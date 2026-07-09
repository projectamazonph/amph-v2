# STORY-043: CI Environment Fix + Playwright Config

**Sprint:** 10
**Points:** 1
**Epic:** Infrastructure

## Goal

Ensure CI runs PostgreSQL correctly (database name updated to `amph_v2_test`), and add Playwright configuration for E2E testing.

## Context

CI already had PostgreSQL service configured. The fix was: schema switched from SQLite to PostgreSQL, CI database name aligned to `amph_v2_test`, and `DATABASE_URL` updated in `.env` / `.env.local` / `.env.example`.

## Acceptance Criteria

- [x] `prisma/schema.prisma` — provider is `postgresql` (not `sqlite`)
- [x] `.env` / `.env.local` / `.env.example` — `DATABASE_URL` uses PostgreSQL connection string
- [x] `.github/workflows/ci.yml` — PostgreSQL service with `amph_v2_test` database
- [ ] `playwright.config.ts` exists at project root with:
  - `baseURL: 'http://localhost:3000'`
  - Chromium-only
  - Web server: `pnpm dev` with `url` check
  - Timeout: 30s per test
  - Retries: 1 on CI
  - Reporter: `html` (local) + `list` (CI)
- [ ] `pnpm test:e2e` does not error on missing config

## Files to Touch

- `prisma/schema.prisma` — ✅ done (provider = postgresql)
- `.env` / `.env.local` / `.env.example` — ✅ done
- `.github/workflows/ci.yml` — ✅ done (database name updated)
- `playwright.config.ts` — new file (TODO)

## Verification

```bash
# Schema validated
pnpm prisma format --check && pnpm prisma validate

# CI config has no SQLite references
cat .github/workflows/ci.yml | grep -c sqlite  # should be 0

# Playwright config exists
npx playwright test --list 2>&1 | head -5
```

## Pitfalls

- PostgreSQL must be running locally or use a remote connection string
- `prisma migrate dev` creates PostgreSQL-compatible migrations (no `AUTOINCREMENT`)
- CI PostgreSQL service uses `test:test` credentials — match `DATABASE_URL`
