import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startLessonAction } from '@/app/actions/progress';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { evaluateCourseAccess } from '@/lib/tier-gate';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

vi.mock('@/lib/db', () => ({
  db: {
    lesson: { findUnique: vi.fn() },
    lessonProgress: { findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'u1', email: 'a@b.com', name: 'A', role: 'STUDENT',
    xp: 0, level: 1, streakDays: 0,
  }),
}));

vi.mock('@/lib/tier-gate', () => ({
  evaluateCourseAccess: vi.fn().mockResolvedValue({ allowed: true, userTier: null, requiredTier: null }),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('progress actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'A', role: 'STUDENT',
      xp: 0, level: 1, streakDays: 0,
    });
    (evaluateCourseAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true, userTier: null, requiredTier: null,
    });
  });

  it('startLessonAction returns error when lesson missing', async () => {
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await startLessonAction({ courseSlug: 'c1', lessonSlug: 'l1' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Lesson not found.');
  });

  it('startLessonAction returns error when lesson belongs to another course', async () => {
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'l1', slug: 'l1', module: { course: { slug: 'other' } },
    });
    const result = await startLessonAction({ courseSlug: 'c1', lessonSlug: 'l1' });
    expect(result.success).toBe(false);
  });

  it('startLessonAction does not downgrade an already-completed lesson back to IN_PROGRESS', async () => {
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'l1', slug: 'l1', module: { course: { slug: 'c1' } },
    });
    (db.lessonProgress.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'COMPLETED',
    });

    const result = await startLessonAction({ courseSlug: 'c1', lessonSlug: 'l1' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('COMPLETED');
    expect(db.lessonProgress.upsert).not.toHaveBeenCalled();
  });

  it('startLessonAction marks a not-yet-completed lesson IN_PROGRESS as before', async () => {
    (db.lesson.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'l1', slug: 'l1', module: { course: { slug: 'c1' } },
    });
    (db.lessonProgress.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await startLessonAction({ courseSlug: 'c1', lessonSlug: 'l1' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('IN_PROGRESS');
    expect(db.lessonProgress.upsert).toHaveBeenCalledTimes(1);
  });
});
