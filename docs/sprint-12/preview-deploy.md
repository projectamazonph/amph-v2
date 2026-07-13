# Preview Deploy for Browser Test

**Status:** Ready to execute
**Sprint:** 12 / pre-launch gate
**Goal:** Real browser-testable URL with **zero live-payment risk**, before promoting to production.

---

## When to use this

Run this when you want to:
- Click through the entire UI in a real browser before going public
- Verify Filipino-language copy renders correctly
- Confirm mobile responsive at 390px / 1280px / 1920px
- Smoke-test the deploy pipeline (build, env wiring, security headers)
- Demo to a stakeholder without burning production state

**When NOT to use this:** for live student enrollment. That's a production deploy — see `docs/runbooks/production-deploy.md` instead.

---

## Pre-flight (5 min)

```bash
cd ~/code/amph-v2
git checkout main
git pull --ff-only
git log --oneline -5
```

**Expected:** most recent commit is `chore(bmad): workflow-status sprint 12 complete (52/52)` (`44ad0750547c`).

Verify the shell scripts locally before deploying:

```bash
bash -n scripts/smoke-prod.sh && echo "smoke OK"
bash -n scripts/backup-prod.sh && echo "backup OK"
bash -n scripts/restore-prod.sh && echo "restore OK"
```

---

## Step 1 — Set up isolation (recommended, 5 min)

To keep preview errors out of production telemetry, create **parallel preview-only resources**:

### 1a. Sentry preview project

1. https://sentry.io → **Create Project** → Platform: **Next.js** → Name: **`amph-v2-preview`**
2. Copy the DSN from **Project Settings → Client Keys (DSN)**
3. **Settings → Account → Auth Tokens → Create New Token**:
   - Scopes: `project:releases`, `project:write`
   - Save the token (call it `SENTRY_AUTH_TOKEN_preview`)
4. **Settings → Account → Auth Tokens → Create New Token** (a second one):
   - Scopes: `project:read`
   - Save (call it `SENTRY_API_TOKEN_preview`)

### 1b. Slack preview channel

1. Slack → Create channel **`#amph-preview-alerts`**
2. https://api.slack.com/apps → your existing app (or create one) → **Incoming Webhooks** → **Add New Webhook to Workspace** → pick **`#amph-preview-alerts`** → Copy webhook URL

### 1c. Neon preview branch (optional but recommended)

If you don't want browser-test activity in your dev DB:

1. https://console.neon.tech → `amph-v2` project → **Branches → Create Branch**
2. Name: `preview-drift-<date>`
3. Copy the **pooler** connection string
4. Optionally run `npx prisma migrate deploy` against it to bring schema in sync

> **Skipping 1c is fine** for a quick browser test — your dev database is what the preview will hit. Just don't enroll real students.

---

## Step 2 — Set 18 env vars in Vercel (5 min)

Open: https://vercel.com/projectamazonph/amph-v2/settings/environment-variables

For each variable below, click **Add New**, paste the name + value, and check:
- ☑ Production
- ☑ Preview
- ☐ Development

### The 18 vars (with preview-safe substitutions marked)

| # | Variable | Preview-safe value |
|---|---|---|
| 1 | `DATABASE_URL` | Your dev Neon URL **OR** the `preview-drift-<date>` URL from Step 1c |
| 2 | `JWT_SECRET` | Generate fresh: `openssl rand -base64 32` |
| 3 | `PAYMONGO_SECRET_KEY` | **`sk_test_...`** — PayMongo dashboard → Developers → API Keys → **Test** tab |
| 4 | `PAYMONGO_PUBLIC_KEY` | **`pk_test_...`** |
| 5 | `PAYMONGO_WEBHOOK_SECRET` | PayMongo test webhook secret |
| 6 | `RESEND_API_KEY` | Same prod key is OK (Resend only sends to verified addresses) |
| 7 | `RESEND_FROM_EMAIL` | Same as prod: `noreply@projectamazonph.com` |
| 8 | `RESEND_WEBHOOK_SECRET` | Same as prod |
| 9 | `BLOB_READ_WRITE_TOKEN` | Same as prod (Blob is scoped per project, not per env) |
| 10 | `SENTRY_DSN` | **Preview project's DSN** (from Step 1a) |
| 11 | `NEXT_PUBLIC_SENTRY_DSN` | Same as #10 |
| 12 | `SENTRY_AUTH_TOKEN` | **`SENTRY_AUTH_TOKEN_preview`** (Step 1a) |
| 13 | `SENTRY_ORG` | `projectamazonph` |
| 14 | `SENTRY_PROJECT` | **`amph-v2-preview`** (NOT `amph-v2`) |
| 15 | `SENTRY_HOST` | `https://sentry.io` |
| 16 | `SENTRY_API_TOKEN` | **`SENTRY_API_TOKEN_preview`** (Step 1a) |
| 17 | `SLACK_WEBHOOK_URL` | **`#amph-preview-alerts`** webhook URL (Step 1b) |
| 18 | `NEXT_PUBLIC_APP_URL` | **The preview URL itself** — set this AFTER Step 3, then redeploy |

**Verify:**

```bash
vercel env ls
# Expect ~18 rows, each with Production + Preview checked
```

---

## Step 3 — Trigger preview deploy (3 min)

```bash
cd ~/code/amph-v2
vercel login   # if not already
vercel link --yes   # projectamazonph → amph-v2

# Preview deploy — DO NOT pass --prod
vercel deploy
```

Watch the build in another terminal:

```bash
vercel logs amph-v2 --follow
```

When done, Vercel prints:

```
✅ Preview: https://amph-v2-<hash>-projectamazonph.vercel.app
```

**That URL is your browser-test target.** It expires after ~7 days by default.

---

## Step 4 — Update NEXT_PUBLIC_APP_URL (1 min)

Now that you know the preview URL, update it so absolute URLs in emails use it:

```bash
PREVIEW_URL="https://amph-v2-<hash>-projectamazonph.vercel.app"

# Option A — Vercel CLI (one-liner)
echo "$PREVIEW_URL" | vercel env add NEXT_PUBLIC_APP_URL production preview

# Option B — Dashboard: edit NEXT_PUBLIC_APP_URL with the new value
```

Then redeploy so the new value is baked in:

```bash
vercel deploy --force
```

---

## Step 5 — Smoke test (1 min)

```bash
export PROD_URL=https://amph-v2-<hash>-projectamazonph.vercel.app
./scripts/smoke-prod.sh
```

**Expected output:**

```
==> Smoke test against https://amph-v2-<hash>-projectamazonph.vercel.app

-> GET /
  status: 200
  ok checks complete for /

-> GET /pricing
  status: 200
  ok checks complete for /pricing

-> GET /courses
  status: 200
  ok checks complete for /courses

-> GET /dashboard
  status: 302   # auth redirect is OK
  ok checks complete for /dashboard

==> Summary
  routes checked:  4
  headers checked: 6 per route
  failures:        0

OK Smoke test PASSED - preview URL is healthy.
```

**Exit codes:**
- `0` = pass
- `1` = header or route failure (rollback or fix env vars)
- `2` = script setup error

---

## Step 6 — Browser-test checklist

Open the preview URL in **incognito** (avoids cached sessions). Test:

### Public surfaces (no login)

| Page | Look for |
|---|---|
| `/` | Hero, pricing CTA, Tagalog line ("Salamat po sa inyong suporta..."), Philippine flag 🇵🇭 |
| `/pricing` | 3 tiers visible, peso ₱ pricing, "Enroll" CTA |
| `/courses` | Course catalog (published only), module/lesson counts |
| Login modal/page | Email + password form, "Forgot password" link |

### Authenticated (sign up first via `/signup` or use your dev account)

| Page | Look for |
|---|---|
| `/dashboard` | Stats cards, Continue Learning section, recent tools |
| `/courses/[slug]` | Module list, progress indicators |
| `/courses/[slug]/lessons/[id]` | Lesson reader, MDX content renders, prev/next nav |
| `/courses/[slug]/lessons/[id]/quiz` | Quiz form, scoring on submit |
| `/tools` | 5 tool cards (Campaign Builder, Bid Elevator, STR Triage, Listing Audit, Keyword Research) |
| `/tools/[scenario]/run` | Interactive tool UI works end-to-end |
| `/certificates` | Earned certificates render as PDF links |
| `/payments` | Payment history (test entries if any) |

### Admin (login as ADMIN role)

| Page | Look for |
|---|---|
| `/admin` | Stats dashboard renders |
| `/admin/users` | User list with search/pagination |
| `/admin/courses` | Course CRUD with MDX editor |
| `/admin/tools` | Scenario pack management |
| `/admin/analytics` | Charts render (enrollments funnel, revenue MRR) |

### Mobile (resize window to 390px)

- [ ] BottomNav visible on `/dashboard`, `/tools`, `/certificates`, `/payments`
- [ ] No horizontal scroll on any page
- [ ] Forms are full-width and tappable (44px min touch targets)
- [ ] Pricing cards stack vertically
- [ ] Hero copy readable without zoom

### Dark mode (toggle in user settings)

- [ ] All pages adapt (background, text, borders)
- [ ] No white flashes during page transitions

### Observability check

- [ ] Sentry `amph-v2-preview` project: trigger an error (visit `/admin` while logged out) — confirm event appears within 30s
- [ ] `#amph-preview-alerts`: no spam during normal browsing; only fires when you trigger an error

### PayMongo test (optional, only if you want to verify the payment flow)

Use PayMongo's test card:
- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
- Name: anything

Confirm:
1. Checkout redirects to PayMongo
2. Test payment succeeds
3. Enrollment is created in your DB
4. Resend sends a confirmation email (check the recipient inbox)
5. Dashboard shows the new course under "My Courses"

---

## Step 7 — Tear down (when browser test is done)

### Option A — Promote preview to production

If everything looks good and you're ready to go live:

```bash
vercel ls --prod                # find the preview deployment ID
# e.g. amph-v2-44ad0750547cabc-projectamazonph.vercel.app

# Update NEXT_PUBLIC_APP_URL to your real domain BEFORE promoting
echo "https://amph.projectamazonph.com" | vercel env add NEXT_PUBLIC_APP_URL production preview
vercel deploy --force           # rebuild with new URL

# Then promote
vercel promote <preview-deployment-id> --prod
```

Then update the PayMongo env vars to `sk_live_` / `pk_live_` in Vercel (Production only) and follow `docs/runbooks/production-deploy.md`.

### Option B — Let the preview expire

Vercel preview deploys auto-expire after 7 days by default. If you just wanted a quick test and don't need the URL anymore, do nothing — it'll clean itself up.

### Option C — Delete manually

Vercel dashboard → Deployments → click the preview → three-dot menu → **Delete**.

---

## Common issues

### "smoke-prod.sh fails with header mismatch on /dashboard"

If `/dashboard` returns 302 (redirect to login) and you don't accept 3xx, the smoke script accepts 2xx OR 3xx as "reachable" — so 302 is fine. If the script exits 1, it's a real failure: check that env vars are loaded correctly.

### "Sentry events go to amph-v2 (prod) instead of amph-v2-preview"

You set `SENTRY_PROJECT=amph-v2` instead of `amph-v2-preview`. Update the var and redeploy with `--force`.

### "PayMongo rejects my test card"

Check `PAYMONGO_SECRET_KEY` starts with `sk_test_`. Live keys (`sk_live_`) reject test cards.

### "Preview URL not accessible from my network"

Some corporate firewalls block `.vercel.app`. Try a different network or use a personal device.

### "Build fails with 'Module not found'"

The code on `main` should build clean (CI was green). If not, check `git log --oneline -5` — make sure you're not on a stale local branch.

---

## Verification

After running this doc end-to-end:

- [ ] Preview URL returns 2xx for `/`, `/pricing`, `/courses`, `/dashboard`
- [ ] All 6 security headers present, no `X-Powered-By`
- [ ] Login → student dashboard → enroll in course → Resend email arrives
- [ ] Mobile 390px renders without horizontal scroll
- [ ] Sentry preview project receives events from `/dashboard` error
- [ ] `#amph-preview-alerts` does NOT receive any alert during normal browsing

If all boxes tick: ready to promote to production. See `docs/runbooks/production-deploy.md`.

---

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-13 | Initial author (Sprint 12 / pre-launch) | Ryan |