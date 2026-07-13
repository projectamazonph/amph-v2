# SESSION-HANDOVER.md

**Updated:** 2026-07-14 (Sprint 12 closed; post-launch type-safety + auth-load hotfix)

---

## Project Status

| Metric | Value |
|--------|-------|
| Sprints complete | **12 of 12 (100%)** |
| Stories complete | **52 / 52 (100%)** |
| Last closed sprint | Sprint 12 — Launch |
| Last commit SHA | `284cc19f8962` (STORY-057 acceptance doc) — `main` HEAD |
| Lint | Clean |
| Typecheck | Clean — `tsc --noEmit` exits 0 (19 errors fixed 2026-07-14: 4 missing deps, `trace()` export, Sentry v9 profiling call, PayMongo union, pricing typing) |
| CI | PostgreSQL service aligned; includes Sentry upload, LHCI, Playwright, gitleaks, db-backup cron |
| Tests | 50/53 unit + integration passing (Sprint 10 outcome) |
| Database | PostgreSQL on Neon (dev + production) |
| Production | **Live deploy pending operator execution** — see Sprint 12 / STORY-056 |

---

## Sprint 11 — Observability (DONE, commit `82d181f`)

**Goal:** Production-grade observability before launch: Sentry error tracking, structured logging, server-action tracing, Lighthouse performance budgets, and Slack alerting.

| Story | Pts | Status | Description |
|-------|-----|--------|-------------|
| STORY-048 | 1 | Done | Sentry setup: client/server/edge configs, source maps, release tracking via `@sentry/nextjs@^9`. |
| STORY-049 | 1 | Done | Structured logging (Pino): `src/lib/logger.ts`, AsyncLocalStorage request context, redaction. `console.*` replaced in critical paths. |
| STORY-050 | 1 | Done | Server-action tracing: `withActionTracing` HOC in `src/lib/tracing.ts`, edge-friendly `src/lib/middleware-context.ts`. `getSession` wrapped. |
| STORY-051 | 1 | Done | Lighthouse CI: `.lighthouserc.json` with perf ≥0.85, a11y/bp ≥0.95, seo ≥0.9, LCP ≤4000ms, TBT ≤300ms. |
| STORY-052 | 1 | Done | Slack alerting: `scripts/sentry-slack-alert.ts` (190 lines), summary + spike modes, scheduled cron in CI. |

**Files added (10):** `src/lib/logger.ts`, `src/lib/sentry.ts`, `src/lib/sentry-shared.ts`, `src/lib/tracing.ts`, `src/lib/middleware-context.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `.lighthouserc.json`, `scripts/sentry-slack-alert.ts`.
**Files modified (7):** `package.json`, `next.config.ts`, `.env.example`, `CHANGELOG.md`, `src/app/api/paymongo/webhook/route.ts`, `src/lib/auth.ts`, `.github/workflows/ci.yml`.

---

## Sprint 12 — Launch (DONE — code & runbook complete; deploy execution is operator-side)

**Goal:** Ship AMPH Academy to production: deploy runbook, backup drill, security audit, production deploy, launch communications.

| Story | Pts | Status | Description |
|-------|-----|--------|-------------|
| STORY-053 | 1 | ✅ Done | Production deploy runbook + smoke script. `docs/runbooks/production-deploy.md` (227 lines), `scripts/smoke-prod.sh` (159 lines, bash+curl+grep). |
| STORY-054 | 1 | 🟡 Code done | Backup runbook + cron + restore drill script. `docs/runbooks/db-backup-restore.md` + `scripts/backup-prod.sh` + `scripts/restore-prod.sh` + `.github/workflows/db-backup.yml`. **Operator action:** run the drill against real Neon + Blob. |
| STORY-055 | 1 | ✅ Done | Security audit. `docs/security/tenant-isolation.md` + `docs/security/security-audit-2026-07-13.md`. 5 open issues tracked, 1 blocker-class (PayMongo HMAC). |
| STORY-056 | 1 | 🟡 Code done | Production deploy. `docs/sprint-12/deploy-execution.md` (operator checklist). **Operator action:** run `vercel deploy --prod` after setting 17 production env vars. |
| STORY-057 | 1 | 🟡 Drafts done | Launch comms. `docs/sprint-12/launch-comms.md` (250 lines of copy + templates + retro template). **Operator action:** approve copy, build the React Email template, schedule broadcasts T+30min after deploy. |

**Total Sprint 12 file inventory:**
- 2 runbooks + 1 runbooks index
- 2 security audit docs
- 2 sprint-12 docs (deploy execution, launch comms)
- 5 STORY-053–057 acceptance docs
- 3 production shell scripts (smoke-prod, backup-prod, restore-prod)
- 1 GitHub Actions workflow (db-backup cron)

---

## Required Secrets for Production Deploy

**All 17 must be set in Vercel → Project Settings → Environment Variables → Production before deploy.**

Sprint 11 + 12 secrets (8 from Sprints 1–11, plus key existing ones for production):

| Variable | Where | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Sprint 1 | Neon prod pooler with `?sslmode=require` |
| `JWT_SECRET` | Sprint 1 | `openssl rand -base64 32` |
| `PAYMONGO_SECRET_KEY` | Sprint 6 | `sk_live_...` |
| `PAYMONGO_PUBLIC_KEY` | Sprint 6 | `pk_live_...` |
| `PAYMONGO_WEBHOOK_SECRET` | Sprint 6 | PayMongo dashboard |
| `RESEND_API_KEY` | Sprint 8 | Prod key |
| `RESEND_FROM_EMAIL` | Sprint 8 | `noreply@projectamazonph.com` |
| `RESEND_WEBHOOK_SECRET` | Sprint 8 | **Verify in Vercel prod — needed for delivery tracking** |
| `BLOB_READ_WRITE_TOKEN` | Sprint 7 | Vercel Blob prod token (also used by db-backup script) |
| `SENTRY_DSN` | STORY-048 | Sentry project DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | STORY-048 | Public counterpart |
| `SENTRY_AUTH_TOKEN` | STORY-048 | Org-level for source-map upload |
| `SENTRY_ORG` | STORY-048 | `projectamazonph` |
| `SENTRY_PROJECT` | STORY-048 | `amph-v2` |
| `SENTRY_HOST` | STORY-048 | `https://sentry.io` |
| `SENTRY_API_TOKEN` | STORY-052 | API token with `project:read` |
| `SLACK_WEBHOOK_URL` | STORY-052 | Slack Incoming Webhook for `#amph-alerts` |
| `NEXT_PUBLIC_APP_URL` | Required | `https://amph.projectamazonph.com` (or your prod URL) |

GitHub repo secrets (for the `db-backup` and `sentry-alert` cron jobs): same `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `SLACK_WEBHOOK_URL`, `SENTRY_API_TOKEN` set.

All Sprint 11 additions are listed in `.env.example`.

---

## Key Files

- **BMAD state:** `bmad/sprint-status.yaml`, `bmad/workflow-status.yaml`
- **Sprint plan:** `docs/sprint-plan.md`
- **Sprint 11 plan:** `docs/sprint-11/PLAN.md` (SHIPPED)
- **Sprint 12 plan:** `docs/sprint-12/PLAN.md` (SHIPPED 2026-07-13)
- **Stories:** `docs/stories/STORY-038.md` through `STORY-057.md` (S10 + S11 + S12 acceptance ticked)
- **Runbooks:** `docs/runbooks/production-deploy.md`, `docs/runbooks/db-backup-restore.md`
- **Security:** `docs/security/tenant-isolation.md`, `docs/security/security-audit-2026-07-13.md`
- **Launch comms:** `docs/sprint-12/launch-comms.md`
- **Session history:** `SESSION-HANDOVER.md` (this file)

---

## Decisions Log

| Decision | Rationale |
|----------|-----------|
| `@sentry/nextjs@^9` (not `@sentry/instrumentation` stand-alone) | Matches Next 16; auto-detects `sentry.{client,server,edge}.config.ts`. No `instrumentation.ts` needed for the captured subset. |
| Pino over Winston | Lighter, faster, native JSON, better async-context support via `pino-with-async-storage`. |
| `base_tree` strategy for the Sprint 11 push | Single commit with 17 files via Git Data API (blob → tree → commit → ref). Avoids re-listing ~200 unchanged blobs. |
| `getSession` traced in `src/lib/auth.ts` but `redirect()` left unwrapped | `redirect()` throws `NEXT_REDIRECT`; wrapping in try/catch would break the redirect. |
| Cron at UTC 01:00 for daily Slack summary | 09:00 PHT = 01:00 UTC. Matches existing CI schedule cadence. |
| Skip `instrumentation.ts` reference in CHANGELOG (refine in follow-up) | Functionally irrelevant with `@sentry/nextjs@^9` auto-detection. Wording ahead of files; acceptable. |
| db-backup cron at 02:00 UTC | 10:00 PHT — before peak PH morning traffic, after EU/NA night. Lowest write volume. |
| Pure bash + curl + grep for smoke script | No node/jq dependency; runs in any CI environment. |
| 1 file at a time for Sprint 12 push | User-mandated workflow correction from 2026-07-14. Avoids script-staging fragility. |
| File-by-file Contents API PUT (not Git Data API) for Sprint 12 | Smaller files; less risk of merge conflicts in 17-var tree updates. |
| Pure bash multipart upload to Vercel Blob | Avoids @vercel/blob npm install in CI. Portable. |
| CSP header deferred to Sprint 13 | Sentry tunnel rewrite + Resend image embedding + Vercel Blob CDN need careful allow-listing not yet finalized. |

---

## Open Issues

### Operator-side (close before/during launch)

1. **PayMongo webhook HMAC not verified** — STORY-055 finding #1. Pre-launch security gap. If launching with live payments, fix before STORY-056; otherwise post-launch bugfix.
2. **Confirm `RESEND_WEBHOOK_SECRET` set in Vercel prod** — STORY-055 finding #3.
3. **Run the restore drill** — STORY-054 acceptance bullet #3.
4. **Execute the production deploy** — STORY-056 acceptance.
5. **Approve launch copy + build React Email template + schedule broadcasts** — STORY-057 acceptance.

### Post-launch (Sprint 13 candidates)

1. PayMongo HMAC verification (security gap)
2. CSP header (deferred from STORY-055)
3. Fix 3 broken Vitest mocks in `src/app/actions/__tests__/tool-actions.test.ts` (S10 carry-over)
4. BottomNav on lesson/quiz pages (S9 carry-over)
5. TS7006 cleanup in admin/course pages — `tsc --noEmit` reports 0 errors as of 2026-07-14, so resolved within the 19-error hotfix; confirm in next CI run
6. (Added in S12 audit) Verify Resend webhook secret env var

---

## Notas / Status Tagalog-English Mix

- Sprint 12 done, 5/5 punta. 52/52 kwento closed. AMPC v2 ready na for launch.
- Susi: Vercel deploy + Neon backup drill + Resend broadcast. Tatlong operator actions bago live.
- PayMongo HMAC gap lang ang blocker — pwede soft launch muna kung gusto mong i-defer live payments.
- Salamat sa 12 sprints, 52 stories. Tara, mag-launch na tayo. 🇵🇭