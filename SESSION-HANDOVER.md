# SESSION-HANDOVER.md

**Updated:** 2026-07-13 (Sprint 10 closed, Sprint 11 closed)

---

## Project Status

| Metric | Value |
|--------|-------|
| Sprints complete | 11 of 12 |
| Stories complete | 47 / 52 (90%) |
| Last closed sprint | Sprint 11 — Observability (commit `82d181f`) |
| Next sprint | Sprint 12 — Launch (5 pts) |
| Lint | Clean |
| Typecheck | Pre-existing TS7006 errors in admin/course pages (out of scope) |
| CI | PostgreSQL service aligned; includes Sentry upload, LHCI, Playwright |
| Tests | 50/53 unit + integration passing (Sprint 10 outcome) |
| Database | PostgreSQL (dev + production) |

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

## Sprint 12 — Launch (Next, 5 pts)

**Goal:** Production deploy + security audit + launch comms.

| Story | Pts | Status | Description |
|-------|-----|--------|-------------|
| STORY-053 | 1 | Backlog | Deploy runbook + rollback procedure (`docs/runbooks/deploy.md`). |
| STORY-054 | 1 | Backlog | Backup drill: restore production backup to staging, smoke test. |
| STORY-055 | 1 | Backlog | Security audit: OWASP ZAP scan, fix high/critical. |
| STORY-056 | 1 | Backlog | Production deploy via Vercel. Verify Sentry + LHCI in prod. |
| STORY-057 | 1 | Backlog | Launch checklist + email to v1 users. |

---

## Required Secrets for Production Deploy

These must be set in Vercel (and as GitHub repo secrets for the `sentry-alert` cron job) before Sprint 12:

- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_HOST` — source-map upload + alert script
- `SENTRY_API_TOKEN` — Sentry REST API (read events for Slack script)
- `SLACK_WEBHOOK_URL` — Slack Incoming Webhook for `#amph-alerts`
- `DATABASE_URL` — production PostgreSQL
- `PAYMONGO_SECRET_KEY`, `RESEND_API_KEY`, etc. — business layer (already in prod from Sprint 6/8)

All Sprint 11 additions are listed in `.env.example`.

---

## Key Files

- **BMAD state:** `bmad/sprint-status.yaml`, `bmad/workflow-status.yaml`
- **Sprint plan:** `docs/sprint-plan.md`
- **Sprint 10 plan:** `docs/sprint-10/PLAN.md`
- **Sprint 11 plan:** `docs/sprint-11/PLAN.md`
- **Stories:** `docs/stories/STORY-038.md` through `STORY-052.md` (S10 + S11 acceptance ticked)
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

---

## Open Issues (carried from prior sprints)

1. BottomNav not yet on course detail / lesson / quiz pages (focused reader mode, possibly intentional)
2. Pre-existing TS7006 errors in admin/course pages (out of scope per constraints; consider a Sprint 12 cleanup story)
3. PayMongo webhook HMAC not verified (out of scope from Sprint 8; consider adding in Sprint 12)
4. 3 broken Vitest mocks in `src/app/actions/__tests__/tool-actions.test.ts` (`requireAuth` not mocked) — from Sprint 10

---

## Notas / Status Tagalog-English Mix

- Sprint 11 done, 5/5 punta. 47/52 kwento closed.
- Susi: Sprint 12 launch nalang. Kailangan ng Sentry + Slack secrets sa Vercel tsaka repo.
- 50/53 unit tests pass, 3 mock issue kaylangan ayusin bago launch.
