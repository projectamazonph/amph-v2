import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { evaluateBadges } from '@/lib/badges';
import { BadgeCriteria } from '@/lib/badges';
import { CourseTier } from '@/lib/enums';

const txMock = {
  userBadge: { create: vi.fn() },
  user: { update: vi.fn() },
};

vi.mock('@/lib/db', () => {
  const m = {
    badge: { findMany: vi.fn() },
    userBadge: { findMany: vi.fn() },
    lessonProgress: { count: vi.fn() },
    toolSession: { count: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { db: { ...m, $transaction: vi.fn(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)) } };
});

describe('badges.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('returns no awards when no badges earned', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);
    expect(result.totalXpGained).toBe(0);
  });

  it('is idempotent when badge already awarded', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ badgeId: 'b1' }]);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);
  });

  it('awards xp_threshold badge when criteria met', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'XP', slug: 'xp', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 100 } as BadgeCriteria), xpReward: 50, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ xp: 150, streakDays: 0 });
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(50);
  });

  it('skips malformed criteria JSON', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Bad', criteria: 'not-json', xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);
  });

  it('defaults to false for unknown criteria type', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Unknown', criteria: JSON.stringify({ type: 'unknown_type', threshold: 1 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);
  });

  it('awards streak_days badge when criteria met', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Streak', criteria: JSON.stringify({ type: 'streak_days', threshold: 7 }), xpReward: 30, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ streakDays: 10, xp: 0 });
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(30);
  });

  it('does not award streak_days badge when user not found', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Streak', criteria: JSON.stringify({ type: 'streak_days', threshold: 7 }), xpReward: 30, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);
  });

  it('collapses redundant database queries during badge evaluation using EvaluationCache', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Streak 1', criteria: JSON.stringify({ type: 'streak_days', threshold: 5 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b2', title: 'Streak 2', criteria: JSON.stringify({ type: 'streak_days', threshold: 10 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
      { id: 'b3', title: 'XP Threshold 1', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 100 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b4', title: 'XP Threshold 2', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 500 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ streakDays: 7, xp: 150 });

    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toHaveLength(2); // Should award Streak 1 and XP Threshold 1

    // Check that db.user.findUnique was only called EXACTLY once instead of 4 times (since they are collapsed)
    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('collapses redundant queries for module_complete and tool_sessions', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Module 1', criteria: JSON.stringify({ type: 'module_complete', threshold: 1 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b2', title: 'Module 2', criteria: JSON.stringify({ type: 'module_complete', threshold: 5 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
      { id: 'b3', title: 'Tools 1', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 2, scope: { toolType: 'CAMPAIGN_BUILDER' } }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b4', title: 'Tools 2', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 5, scope: { toolType: 'CAMPAIGN_BUILDER' } }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);
    (db.userBadge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toHaveLength(2); // Should award Module 1 and Tools 1

    expect(db.lessonProgress.count).toHaveBeenCalledTimes(1);
    expect(db.toolSession.count).toHaveBeenCalledTimes(1);
  });
});
