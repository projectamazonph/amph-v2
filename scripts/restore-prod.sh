#!/usr/bin/env bash
#
# scripts/restore-prod.sh — Restore drill: download backup, restore into scratch DB, assert row counts (STORY-054)
#
# Usage:
#   ./scripts/restore-prod.sh <scratch-database-url> <backup-blob-url> [prod-database-url]
#
# Arguments:
#   scratch-database-url  Pooler URL of the scratch Neon branch (the restore target)
#   backup-blob-url       Public URL of a .dump or .dump.gz file in Vercel Blob
#   prod-database-url     Optional. If supplied, the script compares row counts between
#                         the restored scratch DB and this prod URL (within tolerance).
#
# What it does:
#   1. Downloads the backup (gzipped or plain) to a temp file.
#   2. Decompresses if needed.
#   3. Runs pg_restore --clean --if-exists --no-owner into the scratch DB.
#   4. Runs row-count assertions on User, Enrollment, Course, Module, Lesson, ToolSession.
#   5. If a prod URL is supplied, asserts each count matches prod within tolerance.
#
# Exit codes:
#   0  restore + assertions passed
#   1  bad arguments or missing tools
#   2  download failed
#   3  pg_restore failed
#   4  row-count assertion failed (data drift outside tolerance)
#
# Requires: pg_restore, psql, curl, gzip.

set -euo pipefail

# --- 1. Parse args -------------------------------------------------------------

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <scratch-database-url> <backup-blob-url> [prod-database-url]" >&2
  exit 1
fi

SCRATCH_URL="$1"
BACKUP_URL="$2"
PROD_URL="${3:-}"

for cmd in pg_restore psql curl gzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command '$cmd' not found in PATH." >&2
    exit 1
  fi
done

# --- 2. Download --------------------------------------------------------------

TMP_BASE="$(mktemp -d -t amph-restore.XXXXXX)"
trap 'rm -rf "$TMP_BASE"' EXIT
DUMP_FILE="${TMP_BASE}/backup.dump"

echo "==> Downloading $BACKUP_URL"
if ! curl -sSL -o "$DUMP_FILE" "$BACKUP_URL"; then
  echo "ERROR: download failed" >&2
  exit 2
fi
DL_BYTES=$(stat -c %s "$DUMP_FILE" 2>/dev/null || stat -f %z "$DUMP_FILE")
echo "    downloaded: $DL_BYTES bytes"

# --- 3. Decompress if gzipped -------------------------------------------------

if [[ "$DUMP_FILE" == *.gz ]] || file "$DUMP_FILE" 2>/dev/null | grep -qi "gzip"; then
  echo "    decompressing..."
  DECOMP_FILE="${TMP_BASE}/backup.decomp"
  if ! gzip -d -c "$DUMP_FILE" > "$DECOMP_FILE"; then
    echo "ERROR: gzip -d failed" >&2
    exit 2
  fi
  DUMP_FILE="$DECOMP_FILE"
fi

# --- 4. pg_restore ------------------------------------------------------------

echo "==> Restoring into scratch DB"
# --clean --if-exists = drop before create (idempotent)
# --no-owner = we don't own the role on the scratch DB
# --no-privileges = same
# -d = target DB
# Note: pg_restore returns 0 even on warnings (e.g. role-not-found). Treat any
# non-zero as failure.
if ! pg_restore \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      -d "$SCRATCH_URL" \
      "$DUMP_FILE" 2>"${TMP_BASE}/restore.log"; then
  echo "ERROR: pg_restore failed" >&2
  cat "${TMP_BASE}/restore.log" >&2
  exit 3
fi

# Print restore log warnings (informational; do not fail on warnings).
if [[ -s "${TMP_BASE}/restore.log" ]]; then
  echo "    restore warnings (informational):"
  sed 's/^/      /' "${TMP_BASE}/restore.log" | head -20
fi

# --- 5. Row-count assertions --------------------------------------------------
#
# Acceptance: STORY-054 specifies "row count of restored User table matches
# production within 1%". We assert the same for the four core content tables
# and allow 5% drift on ToolSession (write-heavy).
#
# Tables and tolerances (in percent):
#   User, Enrollment, Course, Module, Lesson  -> 1%
#   ToolSession                                -> 5%

echo "==> Row-count assertions"

# Tables to check, one per line: "table|tolerance_percent"
TABLES=(
  "User|1"
  "Enrollment|1"
  "Course|1"
  "Module|1"
  "Lesson|1"
  "ToolSession|5"
)

FAIL=0

# Helper: count rows in a table on a given DB URL
count_rows() {
  local url="$1"
  local tbl="$2"
  psql "$url" -tA -c "SELECT COUNT(*) FROM \"$tbl\";" 2>/dev/null | tr -d '[:space:]'
}

for entry in "${TABLES[@]}"; do
  tbl="${entry%%|*}"
  tol="${entry##*|}"

  scratch_count=$(count_rows "$SCRATCH_URL" "$tbl")
  if [[ -z "$scratch_count" || ! "$scratch_count" =~ ^[0-9]+$ ]]; then
    echo "  x $tbl: scratch count unreadable ('$scratch_count')"
    FAIL=$((FAIL+1))
    continue
  fi

  if [[ -z "$PROD_URL" ]]; then
    echo "  ok $tbl: $scratch_count rows (no prod comparison; add prod URL as 3rd arg)"
    continue
  fi

  prod_count=$(count_rows "$PROD_URL" "$tbl")
  if [[ -z "$prod_count" || ! "$prod_count" =~ ^[0-9]+$ ]]; then
    echo "  x $tbl: prod count unreadable ('$prod_count')"
    FAIL=$((FAIL+1))
    continue
  fi

  # Compute drift percent = |scratch - prod| / prod * 100
  # Use bash arithmetic on integers; if prod is 0, drift is undefined.
  if [[ "$prod_count" -eq 0 ]]; then
    drift_pct=0
  else
    diff=$(( scratch_count > prod_count ? scratch_count - prod_count : prod_count - scratch_count ))
    drift_pct=$(( diff * 100 / prod_count ))
  fi

  if [[ "$drift_pct" -le "$tol" ]]; then
    echo "  ok $tbl: scratch=$scratch_count, prod=$prod_count, drift=${drift_pct}% (tol=${tol}%)"
  else
    echo "  x $tbl: scratch=$scratch_count, prod=$prod_count, drift=${drift_pct}% exceeds tolerance ${tol}%"
    FAIL=$((FAIL+1))
  fi
done

# --- 6. Summary ---------------------------------------------------------------

echo
if [[ $FAIL -eq 0 ]]; then
  echo "==> Restore drill PASSED"
  exit 0
else
  echo "==> Restore drill FAILED with $FAIL assertion(s) outside tolerance"
  exit 4
fi