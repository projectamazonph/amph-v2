/**
 * Campaign Builder scenario fixtures — 5 packs across product categories.
 *
 * Each scenario mimics a brief an Amazon ads operator would receive:
 * a product with a target AOV, target ACoS, monthly revenue goal, and
 * a reference campaign structure that would actually work.
 *
 * All money in PHP (₱). All product data is realistic but fictional.
 */

import type { CampaignBuilderScenario } from './types';

export const SCENARIOS: CampaignBuilderScenario[] = [
  // -------------------------------------------------------------------------
  // KITCHEN
  // -------------------------------------------------------------------------
  {
    id: 'cb-kitchen-001',
    slug: 'kitchen-cutting-board',
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
      'You are launching a new bamboo cutting board. AOV is ₱1,200, target ACoS is 30%. Monthly revenue goal is ₱180,000. Build the campaign structure that gets you there without burning budget.',
    constraints: {
      minKeywords: 8,
      minProductTargets: 3,
      minDailyBudget: 1000,
      maxDailyBudget: 8000,
      allowedCampaignTypes: ['SPONSORED_PRODUCTS'],
      allowedBidStrategies: ['DYNAMIC_BIDS_DOWN_ONLY', 'FIXED_BIDS'],
      requireEndDate: false,
    },
    reference: {
      name: 'Bamboo Cutting Board — Launch',
      campaignType: 'SPONSORED_PRODUCTS',
      targetingType: 'MANUAL',
      bidStrategy: 'DYNAMIC_BIDS_DOWN_ONLY',
      dailyBudget: 2500,
      defaultBid: 180,
      adGroupName: 'Cutting Board — Exact + Phrase',
      keywords: [
        { text: 'bamboo cutting board', matchType: 'EXACT', bid: 200 },
        { text: 'wooden cutting board', matchType: 'EXACT', bid: 180 },
        { text: 'cutting board with juice groove', matchType: 'PHRASE', bid: 160 },
        { text: 'large cutting board', matchType: 'PHRASE', bid: 140 },
        { text: 'kitchen cutting board', matchType: 'BROAD', bid: 100 },
        { text: 'bamboo kitchen board', matchType: 'BROAD', bid: 90 },
        { text: 'chopping board bamboo', matchType: 'PHRASE', bid: 150 },
        { text: 'cutting board set', matchType: 'BROAD', bid: 80 },
        { text: 'eco cutting board', matchType: 'PHRASE', bid: 130 },
      ],
      productTargets: [
        { asin: 'B08COMP001', bid: 200 },
        { asin: 'B07PLAS002', bid: 180 },
        { asin: 'B09GLAS003', bid: 150 },
        { asin: 'B08WOOD004', bid: 170 },
      ],
      explanation:
        'Manual targeting with a down-only dynamic bid strategy gives you control over which terms trigger the ad while letting Amazon protect budget on clicks unlikely to convert. Daily budget of ₱2,500 is enough for Amazon to learn which keywords convert without burning cash in the first week. Exact and phrase match dominate the keyword list (proven converters); broad match is included for discovery (and you will watch those terms closely and pause the wasteful ones after 2 weeks).',
    },
  },

  // -------------------------------------------------------------------------
  // ELECTRONICS
  // -------------------------------------------------------------------------
  {
    id: 'cb-electronics-001',
    slug: 'electronics-usb-c-hub',
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
      'You are scaling a 7-in-1 USB-C hub. AOV is ₱2,400, target ACoS is 25%. Monthly revenue goal is ₱360,000. The product has 200+ reviews, so the conversion data is already strong.',
    constraints: {
      minKeywords: 10,
      minProductTargets: 4,
      minDailyBudget: 3000,
      maxDailyBudget: 15000,
      allowedCampaignTypes: ['SPONSORED_PRODUCTS', 'SPONSORED_BRANDS'],
      allowedBidStrategies: ['DYNAMIC_BIDS_DOWN_ONLY', 'DYNAMIC_BIDS_UP_AND_DOWN'],
      requireEndDate: false,
    },
    reference: {
      name: 'USB-C Hub — Scale',
      campaignType: 'SPONSORED_PRODUCTS',
      targetingType: 'MANUAL',
      bidStrategy: 'DYNAMIC_BIDS_UP_AND_DOWN',
      dailyBudget: 5000,
      defaultBid: 300,
      adGroupName: 'USB-C Hub — Conversion',
      keywords: [
        { text: 'usb c hub', matchType: 'EXACT', bid: 350 },
        { text: 'usb c hub hdmi', matchType: 'EXACT', bid: 380 },
        { text: '7 in 1 usb c hub', matchType: 'PHRASE', bid: 320 },
        { text: 'usb hub', matchType: 'PHRASE', bid: 280 },
        { text: 'type c hub', matchType: 'BROAD', bid: 200 },
        { text: 'usb c adapter', matchType: 'BROAD', bid: 180 },
        { text: 'macbook hub', matchType: 'PHRASE', bid: 250 },
        { text: 'thunderbolt hub', matchType: 'PHRASE', bid: 220 },
        { text: 'usb c dock', matchType: 'BROAD', bid: 190 },
        { text: 'laptop docking station', matchType: 'BROAD', bid: 160 },
        { text: 'usb c multiport', matchType: 'PHRASE', bid: 270 },
      ],
      productTargets: [
        { asin: 'B08COMP005', bid: 300 },
        { asin: 'B07ANKB006', bid: 280 },
        { asin: 'B09HUB0007', bid: 320 },
        { asin: 'B0CDOCK008', bid: 260 },
        { asin: 'B0CHUB0009', bid: 340 },
      ],
      explanation:
        'At the scaling phase, up-and-down dynamic bidding lets Amazon bid aggressively on high-converting clicks. The keyword mix leans toward exact and phrase (proven converters) with broad as exploration. A ₱5,000 daily budget at 25% target ACoS and ₱2,400 AOV supports roughly 8 sales/day, enough to drive ranking momentum.',
    },
  },

  // -------------------------------------------------------------------------
  // GARDEN
  // -------------------------------------------------------------------------
  {
    id: 'cb-garden-001',
    slug: 'garden-pruning-shears',
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
      'You are launching premium bypass pruning shears. AOV is ₱850, target ACoS is 35% (this category tolerates higher ACoS because repeat purchase is strong). Monthly revenue goal is ₱127,500.',
    constraints: {
      minKeywords: 6,
      minProductTargets: 2,
      minDailyBudget: 500,
      maxDailyBudget: 5000,
      allowedCampaignTypes: ['SPONSORED_PRODUCTS'],
      allowedBidStrategies: ['DYNAMIC_BIDS_DOWN_ONLY', 'FIXED_BIDS', 'LEGACY'],
      requireEndDate: false,
    },
    reference: {
      name: 'Pruning Shears — Garden',
      campaignType: 'SPONSORED_PRODUCTS',
      targetingType: 'MANUAL',
      bidStrategy: 'FIXED_BIDS',
      dailyBudget: 1500,
      defaultBid: 120,
      adGroupName: 'Pruning Shears — Garden Tools',
      keywords: [
        { text: 'pruning shears', matchType: 'EXACT', bid: 130 },
        { text: 'bypass pruners', matchType: 'EXACT', bid: 125 },
        { text: 'garden shears', matchType: 'PHRASE', bid: 110 },
        { text: 'titanium pruners', matchType: 'PHRASE', bid: 140 },
        { text: 'tree pruning shears', matchType: 'PHRASE', bid: 100 },
        { text: 'plant cutting shears', matchType: 'BROAD', bid: 70 },
        { text: 'garden clippers', matchType: 'BROAD', bid: 60 },
      ],
      productTargets: [
        { asin: 'B0DCOMP010', bid: 120 },
        { asin: 'B0EPRUN011', bid: 110 },
        { asin: 'B0DGARD012', bid: 100 },
      ],
      explanation:
        'Garden tools have a longer purchase cycle, so fixed bids keep things predictable. The smaller daily budget (₱1,500) matches the more modest revenue target. The keyword list favors exact and phrase for control — broad terms in this category tend to be wasteful (people searching "garden" are not in buying mode).',
    },
  },

  // -------------------------------------------------------------------------
  // FITNESS
  // -------------------------------------------------------------------------
  {
    id: 'cb-fitness-001',
    slug: 'fitness-resistance-bands',
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
      'You are launching a 5-level resistance band set. AOV is ₱950, target ACoS is 30%. Monthly revenue goal is ₱142,500. The product has a strong impulse-buy angle (price + visual).',
    constraints: {
      minKeywords: 7,
      minProductTargets: 3,
      minDailyBudget: 800,
      maxDailyBudget: 6000,
      allowedCampaignTypes: ['SPONSORED_PRODUCTS'],
      allowedBidStrategies: ['DYNAMIC_BIDS_DOWN_ONLY', 'DYNAMIC_BIDS_UP_AND_DOWN'],
      requireEndDate: false,
    },
    reference: {
      name: 'Resistance Bands — Launch',
      campaignType: 'SPONSORED_PRODUCTS',
      targetingType: 'MANUAL',
      bidStrategy: 'DYNAMIC_BIDS_DOWN_ONLY',
      dailyBudget: 2000,
      defaultBid: 140,
      adGroupName: 'Resistance Bands — Home Workout',
      keywords: [
        { text: 'resistance bands', matchType: 'EXACT', bid: 150 },
        { text: 'resistance band set', matchType: 'EXACT', bid: 160 },
        { text: 'exercise bands', matchType: 'PHRASE', bid: 130 },
        { text: 'workout bands', matchType: 'PHRASE', bid: 120 },
        { text: 'home gym bands', matchType: 'PHRASE', bid: 110 },
        { text: 'resistance loop bands', matchType: 'BROAD', bid: 90 },
        { text: 'fitness bands', matchType: 'BROAD', bid: 80 },
        { text: 'pilates bands', matchType: 'BROAD', bid: 85 },
        { text: 'stretching bands', matchType: 'PHRASE', bid: 100 },
      ],
      productTargets: [
        { asin: 'B0DCOMP013', bid: 140 },
        { asin: 'B0ERES0014', bid: 150 },
        { asin: 'B0DFIT0015', bid: 130 },
        { asin: 'B0DYOGA016', bid: 110 },
      ],
      explanation:
        'Down-only dynamic bidding protects the budget during the launch phase while still being competitive for likely converters. The keyword mix includes broader terms ("fitness bands", "stretching bands") to capture adjacent intent — these typically have lower conversion rates, so down-only matters here.',
    },
  },

  // -------------------------------------------------------------------------
  // BEAUTY
  // -------------------------------------------------------------------------
  {
    id: 'cb-beauty-001',
    slug: 'beauty-vitamin-c-serum',
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
      'You are launching a 20% Vitamin C serum. AOV is ₱1,500, target ACoS is 35% (beauty ACoS runs higher — repeat purchase justifies it). Monthly revenue goal is ₱225,000.',
    constraints: {
      minKeywords: 9,
      minProductTargets: 4,
      minDailyBudget: 1500,
      maxDailyBudget: 10000,
      allowedCampaignTypes: ['SPONSORED_PRODUCTS', 'SPONSORED_BRANDS'],
      allowedBidStrategies: ['DYNAMIC_BIDS_DOWN_ONLY', 'DYNAMIC_BIDS_UP_AND_DOWN'],
      requireEndDate: false,
    },
    reference: {
      name: 'Vitamin C Serum — Launch',
      campaignType: 'SPONSORED_PRODUCTS',
      targetingType: 'MANUAL',
      bidStrategy: 'DYNAMIC_BIDS_DOWN_ONLY',
      dailyBudget: 3500,
      defaultBid: 220,
      adGroupName: 'Vitamin C Serum — Skincare',
      keywords: [
        { text: 'vitamin c serum', matchType: 'EXACT', bid: 240 },
        { text: 'brightening serum', matchType: 'EXACT', bid: 220 },
        { text: 'vitamin c serum for face', matchType: 'PHRASE', bid: 200 },
        { text: 'anti aging serum', matchType: 'PHRASE', bid: 180 },
        { text: 'face serum', matchType: 'PHRASE', bid: 160 },
        { text: 'skincare serum', matchType: 'BROAD', bid: 130 },
        { text: 'glow serum', matchType: 'BROAD', bid: 110 },
        { text: 'dark spot serum', matchType: 'PHRASE', bid: 190 },
        { text: 'natural vitamin c serum', matchType: 'PHRASE', bid: 170 },
        { text: 'facial serum', matchType: 'BROAD', bid: 120 },
      ],
      productTargets: [
        { asin: 'B0DCOMP017', bid: 220 },
        { asin: 'B0ESKIN018', bid: 200 },
        { asin: 'B0DBEAU019', bid: 180 },
        { asin: 'B0ESERU020', bid: 240 },
        { asin: 'B0DANTI021', bid: 190 },
      ],
      explanation:
        'Down-only bidding is the safer choice for a beauty launch — you do not want to overpay on clicks during the learning phase. The product target list covers competitors and complementary products (anti-aging serums, dark-spot correctors) — capturing intent where the buyer is already in category.',
    },
  },

  // -------------------------------------------------------------------------
  // SPONSORED TV (BTV) — Awareness campaign
  // -------------------------------------------------------------------------
  {
    id: 'cb-btv-001',
    slug: 'btv-kitchen-air-fryer',
    category: 'kitchen',
    product: {
      asin: 'B0KITCH001',
      name: 'Smart Air Fryer 6L with App Control',
      category: 'Kitchen',
      aov: 4500,
      targetAcos: 0.50,
      monthlyRevenue: 450000,
    },
    brief:
      'You are launching a new smart air fryer with app control. AOV is ₱4,500, target ACoS is 50% (BTV runs higher ACoS — awareness is the goal, not direct response). Monthly revenue goal is ₱450,000. Build a Sponsored TV campaign to drive top-of-funnel awareness.',
    constraints: {
      minKeywords: 0,
      minProductTargets: 0,
      minDailyBudget: 2000,
      maxDailyBudget: 15000,
      allowedCampaignTypes: ['SPONSORED_TV'],
      allowedBidStrategies: ['CPM_FIXED', 'CPM_DYNAMIC'],
      requireEndDate: true,
      minAudienceSegments: 2,
    },
    reference: {
      name: 'Smart Air Fryer — BTV Awareness',
      campaignType: 'SPONSORED_TV',
      targetingType: 'AUDIENCE',
      bidStrategy: 'CPM_FIXED',
      dailyBudget: 5000,
      defaultBid: 150,
      adGroupName: 'Air Fryer — Lifestyle Audience',
      keywords: [],
      productTargets: [],
      audiences: [
        { category: 'LIFESTYLE', details: { segment: 'home_cooking_enthusiasts' } },
        { category: 'IN_MARKET', details: { segment: 'kitchen_appliances' } },
      ],
      explanation:
        'BTV is for top-of-funnel awareness, not direct response. CPM Fixed gives predictable cost per 1000 impressions. Audience targeting (Lifestyle + In-Market) reaches shoppers interested in home cooking and kitchen appliances. Minimum 2 audience segments ensures enough reach for Amazon to optimize. End date is required — awareness bursts should have a defined flight window.',
    },
  },
];

export function getScenarioBySlug(slug: string): CampaignBuilderScenario | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}

export function getScenarioById(id: string): CampaignBuilderScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** All Sponsored TV (BTV) scenarios — separate export for the tool registry. */
export const BTV_SCENARIOS = SCENARIOS.filter(
  (s) => s.reference.campaignType === 'SPONSORED_TV'
);