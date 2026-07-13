# STORY-049: Structured logging

**Sprint:** 11 — Observability
**Points:** 1
**Epic:** Observability
**Status:** ✅ Shipped 2026-07-13 (commit 82d181f)

## Description

Replace ad-hoc `console.log` with Pino structured logging and propagate request IDs across async boundaries.

## Acceptance Criteria

- [x] `pino` + `pino-pretty` added for dev; JSON output in production.
- [x] `src/lib/logger.ts` exports `logger` with child-request context helper.
- [x] Request ID generated at edge/middleware, attached to `log`.
- [x] All `console.log` removed from `src/` except build scripts.
- [x] Log levels respected: `debug` in dev, `info`+ in prod.
- [x] No PII in logs by default.

## Files Shipped

- `src/lib/logger.ts` — Pino instance, `withRequestContext(logger)` helper,
  AsyncLocalStorage bridge, PII redaction (`redact: ['*.password','*.token',...]`)
- `src/app/api/paymongo/webhook/route.ts` — `console.log` → `logger.info({event,evt}, ...)`
- `package.json` — `pino@^9` and `pino-pretty@^11` (dev) added

## Verification

1. Hit an API route in dev — logs show structured JSON with `requestId`.
2. Hit same route in prod mode — logs are single-line JSON.
3. Grep `console.log` across `src/` — zero matches except scripts.

## Notes

- Request ID flows through `src/lib/middleware-context.ts`
  (`AsyncLocalStorage<MiddlewareContext>`) so any server action / route handler
  invoked during a request inherits the same `requestId`.
- PII redaction list is intentionally narrow; widen it when adding new sensitive
  fields (e.g. `*.apiKey`, `*.authorization`).
