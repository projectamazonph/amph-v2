#!/usr/bin/env bash
#
# scripts/backup-prod.sh — Daily logical backup of the production Neon DB (STORY-054)
#
# Usage (locally):
#   DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... ./scripts/backup-prod.sh
#
# Usage (GitHub Actions):
#   env:
#     DATABASE_URL: ${{ secrets.DATABASE_URL }}
#     BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}
#   run: ./scripts/backup-prod.sh
#
# What it does:
#   1. Runs pg_dump --no-owner --clean --if-exists -Fc against $DATABASE_URL.
#   2. Compresses the dump with gzip.
#   3. Uploads to Vercel Blob under amph-prod-backups/db/.
#   4. Prints the Blob URL on success.
#
# Exit codes:
#   0  success
#   1  missing env var
#   2  pg_dump failed
#   3  upload to Blob failed
#
# Requires: pg_dump (Postgres 16+ client), curl, gzip.

set -euo pipefail

# --- 1. Validate env ----------------------------------------------------------

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BLOB_READ_WRITE_TOKEN:?BLOB_READ_WRITE_TOKEN is required}"

for cmd in pg_dump curl gzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command '$cmd' not found in PATH." >&2
    exit 1
  fi
done

# --- 2. Build target path ------------------------------------------------------

TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
DEST_PATH="amph-prod-backups/db/${TS}.dump.gz"
TMP_FILE="$(mktemp -t amph-backup.XXXXXX.dump)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "==> Backup started at ${TS}"
echo "    destination: ${DEST_PATH}"

# --- 3. pg_dump ---------------------------------------------------------------

# -Fc = custom format (compressed by pg_dump itself, faster to restore)
# --no-owner = don't try to set ownerships on roles we don't have on restore
# --clean --if-exists = drop objects before creating, no errors if absent
# --quote-all-identifiers = safe against any reserved-word collisions
# -d = database (read connection string from DATABASE_URL)
echo "    running pg_dump..."
if ! pg_dump \
      --no-owner \
      --clean \
      --if-exists \
      --quote-all-identifiers \
      -Fc \
      -d "$DATABASE_URL" \
      -f "$TMP_FILE"; then
  echo "ERROR: pg_dump failed" >&2
  exit 2
fi

ORIG_BYTES=$(stat -c %s "$TMP_FILE" 2>/dev/null || stat -f %z "$TMP_FILE")
echo "    dump size: ${ORIG_BYTES} bytes"

# --- 4. Compress --------------------------------------------------------------

GZ_FILE="${TMP_FILE}.gz"
if ! gzip -9 -c "$TMP_FILE" > "$GZ_FILE"; then
  echo "ERROR: gzip failed" >&2
  exit 2
fi
GZ_BYTES=$(stat -c %s "$GZ_FILE" 2>/dev/null || stat -f %z "$GZ_FILE")
echo "    compressed size: ${GZ_BYTES} bytes"

# --- 5. Upload to Vercel Blob -------------------------------------------------
# We use Vercel's Blob client-server direct upload API. The simplest portable
# approach is the @vercel/blob client which the CI installs. For a pure-bash
# fallback, we use the /files endpoint directly with a multipart upload.

echo "    uploading to Vercel Blob..."

# Pure-bash multipart upload to the Blob HTTP API. The endpoint requires the
# bearer token and a JSON metadata part alongside the binary part.
UPLOAD_RESP=$(mktemp -t amph-upload.XXXXXX.json)
BOUNDARY="----amph-backup-${TS}"

{
  printf -- "--%s\r\n" "$BOUNDARY"
  printf 'Content-Disposition: form-data; name="path"\r\n\r\n'
  printf '%s\r\n' "$DEST_PATH"
  printf -- "--%s\r\n" "$BOUNDARY"
  printf 'Content-Disposition: form-data; name="content"; filename="%s"\r\n' "$(basename "$GZ_FILE")"
  printf 'Content-Type: application/gzip\r\n\r\n'
  cat "$GZ_FILE"
  printf "\r\n--%s--\r\n" "$BOUNDARY"
} > "$TMP_FILE.multipart"

# Use the Vercel Blob put endpoint
HTTP_CODE=$(curl -sS -o "$UPLOAD_RESP" -w "%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"$GZ_FILE" \
  "https://blob.vercel-storage.com/${DEST_PATH}") || {
  echo "ERROR: curl upload failed" >&2
  rm -f "$UPLOAD_RESP"
  exit 3
}

rm -f "$TMP_FILE.multipart"

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  URL=$(grep -oE '"url":"[^"]+' "$UPLOAD_RESP" | head -1 | sed 's/"url":"//')
  echo
  echo "==> Backup complete"
  echo "    URL: ${URL:-<response did not include URL>}"
  echo "    raw response:"
  cat "$UPLOAD_RESP"
  echo
  rm -f "$UPLOAD_RESP"
  exit 0
else
  echo "ERROR: upload failed with HTTP ${HTTP_CODE}" >&2
  cat "$UPLOAD_RESP" >&2
  rm -f "$UPLOAD_RESP"
  exit 3
fi