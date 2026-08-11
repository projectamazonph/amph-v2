/**
 * Badge evaluation engine.
 *
 * Pure module. Read-only assessment of badge criteria against the database,
 * plus idempotent awarding of newly-earned badges.
 *
 * Hook points:
 *   - submitToolSession — call evaluateBadges({ trigger: 'tool_submit', toolType })
 *   - markLessonCompleteAction — call evaluateBadges({ trigger: 'lesson_complete' })
 *   - submitQuizAction — call evaluateBadges({ trigger: 'quiz_submit', score, passed })
 *   - sign-in / cron — call evaluateBadges({ trigger: 'login' }) to update streak_days + xp_threshold
 *
 * Badge criteria JSON shape (matches prisma/seed.ts):
 *   { type: 'module_complete', threshold: 1 }
 *   { type: 'quiz_score',      threshold: 100 }
 *   { type: 'tool_sessions',   threshold: 5, scope: { toolType: 'CAMPAIGN_BUILDER' } }
 *   { type: 'streak_days',     threshold: 7 }
 *   { type: 'xp_threshold',    threshold: 1000 }
 */

import { db } from './db';

class EvaluationCache {
  private completedCountPromise: Promise<number> | null = null;
  private toolSessionsPromises = new Map<string, Promise<number>>();
  private userPromise: Promise<{ streakDays: number; xp: number } | null> | null = null;

  getCompletedCount(userId: string): Promise<number> {
    if (!this.completedCountPromise) {
      this.completedCountPromise = db.lessonProgress.count({
        where: { userId, status: 'COMPLETED' },
      });
    }
    return this.completedCountPromise;
  }

  getToolSessionsCount(userId: string, scopeToolType?: string): Promise<number> {
    const key = scopeToolType || 'ALL';
    let promise = this.toolSessionsPromises.get(key);
    if (!promise) {
      promise = db.toolSession.count({
        where: {
          userId,
          status: 'GRADED',
          ...(scopeToolType ? { toolType: scopeToolType } : {}),
        },
      });
      this.toolSessionsPromises.set(key, promise);
    }
    return promise;
  }

  getUser(userId: string): Promise<{ streakDays: number; xp: number } | null> {
    if (!this.userPromise) {
      this.userPromise = db.user.findUnique({
        where: { id: userId },
        select: { streakDays: true, xp: true },
      });
    }
    return this.userPromise;
  }
}

export type BadgeTrigger =
  | { trigger: 'lesson_complete' }
  | { trigger: 'quiz_submit'; score: number; passed: boolean }
  | { trigger: 'tool_submit'; toolType: string; passed: boolean }
  | { trigger: 'login' };

export interface BadgeCriteria {
  type:
    | 'module_complete'
    | 'quiz_score'
    | 'tool_sessions'
    | 'streak_days'
    | 'xp_threshold';
  threshold: number;
  scope?: { toolType?: string };
}

export interface AwardedBadge {
  slug: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  xpReward: number;
}

export interface BadgeEvaluationResult {
  awarded: AwardedBadge[];
  totalXpGained: number;
}

/**
 * Evaluate all badges for a user against the current database state. Award any
 * newly-earned ones. Idempotent — re-running with no new events returns
 * `awarded: []`.
 *
 * Returns the list of badges awarded during THIS call, plus the XP gained from
 * those badge rewards. The caller still needs to update `User.xp` itself if it
 * wants to count it; the engine does NOT mutate `User.xp` to keep this function
 * composable inside larger transactions.
 */
export async function evaluateBadges(
  userId: string,
  event: BadgeTrigger,
): Promise<BadgeEvaluationResult> {
  const published = await db.badge.findMany({
    where: { isPublished: true, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      icon: true,
      tier: true,
      xpReward: true,
      criteria: true,
    },
  });

  const alreadyAwarded = await db.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const alreadyAwardedSet = new Set(alreadyAwarded.map((ub) => ub.badgeId));

  const earnedNow: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    tier: string;
    xpReward: number;
  }> = [];

  const cache = new EvaluationCache();

  for (const badge of published) {
    if (alreadyAwardedSet.has(badge.id)) continue;

    let criteria: BadgeCriteria;
    try {
      criteria = JSON.parse(badge.criteria) as BadgeCriteria;
    } catch {
      // Malformed criteria — skip silently.
      continue;
    }

    const qualifies = await checkCriteria(userId, criteria, event, cache);
    if (qualifies) earnedNow.push(badge);
  }

  // Persist awards in one transaction so partial failures roll back cleanly.
  if (earnedNow.length > 0) {
    await db.$transaction(async (tx) => {
      for (const badge of earnedNow) {
        await tx.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: earnedNow.reduce((sum, b) => sum + b.xpReward, 0) } },
      });
    });
  }

  return {
    awarded: earnedNow.map((b) => ({
      slug: b.slug,
      title: b.title,
      description: b.description,
      icon: b.icon,
      tier: b.tier,
      xpReward: b.xpReward,
    })),
    totalXpGained: earnedNow.reduce((sum, b) => sum + b.xpReward, 0),
  };
}

/**
 * Returns true if the user has met the given badge criteria at this moment.
 * Each branch is a narrow DB read — no writes.
 */
async function checkCriteria(
  userId: string,
  criteria: BadgeCriteria,
  event: BadgeTrigger,
  cache: EvaluationCache,
): Promise<boolean> {
  switch (criteria.type) {
    case 'module_complete': {
      const completedCount = await cache.getCompletedCount(userId);
      // Treat each completed lesson as progress toward module_complete; the
      // seed threshold is 1 so this triggers after the first lesson.
      return completedCount >= criteria.threshold;
    }

    case 'quiz_score': {
      if (event.trigger !== 'quiz_submit') return false;
      if (!event.passed) return false;
      return event.score >= criteria.threshold;
    }

    case 'tool_sessions': {
      const scopeToolType = criteria.scope?.toolType;
      const count = await cache.getToolSessionsCount(userId, scopeToolType);
      return count >= criteria.threshold;
    }

    case 'streak_days': {
      const user = await cache.getUser(userId);
      if (!user) return false;
      return user.streakDays >= criteria.threshold;
    }

    case 'xp_threshold': {
      const user = await cache.getUser(userId);
      if (!user) return false;
      return user.xp >= criteria.threshold;
    }

    default:
      return false;
  }
}
