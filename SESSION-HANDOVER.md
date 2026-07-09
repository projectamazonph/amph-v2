# AMPH Academy v2 — Session Handover

**Date:** 2026-07-12
**Session end state:** Sprint 9 COMPLETE. All 5 stories committed. 42/47 stories total (89%).
**Project:** `/storage/emulated/0/Hermes Projects/projects/amph-v2`

---

## What Was Accomplished

**Sprint 9 — Polish + Mobile-First Refactor (this session)**

7 commits landed on `main`. All pages now render correctly at 390px (mobile) and 1280px (desktop). Lint clean.

| Story | Commit | What was done |
|---|---|---|
| STORY-038 | `8e2ba4e` | Design system audit — 30 inline hex violations found in `email.tsx`, added email template exception to ESLint rule (`EMAIL_TEMPLATE_FILES` regex + `isEmailTemplate()`). Audit report at `docs/design-audit-s9.md`. |
| STORY-039 | `6350757` | Responsive breakpoints — `--bp-sm/md/lg/xl`, `--side-pad`, `--max-content/reading/form` added to `:root`. Three helper classes: `.stack-mobile`, `.cards-mobile`, `.table-mobile`. README at `src/styles/README.md`. |
| STORY-040 | `07265a5` | BottomNav component — 4-slot mobile nav (Home/Courses/Tools/Profile), hidden at ≥1024px, safe-area-inset handling. Preview at `/_dev/bottom-nav`. |
| STORY-041 | `7ac7105` | Marketing + auth refactor — landing page rewritten with CSS module (responsive hero, footer, pricing preview, CTA). Pricing grid: 1→2→3 cols. Auth/checkout padding updated to `--side-pad`. |
| STORY-042 | `7298e26` | Student shell refactor — dashboard stats (1→2→4 col), tools grid (1→2→3 col), BottomNav on dashboard/tools. Certificates/payments CSS fixed (hardcoded colors → tokens). Added `.sticky-cta` helper. |
| docs | `655a983` | Sprint status files updated — 42/47 stories. |

---

## Current Project State

| | |
|---|---|
| **Stories complete** | 42 / 47 (89%) |
| **Sprints done** | S1–S9 |
| **Last commit** | `655a983` on `main` |
| **TypeScript** | `pnpm typecheck` — pre-existing errors only (implicit `any` in course/certificate pages, not in scope) |
| **Lint** | `pnpm lint` — clean (0 errors) |

---

## Sprint 9 Decisions

- **Email template exception in ESLint:** All 30 inline hex violations were in `src/lib/email.tsx` (React Email). Email clients don't support CSS custom properties — inline hex is mandatory. Added `EMAIL_TEMPLATE_FILES` regex + `isEmailTemplate()` check, consistent with existing PDF generator exception.
- **BottomNav per-page placement:** No `src/app/(dashboard)/layout.tsx` exists, so BottomNav is placed individually in each qualifying page (`DashboardPage`, `ToolsIndexPage`). Not placed on lesson/quiz pages (focused reader mode).
- **Icon substitutions:** `Toolbox`, `Books`, `UserCircle` not available in Phosphor 2.1.7. Used `Gear`, `BookOpen`, `User` instead.
- **Types in separate file:** `BottomNavProps` and `BottomNavSlot` in `BottomNav.types.ts` to avoid TS6142 barrel export errors.
- **Landing page full rewrite:** Original `page.tsx` used inline `style={{...}}` objects throughout. Replaced with `home.module.css`.
- **Certificates/payments hardcoded colors:** Replaced bare hex values with CSS token vars from globals.css.

---

## Open Issues

| # | Severity | Issue | Status |
|---|---|---|---|
| 1 | P1 | PayMongo webhook — no HMAC verification | Open |
| 2 | P1 | `RESEND_API_KEY` still missing from `.env.local` | Open |
| 3 | P1 | Resend webhook — HMAC verification not wired | Open |
| 4 | P2 | `gitleaks` not in CI | Open |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/styles/globals.css` | All design tokens, breakpoints, dark mode, responsive helpers |
| `src/styles/README.md` | Breakpoint/layout token documentation |
| `src/components/ui/BottomNav.tsx` | Mobile bottom navigation (4 slots, mobile-only) |
| `src/components/ui/BottomNav.types.ts` | BottomNav type exports |
| `src/components/ui/BottomNav.module.css` | BottomNav CSS with media query |
| `src/app/home.module.css` | Landing page CSS module |
| `eslint-rules/no-tailwind.js` | ESLint rule with email template exception |
| `docs/design-audit-s9.md` | Design system audit report |
| `bmad/sprint-status.yaml` | 42/47 stories, Sprint 9 done |
| `bmad/workflow-status.yaml` | 42/47 stories, Sprint 9 done |

---

## Sprint 10 — Next Up

5 remaining stories (STORY-043 through STORY-047). Not yet planned — needs sprint planning session.

---

## Commands

```bash
cd "/storage/emulated/0/Hermes Projects/projects/amph-v2"
pnpm dev
pnpm typecheck   # pre-existing errors only
pnpm lint        # clean
git push
```

---

## Design Rules

- CSS Modules only — no Tailwind
- Server Components + Server Actions for data mutations
- `requireAdmin()` from `@/lib/auth` on every **admin page AND every admin server action**
- `auditLog()` from `@/lib/admin-audit` on every admin mutation
- Always `revalidatePath` after mutations
- Email sending: `.catch(() => {})` — never throw, never block
- Responsive breakpoints: `--bp-sm: 640px`, `--bp-md: 768px`, `--bp-lg: 1024px`, `--bp-xl: 1280px`
- BottomNav hidden at ≥1024px (NavSidebar shows instead)
