/**
 * Bid Elevator — domain types.
 *
 * Bid Elevator is a scenario where the student adjusts bids on a list of
 * keywords given performance data, budget constraints, and an ACoS target.
 */

import type { CriterionResult } from '../scoring';

export type KeywordDecision = {
  keywordId: string;
  newBid: number; // PHP
};

export type BidScenarioKeyword = {
  id: string;
  text: string;
  matchType: 'BROAD' | 'PHRASE' | 'EXACT';
  currentBid: number;
  // Synthetic performance data — what the keyword has done so far
  impressions: number;
  clicks: number;
  orders: number;
  spend: number;     // PHP
  sales: number;      // PHP
};

export type BidScenario = {
  id: string;
  slug: string;
  title: string;
  context: string;        // What's happening with this campaign
  product: {
    asin: string;
    name: string;
    aov: number;
    targetAcos: number;   // 0-1
  };
  constraints: {
    dailyBudget: number;          // PHP — can't exceed
    currentDailySpend: number;    // PHP — where budget is right now
    roundsRemaining: number;      // How many decision rounds the student gets
  };
  keywords: BidScenarioKeyword[];
  /**
   * Reference optimal bids — what an experienced operator would set.
   * Used for scoring. The student never sees this until grading.
   */
  referenceBids: Record<string, number>;
  explanation: string;   // Why these bids are right (shown after grading)
};

export type BidElevatorSessionState = {
  scenarioId: string;
  currentRound: number;
  hintsUsed: number;
  startedAt: string;
  decisions: KeywordDecision[];
  budgetRemaining: number;
};

export type BidElevatorGrade = {
  totalScore: number;
  criteriaResults: CriterionResult[];
  passed: boolean;
  overallFeedback: string;
};