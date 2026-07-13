# STORY-051: Lighthouse CI

**Sprint:** 11 — Observability
**Points:** 1
**Epic:** Observability
**Status:** ✅ Shipped 2026-07-13 (commit 82d181f)

## Description

Add Lighthouse CI to enforce performance and accessibility budgets on student-facing pages on every PR.

## Acceptance Criteria

- [x] `@lhci/cli` installed and configured.
- [x] `lighthouserc.js` targets: performance ≥0.85, accessibility ≥0.95, best-practices ≥0.95, SEO ≥0.9.
- [x] Core Web Vitals budget: LCP ≤4000ms, TBT ≤300ms.
- [x] CI job runs on PR against `/dashboard`, `/courses/*`, `/tools/*`, `/pricing`, `/`.
- [x] CI fails when budget breached.
- [x] Results uploaded as artifact.

## Files Shipped

- `.lighthouserc.json` — JSON config (5 budgets, 6 URLs, strict assertions=error,
  storage `temporary` for PR, GitHub App upload for main)
- `.github/workflows/ci.yml` — new `lighthouse-ci` job after `build`, depends on
  Vercel preview URL output
- `package.json` — `@lhci/cli@^0.14` (devDep)

## Verification

1. Open a PR with a performance regression — CI fails with Lighthouse diff.
2. Open a PR with no regression — CI passes and artifact is available.

## Notes

- Performance threshold 0.85 (not 0.90) is intentional: AMPH is content-heavy with
  ADT-style lesson imagery; tightening to 0.90 deferred to Sprint 13 post-launch.
- When run on a fork PR without Vercel access, LHCI falls back to `temporary`
  storage and still asserts budgets — see `.lighthouserc.json` `collect.url` env.
