# Ralplan Consensus — Sprint 1 Foundation

**Project:** AMPH Academy v2
**Instance:** sprint-1-foundation
**Date:** 2026-07-07
**Rounds:** 1 (consensus reached on round 1 with incorporated revisions)

---

## Consensus Status

| Round | Phase | Verdict | Key Output |
|-------|-------|---------|------------|
| 1 | Planner | APPROVE | Full implementation plan with story ordering, sub-tasks, acceptance criteria, risks |
| 1 | Architect | APPROVE with 4 concerns + 6 gaps | Dark mode CSS missing, seed needs enum fields, .env missing |
| 1 | Critic | REQUEST_CHANGES (resolved by incorporated revisions below) | STORY-004 under-scoped, parallel phases unsuited for solo, blind spots in JWT/edge middleware |

**Final verdict: APPROVED with revisions incorporated.**

---

## Incorporated Revisions (from Critic + Architect)

### Adopted
1. **A1 + Dark mode CSS** — implement `@media (prefers-color-scheme: dark)` block in `globals.css`
2. **A2 + Seed enums** — Badge seed includes `category`, `tier`, `criteria` JSON, `icon`
3. **A4 + B5 + `.env.example`** — already exists; add JWT secret generation script (`scripts/gen-jwt-secret.ts`)
4. **B6 + Server Component auth pattern** — document and implement: middleware sets headers, Server Components re-verify via `cookies()` + `jose`
5. **G2 + `requireAdmin()` helper** — implement in `src/lib/auth.ts` (10 lines)
6. **G5 + Middleware `matcher`** — explicit config for `/admin/:path*` and `/dashboard/:path*`
7. **C4 + Sequential execution order** — no parallel phases for solo developer

### Deferred (out of Sprint 1 scope)
- **C1** — STORY-004 stays 1pt, full schema in one migration (operator's call: solo dev has capacity)
- **C2** — STORY-002/003 stay at 1pt/1.5pt with original component scope
- **C3** — Playwright spike stays in Sprint 9
- **C5** — Admin empty dashboard page stays in STORY-006
- **G1, G3, G4** — `logger.ts`, `audit.ts`, error classes deferred to Sprints 6/10

---

## Final Story Order (Sequential, Solo Dev)

```
STORY-001 (1pt): Scaffold verification
  ↓
STORY-002 (1pt): Design tokens + dark mode CSS
  ↓
STORY-004 (1pt): Prisma schema + migration + seed (full ~25 models)
  ↓
STORY-003 (1.5pt): UI component library (7 components)
  ↓
STORY-005 (1pt): JWT auth (jose) + middleware + server actions
  ↓
STORY-006 (0.5pt): Admin layout + RBAC + empty dashboard
```

Total: 6 points, sequential, no parallel phases.

---

## Per-Story Execution Spec

### STORY-001: Scaffold (verify existing)
- Files: `package.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`, `src/app/layout.tsx`, `src/app/page.tsx`
- Add: `scripts/gen-jwt-secret.ts` for HS256 secret generation
- Verify: `pnpm install && pnpm typecheck && pnpm lint && pnpm build && pnpm dev`
- Commit: `feat: scaffold Next.js 16, add JWT secret generator`

### STORY-002: Design tokens + dark mode
- File: `src/styles/globals.css`
- Add: full token audit, dark mode `@media` block, missing tokens (`--space-5`, `--space-10`, `--leading-snug`, `--radius-full`, `--border-strong`, `--accent-hover`, `--ink-inverse`)
- Verify: dark mode toggle in OS changes surface + ink tokens
- Commit: `feat: complete Field Manual design tokens with dark mode`

### STORY-004: Prisma + migration + seed
- Files: `prisma/schema.prisma`, `prisma/migrations/<timestamp>_init/migration.sql`, `prisma/seed.ts`
- Schema: full ~25 models from `docs/db-schema.md` (User, Account, Session, Course, Module, Lesson, Enrollment, Module/LessonProgress, Quiz, QuizQuestion, QuizAttempt, Badge, UserBadge, Certificate, LiveClass, LiveClassRegistration, ToolSession, ToolResult, Resource, ContentDraft, PricingTier, CheckoutSession, Payment, DiscountCode, DiscountTier, RefundRequest, AuditLog, TeamMember)
- Migration: ONE migration file (per operator's call to keep at 1pt)
- Seed: 1 admin user + 3 PricingTiers (PPC Foundations ₱2,999 / Accelerated Mastery ₱5,999 / Ultimate Transformation ₱9,999) + 5 Badges with full enum fields
- Verify: `pnpm prisma migrate dev && pnpm prisma db seed && pnpm prisma studio` shows all tables
- Commit: `feat: Prisma schema, initial migration, and seed data`

### STORY-003: UI component library
- Files: `src/components/ui/{Button,Card,Input,Badge,Modal,Toast,Icon}.{tsx,module.css}`, `src/components/ui/ToastProvider.tsx`, `src/components/ui/index.ts`
- Phosphor: `import { IconName } from '@phosphor-icons/react/dist/ssr/IconName'` (SSR subpath for tree-shaking)
- CSS Modules with `var(--token)` references
- Verify: `pnpm lint` passes no-ai-slop on all component code
- Commit: `feat: shared UI component library (Button, Card, Input, Badge, Modal, Toast, Icon)`

### STORY-005: JWT auth (jose)
- Files: `src/lib/auth.ts`, `src/lib/validation.ts`, `src/lib/utils.ts`, `src/middleware.ts`, `src/app/(public)/auth/{signup,signin,signout}/page.tsx`
- Pattern: middleware verifies JWT, sets headers; Server Components re-verify via `cookies()` + `jose` (no double work if cookie present)
- Server actions: `signUpAction`, `signInAction`, `signOutAction`
- `requireAdmin()` helper in `src/lib/auth.ts`
- Middleware `matcher: ['/admin/:path*', '/dashboard/:path*']`
- Verify: signup → signin → cookie set → /admin redirects when signed out
- Commit: `feat: JWT auth with jose (signup, signin, signout, middleware)`

### STORY-006: Admin layout + RBAC
- Files: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/ui/NavSidebar.tsx`, `src/components/ui/TopBar.tsx`
- Layout: `requireAdmin()` check, redirects to `/` if not admin, renders NavSidebar + TopBar
- Dashboard: empty "Welcome, Admin" + placeholder cards using Card + Badge components
- Verify: admin user signs in → sees dashboard; non-admin redirected
- Commit: `feat: admin layout with RBAC gating`

---

## Risks (Final)

| Risk | Mitigation |
|------|------------|
| Prisma migration fails on 25 models | Run `pnpm prisma generate` + `pnpm prisma migrate dev` after schema; rollback by deleting `prisma/dev.db` and re-migrating |
| JWT cookie edge cases (localhost, SameSite) | Test full signup→signin→access flow early in STORY-005; document working config in `.env.example` |
| Phosphor bundle bloat | Use `@phosphor-icons/react/dist/ssr/IconName` imports (SSR subpath); never barrel imports |
| no-ai-slop false positives | Review error output; add narrow exception in rule only if proven false positive |
| RBAC bypass via direct URL | Middleware + `requireAdmin()` in layout — defense in depth |
| SQLite/Postgres drift | Schema uses only Postgres-compatible features (no SQLite-specific types) |

---

## Definition of Done

```bash
cd /storage/emulated/0/Hermes Projects/projects/amph-v2
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
# → localhost:3000 loads landing page
# → Click "Sign Up" → create account
# → Sign in as seeded admin (email from .env)
# → Navigate to /admin → see dashboard with sidebar + topbar
# → Non-admin user gets redirected away from /admin
# → pnpm typecheck passes
# → pnpm lint passes (no no-ai-slop hits)
# → pnpm build passes
```

---

## Round Count

Consensus reached in 1 round. No loop required.
