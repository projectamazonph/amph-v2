/**
 * Search Term Triage — domain types.
 *
 * STR Triage Arena presents a list of search terms (the actual shopper
 * queries that triggered the student's ads). For each term the student
 * must decide: keep, pause, negate as exact, negate as phrase, or
 * optimize the bid.
 */

import type { CriterionResult } from '../scoring';

export type StrAction =
  | 'keep'
  | 'pause'
  | 'negate-exact'
  | 'negate-phrase'
  | 'optimize-bid';

export type StrDecision = {
  searchTermId: string;
  action: StrAction;
  newBid?: number;            // PHP — only when action === 'optimize-bid'
  negativeKeyword?: string;   // populated when negate-exact or negate-phrase
};

export type SearchTerm = {
  id: string;
  term: string;
  matchedKeyword: string;     // which campaign keyword it triggered
  matchType: 'BROAD' | 'PHRASE' | 'EXACT';
  impressions: number;
  clicks: number;
  ctr: number;                // 0-1
  spend: number;              // PHP
  cpc: number;                // PHP
  orders: number;
  unitsSold: number;
  sales: number;              // PHP
  acos: number | null;        // 0-1
  roas: number;               // 0+
};

export type StrScenario = {
  id: string;
  slug: string;
  title: string;
  context: string;
  product: {
    asin: string;
    name: string;
    aov: number;
    targetAcos: number;        // 0-1
  };
  constraints: {
    dailyBudget: number;
    currentDailySpend: number;
  };
  searchTerms: SearchTerm[];
  /**
   * Reference actions — what an experienced operator would do for each term.
   * Used for scoring.
   */
  referenceActions: Record<string, StrAction>;
  referenceBidAdjustments?: Record<string, number>;  // for optimize-bid cases
  referenceNegatives?: Record<string, string>;       // termId -> negative keyword to add
  explanation: string;   // Overall pattern shown after grading
};

export type StrTriageSessionState = {
  scenarioId: string;
  currentIndex: number;        // for sequential "next term" navigation
  hintsUsed: number;
  startedAt: string;
  decisions: StrDecision[];
};

export type StrTriageGrade = {
  totalScore: number;
  criteriaResults: CriterionResult[];
  passed: boolean;
  overallFeedback: string;
};