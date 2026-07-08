'use server';

/**
 * Live Classes server actions — register, cancel.
 *
 * Tier check: Live Classes require ULTIMATE_TRANSFORMATION. The check is
 * server-side via `userMeetsTierRequirement` — gating in the UI alone is a
 * security hole.
 *
 * Email reminders: stubbed for Sprint 8 (when Resend templates land). The
 * action returns silently if RESEND_API_KEY is absent, so we don't break the
 * flow in development or pre-launch.
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { CourseTier } from '@/lib/enums';
import { createSafeAction, type ActionResult } from '@/lib/validation';
import { userMeetsTierRequirement } from '@/lib/tier-gate';
import { isClassFull } from '@/lib/live-classes';

const classIdSchema = z.object({ classId: z.string().min(1) });

export interface RegistrationState {
  classId: string;
  registered: boolean;
  alreadyRegistered: boolean;
}

/**
 * Register the current user for a live class. Idempotent — re-registering
 * returns the existing registration with `alreadyRegistered: true`.
 *
 * Tier gate: ULTIMATE_TRANSFORMATION required.
 */
export const registerForLiveClass = createSafeAction<
  typeof classIdSchema,
  RegistrationState
>(classIdSchema, async (data) => {
  const user = await requireAuth();

  const klass = await db.liveClass.findUnique({
    where: { id: data.classId, deletedAt: null },
    select: {
      id: true,
      isPublished: true,
      cancelledAt: true,
      scheduledAt: true,
    },
  });
  if (!klass || !klass.isPublished || klass.cancelledAt) {
    throw new Error('Class is not available.');
  }
  if (klass.scheduledAt.getTime() < Date.now()) {
    throw new Error('This class has already started. Registration is closed.');
  }

  const tier = await userMeetsTierRequirement(user.id, CourseTier.ULTIMATE_TRANSFORMATION);
  if (!tier.allowed) {
    throw new Error(
      `Live Classes require the Ultimate tier. ${
        tier.userTier ? `Your current tier: ${tier.userTier}.` : 'You have no active enrollment.'
      }`,
    );
  }

  const existing = await db.liveClassRegistration.findUnique({
    where: {
      liveClassId_userId: {
        liveClassId: data.classId,
        userId: user.id,
      },
    },
  });

  if (existing && !existing.cancelledAt && !existing.deletedAt) {
    return {
      classId: data.classId,
      registered: true,
      alreadyRegistered: true,
    };
  }

  const full = await isClassFull(data.classId);
  if (full) {
    throw new Error('This class is at capacity. Join the waitlist or pick another date.');
  }

  if (existing) {
    // Was cancelled — restore instead of recreating.
    await db.liveClassRegistration.update({
      where: { id: existing.id },
      data: { cancelledAt: null, deletedAt: null },
    });
  } else {
    await db.liveClassRegistration.create({
      data: {
        liveClassId: data.classId,
        userId: user.id,
      },
    });
  }

  // Stub the email reminder — real wiring lands in Sprint 8 (Resend templates).
  // Logged for visibility while in dev; no-op in production.
  if (process.env.NODE_ENV !== 'production') {
    console.info(
      `[live-classes] would send reminder for class=${data.classId} user=${user.id} (RESEND_API_KEY not wired yet)`,
    );
  }

  return {
    classId: data.classId,
    registered: true,
    alreadyRegistered: false,
  };
});

/**
 * Cancel the user's own registration. Idempotent — cancelling a non-existent
 * registration is a no-op.
 */
export const cancelLiveClassRegistration = createSafeAction<
  typeof classIdSchema,
  { classId: string; cancelled: boolean }
>(classIdSchema, async (data) => {
  const user = await requireAuth();

  const existing = await db.liveClassRegistration.findUnique({
    where: {
      liveClassId_userId: {
        liveClassId: data.classId,
        userId: user.id,
      },
    },
  });
  if (!existing || existing.deletedAt) {
    return { classId: data.classId, cancelled: false };
  }

  await db.liveClassRegistration.update({
    where: { id: existing.id },
    data: { cancelledAt: new Date() },
  });

  return { classId: data.classId, cancelled: true };
});

export interface RegistrationSummary {
  classId: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  cancelledAt: Date | null;
  registeredAt: Date;
  course: { slug: string; title: string };
}

export async function listMyRegistrations(): Promise<RegistrationSummary[]> {
  const user = await requireAuth();
  const regs = await db.liveClassRegistration.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      cancelledAt: null,
    },
    orderBy: { liveClass: { scheduledAt: 'asc' } },
    include: {
      liveClass: {
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          durationMinutes: true,
          meetingUrl: true,
          cancelledAt: true,
          course: { select: { slug: true, title: true } },
        },
      },
    },
  });
  return regs.map((r) => ({
    classId: r.liveClass.id,
    title: r.liveClass.title,
    scheduledAt: r.liveClass.scheduledAt,
    durationMinutes: r.liveClass.durationMinutes,
    meetingUrl: r.liveClass.meetingUrl,
    cancelledAt: r.liveClass.cancelledAt,
    registeredAt: r.registeredAt,
    course: r.liveClass.course,
  }));
}

export type { ActionResult };
