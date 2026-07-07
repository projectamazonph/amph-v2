/**
 * Campaign Builder BTV scenarios — 5 across product categories.
 *
 * Sponsored TV is for awareness / top-of-funnel. CPM-based. Audience-based
 * targeting. No keywords or product targets.
 */

import type { CampaignBuilderScenario } from './types';

export const BTV_SCENARIOS: CampaignBuilderScenario[] = [
  {
    id: 'cb-btv-kitchen-001',
    slug: 'kitchen-cutting-board-btv-launch',
    category: 'kitchen',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board with Juice Groove',
      category: 'Kitchen',
      aov: 1200,
      targetAcos: 0.30,
      monthlyRevenue: 180000,
    },
    brief:
      'You are launching a new bamboo cutting board. Use Sponsored TV to drive top-of-funnel awareness on Prime Video, Twitch, and streaming apps. The audience you reach here will retarget later via Sponsored Display.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 2000,
      maxDailyBudget: 12000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 2,
    },
    reference: {
      name: 'Bamboo Cutting Board — BTV Awareness',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_FIXED',
      dailyBudget: 5000,
      defaultBid: 120, // CPM in PHP per 1000 impressions
      adGroupName: 'BTV — In-Market Home & Kitchen',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'IN_MARKET', details: { segment: 'Home & Kitchen', subcategory: 'Kitchen Utensils & Gadgets' } },
        { category: 'LIFESTYLE', details: { segment: 'Eco-Conscious Shoppers' } },
        { category: 'INTERESTS', details: { segment: 'Cooking Enthusiasts' } },
      ],
      explanation:
        'Sponsored TV is for awareness, not direct response. Targeting In-Market Home & Kitchen shoppers catches people already researching products in your category. Layer in Eco-Conscious Lifestyle and Cooking Enthusiast Interests to reach your ideal customer profile. CPM fixed bid at ₱120 — high enough for prime placements but not overpaying. The reference uses 30-day end date to align with launch campaign.',
    },
  },

  {
    id: 'cb-btv-electronics-001',
    slug: 'electronics-usb-c-hub-btv-scale',
    category: 'electronics',
    product: {
      asin: 'B0CUSBC001',
      name: 'USB-C Hub 7-in-1 with HDMI 4K',
      category: 'Electronics',
      aov: 2400,
      targetAcos: 0.25,
      monthlyRevenue: 360000,
    },
    brief:
      'You are scaling a USB-C hub. Sponsored TV reaches tech-conscious shoppers on Prime Video and Twitch. Pair this with your Sponsored Products campaign for full-funnel coverage.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 3000,
      maxDailyBudget: 20000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 3,
    },
    reference: {
      name: 'USB-C Hub — BTV Tech Audience',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_DYNAMIC',
      dailyBudget: 8000,
      defaultBid: 180,
      adGroupName: 'BTV — Tech Enthusiasts + Lookalike',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'IN_MARKET', details: { segment: 'Computers & Accessories', subcategory: 'Computer Accessories' } },
        { category: 'LIFESTYLE', details: { segment: 'Tech Early Adopters' } },
        { category: 'LOOKALIKE', details: { segment: 'Lookalike of past purchasers' } },
        { category: 'CONTEXTUAL', details: { segment: 'Tech Review Content' } },
      ],
      explanation:
        'Higher AOV (₱2,400) justifies a higher CPM bid. CPM Dynamic lets Amazon optimize toward placements that drive conversions. The 4-audience mix covers in-market shoppers, lifestyle match, lookalike of past buyers, and contextual placement near tech review content.',
    },
  },

  {
    id: 'cb-btv-garden-001',
    slug: 'garden-pruning-shears-btv-seasonal',
    category: 'garden',
    product: {
      asin: 'B0DPRUN001',
      name: 'Titanium Bypass Pruning Shears',
      category: 'Garden',
      aov: 850,
      targetAcos: 0.35,
      monthlyRevenue: 127500,
    },
    brief:
      'Spring planting season. Use Sponsored TV to reach gardeners on Prime Video content during a 6-week campaign.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 1000,
      maxDailyBudget: 8000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 2,
    },
    reference: {
      name: 'Pruning Shears — BTV Spring Campaign',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_FIXED',
      dailyBudget: 2500,
      defaultBid: 85,
      adGroupName: 'BTV — Gardening Lifestyle + In-Market',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'IN_MARKET', details: { segment: 'Home & Garden', subcategory: 'Gardening' } },
        { category: 'LIFESTYLE', details: { segment: 'Home Gardeners' } },
        { category: 'INTERESTS', details: { segment: 'Gardening & Horticulture' } },
      ],
      explanation:
        'Seasonal campaign with hard end date (6 weeks). Conservative budget given seasonal AOV. Three audiences: In-Market Garden, Home Gardener Lifestyle, Gardening Interests — heavy overlap which is fine for a short awareness burst. CPM fixed at ₱85 — appropriate for gardening where CTR tends to be lower than tech.',
    },
  },

  {
    id: 'cb-btv-fitness-001',
    slug: 'fitness-resistance-bands-btv-launch',
    category: 'fitness',
    product: {
      asin: 'B0ERESI001',
      name: 'Resistance Bands Set (5 Levels)',
      category: 'Sports & Fitness',
      aov: 950,
      targetAcos: 0.30,
      monthlyRevenue: 142500,
    },
    brief:
      'New Year resolution season. Use Sponsored TV to reach fitness-curious shoppers across Prime Video and Twitch.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 2000,
      maxDailyBudget: 10000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 2,
    },
    reference: {
      name: 'Resistance Bands — BTV New Year Push',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_DYNAMIC',
      dailyBudget: 3500,
      defaultBid: 110,
      adGroupName: 'BTV — Fitness + Lookalike',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'IN_MARKET', details: { segment: 'Sports & Fitness', subcategory: 'Exercise & Fitness' } },
        { category: 'LIFESTYLE', details: { segment: 'Active Lifestyle' } },
        { category: 'LOOKALIKE', details: { segment: 'Lookalike of supplement buyers (related audience)' } },
      ],
      explanation:
        'Seasonal New Year push — high intent window. CPM Dynamic lets Amazon optimize as the season progresses. Lookalike of supplement buyers catches adjacent intent (people buying supplements are in fitness-buying mode). Budget of ₱3,500/day over the 4-week campaign window.',
    },
  },

  {
    id: 'cb-btv-beauty-001',
    slug: 'beauty-vitamin-c-serum-btv-launch',
    category: 'beauty',
    product: {
      asin: 'B0EVITC001',
      name: 'Vitamin C Brightening Serum 20%',
      category: 'Beauty',
      aov: 1500,
      targetAcos: 0.35,
      monthlyRevenue: 225000,
    },
    brief:
      'Beauty brand launch. Use Sponsored TV to reach skincare-aware shoppers on Prime Video content. Repeat-purchase category justifies awareness spend.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 2000,
      maxDailyBudget: 15000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 3,
    },
    reference: {
      name: 'Vitamin C Serum — BTV Beauty Audience',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_DYNAMIC',
      dailyBudget: 4500,
      defaultBid: 140,
      adGroupName: 'BTV — Skincare Lifestyle + Lookalike',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'IN_MARKET', details: { segment: 'Beauty', subcategory: 'Skincare' } },
        { category: 'LIFESTYLE', details: { segment: 'Skincare Enthusiasts' } },
        { category: 'LOOKALIKE', details: { segment: 'Lookalike of beauty buyers' } },
        { category: 'INTERESTS', details: { segment: 'Anti-Aging & Wellness' } },
      ],
      explanation:
        'Highest-touch campaign of the five. Beauty repeat-purchase makes awareness spend justifiable. Four audiences cover in-market skincare, lifestyle match, lookalike of past beauty buyers (highest-intent lookalike), and the anti-aging interest category. CPM Dynamic because beauty creative benefits from optimization over the campaign window.',
    },
  },
];

export function getBtvScenarioBySlug(slug: string): CampaignBuilderScenario | undefined {
  return BTV_SCENARIOS.find((s) => s.slug === slug);
}