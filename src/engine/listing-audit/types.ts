/**
 * Listing Audit — domain types.
 *
 * Student is presented with a product listing (title, bullets, description,
 * images, A+ content, pricing, reviews) and scores it against Amazon's
 * listing quality best practices. Mirrors the Manage Your Inventory detail
 * page + Listing Quality Dashboard from Amazon Advertising Console.
 */

import type { CriterionResult } from '../scoring';

export type ListingAuditFinding = {
  field: 'title' | 'bullets' | 'description' | 'images' | 'aplus' | 'pricing' | 'reviews';
  severity: 'good' | 'warning' | 'critical';
  message: string;
};

export type ListingDraft = {
  title: string;
  bullets: string[];       // Up to 5 bullets
  description: string;     // Long-form description
  imageCount: number;
  hasAplusContent: boolean;
  pricePhp: number;
  reviewCount: number;
  averageRating: number;   // 1.0 to 5.0
};

export type ListingAuditScenario = {
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

  /** The current (suboptimal) listing to audit. */
  currentListing: ListingDraft;

  /** Reference (optimized) listing for scoring. */
  referenceListing: ListingDraft;

  /** Findings generated automatically by the engine for display. */
  referenceFindings: ListingAuditFinding[];

  explanation: string;
};

export type ListingAuditSessionState = {
  scenarioId: string;
  hintsUsed: number;
  startedAt: string;
  /** The student's findings — they identify problems and we grade their identification. */
  findings: ListingAuditFinding[];
  /** Optional: a revised version of the listing they would create. */
  revisedListing?: Partial<ListingDraft>;
};

export type ListingAuditGrade = {
  totalScore: number;
  criteriaResults: CriterionResult[];
  passed: boolean;
  overallFeedback: string;
};