# Contributing to Project Amazon PH Academy v2

Thank you for your interest in contributing to Project Amazon PH Academy! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/amph-v2.git`
3. **Install dependencies**: `pnpm install`
4. **Set up environment**: Copy `.env.example` to `.env` and configure
5. **Start development**: `pnpm dev`

## 📋 Development Standards

### The Five Rules (Mandatory)
1. **Zero AI features.** No `openai`, `anthropic`, `langchain`, or any LLM API. No mentor chat, no AI mistake analysis.
2. **One icon set.** Phosphor (light) only. No Heroicons, no Lucide.
3. **One font pairing.** Space Grotesk + JetBrains Mono. No Inter, no system fonts in product UI.
4. **Server actions for mutations.** Reserve API routes for webhooks, file uploads, third-party.
5. **Every admin action logs to AuditLog.** No exceptions.

### Code Style
- **TypeScript strict** - No `any`. Define types or use `unknown` with narrowing.
- **Server components by default** - `'use client'` only when needed.
- **No `console.log` in committed code** - Use the structured logger (`src/lib/logger.ts`).
- **No comments that restate the code** - Comment the why, not the what.
- **File names**: `kebab-case.ts` for non-component files, `PascalCase.tsx` for components.

### Testing
- **Vitest** for unit + integration tests.
- **Playwright** for E2E tests.
- **Tests live next to the code they test**: `foo.ts` → `foo.test.ts`.
- **Coverage thresholds**: 70% on `src/lib` and `src/app/actions`.

### Voice & Design
- **Voice**: Direct, plain-spoken, Filipino VA audience. No jargon without definition. No AI-slop phrases.
- **Design System**: Field Manual. Dense, scannable, utilitarian. Off-white surface. Orange accent (#FF6B35). Type-led hierarchy.

## 🔄 Development Workflow

### Branching Strategy
- `main` — production-ready
- `feat/*` — feature branches
- `fix/*` — bugfix branches
- Branch off `main`, PR back to `main`
- Squash merge

### Commit Guidelines
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **One concern per commit** - Don't mix refactor + feature
- **Reference story IDs**: `feat(admin): user list table (STORY-027)`
- **Always `git commit` after work** - Never leave uncommitted changes

### CI Requirements (Build Fails If Any Fail)
- `pnpm tsc --noEmit` — zero type errors
- `pnpm lint` — zero ESLint errors (includes no-ai-slop)
- `pnpm test` — all tests pass
- `pnpm test:coverage` — coverage above threshold
- `pnpm test:e2e` — Playwright suite passes
- `pnpm build` — production build succeeds
- Lighthouse CI — performance budget met
- `gitleaks detect` — no secrets in diff

## 🏗️ Architecture Guidelines

### File Dependency Chain
```
src/lib/        ← Pure utilities, no deps
   ↑
src/components/ ← UI primitives, depend on lib
   ↑
src/app/        ← Routes, depend on components + lib
   ↑
tests/          ← Mirror src structure
```

**Lower layers must not import from higher layers.** `src/lib/auth.ts` cannot import from `src/app/`.

### Database
- **PostgreSQL** for all environments (dev + production)
- **Schema uses no SQLite-specific features**
- **Every mutable table has**: `deletedAt`, `createdById`, `updatedById`

### Admin Panel
- `/admin/*` gated by `requireAdmin()`
- Every route has search, filter, pagination
- Every mutation is audited to AuditLog

## 🚫 What NOT To Do

- Don't add dependencies without updating `package.json` and `pnpm-lock.yaml`.
- Don't use `fetch` directly in components. Use server actions.
- Don't store secrets in code. Use env vars.
- Don't commit `.env*` files. `.env.example` is allowed.
- Don't use emojis in code or commit messages.
- Don't use em-dashes. Use periods, commas, parentheses.
- Don't write generic AI-slop copy.
- Don't ship code without tests for new features (admin and business layer are mandatory).
- Don't ignore the AuditLog. Every admin mutation logs.

## 🐛 Error Handling

When something breaks:
1. **Read the actual error.** Don't guess.
2. **Reproduce in the smallest possible test.**
3. **Fix root cause, not symptom.**
4. **Add a test that would have caught this.**
5. **Commit fix + test together.**

## 📝 Pull Request Process

### 1. Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes
- Follow the coding standards above
- Write tests for new functionality
- Ensure all tests pass locally

### 3. Commit Your Changes
```bash
git commit -m "feat(your-area): description of change (STORY-XXX)"
```

### 4. Push and Create PR
```bash
git push origin feat/your-feature-name
```

### 5. PR Requirements
- **Title**: Follow conventional commits format
- **Description**: Explain what and why, not how
- **Tests**: Include tests for new features
- **Screenshots**: For UI changes, include before/after screenshots
- **Story Reference**: Link to relevant story/task

### 6. Code Review
- Address all review comments
- Ensure CI passes
- Get approval from at least one maintainer

## 🎯 Issue Guidelines

### Bug Reports
- **Clear title**: Describe the issue concisely
- **Steps to reproduce**: Numbered list of steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, device

### Feature Requests
- **Problem statement**: What problem does this solve?
- **Proposed solution**: How should it work?
 - **Alternatives considered**: Other approaches
- **Business value**: Why is this important?

## 🔒 Security

- **Never commit secrets** - Use environment variables
- **Report security issues privately** - Email security@projectamazonph.com
- **Follow OWASP guidelines** - Especially for authentication and data handling

## 📚 Documentation

- **Update README** if adding new features
- **Update ADRs** for architectural decisions
- **Write inline comments** for complex business logic
- **Maintain CHANGELOG** with your changes

## 🆘 Getting Help

- **Documentation**: Check existing docs in `docs/`
- **AGENTS.md**: Read the five rules and coding standards
- **Codebase**: Look at existing patterns for guidance
- **Team**: Reach out to maintainers for complex issues

## 🎉 Thank You!

Your contributions help Filipino virtual assistants learn Amazon PPC skills and earn more. Every improvement to this platform makes a real difference in people's lives.

---

**Project Amazon PH Academy** - Bridging the gap between general admin work and specialized Amazon PPC skills.

*© 2026 Project Amazon PH. All rights reserved.*