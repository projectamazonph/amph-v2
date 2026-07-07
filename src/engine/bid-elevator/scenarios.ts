/**
 * Bid Elevator scenario fixtures — 10 scenarios.
 *
 * Each scenario presents a campaign with performance data and asks the
 * student to make bid adjustments. Scenarios cover common situations:
 * - High ACoS keywords that need cuts
 * - High-converting keywords that deserve more
 * - Underperformers to pause
 * - Budget reallocation
 *
 * All data realistic but fictional. All money in PHP.
 */

import type { BidScenario } from './types';

export const SCENARIOS: BidScenario[] = [
  {
    id: 'be-001',
    slug: 'cutting-board-spend-too-high',
    title: 'Cutting Board — Spend Too High',
    context:
      'Your bamboo cutting board campaign is converting, but ACoS is 45% — above the 30% target. Sales are good but you are spending too much. Bring ACoS back to target without killing sales.',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board',
      aov: 1200,
      targetAcos: 0.30,
    },
    constraints: {
      dailyBudget: 2500,
      currentDailySpend: 2400,
      roundsRemaining: 1,
    },
    keywords: [
      { id: 'k1', text: 'bamboo cutting board', matchType: 'EXACT', currentBid: 200, impressions: 4500, clicks: 90, orders: 14, spend: 1620, sales: 16800 },
      { id: 'k2', text: 'wooden cutting board', matchType: 'EXACT', currentBid: 180, impressions: 3200, clicks: 55, orders: 6, spend: 990, sales: 7200 },
      { id: 'k3', text: 'cutting board with juice groove', matchType: 'PHRASE', currentBid: 160, impressions: 2100, clicks: 42, orders: 8, spend: 630, sales: 9600 },
      { id: 'k4', text: 'large cutting board', matchType: 'PHRASE', currentBid: 140, impressions: 1800, clicks: 28, orders: 4, spend: 392, sales: 4800 },
      { id: 'k5', text: 'kitchen cutting board', matchType: 'BROAD', currentBid: 100, impressions: 8000, clicks: 75, orders: 3, spend: 750, sales: 3600 },
    ],
    referenceBids: {
      k1: 180, // high ACoS (1620/16800 = 9.6% ACoS, actually good — but at scale, can sustain slight reduction)
      k2: 140, // high ACoS (990/7200 = 13.75% — actually good, but lower priority)
      k3: 160, // good ACoS (630/9600 = 6.6%), keep
      k4: 110, // decent ACoS, slight cut
      k5: 50,  // BROAD with 5% ACoS — cut hard
    },
    explanation:
      'The broad match "kitchen cutting board" has 5% ACoS and 3 orders from 75 clicks — wasteful discovery term. Cut it hard. The phrase matches with 4+ orders and decent ACoS deserve small cuts to bring overall ACoS down while preserving conversion volume. The exact match "bamboo cutting board" is a strong converter — light cut only.',
  },

  {
    id: 'be-002',
    slug: 'usb-c-hub-scale-up',
    title: 'USB-C Hub — Scale Up',
    context:
      'Your USB-C hub campaign has been running well at ₱4,000/day with ACoS at 22%. Sales are growing. You have room in the budget. Push volume without pushing ACoS above 25%.',
    product: { asin: 'B0CUSBC001', name: 'USB-C Hub 7-in-1', aov: 2400, targetAcos: 0.25 },
    constraints: { dailyBudget: 5000, currentDailySpend: 4000, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'usb c hub', matchType: 'EXACT', currentBid: 350, impressions: 12000, clicks: 360, orders: 60, spend: 10800, sales: 144000 },
      { id: 'k2', text: 'usb c hub hdmi', matchType: 'EXACT', currentBid: 380, impressions: 4800, clicks: 145, orders: 32, spend: 4940, sales: 76800 },
      { id: 'k3', text: '7 in 1 usb c hub', matchType: 'PHRASE', currentBid: 320, impressions: 6500, clicks: 195, orders: 30, spend: 5600, sales: 72000 },
      { id: 'k4', text: 'usb hub', matchType: 'PHRASE', currentBid: 280, impressions: 18000, clicks: 270, orders: 22, spend: 6800, sales: 52800 },
    ],
    referenceBids: {
      k1: 380, // strong converter (16.7% CVR), raise
      k2: 420, // best converter (22% CVR, 21.6% ACoS), raise
      k3: 340, // good (15.4% CVR, 7.8% ACoS), slight raise
      k4: 240, // ACoS at 12.9%, OK but lots of spend — slight cut to fund raises elsewhere
    },
    explanation:
      'The two exact matches are converting at 17% and 22% — raise their bids to capture more of this high-intent traffic. The phrase match "usb hub" is broad and spending a lot with only 8% conversion rate. Light cut there to fund the raises.',
  },

  {
    id: 'be-003',
    slug: 'pruning-shears-discovery',
    title: 'Pruning Shears — Discovery Phase',
    context:
      'New campaign for pruning shears. Two weeks of data. A few terms convert, several are wasteful. Build the bid profile that captures the converters without burning on the rest.',
    product: { asin: 'B0DPRUN001', name: 'Titanium Bypass Pruning Shears', aov: 850, targetAcos: 0.35 },
    constraints: { dailyBudget: 1500, currentDailySpend: 1450, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'pruning shears', matchType: 'EXACT', currentBid: 130, impressions: 3200, clicks: 48, orders: 8, spend: 576, sales: 6800 },
      { id: 'k2', text: 'bypass pruners', matchType: 'EXACT', currentBid: 125, impressions: 1800, clicks: 22, orders: 4, spend: 253, sales: 3400 },
      { id: 'k3', text: 'garden shears', matchType: 'PHRASE', currentBid: 110, impressions: 5800, clicks: 70, orders: 5, spend: 700, sales: 4250 },
      { id: 'k4', text: 'titanium pruners', matchType: 'PHRASE', currentBid: 140, impressions: 450, clicks: 12, orders: 4, spend: 154, sales: 3400 },
      { id: 'k5', text: 'plant cutting shears', matchType: 'BROAD', currentBid: 70, impressions: 12000, clicks: 95, orders: 1, spend: 665, sales: 850 },
      { id: 'k6', text: 'garden clippers', matchType: 'BROAD', currentBid: 60, impressions: 9500, clicks: 80, orders: 2, spend: 480, sales: 1700 },
    ],
    referenceBids: {
      k1: 145, // 16.7% CVR, raise
      k2: 135, // 18.2% CVR, raise
      k3: 90,  // 7.1% CVR, slight cut
      k4: 160, // 33.3% CVR with 4 orders from 12 clicks — this is gold, raise
      k5: 25,  // 1% CVR, cut hard
      k6: 40,  // 2.5% CVR, cut
    },
    explanation:
      'The two exact matches and "titanium pruners" are converting strongly — raise them. The broad terms ("plant cutting shears", "garden clippers") are spending with little return — cut hard. "Garden shears" is somewhere in between — light cut.',
  },

  {
    id: 'be-004',
    slug: 'resistance-bands-budget-cut',
    title: 'Resistance Bands — Budget Tightened',
    context:
      'Your client cut the daily budget from ₱3,000 to ₱1,500. Sales will drop, but you can preserve the profitable conversions by bidding more aggressively on what works and cutting what does not.',
    product: { asin: 'B0ERESI001', name: 'Resistance Bands Set', aov: 950, targetAcos: 0.30 },
    constraints: { dailyBudget: 1500, currentDailySpend: 2950, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'resistance bands', matchType: 'EXACT', currentBid: 150, impressions: 5500, clicks: 88, orders: 12, spend: 1320, sales: 11400 },
      { id: 'k2', text: 'resistance band set', matchType: 'EXACT', currentBid: 160, impressions: 3800, clicks: 68, orders: 14, spend: 1088, sales: 13300 },
      { id: 'k3', text: 'exercise bands', matchType: 'PHRASE', currentBid: 130, impressions: 4200, clicks: 55, orders: 6, spend: 715, sales: 5700 },
      { id: 'k4', text: 'workout bands', matchType: 'PHRASE', currentBid: 120, impressions: 4800, clicks: 60, orders: 5, spend: 720, sales: 4750 },
      { id: 'k5', text: 'home gym bands', matchType: 'PHRASE', currentBid: 110, impressions: 1800, clicks: 25, orders: 3, spend: 275, sales: 2850 },
      { id: 'k6', text: 'resistance loop bands', matchType: 'BROAD', currentBid: 90, impressions: 12000, clicks: 90, orders: 2, spend: 810, sales: 1900 },
    ],
    referenceBids: {
      k1: 200, // 13.6% CVR, raise
      k2: 220, // 20.6% CVR, raise more
      k3: 100, // 10.9% CVR but ACoS at 12.5% — acceptable, slight cut
      k4: 90,  // 8.3% CVR with 15.2% ACoS — cut
      k5: 95,  // 12% CVR with 9.6% ACoS — keep
      k6: 30,  // 2.2% CVR with 42.6% ACoS — cut hard
    },
    explanation:
      'Cut the broad match that is burning budget with no return. Cut the two phrase matches that are spending meaningfully with mediocre CVR. Raise the two exact matches that are the real converters. The "home gym bands" term is a hidden gem — keep its bid near steady.',
  },

  {
    id: 'be-005',
    slug: 'vitamin-c-serum-defense',
    title: 'Vitamin C Serum — Defend ACoS',
    context:
      'A new competitor launched on your top keyword and your ACoS is creeping up to 38% (target 35%). Defend ACoS by trimming wasted spend without losing top-of-page position on the converters.',
    product: { asin: 'B0EVITC001', name: 'Vitamin C Serum 20%', aov: 1500, targetAcos: 0.35 },
    constraints: { dailyBudget: 3500, currentDailySpend: 3400, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'vitamin c serum', matchType: 'EXACT', currentBid: 240, impressions: 8500, clicks: 170, orders: 24, spend: 3060, sales: 36000 },
      { id: 'k2', text: 'brightening serum', matchType: 'EXACT', currentBid: 220, impressions: 4800, clicks: 88, orders: 11, spend: 1760, sales: 16500 },
      { id: 'k3', text: 'vitamin c serum for face', matchType: 'PHRASE', currentBid: 200, impressions: 3200, clicks: 64, orders: 9, spend: 1152, sales: 13500 },
      { id: 'k4', text: 'anti aging serum', matchType: 'PHRASE', currentBid: 180, impressions: 5800, clicks: 92, orders: 7, spend: 1472, sales: 10500 },
      { id: 'k5', text: 'face serum', matchType: 'PHRASE', currentBid: 160, impressions: 9500, clicks: 105, orders: 6, spend: 1575, sales: 9000 },
    ],
    referenceBids: {
      k1: 230, // top converter (14.1% CVR), hold steady
      k2: 210, // 12.5% CVR, slight cut
      k3: 190, // 14% CVR, slight cut
      k4: 150, // 7.6% CVR, 14% ACoS — over target, cut
      k5: 130, // 5.7% CVR, 17.5% ACoS — over target, cut
    },
    explanation:
      'The exact match is your main converter — defend the position with only a tiny adjustment. The two phrase matches that perform well get small cuts. The two phrase matches that perform poorly (under-target ACoS) get bigger cuts to free up budget for the winners.',
  },

  {
    id: 'be-006',
    slug: 'kitchen-board-launch',
    title: 'New Product Launch — Bid From Zero',
    context:
      'You are launching a brand new product. No performance data yet. Set your starting bids based on the brief and standard practice.',
    product: { asin: 'B09KCB002', name: 'Plastic Cutting Board Set', aov: 800, targetAcos: 0.30 },
    constraints: { dailyBudget: 2000, currentDailySpend: 0, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'plastic cutting board', matchType: 'EXACT', currentBid: 0, impressions: 0, clicks: 0, orders: 0, spend: 0, sales: 0 },
      { id: 'k2', text: 'cutting board set', matchType: 'EXACT', currentBid: 0, impressions: 0, clicks: 0, orders: 0, spend: 0, sales: 0 },
      { id: 'k3', text: 'colorful cutting board', matchType: 'PHRASE', currentBid: 0, impressions: 0, clicks: 0, orders: 0, spend: 0, sales: 0 },
      { id: 'k4', text: 'cutting boards kitchen', matchType: 'PHRASE', currentBid: 0, impressions: 0, clicks: 0, orders: 0, spend: 0, sales: 0 },
      { id: 'k5', text: 'cutting board plastic', matchType: 'BROAD', currentBid: 0, impressions: 0, clicks: 0, orders: 0, spend: 0, sales: 0 },
    ],
    referenceBids: {
      k1: 120, // exact: high intent, AOV × target ACoS = 240, slightly under
      k2: 110, // exact: high intent, similar
      k3: 100, // phrase: discovery with some intent
      k4: 85,  // phrase: discovery
      k5: 50,  // broad: lowest, watch closely
    },
    explanation:
      'Standard launch practice: set exact match bids around target ACoS × AOV (₱240 for this product), phrase slightly under, broad much lower. You will adjust after 2 weeks of data.',
  },

  {
    id: 'be-007',
    slug: 'usb-hub-pause-wasteful',
    title: 'USB-C Hub — Pause the Wasteful',
    context:
      'Your USB-C hub campaign has one keyword eating 40% of budget with zero conversions in 30 days. Pause it. Reallocate the freed budget to two keywords that are converting.',
    product: { asin: 'B0CUSBC002', name: 'USB-C Hub Premium', aov: 2800, targetAcos: 0.25 },
    constraints: { dailyBudget: 5000, currentDailySpend: 4900, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'usb c hub', matchType: 'EXACT', currentBid: 350, impressions: 12000, clicks: 280, orders: 42, spend: 8400, sales: 117600 },
      { id: 'k2', text: 'type c hub', matchType: 'BROAD', currentBid: 200, impressions: 25000, clicks: 380, orders: 0, spend: 7600, sales: 0 },
      { id: 'k3', text: 'usb c dock', matchType: 'BROAD', currentBid: 190, impressions: 18000, clicks: 220, orders: 3, spend: 4180, sales: 8400 },
      { id: 'k4', text: 'laptop docking station', matchType: 'BROAD', currentBid: 160, impressions: 22000, clicks: 310, orders: 5, spend: 4960, sales: 14000 },
    ],
    referenceBids: {
      k1: 380, // strong converter, raise
      k2: 0,   // PAUSE — 0 conversions from 380 clicks
      k3: 170, // weak but some signal, slight cut
      k4: 150, // weak, slight cut
    },
    explanation:
      'Pause "type c hub" — 380 clicks, zero orders, 14.8% of budget. Free up that budget for "usb c hub" which is your best converter. The two weak broad terms get slight cuts but not paused since they have at least some signal.',
  },

  {
    id: 'be-008',
    slug: 'pruning-shears-broad-cleanup',
    title: 'Pruning Shears — Cleanup Round',
    context:
      'Three broad match terms are running. The performance data tells a story. Make the call.',
    product: { asin: 'B0DPRUN002', name: 'Bypass Pruners Standard', aov: 700, targetAcos: 0.35 },
    constraints: { dailyBudget: 1200, currentDailySpend: 1180, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'garden tools', matchType: 'BROAD', currentBid: 80, impressions: 45000, clicks: 220, orders: 2, spend: 1760, sales: 1400 },
      { id: 'k2', text: 'gardening', matchType: 'BROAD', currentBid: 60, impressions: 80000, clicks: 180, orders: 1, spend: 1080, sales: 700 },
      { id: 'k3', text: 'outdoor tools', matchType: 'BROAD', currentBid: 70, impressions: 22000, clicks: 95, orders: 4, spend: 665, sales: 2800 },
      { id: 'k4', text: 'pruning shears', matchType: 'EXACT', currentBid: 130, impressions: 2500, clicks: 42, orders: 8, spend: 504, sales: 5600 },
    ],
    referenceBids: {
      k1: 0,   // pause: 0.9% CVR, 125% ACoS, huge spend
      k2: 0,   // pause: 0.6% CVR, 154% ACoS
      k3: 100, // raise: 4.2% CVR, 23.8% ACoS — winning
      k4: 145, // raise: 19% CVR, 9% ACoS — strong
    },
    explanation:
      'The first two broad terms are pure waste — pause them. "Outdoor tools" is converting well for a broad term — raise it. "Pruning shears" exact match is your rock — raise modestly.',
  },

  {
    id: 'be-009',
    slug: 'resistance-bands-rebalance',
    title: 'Resistance Bands — Rebalance',
    context:
      'Two keywords are killing your ACoS at 50%+. One keyword is doing great at 8%. Shift the budget.',
    product: { asin: 'B0ERESI002', name: 'Resistance Loop Bands Heavy', aov: 850, targetAcos: 0.30 },
    constraints: { dailyBudget: 2000, currentDailySpend: 1950, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'resistance loop bands', matchType: 'EXACT', currentBid: 150, impressions: 5200, clicks: 104, orders: 18, spend: 1560, sales: 15300 },
      { id: 'k2', text: 'fitness equipment', matchType: 'BROAD', currentBid: 130, impressions: 28000, clicks: 280, orders: 2, spend: 3640, sales: 1700 },
      { id: 'k3', text: 'exercise equipment home', matchType: 'BROAD', currentBid: 120, impressions: 18000, clicks: 165, orders: 1, spend: 1980, sales: 850 },
      { id: 'k4', text: 'home workout', matchType: 'PHRASE', currentBid: 95, impressions: 9500, clicks: 78, orders: 4, spend: 741, sales: 3400 },
    ],
    referenceBids: {
      k1: 175, // 17.3% CVR, raise
      k2: 0,   // pause: 0.7% CVR, 214% ACoS
      k3: 0,   // pause: 0.6% CVR, 232% ACoS
      k4: 110, // 5.1% CVR, 21.8% ACoS — slight raise
    },
    explanation:
      'Pause both broad terms — they are destroying your budget with zero real return. "Resistance loop bands" exact is a strong converter — raise it. "Home workout" is acceptable — slight raise.',
  },

  {
    id: 'be-010',
    slug: 'vitamin-c-serum-scale-day',
    title: 'Vitamin C Serum — Scale Day',
    context:
      'High-performing campaign. All keywords are converting above target. Budget headroom available. This is the easy round — capture more volume.',
    product: { asin: 'B0EVITC002', name: 'Vitamin C Brightening Serum Pro', aov: 1800, targetAcos: 0.32 },
    constraints: { dailyBudget: 6000, currentDailySpend: 4200, roundsRemaining: 1 },
    keywords: [
      { id: 'k1', text: 'vitamin c serum', matchType: 'EXACT', currentBid: 240, impressions: 9200, clicks: 184, orders: 32, spend: 3312, sales: 57600 },
      { id: 'k2', text: 'brightening serum', matchType: 'EXACT', currentBid: 220, impressions: 5400, clicks: 108, orders: 18, spend: 2160, sales: 32400 },
      { id: 'k3', text: 'face serum', matchType: 'PHRASE', currentBid: 160, impressions: 8500, clicks: 102, orders: 12, spend: 1530, sales: 21600 },
      { id: 'k4', text: 'glow serum', matchType: 'BROAD', currentBid: 110, impressions: 12000, clicks: 95, orders: 8, spend: 1045, sales: 14400 },
    ],
    referenceBids: {
      k1: 280, // 17.4% CVR, 5.8% ACoS, raise
      k2: 260, // 16.7% CVR, 6.7% ACoS, raise
      k3: 185, // 11.8% CVR, 7.1% ACoS, slight raise
      k4: 130, // 8.4% CVR, 7.3% ACoS, slight raise
    },
    explanation:
      'All four keywords are healthy and converting well. Raise all bids moderately to capture more volume within the budget headroom. The exact matches deserve larger raises because the intent is strongest.',
  },
];

export function getScenarioBySlug(slug: string): BidScenario | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}

export function getScenarioById(id: string): BidScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}