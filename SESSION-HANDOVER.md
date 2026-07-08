# AMPH Academy v2 — Session Handover

**Date:** 2026-07-10
**Session end state:** Sprint 7 committed and pushed, docs updated, S8 next
**Project:** `/storage/emulated/0/Hermes Projects/projects/amph-v2`

---

## What Was Accomplished

**Sprint 7 — Admin Panel (4 pts, all done)**

Committed as `15259ef` on `main`. 21 files changed, 1,667 insertions.

- **Admin dashboard** (`src/app/admin/page.tsx`) — real DB queries for 4 stat cards + recent payments table
- **User management** (`src/app/admin/users/`) — list (search/filter/paginate), detail (enrollments/payments/badges/audit), suspend/reactivate/delete actions
- **Course admin** (`src/app/admin/courses/`) — course list, course detail tree (modules → lessons), CRUD actions
- **Tool scenario registry** (`src/app/admin/tool-scenarios/`) — read-only view via `TOOL_REGISTRY` (no DB model)
- **Analytics** (`src/app/admin/analytics/page.tsx`) — enrollment funnel, MRR, engagement, top courses, activity feed
- **Supporting:** `src/lib/admin-audit.ts`, CSS Modules for every new page

---

## Critical Fixes Applied This Session

1. **No `db.toolScenario` model** — scenarios are TypeScript code in `src/engine/registry.ts`. Admin is read-only view via `TOOL_REGISTRY`. Do not add server actions that write to a `toolScenario` DB model — it doesn't exist.

2. **Valid Phosphor icon names** — only these are allowed: `House`, `User`, `Gear`, `SignOut`, `Rocket`, `Trophy`, `Flame`, `Sparkle`, `BookOpen`, `X`, `Check`, `Warning`, `Info`, `Lock`, `CaretDown`, `CaretRight`, `CaretLeft`, `CaretUp`, `Plus`, `Minus`, `MagnifyingGlass`, `List`, `ChartLine`, `ChartBar`, `CreditCard`, `Receipt`, `Calendar`, `Clock`, `GraduationCap`, `ArrowRight`, `Download`, `Video`, `Circle`. `Wrench`, `Files`, `Users`, `CurrencyPhp` are NOT valid and will fail `tsc`.

3. **Icon import is named, not default** — always use `import { Icon } from '@/components/ui/Icon';`, never `import Icon from '@/components/ui/Icon';`.

---

## Current Project State

| | |
|---|---|
| **Stories complete** | 33 / 55 |
| **Sprints done** | S1–S7 |
| **Next sprint** | S8 — Refunds + Email |
| **Velocity** | S1=6, S2=6, S3=6, S4=4.5, S5=3.5, S6=4, S7=4 |
| **Last commit** | `15259ef` on `main` (pushed) |
| **TypeScript** | `pnpm typecheck` exits 0 |

---

## Sprint 8 — Refunds + Email (4 stories, 4 pts)

All 4 stories are in `bmad/sprint-status.yaml` as Sprint 8 next:

| Story | Description |
|-------|-------------|
| STORY-034 | Refund flow — student request + admin approval |
| STORY-035 | Email reminders — enrollment, live class, refund status |
| STORY-036 | Resend webhook handler for delivery tracking |
| STORY-037 | Outbound email templates |

---

## Key Files

| File | Purpose |
|------|---------|
| `bmad/sprint-status.yaml` | Sprint 8 is `in_progress`, velocity=0, 4 planned stories |
| `bmad/workflow-status.yaml` | 33/33 stories complete, progress_percentage=100 |
| `docs/sprint-plan.md` | Updated to S8 next, 33/55 done |
| `src/engine/registry.ts` | Source of truth for tool scenarios — not DB |
| `src/lib/admin-audit.ts` | AuditLog helper — use this on all admin mutations |
| `prisma/schema.prisma` | 29 models — keep this open when writing admin actions |

---

## Commands

```bash
# Dev
cd "/storage/emulated/0/Hermes Projects/projects/amph-v2"
pnpm dev

# Type check (required before commit)
pnpm typecheck

# Push
git push "https://x-access-token:$(gh auth token)@github.com/projectamazonph/amph-v2.git" main
```

---

## Design Rules

- CSS Modules only — no Tailwind
- Server Components + Server Actions for data mutations
- `requireAdmin()` from `@/lib/auth` on every admin page
- `auditLog()` from `@/lib/admin-audit` on every admin mutation
- Always `revalidatePath` after mutations
- Zero TypeScript errors before commit
