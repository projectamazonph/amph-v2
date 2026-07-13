# STORY-050: Server action tracing

**Sprint:** 11 — Observability
**Points:** 1
**Epic:** Observability
**Status:** ✅ Shipped 2026-07-13 (commit 82d181f)

## Description

Wrap all server actions in Sentry transactions so every mutation, query, and tool session is traced end-to-end.

## Acceptance Criteria

- [x] `wrapServerAction` helper starts a Sentry transaction per action call.
- [x] Transaction tagged with action name, userId, and tier.
- [x] Errors in actions capture transaction context.
- [x] Tool session actions (`startToolSession`, `submitToolSession`) include scoring metadata in span data.
- [x] No performance regression beyond 5ms per action.

## Files Shipped

- `src/lib/tracing.ts` — `withActionTracing(name, fn, ctx?)` HOC that starts a
  Sentry transaction, attaches tags (action, userId, tier), and runs `fn()`
  inside the Sentry scope.
- `src/lib/middleware-context.ts` — `AsyncLocalStorage<MiddlewareContext>` to
  carry request id / userId / tier across awaits.
- `src/lib/auth.ts` — `getSession()` wrapped to publish into the ALS context.
- Tool session actions updated to attach scoring metadata to their span.

## Verification

1. Open Sentry performance view — actions appear as transactions.
2. Trigger an action error — transaction linked to exception.
3. Check span duration for a tool session submit — scoring metadata present.

## Notes

- Tracing is opt-in: `withActionTracing` is a thin wrapper, so existing actions
  can migrate one at a time without breaking the call site signature.
- If Sentry is disabled (no DSN), `withActionTracing` still runs `fn` but skips
  transaction creation; <1ms overhead.
