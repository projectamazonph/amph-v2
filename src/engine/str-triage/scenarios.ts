/**
 * Search Term Triage scenario fixtures — 20 search terms across 2 scenarios.
 *
 * Each scenario gives the student a slice of an Amazon Search Term Report
 * with real-looking shopper queries, performance data, and asks for a
 * decision on each: keep, pause, negate as exact, negate as phrase, or
 * optimize the bid.
 *
 * Data is realistic but fictional. Money in PHP.
 */

import type { StrScenario } from './types';

export const SCENARIOS: StrScenario[] = [
  // -------------------------------------------------------------------------
  // Scenario 1: Cutting board campaign — 10 search terms
  // -------------------------------------------------------------------------
  {
    id: 'str-001',
    slug: 'cutting-board-week-one',
    title: 'Cutting Board — Week One Triage',
    context:
      'One week of search term data for the bamboo cutting board campaign. Triage each term: keep it, pause it, negate it as exact, negate it as phrase, or optimize the bid.',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board with Juice Groove',
      aov: 1200,
      targetAcos: 0.30,
    },
    constraints: {
      dailyBudget: 2500,
      currentDailySpend: 2480,
    },
    searchTerms: [
      // Converters — keep
      { id: 't1', term: 'bamboo cutting board', matchedKeyword: 'bamboo cutting board', matchType: 'EXACT', impressions: 1200, clicks: 36, ctr: 0.030, spend: 720, cpc: 20, orders: 8, unitsSold: 8, sales: 9600, acos: 0.075, roas: 13.3 },
      { id: 't2', term: 'cutting board with juice groove', matchedKeyword: 'cutting board with juice groove', matchType: 'PHRASE', impressions: 480, clicks: 12, ctr: 0.025, spend: 192, cpc: 16, orders: 3, unitsSold: 3, sales: 3600, acos: 0.053, roas: 18.8 },

      // Decent — keep but lower bid
      { id: 't3', term: 'large cutting board', matchedKeyword: 'large cutting board', matchType: 'PHRASE', impressions: 850, clicks: 17, ctr: 0.020, spend: 238, cpc: 14, orders: 2, unitsSold: 2, sales: 2400, acos: 0.099, roas: 10.1 },
      { id: 't4', term: 'wooden chopping board', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 1200, clicks: 24, ctr: 0.020, spend: 240, cpc: 10, orders: 2, unitsSold: 2, sales: 2400, acos: 0.10, roas: 10.0 },

      // Pure junk — negate exact (these are different products)
      { id: 't5', term: 'plastic cutting board', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 680, clicks: 14, ctr: 0.021, spend: 140, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
      { id: 't6', term: 'cutting board set', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 920, clicks: 18, ctr: 0.020, spend: 180, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
      { id: 't7', term: 'cutting board plastic dishwasher safe', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 145, clicks: 4, ctr: 0.028, spend: 40, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },

      // Aspirational junk — negate phrase (lots of impressions, no orders, totally unrelated intent)
      { id: 't8', term: 'cutting board diy', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 2200, clicks: 8, ctr: 0.004, spend: 80, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
      { id: 't9', term: 'cutting board game', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 3800, clicks: 11, ctr: 0.003, spend: 110, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },

      // Edge case — high spend, low ACoS, marginal — pause
      { id: 't10', term: 'cutting board holder', matchedKeyword: 'kitchen cutting board', matchType: 'BROAD', impressions: 540, clicks: 8, ctr: 0.015, spend: 80, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
    ],
    referenceActions: {
      t1: 'keep',
      t2: 'keep',
      t3: 'optimize-bid',
      t4: 'optimize-bid',
      t5: 'negate-exact',
      t6: 'negate-exact',
      t7: 'negate-exact',
      t8: 'negate-phrase',
      t9: 'negate-phrase',
      t10: 'negate-exact',
    },
    referenceBidAdjustments: {
      t3: 11,  // 14 -> 11 (lower because 99% ACoS still good but bid was high)
      t4: 7,   // 10 -> 7 (lower because ACoS at 100%)
    },
    referenceNegatives: {
      t5: 'plastic cutting board',
      t6: 'cutting board set',
      t7: 'plastic',
      t8: 'diy',
      t9: 'game',
      t10: 'holder',
    },
    explanation:
      'Two exact-match terms are converting well — keep them. Two phrase matches are converting at 99-100% ACoS — bid-optimize (lower the bid, not negate). Five terms are pure waste — negate them. Three are junk intent (plastic, set, dishwasher-safe = wrong product), negate as exact. Two are aspirational/wrong intent (DIY, game) — negate as phrase to catch the whole family.',
  },

  // -------------------------------------------------------------------------
  // Scenario 2: USB-C hub campaign — 10 search terms
  // -------------------------------------------------------------------------
  {
    id: 'str-002',
    slug: 'usb-c-hub-competitor-searches',
    title: 'USB-C Hub — Competitor Searches',
    context:
      'Search terms from a USB-C hub campaign. Several terms are actually shoppers looking for your competitors — sometimes that converts, sometimes it does not. Decide each one.',
    product: {
      asin: 'B0CUSBC001',
      name: 'USB-C Hub 7-in-1 with HDMI 4K',
      aov: 2400,
      targetAcos: 0.25,
    },
    constraints: {
      dailyBudget: 5000,
      currentDailySpend: 4800,
    },
    searchTerms: [
      // Direct converters — keep, raise bid if needed
      { id: 't1', term: 'usb c hub', matchedKeyword: 'usb c hub', matchType: 'EXACT', impressions: 1800, clicks: 54, ctr: 0.030, spend: 1620, cpc: 30, orders: 9, unitsSold: 9, sales: 21600, acos: 0.075, roas: 13.3 },
      { id: 't2', term: 'usb c hub hdmi', matchedKeyword: 'usb c hub hdmi', matchType: 'EXACT', impressions: 920, clicks: 28, ctr: 0.030, spend: 1120, cpc: 40, orders: 6, unitsSold: 6, sales: 14400, acos: 0.078, roas: 12.9 },

      // Compatible product searches — keep, decent
      { id: 't3', term: 'thunderbolt 4 hub', matchedKeyword: 'thunderbolt hub', matchType: 'PHRASE', impressions: 380, clicks: 11, ctr: 0.029, spend: 275, cpc: 25, orders: 2, unitsSold: 2, sales: 4800, acos: 0.057, roas: 17.5 },
      { id: 't4', term: 'usb hub for macbook', matchedKeyword: 'macbook hub', matchType: 'PHRASE', impressions: 540, clicks: 16, ctr: 0.030, spend: 400, cpc: 25, orders: 2, unitsSold: 2, sales: 4800, acos: 0.083, roas: 12.0 },

      // Wrong product — buyers looking for a hub without HDMI but we have HDMI (different features)
      { id: 't5', term: 'usb hub no hdmi', matchedKeyword: 'usb hub', matchType: 'PHRASE', impressions: 280, clicks: 8, ctr: 0.029, spend: 160, cpc: 20, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
      { id: 't6', term: 'basic usb hub 4 port', matchedKeyword: 'usb hub', matchType: 'PHRASE', impressions: 450, clicks: 12, ctr: 0.027, spend: 144, cpc: 12, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },

      // Aspirational / wrong intent — negate phrase
      { id: 't7', term: 'usb hub diy', matchedKeyword: 'usb hub', matchType: 'BROAD', impressions: 950, clicks: 5, ctr: 0.005, spend: 50, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
      { id: 't8', term: 'usb hub repair', matchedKeyword: 'usb hub', matchType: 'BROAD', impressions: 1100, clicks: 4, ctr: 0.004, spend: 40, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },

      // Edge case — high spend but some signal
      { id: 't9', term: 'usb c dongle', matchedKeyword: 'usb c adapter', matchType: 'BROAD', impressions: 4200, clicks: 38, ctr: 0.009, spend: 380, cpc: 10, orders: 1, unitsSold: 1, sales: 2400, acos: 0.158, roas: 6.3 },

      // Edge case — high impressions, low CTR, zero orders
      { id: 't10', term: 'usb c', matchedKeyword: 'usb hub', matchType: 'BROAD', impressions: 18000, clicks: 42, ctr: 0.002, spend: 420, cpc: 10, orders: 0, unitsSold: 0, sales: 0, acos: null, roas: 0 },
    ],
    referenceActions: {
      t1: 'keep',
      t2: 'keep',
      t3: 'keep',
      t4: 'optimize-bid',
      t5: 'negate-exact',
      t6: 'negate-exact',
      t7: 'negate-phrase',
      t8: 'negate-phrase',
      t9: 'optimize-bid',
      t10: 'negate-phrase',
    },
    referenceBidAdjustments: {
      t4: 32,  // 25 -> 32 (raise — 8.3% ACoS, good signal)
      t9: 18,  // 10 -> 18 (raise — has 1 conversion from 38 clicks, signal worth pursuing)
    },
    referenceNegatives: {
      t5: 'no hdmi',
      t6: 'basic 4 port',
      t7: 'diy',
      t8: 'repair',
      t10: 'usb c',
    },
    explanation:
      'Two exact matches are converting well at 7-8% ACoS — keep them. Compatible product searches (Thunderbolt 4, MacBook) are converting — keep or bid-optimize. Wrong-product searches (no HDMI, basic 4-port) — negate as exact so you do not waste spend on shoppers who want a different feature set. Aspirational junk (DIY, repair) — negate as phrase. "USB c dongle" has one conversion from 38 clicks — signal worth pursuing, raise bid. "USB c" alone has 18,000 impressions with no orders — too broad, negate as phrase to capture the family.',
  },
];

export function getScenarioBySlug(slug: string): StrScenario | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}

export function getScenarioById(id: string): StrScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}