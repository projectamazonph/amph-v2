'use server';

/**
 * Manual enrollment action (stripped launch build).
 *
 * Admin enters a student email + pricing tier; we create/find the user and
 * enroll them in every course on the tier. For brand-new students the
 * one-time claim link is emailed automatically (best-effort) and also
 * returned so the admin can send it themselves over Messenger as a backup
 * if the email doesn't land (e.g. no Resend domain verified yet).
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/admin-audit';
import { grantManualEnrollment } from '@/lib/enrollment';
import { sendAccountInviteEmail } from '@/lib/email';
import type { ActionResult } from '@/lib/validation';

const manualEnrollSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  name: z.string().trim().max(100).optional(),
  pricingTierId: z.string().min(1, 'Pick a pricing tier.'),
});

export interface ManualEnrollActionData {
  isNewUser: boolean;
  /** Full signup link for new accounts, shown once, admin sends it manually. */
  claimUrl?: string;
  tierName: string;
  enrolledCount: number;
  alreadyEnrolledCount: number;
}

export async function manualEnrollAction(
  input: z.infer<typeof manualEnrollSchema>,
): Promise<ActionResult<ManualEnrollActionData>> {
  await requireAdmin();

  const parsed = manualEnrollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  try {
    const result = await grantManualEnrollment({
      email: parsed.data.email,
      name: parsed.data.name || null,
      pricingTierId: parsed.data.pricingTierId,
    });

    await auditLog({
      action: 'MANUAL_ENROLL',
      entityType: 'User',
      entityId: result.userId,
    });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${result.userId}`);

    let claimUrl: string | undefined;
    if (result.rawClaimToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      const url = new URL('/auth/signup', appUrl);
      url.searchParams.set('claim', result.rawClaimToken);
      url.searchParams.set('email', parsed.data.email);
      url.searchParams.set('next', '/dashboard');
      claimUrl = url.toString();

      // Best-effort: errors are logged, never thrown. The claimUrl above is
      // shown to the admin regardless, as a manual-send backup.
      sendAccountInviteEmail({
        to: parsed.data.email,
        tierName: result.tierName,
        claimUrl,
      }).catch(() => {});
    }

    return {
      success: true,
      data: {
        isNewUser: result.isNewUser,
        claimUrl,
        tierName: result.tierName,
        enrolledCount: result.enrolledCourseIds.length,
        alreadyEnrolledCount: result.alreadyEnrolledCourseIds.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Enrollment failed.',
    };
  }
}
