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

  it('awards module_complete badge when criteria met', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Module Complete', criteria: JSON.stringify({ type: 'module_complete', threshold: 1 }), xpReward: 20, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const result = await evaluateBadges('user-1', { trigger: 'lesson_complete' });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(20);
  });

  it('awards quiz_score badge when criteria met', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Perfect Quiz', criteria: JSON.stringify({ type: 'quiz_score', threshold: 100 }), xpReward: 40, description: '', icon: '', tier: 'GOLD', isPublished: true, deletedAt: null },
    ]);
    const result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 100, passed: true });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(40);
  });

  it('does not award quiz_score badge if passed is false or event is not quiz_submit', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Perfect Quiz', criteria: JSON.stringify({ type: 'quiz_score', threshold: 100 }), xpReward: 40, description: '', icon: '', tier: 'GOLD', isPublished: true, deletedAt: null },
    ]);
    // Score matches but not passed
    const res1 = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 100, passed: false });
    expect(res1.awarded).toHaveLength(0);

    // Score too low
    const res2 = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 80, passed: true });
    expect(res2.awarded).toHaveLength(0);

    // Event trigger is not quiz_submit
    const res3 = await evaluateBadges('user-1', { trigger: 'login' });
    expect(res3.awarded).toHaveLength(0);
  });

  it('awards tool_sessions badge when criteria met (scoped & unscoped)', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Campaign Builder Sessions', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 3, scope: { toolType: 'CAMPAIGN_BUILDER' } }), xpReward: 25, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b2', title: 'Any Tool Sessions', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 5 }), xpReward: 35, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);

    // Mock count calls
    (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (query: any) => {
      if (query?.where?.toolType === 'CAMPAIGN_BUILDER') return 3;
      return 5;
    });

    const result = await evaluateBadges('user-1', { trigger: 'tool_submit', toolType: 'CAMPAIGN_BUILDER', passed: true });
    expect(result.awarded).toHaveLength(2);
    expect(result.totalXpGained).toBe(60);
  });

  it('does not award xp_threshold badge when user not found or XP too low', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'XP', slug: 'xp', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 100 } as BadgeCriteria), xpReward: 50, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toHaveLength(0);
  });
});
