import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { evaluateBadges, EvaluationCache } from '@/lib/badges';
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

  describe('EvaluationCache and additional branch coverage', () => {
    it('caches lesson progress count queries successfully', async () => {
      const cache = new EvaluationCache('user-cache-test');
      (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const promise1 = cache.getLessonCount();
      const promise2 = cache.getLessonCount();

      expect(promise1).toBe(promise2);
      const res = await promise1;
      expect(res).toBe(5);
      expect(db.lessonProgress.count).toHaveBeenCalledTimes(1);
    });

    it('caches tool session count queries with different scopes successfully', async () => {
      const cache = new EvaluationCache('user-cache-test');
      (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3);

      const promiseAny1 = cache.getToolSessionCount();
      const promiseAny2 = cache.getToolSessionCount();
      expect(promiseAny1).toBe(promiseAny2);

      const promiseSpecific = cache.getToolSessionCount('CAMPAIGN_BUILDER');
      expect(promiseSpecific).not.toBe(promiseAny1);

      await promiseAny1;
      await promiseSpecific;
      expect(db.toolSession.count).toHaveBeenCalledTimes(2);
    });

    it('caches user details queries successfully', async () => {
      const cache = new EvaluationCache('user-cache-test');
      (db.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ streakDays: 5, xp: 500 });

      const promise1 = cache.getUser();
      const promise2 = cache.getUser();
      expect(promise1).toBe(promise2);

      const res = await promise1;
      expect(res?.xp).toBe(500);
      expect(db.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('handles module_complete criteria checks correctly', async () => {
      (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'b_mod', title: 'Module Complete', criteria: JSON.stringify({ type: 'module_complete', threshold: 1 }), xpReward: 10, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      ]);
      (db.lessonProgress.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const result = await evaluateBadges('user-1', { trigger: 'lesson_complete' });
      expect(result.awarded).toHaveLength(1);
    });

    it('handles quiz_score criteria checks correctly', async () => {
      (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'b_quiz', title: 'Perfect Quiz', criteria: JSON.stringify({ type: 'quiz_score', threshold: 100 }), xpReward: 15, description: '', icon: '', tier: 'BRONZE', isPublished: true, deletedAt: null },
      ]);

      // Failed quiz submit
      let result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 100, passed: false });
      expect(result.awarded).toHaveLength(0);

      // Passed but low score
      result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 80, passed: true });
      expect(result.awarded).toHaveLength(0);

      // Passed with enough score
      result = await evaluateBadges('user-1', { trigger: 'quiz_submit', score: 100, passed: true });
      expect(result.awarded).toHaveLength(1);
    });

    it('handles tool_sessions criteria checks with and without scope correctly', async () => {
      (db.badge.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'b_tool_any', title: 'Tool Master', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 3 }), xpReward: 20, description: '', icon: '', tier: 'SILVER', isPublished: true, deletedAt: null },
        { id: 'b_tool_builder', title: 'Builder Master', criteria: JSON.stringify({ type: 'tool_sessions', threshold: 2, scope: { toolType: 'CAMPAIGN_BUILDER' } }), xpReward: 25, description: '', icon: '', tier: 'GOLD', isPublished: true, deletedAt: null },
      ]);

      (db.toolSession.count as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (args) => {
        if (args?.where?.toolType === 'CAMPAIGN_BUILDER') {
          return 2;
        }
        return 3;
      });

      const result = await evaluateBadges('user-1', { trigger: 'tool_submit', toolType: 'CAMPAIGN_BUILDER', passed: true });
      expect(result.awarded).toHaveLength(2);
    });
  });
});
