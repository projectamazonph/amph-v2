/**
 * Campaign Builder scoring.
 *
 * Deterministic checks against the scenario's reference answer.
 * Each criterion returns 0-100 with a pass/fail threshold.
 */

import {
  aggregateGrade,
  binaryCriterion,
  gradedCriterion,
  type CriterionResult,
} from '../scoring';
import type {
  CampaignDraft,
  CampaignBuilderScenario,
  CampaignBuilderGrade,
} from './types';
/**
 * Empty draft (used when starting a new session).
 */
export function emptyDraft(scenario: CampaignBuilderScenario): CampaignDraft {
  return {
    name: '',
    campaignType: scenario.reference.campaignType,
    portfolioId: null,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: scenario.constraints.requireEndDate
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null,
    dailyBudget: 0,
    targetingType: scenario.reference.targetingType,
    bidStrategy: scenario.reference.bidStrategy,
    defaultBid: 0,
    adGroupName: '',
    keywords: [],
    productTargets: [],
    audiences: [],
  };
}

/**
 * Score a draft against a scenario's reference.
 */
export function gradeCampaignDraft(
  draft: CampaignDraft,
  scenario: CampaignBuilderScenario
): CampaignBuilderGrade {
  const ref = scenario.reference;
  const c = scenario.constraints;

  // BTV campaigns get a different rubric entirely
  if (draft.campaignType === 'SPONSORED_TV' || ref.campaignType === 'SPONSORED_TV') {
    return gradeBtvCampaign(draft, ref, c, scenario);
  }

  const criteria: CriterionResult[] = [
    // 1. Campaign name set
    binaryCriterion(
      'campaign_name',
      draft.name.trim().length > 0,
      'Campaign name is set.',
      'Campaign name is empty. Use a name you will recognize in two weeks — product + audience + angle.'
    ),

    // 2. Campaign type allowed for this brief
    binaryCriterion(
      'campaign_type',
      c.allowedCampaignTypes.includes(draft.campaignType),
      `Campaign type (${prettyCampaignType(draft.campaignType)}) is allowed for this brief.`,
      `This brief restricts you to: ${c.allowedCampaignTypes.map(prettyCampaignType).join(', ')}. Pick one of those.`
    ),

    // 3. Campaign type matches reference
    binaryCriterion(
      'campaign_type_match',
      draft.campaignType === ref.campaignType,
      `Campaign type matches what the brief calls for (${prettyCampaignType(ref.campaignType)}).`,
      `The reference answer uses ${prettyCampaignType(ref.campaignType)}. ${typeMismatchReason(draft.campaignType, ref.campaignType, scenario)}`
    ),

    // 4. Targeting type matches reference
    binaryCriterion(
      'targeting_type_match',
      draft.targetingType === ref.targetingType,
      `Targeting is ${prettyTargetingType(ref.targetingType)} — right call.`,
      `The reference uses ${prettyTargetingType(ref.targetingType)}. ${targetingReason(ref.targetingType)}`
    ),

    // 5. Daily budget within range
    gradedCriterion(
      'daily_budget',
      budgetRatio(draft.dailyBudget, ref.dailyBudget, c.minDailyBudget, c.maxDailyBudget),
      `Daily budget (₱${draft.dailyBudget}) is in a sensible range.`,
      `Daily budget is off. The reference answer uses ₱${ref.dailyBudget}/day. Too low and the campaign can't learn; too high and you burn cash.`,
      0.7
    ),

    // 6. Bid strategy allowed
    binaryCriterion(
      'bid_strategy_allowed',
      c.allowedBidStrategies.includes(draft.bidStrategy),
      `Bid strategy (${prettyBidStrategy(draft.bidStrategy)}) is allowed.`,
      `This brief restricts bid strategy to: ${c.allowedBidStrategies.map(prettyBidStrategy).join(', ')}.`
    ),

    // 7. Bid strategy matches reference
    binaryCriterion(
      'bid_strategy_match',
      draft.bidStrategy === ref.bidStrategy,
      `Bid strategy matches (${prettyBidStrategy(ref.bidStrategy)}).`,
      `Reference uses ${prettyBidStrategy(ref.bidStrategy)}. ${bidStrategyReason(ref.bidStrategy)}`
    ),

    // 8. Default bid in safe range relative to AOV
    gradedCriterion(
      'default_bid_safety',
      bidSafetyRatio(draft.defaultBid, scenario),
      'Default bid is in a safe starting range.',
      `Default bid is too high or too low. A safe starting bid is roughly target ACoS × AOV (₱${Math.round(scenario.product.aov * scenario.product.targetAcos)} for this product).`,
      0.7
    ),

    // 9. Ad group named
    binaryCriterion(
      'ad_group_named',
      draft.adGroupName.trim().length > 0,
      'Ad group is named.',
      'Ad group needs a name. Use a name that tells you what it is in 6 months.'
    ),

    // 10. Keywords present and meet minimum
    gradedCriterion(
      'keyword_coverage',
      keywordRatio(draft.keywords.length, c.minKeywords, ref.keywords.length),
      `Keywords count is good (${draft.keywords.length}).`,
      `Need at least ${c.minKeywords} keywords. The reference has ${ref.keywords.length}. Too few and Amazon has no signal.`,
      0.7
    ),

    // 11. Product targets present if required
    gradedCriterion(
      'product_targets',
      productTargetRatio(draft.productTargets.length, c.minProductTargets, ref.productTargets.length),
      c.minProductTargets > 0
        ? `Product targets present (${draft.productTargets.length}).`
        : 'No product targets needed for this brief.',
      `Need at least ${c.minProductTargets} product targets (ASINs). The reference has ${ref.productTargets.length}.`,
      0.6
    ),

    // 12. Match type mix (variety across exact/phrase/broad)
    binaryCriterion(
      'match_type_variety',
      hasMatchTypeVariety(draft.keywords),
      'Match type mix is varied — exact for control, phrase/broad for reach.',
      'Match type mix is all one type. Exact is too rigid alone; broad alone wastes budget. Use exact for proven converters, phrase for relevance + reach, broad for discovery (and watch closely).'
    ),
  ];

  const result = aggregateGrade(criteria, 70);
  return {
    totalScore: result.totalScore,
    criteriaResults: result.criteriaResults,
    passed: result.passed,
    overallFeedback: result.overallFeedback,
  };
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function budgetRatio(
  draft: number,
  ref: number,
  min: number,
  max: number
): number {
  if (draft <= 0) return 0;
  if (draft < min || draft > max) return 0.3;
  // Closer to reference is better
  const ratio = 1 - Math.abs(draft - ref) / ref;
  return Math.max(0, Math.min(1, ratio));
}

function bidSafetyRatio(bid: number, scenario: CampaignBuilderScenario): number {
  if (bid <= 0) return 0;
  const safe = scenario.product.aov * scenario.product.targetAcos;
  const safeMin = safe * 0.4;
  const safeMax = safe * 1.2;
  if (bid < safeMin) return bid / safeMin;
  if (bid > safeMax) return Math.max(0, 1 - (bid - safeMax) / safeMax);
  return 1;
}

function keywordRatio(have: number, minRequired: number, ref: number): number {
  if (have < minRequired) return have / minRequired;
  return Math.min(1, have / ref);
}

function productTargetRatio(have: number, minRequired: number, ref: number): number {
  if (minRequired === 0) return 1;
  if (have < minRequired) return have / minRequired;
  return Math.min(1, have / ref);
}

function hasMatchTypeVariety(keywords: Array<{ matchType: string }>): boolean {
  if (keywords.length < 3) return true;
  const types = new Set(keywords.map((k) => k.matchType));
  return types.size >= 2;
}

// ---------------------------------------------------------------------------
// Display helpers (use Amazon's exact terminology)
// ---------------------------------------------------------------------------

export function prettyCampaignType(t: CampaignDraft['campaignType']): string {
  return {
    SPONSORED_PRODUCTS: 'Sponsored Products',
    SPONSORED_BRANDS: 'Sponsored Brands',
    SPONSORED_DISPLAY: 'Sponsored Display',
    SPONSORED_TV: 'Sponsored TV',
  }[t];
}

export function prettyTargetingType(t: CampaignDraft['targetingType']): string {
  return { MANUAL: 'Manual', AUTO: 'Auto', AUDIENCE: 'Audience' }[t];
}

export function prettyBidStrategy(s: CampaignDraft['bidStrategy']): string {
  return {
    LEGACY: 'Legacy',
    DYNAMIC_BIDS_DOWN_ONLY: 'Dynamic bids (down only)',
    DYNAMIC_BIDS_UP_AND_DOWN: 'Dynamic bids (up and down)',
    FIXED_BIDS: 'Fixed bids',
    CPM_FIXED: 'CPM Fixed',
    CPM_DYNAMIC: 'CPM Dynamic',
  }[s];
}

function typeMismatchReason(
  chosen: CampaignDraft['campaignType'],
  ref: CampaignDraft['campaignType'],
  scenario: CampaignBuilderScenario
): string {
  if (chosen === 'SPONSORED_BRANDS' && ref === 'SPONSORED_PRODUCTS') {
    return 'For a new product launch, Sponsored Products gives you the most direct path to sales. Sponsored Brands needs a brand store and usually a portfolio of ASINs.';
  }
  if (chosen === 'SPONSORED_DISPLAY' && ref === 'SPONSORED_PRODUCTS') {
    return 'Sponsored Display retargets shoppers but does not catch cold traffic well. For first-time launch, Sponsored Products is more direct.';
  }
  return `For ${scenario.product.category} products, ${prettyCampaignType(ref)} is the standard starting point.`;
}

function targetingReason(ref: CampaignDraft['targetingType']): string {
  if (ref === 'MANUAL') {
    return 'Manual targeting lets you control which keywords and ASINs you bid on. For a new product where you have specific terms in mind, manual is the right call.';
  }
  return 'Auto targeting lets Amazon find keyword and ASIN targets for you. Use it when you do not have a clear keyword hypothesis yet.';
}

function bidStrategyReason(ref: CampaignDraft['bidStrategy']): string {
  if (ref === 'DYNAMIC_BIDS_DOWN_ONLY') {
    return 'Down-only lets Amazon lower your bid when a click looks unlikely to convert, protecting budget while still bidding competitively for likely converters.';
  }
  if (ref === 'DYNAMIC_BIDS_UP_AND_DOWN') {
    return 'Up-and-down gives Amazon the most freedom. Use only when you are comfortable with potentially higher spend.';
  }
  if (ref === 'FIXED_BIDS') {
    return 'Fixed bids give you exact control. Use when you have clear bid values you want to hold.';
  }
  if (ref === 'CPM_FIXED') {
    return 'CPM Fixed bid gives you exact control over the cost per 1000 impressions. Best for awareness campaigns with clear budget pacing.';
  }
  if (ref === 'CPM_DYNAMIC') {
    return 'CPM Dynamic lets Amazon optimize CPM across placements to maximize reach within budget. Best when you want flexibility and trust Amazon to find the best placements.';
  }
  return 'Legacy bidding uses your exact bid with no adjustments. Most campaigns should use a dynamic strategy now.';
}

// ---------------------------------------------------------------------------
// BTV-specific scoring (awareness campaigns, CPM, audience-based)
// ---------------------------------------------------------------------------

function gradeBtvCampaign(
  draft: CampaignDraft,
  ref: CampaignBuilderScenario['reference'],
  c: CampaignBuilderScenario['constraints'],
  scenario: CampaignBuilderScenario
): CampaignBuilderGrade {
  const criteria: CriterionResult[] = [
    binaryCriterion(
      'campaign_name',
      draft.name.trim().length > 0,
      'Campaign name is set.',
      'Campaign name is empty. Use a name you will recognize in two weeks — product + audience + angle.'
    ),
    binaryCriterion(
      'campaign_type_btv',
      draft.campaignType === 'SPONSORED_TV',
      'Campaign type is Sponsored TV — right call for awareness.',
      'This scenario calls for Sponsored TV. BTV is for top-of-funnel awareness, not direct response.'
    ),
    binaryCriterion(
      'targeting_audience',
      draft.targetingType === 'AUDIENCE',
      'Targeting is audience-based — correct for BTV.',
      'BTV uses audience targeting, not manual keywords. Switch to Audience targeting.'
    ),
    binaryCriterion(
      'cpm_bid_strategy',
      draft.bidStrategy === 'CPM_FIXED' || draft.bidStrategy === 'CPM_DYNAMIC',
      'Bid strategy is CPM-based (Fixed or Dynamic).',
      'BTV campaigns use CPM, not CPC bid strategies. Pick CPM Fixed or CPM Dynamic.'
    ),
    binaryCriterion(
      'bid_strategy_match',
      draft.bidStrategy === ref.bidStrategy,
      `Bid strategy matches reference (${prettyBidStrategy(ref.bidStrategy)}).`,
      `Reference uses ${prettyBidStrategy(ref.bidStrategy)}.`
    ),
    gradedCriterion(
      'daily_budget',
      budgetRatioBtv(draft.dailyBudget, ref.dailyBudget, c.minDailyBudget, c.maxDailyBudget),
      'Daily budget is in the BTV range.',
      'Daily budget is off. BTV needs enough scale for Amazon to optimize placements.',
      0.7
    ),
    gradedCriterion(
      'cpm_bid_sanity',
      cpmBidRatio(draft.defaultBid, scenario),
      'CPM bid is reasonable for the audience.',
      'CPM bid is too high or too low. A reasonable BTV CPM in the Philippines is ₱80-200.',
      0.7
    ),
    gradedCriterion(
      'audience_count',
      audienceCountRatio(draft.audiences.length, c.minAudienceSegments ?? 2, ref.audiences?.length ?? 0),
      'Audience segment count meets the brief.',
      `Need at least ${c.minAudienceSegments ?? 2} audience segments.`,
      0.7
    ),
    binaryCriterion(
      'no_keywords_in_btv',
      draft.keywords.length === 0 && draft.productTargets.length === 0,
      'No keywords or product targets — correct for BTV.',
      'BTV does not use keywords or product targets. Clear those fields.'
    ),
    binaryCriterion(
      'has_audiences',
      draft.audiences.length > 0,
      'At least one audience segment is selected.',
      'No audience segments selected. BTV requires audience targeting.'
    ),
    binaryCriterion(
      'has_end_date',
      c.requireEndDate ? draft.endDate !== null : true,
      c.requireEndDate ? 'End date is set.' : 'End date configuration is acceptable.',
      c.requireEndDate ? 'End date is required for BTV awareness campaigns.' : 'End date missing.'
    ),
  ];

  const result = aggregateGrade(criteria, 70);
  return {
    totalScore: result.totalScore,
    criteriaResults: result.criteriaResults,
    passed: result.passed,
    overallFeedback: result.overallFeedback,
  };
}

function budgetRatioBtv(
  draft: number,
  ref: number,
  min: number,
  max: number
): number {
  if (draft <= 0) return 0;
  if (draft < min || draft > max) return 0.3;
  const ratio = 1 - Math.abs(draft - ref) / ref;
  return Math.max(0, Math.min(1, ratio));
}

function cpmBidRatio(bid: number, scenario: CampaignBuilderScenario): number {
  if (bid <= 0) return 0;
  if (bid < 50) return bid / 50;
  if (bid > 300) return Math.max(0, 1 - (bid - 300) / 300);
  return 1;
}

function audienceCountRatio(
  have: number,
  minRequired: number,
  refCount: number
): number {
  if (have < minRequired) return have / minRequired;
  return Math.min(1, have / Math.max(refCount, 1));
}