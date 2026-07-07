/**
 * Keyword Research — domain types.
 *
 * Student is given a seed term + product, researches and prioritizes
 * keywords (with relevance score, search volume proxy, competition proxy).
 * Mirrors Amazon Brand Analytics "Search Query Performance" report +
 * Helium 10 / Jungle Scout keyword workflows.
 */

import type { CriterionResult } from '../scoring';

export type KeywordPriority = 'PRIMARY' | 'SECONDARY' | 'NEGATIVE';

export type KeywordCandidate = {
  text: string;
  relevance: number;        // 0-1, how well it matches the product
  searchVolumeProxy: number; // 0-1, normalized "popularity" — not real volume
  competitionProxy: number; // 0-1, normalized "competition" — 0 = low, 1 = high
  priority: KeywordPriority | null;
  notes?: string;
};

export type KeywordResearchScenario = {
  id: string;
  slug: string;
  category: 'kitchen' | 'electronics' | 'garden' | 'fitness' | 'beauty';

  product: {
    asin: string;
    name: string;
    category: string;
    aov: number;
    targetAcos: number;
  };

  seedTerm: string;

  /** Pool of keywords the student must categorize. Mix of relevant + irrelevant. */
  candidates: KeywordCandidate[];

  /**
   * Reference priorities — what an experienced operator would assign.
   * Used for scoring. Student never sees this until grading.
   */
  referencePriorities: Record<string, KeywordPriority>;

  /**
   * Reference for "should be a negative" — terms to add to a negative
   * keyword list (irrelevant products, complementary not competitive, etc.)
   */
  referenceNegatives: string[];

  explanation: string;
};

export type KeywordResearchSessionState = {
  scenarioId: string;
  hintsUsed: number;
  startedAt: string;
  decisions: Array<{ keyword: string; priority: KeywordPriority; notes?: string }>;
  /** Negative keywords the student chose to add. */
  negatives: string[];
};

export type KeywordResearchGrade = {
  totalScore: number;
  criteriaResults: CriterionResult[];
  passed: boolean;
  overallFeedback: string;
};