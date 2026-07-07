/**
 * Campaign Builder — domain types.
 *
 * Mirrors Amazon Advertising Console's Campaign Manager data shapes
 * so the UI can be an exact copy of what students see in production.
 */

import type { CriterionResult } from '../scoring';

// ---------------------------------------------------------------------------
// Campaign metadata (matches Amazon Advertising Console Campaign Manager)
// ---------------------------------------------------------------------------

export type CampaignType =
  | 'SPONSORED_PRODUCTS'
  | 'SPONSORED_BRANDS'
  | 'SPONSORED_DISPLAY'
  | 'SPONSORED_TV';

export type TargetingType = 'MANUAL' | 'AUTO' | 'AUDIENCE';

/**
 * Sponsored TV targeting — different model from SP/SB/SD.
 * No keywords/ASINs. CPM-based. Audience categories or contextual signals.
 */
export type BtvAudienceCategory =
  | 'IN_MARKET'
  | 'LIFESTYLE'
  | 'INTERESTS'
  | 'LOOKALIKE'
  | 'CONTEXTUAL';

export type BtvAudience = {
  category: BtvAudienceCategory;
  // Each category has different inputs; we store as a free-form record for now
  details: Record<string, string>;
};

export type BidStrategy =
  | 'LEGACY'
  | 'DYNAMIC_BIDS_DOWN_ONLY'
  | 'DYNAMIC_BIDS_UP_AND_DOWN'
  | 'FIXED_BIDS'
  // BTV uses CPM, not CPC
  | 'CPM_FIXED'
  | 'CPM_DYNAMIC';
export type CampaignStatus = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type MatchType = 'BROAD' | 'PHRASE' | 'EXACT';

/**
 * Campaign as it appears in Campaign Manager table.
 * Field names and order mirror Amazon's column layout.
 */
export type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  portfolioId: string | null;
  portfolioName: string | null;
  startDate: string;       // ISO date
  endDate: string | null;  // ISO date or null (ongoing)
  dailyBudget: number;     // PHP
  targetingType: TargetingType;
  bidStrategy: BidStrategy;
  defaultBid: number;      // PHP
  lastUpdated: string;     // ISO datetime
  // Performance (for the "running" view of the campaign — populated
  // by the engine when the scenario includes synthetic performance data)
  performance?: CampaignPerformance;
};

export type CampaignPerformance = {
  impressions: number;
  clicks: number;
  ctr: number;             // 0-1
  spend: number;           // PHP
  orders: number;
  sales: number;           // PHP
  acos: number;            // 0-1
  roas: number;            // 0+
};

// ---------------------------------------------------------------------------
// Ad group, keyword, product targeting
// ---------------------------------------------------------------------------

export type AdGroup = {
  id: string;
  campaignId: string;
  name: string;
  defaultBid: number; // PHP
  keywords: Keyword[];
  productTargets: ProductTarget[];  // ASINs
};

export type Keyword = {
  id: string;
  text: string;
  matchType: MatchType;
  bid: number; // PHP
};

export type ProductTarget = {
  id: string;
  asin: string;
  bid: number; // PHP
};

// ---------------------------------------------------------------------------
// Wizard step state — mirrors Amazon's Create Campaign flow
// ---------------------------------------------------------------------------

/**
 * The student's current draft as they step through the Create Campaign
 * wizard. Each step shows different controls.
 */
export type CampaignDraft = {
  // Step 1: Campaign settings
  name: string;
  campaignType: CampaignType;
  portfolioId: string | null;
  startDate: string;
  endDate: string | null;
  dailyBudget: number;
  targetingType: TargetingType;

  // Step 2: Bidding
  bidStrategy: BidStrategy;
  defaultBid: number;

  // Step 3: Ad group (single ad group for Sprint 2; multi-ad-group in Sprint 3+)
  adGroupName: string;

  // Step 4: Keywords / Product targets (SP/SB/SD only — BTV skips this step)
  keywords: Keyword[];
  productTargets: ProductTarget[];

  // Step 4-alt (BTV): Audience segments — replaces keywords/productTargets for BTV
  audiences: BtvAudience[];
};

/**
 * NOTE: CampaignType and related enums currently live only in TypeScript
 * (`types.ts`). The Campaign model itself is not in prisma/schema.prisma
 * yet — the Campaign Builder tool persists drafts as JSON in ToolSession.state.
 * Sprint 3 (curriculum) will introduce the Campaign model in Prisma with
 * these same enums, at which point this TypeScript mirror must be kept in
 * sync. See docs/db-schema.md for the planned Campaign model.
 */

/**
 * One Campaign Builder scenario — the brief presented to the student.
 * Mimics the "real-life" feel of an Amazon operator receiving a brief.
 */
export type CampaignBuilderScenario = {
  id: string;
  slug: string;
  category: 'kitchen' | 'electronics' | 'garden' | 'fitness' | 'beauty';

  product: {
    asin: string;
    name: string;
    category: string;
    aov: number;          // PHP
    targetAcos: number;   // 0-1 (e.g. 0.25 = 25%)
    monthlyRevenue: number;
  };

  brief: string;             // What the student is being asked to build
  constraints: {
    minKeywords: number;
    minProductTargets: number;
    minDailyBudget: number;
    maxDailyBudget: number;
    allowedCampaignTypes: CampaignType[];
    allowedBidStrategies: BidStrategy[];
    requireEndDate: boolean;
    /** For BTV campaigns: minimum number of audience segments. */
    minAudienceSegments?: number;
  };

  /**
   * Reference answer — what the campaign SHOULD look like.
   * Used for scoring. The student never sees this until after grading.
   */
  reference: {
    name: string;
    campaignType: CampaignType;
    targetingType: TargetingType;
    bidStrategy: BidStrategy;
    dailyBudget: number;
    defaultBid: number;     // PHP (or CPM in PHP for BTV)
    adGroupName: string;
    keywords: Array<Omit<Keyword, 'id' | 'campaignId'>>;
    productTargets: Array<Omit<ProductTarget, 'id' | 'campaignId'>>;
    /** For BTV: reference audiences. */
    audiences?: BtvAudience[];
    explanation: string;     // Why this is correct (shown after grading)
  };
};

// ---------------------------------------------------------------------------
// Session state — stored in ToolSession.state as JSON
// ---------------------------------------------------------------------------

export type CampaignBuilderSessionState = {
  scenarioId: string;
  currentStep: WizardStep;
  hintsUsed: number;
  startedAt: string;
  draft: CampaignDraft;
  completedAt?: string;
};

export type WizardStep = 'campaign' | 'bidding' | 'adgroup' | 'targets' | 'review' | 'audiences';

// ---------------------------------------------------------------------------
// Grade shape (returned to UI)
// ---------------------------------------------------------------------------

export type CampaignBuilderGrade = {
  totalScore: number;
  criteriaResults: CriterionResult[];
  passed: boolean;
  overallFeedback: string;
};