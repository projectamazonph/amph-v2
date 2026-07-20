'use server';

/**
 * Manual enrollment action — stripped launch build.
 *
 * Admin enters a student email + pricing tier; we create/find the user and
 * enroll them in every course on the tier. For brand-new students the
 * one-time claim link is returned so the admin can send it to the student
 * over Messenger/email themselves (no automated email in this build).
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/admin-audit';
import { grantManualEnrollment } from '@/lib/enrollment';
import type { ActionResult } from '@/lib/validation';

const manualEnrollSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  name: z.string().trim().max(100).optional(),
  pricingTierId: z.string().min(1, 'Pick a pricing tier.'),
});

export interface ManualEnrollActionData {
  isNewUser: boolean;
  /** Full signup link for new accounts — show once, admin sends it manually. */
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
