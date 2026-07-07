/**
 * Engine — shared types and scoring utilities for the three interactive tools.
 *
 * Each tool (Campaign Builder, Bid Elevator, STR Triage) has its own
 * domain types in its own module, but they all share:
 *   - Scoring (criterion-based, returns CriterionResult[])
 *   - Session state (JSON in ToolSession.state)
 *   - Grade computation (percentage 0-100 from criterion results)
 *
 * No external AI dependencies. Scoring is deterministic.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type CriterionId = string;

export type CriterionResult = {
  criterionId: CriterionId;
  passed: boolean;
  score: number;        // 0-100 for this criterion
  feedback: string;     // 1-3 sentences, no jargon (jargon buster applies)
  details?: Record<string, unknown>;
};

export type ToolGrade = {
  totalScore: number;     // 0-100, weighted average of criteria
  criteriaResults: CriterionResult[];
  passed: boolean;        // totalScore >= passThreshold
  overallFeedback: string;
};

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Aggregate criterion results into a final grade.
 * Each criterion can have an optional weight; defaults to 1 (equal weight).
 */
export function aggregateGrade(
  results: CriterionResult[],
  passThreshold = 70,
  weights: Record<CriterionId, number> = {}
): ToolGrade {
  if (results.length === 0) {
    return {
      totalScore: 0,
      criteriaResults: [],
      passed: false,
      overallFeedback: 'No criteria evaluated.',
    };
  }

  const totalWeight = results.reduce(
    (sum, r) => sum + (weights[r.criterionId] ?? 1),
    0
  );
  const weightedSum = results.reduce(
    (sum, r) => sum + r.score * (weights[r.criterionId] ?? 1),
    0
  );
  const totalScore = Math.round(weightedSum / totalWeight);

  const passedCount = results.filter((r) => r.passed).length;
  const passed = totalScore >= passThreshold;

  const overallFeedback = passed
    ? buildPassFeedback(totalScore, passedCount, results.length)
    : buildFailFeedback(totalScore, passedCount, results.length, results);

  return { totalScore, criteriaResults: results, passed, overallFeedback };
}

function buildPassFeedback(score: number, passed: number, total: number): string {
  if (score >= 95) {
    return `Strong work — ${passed} of ${total} criteria met at top score.`;
  }
  if (score >= 85) {
    return `Solid run. ${passed} of ${total} criteria met. Review the feedback below to tighten anything below 100.`;
  }
  return `Passed. ${passed} of ${total} criteria met. The feedback below points at the weaker spots.`;
}

function buildFailFeedback(
  score: number,
  passed: number,
  total: number,
  results: CriterionResult[]
): string {
  const weakCriteria = results
    .filter((r) => !r.passed)
    .map((r) => r.criterionId)
    .slice(0, 2);
  const weakList = weakCriteria.length > 0 ? ` Focus on: ${weakCriteria.join(', ')}.` : '';
  return `Score ${score}. ${passed} of ${total} criteria met.${weakList}`;
}

// ---------------------------------------------------------------------------
// Common scoring primitives
// ---------------------------------------------------------------------------

/**
 * Score on a 0-100 scale from a 0-1 ratio, snapped to common bands.
 * Used by individual criteria that compute "how close was the answer".
 */
export function ratioScore(ratio: number): number {
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(clamped * 100);
}

/**
 * Binary pass/fail criterion. Use for hard checks like "dailyBudget > 0".
 */
export function binaryCriterion(
  id: CriterionId,
  passed: boolean,
  passMessage: string,
  failMessage: string
): CriterionResult {
  return {
    criterionId: id,
    passed,
    score: passed ? 100 : 0,
    feedback: passed ? passMessage : failMessage,
  };
}

/**
 * Graded criterion: partial credit. Use for numeric targets.
 */
export function gradedCriterion(
  id: CriterionId,
  ratio: number,
  passMessage: string,
  failMessage: string,
  threshold: number = 0.7
): CriterionResult {
  const clamped = Math.max(0, Math.min(1, ratio));
  const passed = clamped >= threshold;
  return {
    criterionId: id,
    passed,
    score: ratioScore(clamped),
    feedback: passed ? passMessage : failMessage,
    details: { ratio: clamped },
  };
}

// ---------------------------------------------------------------------------
// ToolSession JSON shape contract
// ---------------------------------------------------------------------------

/**
 * Canonical shape stored in `ToolSession.state` (JSON).
 * Each tool extends this with its own draft/payload field.
 */
export type ToolSessionStateBase = {
  currentStep: number;
  hintsUsed: number;
  startedAt: string;  // ISO 8601
  completedAt?: string;
};