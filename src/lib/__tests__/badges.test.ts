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
      { id: 'b1', title: 'Module Complete', slug: 'mod-comp', criteria: JSON.stringify({ type: 'module_complete', threshold: 3 }), xpReward: 20, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    const result = await evaluateBadges('user-1', { trigger: 'lesson_complete' });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(20);
    expect(db.lessonProgress.count).toHaveBeenCalledTimes(1);
  });

  it('does not award module_complete badge when criteria not met', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Module Complete', slug: 'mod-comp', criteria: JSON.stringify({ type: 'module_complete', threshold: 3 }), xpReward: 20, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const result = await evaluateBadges('user-1', { trigger: 'lesson_complete' });
    expect(result.awarded).toEqual([]);
  });

  it('handles quiz_score badge correctly', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Quiz Whiz', slug: 'quiz', criteria: JSON.stringify({ type: 'quiz_score', threshold: 90 }), xpReward: 15, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
    ]);

    // Case 1: different trigger
    let result = await evaluateBadges('user-1', { trigger: 'login' });
    expect(result.awarded).toEqual([]);

    // Case 2: passed is false
    result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 100, passed: false });
    expect(result.awarded).toEqual([]);

    // Case 3: passed true, but score too low
    result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 80, passed: true });
    expect(result.awarded).toEqual([]);

    // Case 4: passed true, score met
    result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 95, passed: true });
    expect(result.awarded).toHaveLength(1);
    expect(result.totalXpGained).toBe(15);
  });

  it('awards tool_sessions badge with and without scope.toolType correctly', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Tools Generic', slug: 'tools-generic', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 2 }), xpReward: 25, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b2', title: 'Tools Specific', slug: 'tools-specific', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 3, scope: { toolType: 'CAMPAIGN_BUILDER' } }), xpReward: 35, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);

    (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (query: any) => {
      const toolType = query?.where?.toolType;
      if (toolType === 'CAMPAIGN_BUILDER') {
        return 4;
      }
      return 2;
    });

    const result = await evaluateBadges('user-1', { trigger: 'tool_submit', toolType: 'CAMPAIGN_BUILDER', passed: true });
    expect(result.awarded).toHaveLength(2);
    expect(result.totalXpGained).toBe(60);
  });

  it('deduplicates database queries using EvaluationCache', async () => {
    (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'b1', title: 'Streak 1', slug: 'streak-1', criteria: JSON.stringify({ type: 'streak_days', threshold: 5 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b2', title: 'Streak 2', slug: 'streak-2', criteria: JSON.stringify({ type: 'streak_days', threshold: 10 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
      { id: 'b3', title: 'XP 1', slug: 'xp-1', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 100 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b4', title: 'XP 2', slug: 'xp-2', criteria: JSON.stringify({ type: 'xp_threshold', threshold: 200 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
      { id: 'b5', title: 'Module 1', slug: 'mod-1', criteria: JSON.stringify({ type: 'module_complete', threshold: 1 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      { id: 'b6', title: 'Module 2', slug: 'mod-2', criteria: JSON.stringify({ type: 'module_complete', threshold: 2 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
    ]);

    (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ streakDays: 7, xp: 150 });
    (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await evaluateBadges('user-1', { trigger: 'login' });
    // streak-1 is met, streak-2 is not. xp-1 is met, xp-2 is not. mod-1 is met, mod-2 is not.
    // Total awarded: streak-1, xp-1, mod-1.
    expect(result.awarded).toHaveLength(3);

    // Verifying EvaluationCache collapsing:
    // Even though 4 badges (streak-1, streak-2, xp-1, xp-2) checked the user, `db.user.findUnique` should only have been called once.
    expect(db.user.findUnique).toHaveBeenCalledTimes(1);

    // Even though 2 badges checked the lesson completed count, `db.lessonProgress.count` should only have been called once.
    expect(db.lessonProgress.count).toHaveBeenCalledTimes(1);
  });
});
