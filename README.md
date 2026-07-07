# AMPH Academy v2

**Amazon advertising training platform for Filipino virtual assistants.**

Three courses. One outcome: the VA becomes the Amazon ads specialist clients retain at ₱60k–₱80k/month.

---

## Status

| Layer | Status |
|-------|--------|
| Architecture | Spec complete (`docs/decisions.md`) |
| Database schema | Spec complete (`docs/db-schema.md`) |
| Design system | Spec complete (`docs/design-brief.md`) |
| Voice + copy guide | Spec complete (`docs/voice-guide.md`) |
| Business layer | Spec complete (`docs/business-layer.md`) |
| Admin backend | Spec complete (`docs/admin-backend.md`) |
| Sprint plan | Active (`docs/sprint-plan.md`) |
| Source code | Sprint 1 starting |

This is a **greenfield rebuild**. v1 lives at `github.com/projectamazonph/AMPH-Academy` and is frozen. No code, schema, or commits from v1 carry over. Every architectural decision is made fresh.

---

## What This Platform Is

A paid training platform where Filipino VAs learn Amazon advertising through structured courses, interactive tools (Campaign Builder, Bid Elevator, Search Term Triage), gamified learning, and downloadable resources.

**Tiers:**
- **PPC Foundations** — ₱2,999
- **Accelerated Mastery** — ₱5,999
- **Ultimate Transformation** — ₱9,999

**Audience:** Filipino virtual assistants who already do general VA work and want to specialize in Amazon advertising. Most earn ₱15k–₱30k/month. They want to reach ₱60k–₱80k/month.

---

## What This Platform Is NOT

- Not a generic course platform. Built for one specific niche.
- Not AI-powered. Zero external AI APIs. See `docs/decisions.md` ADR-003.
- Not a CMS. Content is hand-authored and shipped with the app.
- Not a marketplace. Ryan owns the content.
- Not multi-tenant. Single organization.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 App Router | Server components, server actions, single deploy |
| Language | TypeScript (strict) | Catch errors at compile time |
| Database | PostgreSQL (prod) / SQLite (dev) | Managed in prod, fast local iteration |
| ORM | Prisma | Type-safe queries, migrations |
| Auth | JWT in HttpOnly cookies (jose) | Stateless, works with middleware |
| Styling | CSS Modules + design tokens | No Tailwind. Per design-brief. |
| Icons | Phosphor (light) only | One icon set across the product |
| Fonts | Space Grotesk + JetBrains Mono | Self-hosted via `next/font` |
| Payments | PayMongo | Native PHP, GCash/Maya/card/bank, better DX than PayMongo for one-time Philippine peso flows |
| Email | Resend + React Email | Templates as React components |
| File storage | Vercel Blob | Resources, certificates, receipts |
| Error tracking | Sentry | Errors + performance |
| Testing | Vitest + Playwright | Unit/integration + E2E |
| CI | GitHub Actions | tsc, eslint, vitest, playwright, gitleaks, lighthouse-ci |

---

## Repository Structure

```
amph-v2/
├── src/
│   ├── app/                    Next.js App Router
│   │   ├── (public)/           Public pages (landing, pricing, auth)
│   │   ├── (dashboard)/        Student dashboard + lessons + tools
│   │   ├── admin/              Admin panel
│   │   ├── api/                API routes (webhooks, file uploads)
│   │   └── actions/            Server actions
│   ├── components/
│   │   ├── ui/                 Shared design system components
│   │   ├── features/           Feature-specific components
│   │   └── layout/             Shell components
│   ├── lib/                    Pure utilities (auth, db, validation)
│   ├── engine/                 Domain logic (scoring, grading)
│   ├── stores/                 Zustand stores
│   ├── types/                  TypeScript types
│   └── styles/                 Global CSS + tokens
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                       Specifications (the plan)
│   ├── decisions.md            ADRs
│   ├── design-brief.md         Field Manual design system
│   ├── voice-guide.md          Copy rules + jargon buster
│   ├── db-schema.md            Schema specification
│   ├── admin-backend.md        Admin panel routes + RBAC
│   ├── business-layer.md       Payments, enrollment, refunds
│   ├── ai-removal.md           Zero AI commitment
│   ├── sprint-plan.md          11 sprints, 55 stories
│   └── bmad/                   BMAD state files
├── .github/workflows/          CI
├── eslint-rules/               Custom ESLint rules (no-ai-slop)
├── public/                     Static assets
├── fixtures/                   Quiz data, scenario packs (JSON)
├── downloads/                  Downloadable resources
├── AGENTS.md                   Agent conventions
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET, PAYMONGO_SECRET_KEY, etc.

# Run database migrations
pnpm prisma migrate dev

# Seed fixtures
pnpm prisma db seed

# Start dev server
pnpm dev
```

Open http://localhost:3000.

## Testing

```bash
pnpm test              # Vitest unit + integration
pnpm test:e2e          # Playwright E2E
pnpm test:coverage     # Coverage report
pnpm lint              # ESLint (includes no-ai-slop rule)
pnpm typecheck         # tsc --noEmit
pnpm build             # Production build
```

## Build Status

- Architecture spec: complete
- Source code: in progress (Sprint 1)
- Test coverage: 0% (target: 70%+ on lib/actions)

---

## License

Proprietary. © 2026 Project Amazon PH. All rights reserved.

## Contact

Ryan Roland Dabao — Project Amazon PH
[Email protected]