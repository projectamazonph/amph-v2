# STORY-054: Database backup + restore drill

**Sprint:** 12 — Launch
**Points:** 1
**Epic:** Launch
**Owner:** Ryan
**Status:** 🟡 Code shipped 2026-07-13 — drill execution pending real Neon + Blob credentials

---

## Description

Configure daily logical backups (`pg_dump`) on Neon, write restore procedure,
**and execute a restore into a scratch DB** to prove it works.

## Acceptance Criteria

- [x] Neon scheduled backup enabled (or external cron invokes `pg_dump`).
- [x] `docs/runbooks/db-backup-restore.md` documents the procedure.
- [ ] Restore to scratch DB executed; row count of restored `User` table matches
      production within 1%.

## Code delivered

- **Added:** `docs/runbooks/db-backup-restore.md` (222 lines)
- **Added:** `scripts/backup-prod.sh` (137 lines, executable)
- **Added:** `scripts/restore-prod.sh` (183 lines, executable)
- **Added:** `.github/workflows/db-backup.yml` (51 lines, scheduled cron at 02:00 UTC)

## What's left to do (operational, not code)

The code path is fully runnable. To close the third acceptance bullet, Ryan
must:

1. Set the two required secrets in GitHub repo settings:
   - `DATABASE_URL` — production Neon pooler URL
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob production token
2. Trigger the first backup: `gh workflow run db-backup.yml` (or wait for the
   next 02:00 UTC tick).
3. Create a scratch branch in Neon: `restore-drill-2026-07-13`.
4. Run the drill:
   ```bash
   ./scripts/restore-prod.sh \
     "$SCRATCH_NEON_POOLER_URL" \
     "<backup-blob-url-from-step-2>" \
     "$PROD_NEON_POOLER_URL"
   ```
5. Confirm the output shows `User: scratch=X, prod=Y, drift=N% (tol=1%)` and
   that the assertion is `ok` (not `x`).
6. Delete the scratch branch in Neon.
7. Tick the third checkbox above and ship.

## Verification (post-execution)

- [ ] `cat docs/runbooks/db-backup-restore.md` — procedure is fully readable
      end-to-end.
- [ ] `bash -n scripts/backup-prod.sh` — no syntax errors.
- [ ] `bash -n scripts/restore-prod.sh` — no syntax errors.
- [ ] GitHub Actions `db-backup` workflow is enabled and visible in the Actions tab.
- [ ] At least one successful daily backup has landed in Vercel Blob under
      `amph-prod-backups/db/`.
- [ ] Restore drill executed with all row counts within tolerance.

## Files Shipped

- **Added:** `docs/runbooks/db-backup-restore.md`
- **Added:** `scripts/backup-prod.sh`
- **Added:** `scripts/restore-prod.sh`
- **Added:** `.github/workflows/db-backup.yml`
- **Added:** `docs/stories/STORY-054.md` (this file)

## Notes

- The backup script uploads to Vercel Blob using a `PUT` against
  `https://blob.vercel-storage.com/<path>`. This is the simplest portable
  approach; the script will work in any CI without the @vercel/blob npm
  package.
- Backups land under `amph-prod-backups/db/`. The Vercel Blob dashboard should
  have a 30-day lifecycle policy on that prefix; if not, set one now to
  prevent unbounded growth.
- The restore drill asserts row counts on six core tables. ToolSession is
  given 5% tolerance (vs 1% for the others) because it is write-heavy and
  small drift between backup time and run time is expected.
- Schedule rationale: 02:00 UTC = 10:00 PHT — before peak Philippine morning
  traffic, after the European / North American night. Lowest write volume.