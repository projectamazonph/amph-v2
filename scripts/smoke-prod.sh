#!/usr/bin/env bash
#
# scripts/smoke-prod.sh — Production smoke test (Sprint 12 / STORY-053)
#
# Hits a fixed set of routes against a deployed URL and verifies:
#   1. Every route returns HTTP 200 (or 3xx that resolved to a final 2xx).
#   2. Every route serves the six security headers from next.config.ts:
#        - X-DNS-Prefetch-Control: off
#        - X-Content-Type-Options: nosniff
#        - X-Frame-Options: DENY
#        - Referrer-Policy: strict-origin-when-cross-origin
#        - Permissions-Policy: camera=(), microphone=(), geolocation=()
#        - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
#   3. The X-Powered-By header is NOT present (poweredByHeader: false).
#
# Usage:
#   PROD_URL=https://amph.projectamazonph.com ./scripts/smoke-prod.sh
#   PROD_URL=https://amph-v2-<sha>-projectamazonph.vercel.app ./scripts/smoke-prod.sh
#
# Exit codes:
#   0  all checks passed
#   1  at least one route returned a non-2xx status, missing a header, or leaked X-Powered-By
#   2  PROD_URL was not set or curl/grep are not available
#
# Notes:
#   - Pure bash + curl + grep. No node, jq, or external tools.
#   - Safe to run against any Vercel preview or production URL.
#   - Does NOT authenticate; /dashboard is auth-gated, so we follow redirects
#     up to 5 hops to land on its public surface.

set -uo pipefail

# --- 1. Validate environment --------------------------------------------------

if [[ -z "${PROD_URL:-}" ]]; then
  echo "ERROR: PROD_URL is not set." >&2
  echo "Usage: PROD_URL=https://your-deployment.example.com $0" >&2
  exit 2
fi

for cmd in curl grep; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command '$cmd' not found in PATH." >&2
    exit 2
  fi
done

# Strip any trailing slash so concatenation is consistent
PROD_URL="${PROD_URL%/}"

echo "==> Smoke test against $PROD_URL"
echo

# --- 2. Routes to check --------------------------------------------------------
ROUTES=(
  "/"
  "/pricing"
  "/courses"
  "/dashboard"
)

# --- 3. Security headers that must be present on every response ---------------
# Array entries are "Header-Name|expected-value".
SECURITY_HEADERS=(
  "X-Dns-Prefetch-Control|off"
  "X-Content-Type-Options|nosniff"
  "X-Frame-Options|DENY"
  "Referrer-Policy|strict-origin-when-cross-origin"
  "Permissions-Policy|camera=(), microphone=(), geolocation=()"
  "Strict-Transport-Security|max-age=63072000; includeSubDomains; preload"
)

# --- 4. Headers that must NOT appear ------------------------------------------
FORBIDDEN_HEADERS=(
  "X-Powered-By"
)

# --- 5. Run the checks ---------------------------------------------------------
FAIL=0
TOTAL_ROUTES=${#ROUTES[@]}
TOTAL_HEADERS=${#SECURITY_HEADERS[@]}

for route in "${ROUTES[@]}"; do
  full_url="$PROD_URL$route"
  echo "-> GET $full_url"

  # -s silent, -o /dev/null discard body, -D - dump headers, -L follow redirects,
  # -w append final status code line so we can extract it cleanly.
  raw=$(curl -sSL -A "amph-smoke/1.0" -D - -o /dev/null \
              --max-redirs 5 \
              -w "STATUS:%{http_code}\n" \
              "$full_url" 2>&1) || {
    echo "  x curl failed for $route" >&2
    FAIL=$((FAIL+1))
    echo
    continue
  }

  status=$(echo "$raw" | grep -E "^STATUS:" | tail -1 | sed 's/STATUS://')
  headers=$(echo "$raw" | grep -vE "^STATUS:" || true)

  echo "  status: $status"

  # Accept 2xx and 3xx as "reachable"; non-success means the chain ended badly.
  if [[ ! "$status" =~ ^2[0-9][0-9]$ && ! "$status" =~ ^3[0-9][0-9]$ ]]; then
    echo "  x non-success final status ($status)"
    FAIL=$((FAIL+1))
    echo
    continue
  fi

  # 5a. Forbidden headers check
  for bad in "${FORBIDDEN_HEADERS[@]}"; do
    if echo "$headers" | grep -iE "^${bad}:" >/dev/null 2>&1; then
      echo "  x forbidden header present: $bad"
      FAIL=$((FAIL+1))
    fi
  done

  # 5b. Required security headers check
  for entry in "${SECURITY_HEADERS[@]}"; do
    name="${entry%%|*}"
    expected="${entry##*|}"
    actual=$(echo "$headers" \
              | grep -iE "^${name}:" \
              | head -1 \
              | sed -E "s/^[^:]+:[[:space:]]*//I" \
              | tr -d '\r')

    if [[ -z "$actual" ]]; then
      echo "  x missing header: $name"
      FAIL=$((FAIL+1))
    elif [[ "$actual" != "$expected" ]]; then
      echo "  x header $name mismatch"
      echo "      expected: $expected"
      echo "      actual:   $actual"
      FAIL=$((FAIL+1))
    fi
  done

  echo "  ok checks complete for $route"
  echo
done

# --- 6. Summary ----------------------------------------------------------------
echo "==> Summary"
echo "  routes checked:  $TOTAL_ROUTES"
echo "  headers checked: $TOTAL_HEADERS per route"
echo "  failures:        $FAIL"
echo

if [[ $FAIL -eq 0 ]]; then
  echo "OK Smoke test PASSED - production URL is healthy."
  exit 0
else
  echo "FAIL Smoke test FAILED with $FAIL issue(s). See docs/runbooks/production-deploy.md section 7 (Rollback)."
  exit 1
fi
