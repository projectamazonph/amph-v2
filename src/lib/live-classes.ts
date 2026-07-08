/**
 * Live Classes — pure read logic.
 *
 *   - listUpcomingClasses   — published, not cancelled, scheduled in the future
 *   - listPastClasses       — published, scheduled in the past (recording URL populated)
 *   - getClassDetail        — full detail joined with user's registration state
 *   - getRegistrationCount  — current seat count for capacity checks
 */

import 'server-only';

import { db } from './db';

export interface LiveClassSummary {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  maxAttendees: number;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  course: { id: string; slug: string; title: string };
  registrationCount: number;
  isUserRegistered: boolean | null;
}

export interface LiveClassDetail extends LiveClassSummary {
  registeredAt: Date | null;
}

/**
 * Lists upcoming published live classes. Joins registration count and
 * (optionally) the user's registration state.
 */
export async function listUpcomingClasses(
  userId: string | null,
): Promise<LiveClassSummary[]> {
  const classes = await db.liveClass.findMany({
    where: {
      isPublished: true,
      cancelledAt: null,
      scheduledAt: { gte: new Date() },
      deletedAt: null,
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      course: { select: { id: true, slug: true, title: true } },
      registrations: { where: { deletedAt: null }, select: { id: true, userId: true } },
    },
  });

  return classes.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    instructorName: c.instructorName,
    scheduledAt: c.scheduledAt,
    durationMinutes: c.durationMinutes,
    meetingUrl: c.meetingUrl,
    recordingUrl: c.recordingUrl,
    maxAttendees: c.maxAttendees,
    cancelledAt: c.cancelledAt,
    cancellationReason: c.cancellationReason,
    course: c.course,
    registrationCount: c.registrations.length,
    isUserRegistered: userId
      ? c.registrations.some((r) => r.userId === userId)
      : null,
  }));
}

export async function listPastClasses(
  userId: string | null,
): Promise<LiveClassSummary[]> {
  const classes = await db.liveClass.findMany({
    where: {
      isPublished: true,
      scheduledAt: { lt: new Date() },
      deletedAt: null,
    },
    orderBy: { scheduledAt: 'desc' },
    take: 12,
    include: {
      course: { select: { id: true, slug: true, title: true } },
      registrations: { where: { deletedAt: null }, select: { id: true, userId: true } },
    },
  });
  return classes.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    instructorName: c.instructorName,
    scheduledAt: c.scheduledAt,
    durationMinutes: c.durationMinutes,
    meetingUrl: c.meetingUrl,
    recordingUrl: c.recordingUrl,
    maxAttendees: c.maxAttendees,
    cancelledAt: c.cancelledAt,
    cancellationReason: c.cancellationReason,
    course: c.course,
    registrationCount: c.registrations.length,
    isUserRegistered: userId
      ? c.registrations.some((r) => r.userId === userId)
      : null,
  }));
}

export async function getClassDetail(
  classId: string,
  userId: string,
): Promise<LiveClassDetail | null> {
  const klass = await db.liveClass.findUnique({
    where: { id: classId, deletedAt: null },
    include: {
      course: { select: { id: true, slug: true, title: true } },
      registrations: {
        where: { userId, deletedAt: null },
        take: 1,
        select: { id: true, userId: true, registeredAt: true },
      },
      _count: {
        select: {
          registrations: { where: { deletedAt: null } },
        },
      },
    },
  });
  if (!klass) return null;

  const myReg = klass.registrations[0] ?? null;
  return {
    id: klass.id,
    title: klass.title,
    description: klass.description,
    instructorName: klass.instructorName,
    scheduledAt: klass.scheduledAt,
    durationMinutes: klass.durationMinutes,
    meetingUrl: klass.meetingUrl,
    recordingUrl: klass.recordingUrl,
    maxAttendees: klass.maxAttendees,
    cancelledAt: klass.cancelledAt,
    cancellationReason: klass.cancellationReason,
    course: klass.course,
    registrationCount: klass._count.registrations,
    isUserRegistered: myReg !== null,
    registeredAt: myReg?.registeredAt ?? null,
  };
}

/**
 * Returns true if the user has reached the per-class attendee cap.
 * Callers should check AFTER acquiring the registration row to avoid a TOCTOU
 * race; this is a best-effort gate.
 */
export async function isClassFull(classId: string): Promise<boolean> {
  const klass = await db.liveClass.findUnique({
    where: { id: classId },
    select: {
      maxAttendees: true,
      _count: {
        select: { registrations: { where: { deletedAt: null } } },
      },
    },
  });
  if (!klass) return false;
  return klass._count.registrations >= klass.maxAttendees;
}
