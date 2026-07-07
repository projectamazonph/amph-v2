# Session Handover — AMPH Academy v2

**Session date:** 2026-07-07
**Last commit:** `a977a6d` on `main`
**Repo:** github.com/projectamazonph/amph-v2

## What this session accomplished

Three sprints of work in one mega-session, driven by user request to "build out the rest of Sprint 3" and "do what you see fit and efficient."

### Sprint 1: Foundation (6/6 pts) — ✅ Complete
- Next.js 16 App Router scaffold, TypeScript strict, CSS Modules (no Tailwind)
- Field Manual design system in `src/styles/globals.css` with full dark mode `@media` block
- 7 UI primitives in `src/components/ui/`: Button, Card, Input, Badge, Modal, Toast, Icon + NavSidebar + TopBar
- Full 25-model Prisma schema, migrated and seeded
- JWT auth via jose in HttpOnly cookies, Edge middleware RBAC for `/admin/*` and `/dashboard/*`
- Admin layout + empty dashboard

### Sprint 2: Tools (6/6 pts) — ✅ Complete
- 5 interactive tool engines in `src/engine/`:
  1. `campaign-builder/` — CampaignStructure mirrors Amazon Campaign Manager columns. 5 SP + 5 BTV scenarios. BTV has separate scoring rubric (CPM, audience-based, end date required).
  2. `bid-elevator/` — 10 scenarios, synthetic keyword performance, budget tracking
  3. `str-triage/` — 2 scenarios with 20 search terms, 5 action types
  4. `listing-audit/` — 5 scenarios, auto-findings engine
  5. `keyword-research/` — 5 scenarios with PRIMARY/SECONDARY/NEGATIVE categorization
- Server actions in `src/app/actions/tools.ts`: startToolSession, saveToolSession, submitToolSession, loadToolSession, listRecentSessions
- Tool UI shell at `/dashboard/tools` (index, scenario picker, runner) — runner pages are **stubbed placeholders** (full UIs in Sprint 4)

### Sprint 3: Curriculum (3/6 pts) — 🟡 In progress
- **Imported all AMPH v1 content** via `scripts/import-amph-content.ts`:
  - 1 course, 9 modules, 31 lessons (MDX, currency $USD→₱PHP converted)
  - 5 quizzes, 30 questions
  - Idempotent upsert
- **Schema fix**: Prisma SQLite doesn't support enums. Removed 20 enums, replaced with String fields + `src/lib/enums.ts` const objects.
- **Curriculum pages built**:
  - `/dashboard` — student home with course catalog, XP/level/streak stats, per-course progress bars
  - `/dashboard/courses/[courseSlug]` — module + lesson list with per-lesson completion status
  - `/dashboard/courses/[courseSlug]/lessons/[lessonSlug]` — lesson reader with markdown→HTML renderer (`src/lib/mdx.ts`)
  - `/dashboard/courses/[courseSlug]/lessons/[lessonSlug]/quiz` — quiz with server-side scoring
- **Server actions** (`src/app/actions/progress.ts`): startLessonAction, markLessonCompleteAction, submitQuizAction

## What's NOT done (deferred)

- **5 tool interactive UIs** — engines exist, just need React components wrapping them (Sprint 4)
- **Tier gating UI** — `requireTier()` helper exists from Sprint 1, but lesson pages don't yet enforce tier-based access
- **PayMongo integration** — only spec complete, no code (Sprint 6)
- **Admin full panels** — only layout, no user/course/payment/audit management (Sprint 7)
- **Tests** (Sprint 10) — 0% coverage
- **Observability** (Sprint 11) — no Sentry, no structured logs
- **End-to-end runtime verification** — `pnpm dev` not run in this sandbox (no Node). Seed script ran successfully which proves DB + schema + queries work, but the Next.js dev server hasn't been started.

## Critical context for next session

### 1. Enums pattern
**Don't** use const-asserted TUPLE pattern: `export const UserRole = ['STUDENT', ...] as const` — TypeScript doesn't expose `.ADMIN` member access on tuples.

**Do** use const OBJECT pattern: `export const UserRole = { STUDENT: 'STUDENT', INSTRUCTOR: 'INSTRUCTOR', ADMIN: 'ADMIN' } as const; export type UserRole = (typeof UserRole)[keyof typeof UserRole];`

This is in `src/lib/enums.ts`. When you need a new enum, follow this pattern, then add a column with `String` type in `prisma/schema.prisma` (NOT a Prisma enum, because SQLite doesn't support them).

### 2. Path convention
- Project lives at `/storage/emulated/0/Hermes Projects/projects/amph-v2/` — that's the actual filesystem path.
- The workspace tag in WebUI says `/root/workspace` but the project doesn't live there. New files for the project go to the `/storage/...` path.
- All terminal commands `cd` into the project path first.

### 3. Database
- `DATABASE_URL="file:./dev.db"` (relative to project root, NOT `prisma/dev.db`)
- `pnpm prisma migrate deploy` to apply migrations
- `npx tsx scripts/import-amph-content.ts` to import content
- `npx tsx prisma/seed.ts` to seed admin + tiers + badges
- Default admin: `ryan@projectamazonph.com` / `ChangeMe123!`

### 4. The Sprint 2 stub tool runners
At `src/app/(dashboard)/tools/[tool]/[slug]/page.tsx`, the tool-specific UI components (CampaignBuilderRunner, BidElevatorRunner, etc.) are placeholder Card components showing scenario metadata. They need to be replaced with real interactive UIs in Sprint 4.

### 5. The no-ai-slop rule
At `eslint-rules/no-ai-slop.js`. Banned 30+ AI-slop phrases. Runs as part of `pnpm lint`. Don't disable it. If a legitimate string is flagged, fix the rule with a targeted exception, don't ignore the error.

### 6. Currency convention
AMPH content was authored in USD ($24.99 cutting board examples). The import script converts to PHP via `convertCurrency()` — `$X.XX` becomes `₱{X*50} (about $X.XX)`. Keep both currencies in lessons for educational clarity. Don't drop the USD — the Filipino VA audience benefits from seeing both.

## Commands cheat sheet

```bash
# Local dev (when you have Node)
cd "/storage/emulated/0/Hermes Projects/projects/amph-v2"
pnpm install
pnpm gen:secret --write       # writes JWT_SECRET to .env.local
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev                        # localhost:3000

# Content re-import (idempotent)
DATABASE_URL="file:./dev.db" npx tsx scripts/import-amph-content.ts

# DB inspection
DATABASE_URL="file:./dev.db" sqlite3 dev.db ".tables"
DATABASE_URL="file:./dev.db" sqlite3 dev.db "SELECT COUNT(*) FROM Lesson"

# Push
git push "https://x-access-token:$(gh auth token)@github.com/projectamazonph/amph-v2.git" main

# Verify no AI-slop in source
grep -r -E "leverage|seamless|robust|comprehensive" src/ && echo "FOUND" || echo "CLEAN"
```

## State files

- `bmad/project.yaml` — BMAD project config (level 3, English)
- `bmad/workflow-status.yaml` — phase tracking, story list, metrics
- `bmad/sprint-status.yaml` — current sprint details
- `docs/sprint-plan.md` — full 12-sprint roadmap with story breakdowns
- `docs/decisions.md` — 16 ADRs
- `docs/db-schema.md` — schema spec (the source of truth for Prisma schema)
- `docs/design-brief.md` — Field Manual design system
- `docs/voice-guide.md` — copy rules + jargon buster
- `docs/business-layer.md` — PayMongo integration spec
- `docs/admin-backend.md` — admin panel routes + RBAC pattern
- `docs/build-spec.md` — why greenfield
- `docs/product-brief.md` — audience + value prop

## Recommended next-session order of operations

1. **Sprint 4 (priority 1): Tool UIs** — Build the 5 interactive tool UIs. Engines are ready. The Campaign Builder wizard is the most complex (5 steps + BTV audiences). Bid Elevator, STR Triage, Listing Audit, Keyword Research are simpler table/form UIs.

2. **Sprint 3 finish (priority 2)**: Add tier gating to lesson pages — `requireTier()` helper exists, needs to be called in the lesson page Server Component to redirect non-entitled users to `/upgrade`.

3. **Verify locally** before going further: `pnpm install && pnpm prisma migrate dev && pnpm prisma db seed && pnpm dev`. Test: sign in, browse dashboard, open a lesson, take a quiz, mark complete, use a tool.

4. **Sprint 5: Gamification** — auto-award badges, certificate generation, live classes.

5. **Sprint 6: Payments** — PayMongo integration per `docs/business-layer.md`.

## Things I tried that didn't work (avoid repeating)

- **Using `xendit-node` package** — nonexistent, removed in package.json
- **Prisma enums on SQLite** — doesn't compile, fixed via String + local enums.ts
- **`react-email-components` package** — wrong name, removed
- **Const-asserted TUPLE pattern for enums** — doesn't expose `.ADMIN` member access, use const OBJECT pattern
- **npx tsx with JSDoc glob comments** (`*/*.mdx`) — esbuild errors, use prose
- **Running `pnpm dev` in the sandbox** — no Node runtime, can't verify end-to-end

## Memoria state

Stored in memoria (memory IDs 019f3d5a58807c5187d1632e30528b44 and 019f3e13bc957e71850d2647e083397e and earlier). The most recent entry (Sprint 3 partial) covers content import, schema fix, curriculum UI, and what's deferred.

Second Brain entity at `/root/storage/Documents/SecondBrain/wiki/entities/amph-v2.md` covers Sprints 1 and 2 in detail, plus the Sprint 3 partial entry.