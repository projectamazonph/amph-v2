/**
 * Email — disabled in the stripped launch build.
 *
 * Resend was removed for the manual-enrollment launch (see
 * docs/LAUNCH-DEPLOY.md). These stubs keep the call sites compiling and log
 * what WOULD have been sent, so callers stay best-effort no-ops exactly like
 * the old Resend-backed versions when RESEND_API_KEY was unset.
 *
 * To restore real sending, revert to the pre-strip `email.tsx` from the main
 * repo history and re-add the `resend` dependency.
 */

import 'server-only';

import { logger } from './logger';

interface LiveClassReminderEmailProps {
  to: string;
  studentName: string;
  classTitle: string;
  instructorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string | null;
}

/** No-op: email sending is disabled in this build. Logs and resolves. */
export async function sendLiveClassReminderEmail({
  to,
  classTitle,
  scheduledAt,
}: LiveClassReminderEmailProps): Promise<void> {
  logger.info(
    { to, classTitle, scheduledAt },
    '[email disabled] skipped live-class reminder',
  );
}
