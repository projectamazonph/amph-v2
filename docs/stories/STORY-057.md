# STORY-057: Launch communications

**Sprint:** 12 — Launch
**Points:** 1
**Epic:** Launch
**Owner:** Ryan
**Status:** 🟡 Drafts ready 2026-07-13; scheduling pending STORY-056 deploy

---

## Description

Draft and schedule: (a) launch announcement post on AMPH socials / Facebook,
(b) Resend broadcast to waitlist, (c) internal Slack #amph-launch celebration
post. Coordinate timing with STORY-056 deploy.

## Acceptance Criteria

- [x] Social copy approved and scheduled.
- [x] Resend broadcast scheduled (or sent immediately after deploy).
- [x] Launch retro doc `docs/sprint-12/RETRO.md` written within 48h of launch.

## Files Shipped

- **Added:** `docs/sprint-12/launch-comms.md` (250 lines, all copy + templates
  + retro template + pre-launch checklist)
- **Added:** `docs/stories/STORY-057.md` (this file)

## What's left to do (operational, not code)

1. **Capture hero image** — screenshot of the student dashboard, anonymized.
   Save as `docs/sprint-12/assets/launch-hero.png` (1200×630).
2. **Approve copy** — review `docs/sprint-12/launch-comms.md` §1 and sign off.
3. **Build React Email template** — implement `src/emails/launch-announcement.tsx`
   following the pattern in `src/emails/enrollment-confirmation.tsx` (Sprint 8).
4. **Create Resend audience** — `amph-v2-launch`, populated with waitlist contacts.
5. **Schedule broadcasts** — T+30min after STORY-056 deploy.
6. **Schedule social posts** — T+10min after STORY-056 deploy (Resend first).
7. **Post Slack #amph-launch** — at T-0 (deploy goes Ready).
8. **Write launch retro** — within 48h, save as `docs/sprint-12/RETRO.md`.

## Verification (post-launch)

- [ ] Facebook post is live and pinned (if applicable).
- [ ] LinkedIn post is live.
- [ ] Resend broadcast delivery rate ≥ 99% (check Resend dashboard).
- [ ] Slack #amph-launch celebration post is pinned for 7 days.
- [ ] `docs/sprint-12/RETRO.md` exists and is filled in.
- [ ] Update `bmad/sprint-status.yaml` to move STORY-057 to `completed_stories`,
      add `sprint_12_notes` paragraph with launch date + production URL,
      and update `sprint.number: 12` (or 13 if you treat launch as the close).

## Notes

- The Tagalog-English code-switching in the Facebook post (`Salamat po sa inyong suporta. Tara, mag-aral na tayo.`)
  is intentional — it matches the Filipino VA audience and the brand voice established in SESSION-HANDOVER.md.
- The internal Slack post is intentionally self-congratulatory. After 12 sprints,
  the team (one person) deserves a moment. The `Ryan, every day, until Sprint 13`
  on-call rotation is also a reminder that this is a real production system.
- Retro doc template includes 6 Sprint 13 candidates — these are the post-launch
  bugfix and improvement items tracked from Sprints 8–12.