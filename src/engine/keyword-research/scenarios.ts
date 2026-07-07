/**
 * Keyword Research scenario fixtures — 5 scenarios, one per product category.
 *
 * Each scenario presents a pool of candidate keywords for a product.
 * Student must assign each as PRIMARY (high relevance + volume), SECONDARY
 * (lower relevance or volume, worth targeting), or NEGATIVE (irrelevant
 * to add to a negative keyword list).
 *
 * Data uses normalized 0-1 proxies for relevance, volume, competition
 * — not real Amazon Brand Analytics numbers, but realistic shape.
 */

import type { KeywordResearchScenario } from './types';

export const SCENARIOS: KeywordResearchScenario[] = [
  {
    id: 'kr-kitchen-001',
    slug: 'cutting-board-keyword-research',
    category: 'kitchen',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board with Juice Groove',
      category: 'Kitchen',
      aov: 1200,
      targetAcos: 0.30,
    },
    seedTerm: 'bamboo cutting board',
    candidates: [
      // PRIMARY — high relevance + volume
      { text: 'bamboo cutting board', relevance: 1.0, searchVolumeProxy: 0.85, competitionProxy: 0.65, priority: null },
      { text: 'cutting board with juice groove', relevance: 1.0, searchVolumeProxy: 0.60, competitionProxy: 0.45, priority: null },
      { text: 'wooden chopping board', relevance: 0.85, searchVolumeProxy: 0.70, competitionProxy: 0.60, priority: null },
      { text: 'large cutting board', relevance: 0.80, searchVolumeProxy: 0.65, competitionProxy: 0.55, priority: null },
      // SECONDARY — relevant but lower volume or higher competition
      { text: 'bamboo kitchen board', relevance: 0.90, searchVolumeProxy: 0.30, competitionProxy: 0.30, priority: null },
      { text: 'eco cutting board', relevance: 0.75, searchVolumeProxy: 0.25, competitionProxy: 0.20, priority: null },
      { text: 'chopping board bamboo', relevance: 0.85, searchVolumeProxy: 0.20, competitionProxy: 0.25, priority: null },
      // NEGATIVE — different products / wrong intent
      { text: 'plastic cutting board', relevance: 0.05, searchVolumeProxy: 0.80, competitionProxy: 0.70, priority: null },
      { text: 'cutting board set', relevance: 0.20, searchVolumeProxy: 0.65, competitionProxy: 0.55, priority: null },
      { text: 'cutting board game', relevance: 0.0, searchVolumeProxy: 0.45, competitionProxy: 0.15, priority: null },
      { text: 'cutting board diy', relevance: 0.10, searchVolumeProxy: 0.35, competitionProxy: 0.20, priority: null },
      { text: 'cutting board holder', relevance: 0.15, searchVolumeProxy: 0.20, competitionProxy: 0.10, priority: null },
    ],
    referencePriorities: {
      'bamboo cutting board': 'PRIMARY',
      'cutting board with juice groove': 'PRIMARY',
      'wooden chopping board': 'PRIMARY',
      'large cutting board': 'PRIMARY',
      'bamboo kitchen board': 'SECONDARY',
      'eco cutting board': 'SECONDARY',
      'chopping board bamboo': 'SECONDARY',
      'plastic cutting board': 'NEGATIVE',
      'cutting board set': 'NEGATIVE',
      'cutting board game': 'NEGATIVE',
      'cutting board diy': 'NEGATIVE',
      'cutting board holder': 'NEGATIVE',
    },
    referenceNegatives: [
      'plastic cutting board',
      'cutting board set',
      'cutting board game',
      'cutting board diy',
      'cutting board holder',
    ],
    explanation:
      'Primary terms have both high relevance (1.0) AND reasonable volume. Secondary terms are relevant but lower volume — worth targeting if budget allows, but not the first wave. Negatives are wrong product (plastic), wrong intent (game, diy), or unrelated accessories (holder).',
  },

  {
    id: 'kr-electronics-001',
    slug: 'usb-c-hub-keyword-research',
    category: 'electronics',
    product: {
      asin: 'B0CUSBC001',
      name: 'USB-C Hub 7-in-1 with HDMI 4K',
      category: 'Electronics',
      aov: 2400,
      targetAcos: 0.25,
    },
    seedTerm: 'usb c hub',
    candidates: [
      // PRIMARY
      { text: 'usb c hub', relevance: 1.0, searchVolumeProxy: 0.95, competitionProxy: 0.85, priority: null },
      { text: 'usb c hub hdmi', relevance: 1.0, searchVolumeProxy: 0.75, competitionProxy: 0.70, priority: null },
      { text: '7 in 1 usb c hub', relevance: 1.0, searchVolumeProxy: 0.55, competitionProxy: 0.50, priority: null },
      { text: 'macbook hub', relevance: 0.90, searchVolumeProxy: 0.70, competitionProxy: 0.60, priority: null },
      // SECONDARY
      { text: 'thunderbolt hub', relevance: 0.70, searchVolumeProxy: 0.55, competitionProxy: 0.60, priority: null },
      { text: 'usb c dock', relevance: 0.75, searchVolumeProxy: 0.50, competitionProxy: 0.55, priority: null },
      { text: 'laptop docking station', relevance: 0.60, searchVolumeProxy: 0.45, competitionProxy: 0.65, priority: null },
      { text: 'type c hub', relevance: 0.80, searchVolumeProxy: 0.40, competitionProxy: 0.45, priority: null },
      // NEGATIVE
      { text: 'usb hub no hdmi', relevance: 0.10, searchVolumeProxy: 0.25, competitionProxy: 0.30, priority: null },
      { text: 'basic usb hub 4 port', relevance: 0.10, searchVolumeProxy: 0.20, competitionProxy: 0.25, priority: null },
      { text: 'usb hub diy', relevance: 0.0, searchVolumeProxy: 0.15, competitionProxy: 0.10, priority: null },
      { text: 'usb hub repair', relevance: 0.0, searchVolumeProxy: 0.15, competitionProxy: 0.10, priority: null },
    ],
    referencePriorities: {
      'usb c hub': 'PRIMARY',
      'usb c hub hdmi': 'PRIMARY',
      '7 in 1 usb c hub': 'PRIMARY',
      'macbook hub': 'PRIMARY',
      'thunderbolt hub': 'SECONDARY',
      'usb c dock': 'SECONDARY',
      'laptop docking station': 'SECONDARY',
      'type c hub': 'SECONDARY',
      'usb hub no hdmi': 'NEGATIVE',
      'basic usb hub 4 port': 'NEGATIVE',
      'usb hub diy': 'NEGATIVE',
      'usb hub repair': 'NEGATIVE',
    },
    referenceNegatives: [
      'usb hub no hdmi',
      'basic usb hub 4 port',
      'usb hub diy',
      'usb hub repair',
    ],
    explanation:
      'Primary: terms that match exactly what we sell (HDMI-enabled 7-in-1 hub for MacBook). Secondary: compatible but not exact match (Thunderbolt is different tech, dock is similar but different form factor). Negatives: shoppers explicitly looking for a hub without our key features (no HDMI, basic 4-port), or wrong intent (DIY, repair).',
  },

  {
    id: 'kr-garden-001',
    slug: 'pruning-shears-keyword-research',
    category: 'garden',
    product: {
      asin: 'B0DPRUN001',
      name: 'Titanium Bypass Pruning Shears',
      category: 'Garden',
      aov: 850,
      targetAcos: 0.35,
    },
    seedTerm: 'pruning shears',
    candidates: [
      { text: 'pruning shears', relevance: 1.0, searchVolumeProxy: 0.85, competitionProxy: 0.60, priority: null },
      { text: 'bypass pruners', relevance: 1.0, searchVolumeProxy: 0.70, competitionProxy: 0.50, priority: null },
      { text: 'garden shears', relevance: 0.85, searchVolumeProxy: 0.75, competitionProxy: 0.55, priority: null },
      { text: 'titanium pruners', relevance: 0.95, searchVolumeProxy: 0.45, competitionProxy: 0.30, priority: null },
      { text: 'tree pruning shears', relevance: 0.90, searchVolumeProxy: 0.35, competitionProxy: 0.25, priority: null },
      { text: 'plant cutting shears', relevance: 0.65, searchVolumeProxy: 0.20, competitionProxy: 0.15, priority: null },
      { text: 'garden clippers', relevance: 0.55, searchVolumeProxy: 0.50, competitionProxy: 0.40, priority: null },
      { text: 'garden tools', relevance: 0.20, searchVolumeProxy: 0.95, competitionProxy: 0.90, priority: null },
      { text: 'gardening', relevance: 0.10, searchVolumeProxy: 1.0, competitionProxy: 0.95, priority: null },
      { text: 'outdoor tools', relevance: 0.30, searchVolumeProxy: 0.50, competitionProxy: 0.50, priority: null },
    ],
    referencePriorities: {
      'pruning shears': 'PRIMARY',
      'bypass pruners': 'PRIMARY',
      'garden shears': 'PRIMARY',
      'titanium pruners': 'PRIMARY',
      'tree pruning shears': 'SECONDARY',
      'plant cutting shears': 'SECONDARY',
      'garden clippers': 'SECONDARY',
      'garden tools': 'NEGATIVE',
      'gardening': 'NEGATIVE',
      'outdoor tools': 'NEGATIVE',
    },
    referenceNegatives: ['garden tools', 'gardening', 'outdoor tools'],
    explanation:
      'Primary: terms that match what we sell (pruning shears specifically). Secondary: garden-related but less specific. Negatives: huge broad categories where we cannot compete on relevance (gardening, garden tools) — these would waste budget on shoppers not in buying mode for our specific product.',
  },

  {
    id: 'kr-fitness-001',
    slug: 'resistance-bands-keyword-research',
    category: 'fitness',
    product: {
      asin: 'B0ERESI001',
      name: 'Resistance Bands Set (5 Levels)',
      category: 'Sports & Fitness',
      aov: 950,
      targetAcos: 0.30,
    },
    seedTerm: 'resistance bands',
    candidates: [
      { text: 'resistance bands', relevance: 1.0, searchVolumeProxy: 0.95, competitionProxy: 0.80, priority: null },
      { text: 'resistance band set', relevance: 1.0, searchVolumeProxy: 0.85, competitionProxy: 0.70, priority: null },
      { text: 'exercise bands', relevance: 0.90, searchVolumeProxy: 0.80, competitionProxy: 0.65, priority: null },
      { text: 'workout bands', relevance: 0.85, searchVolumeProxy: 0.75, competitionProxy: 0.60, priority: null },
      { text: 'home gym bands', relevance: 0.85, searchVolumeProxy: 0.45, competitionProxy: 0.40, priority: null },
      { text: 'resistance loop bands', relevance: 0.95, searchVolumeProxy: 0.40, competitionProxy: 0.35, priority: null },
      { text: 'fitness bands', relevance: 0.75, searchVolumeProxy: 0.55, competitionProxy: 0.50, priority: null },
      { text: 'pilates bands', relevance: 0.70, searchVolumeProxy: 0.35, competitionProxy: 0.30, priority: null },
      { text: 'stretching bands', relevance: 0.65, searchVolumeProxy: 0.30, competitionProxy: 0.25, priority: null },
      { text: 'weight lifting', relevance: 0.05, searchVolumeProxy: 1.0, competitionProxy: 0.95, priority: null },
      { text: 'dumbbells', relevance: 0.05, searchVolumeProxy: 0.95, competitionProxy: 0.85, priority: null },
    ],
    referencePriorities: {
      'resistance bands': 'PRIMARY',
      'resistance band set': 'PRIMARY',
      'exercise bands': 'PRIMARY',
      'workout bands': 'PRIMARY',
      'home gym bands': 'PRIMARY',
      'resistance loop bands': 'SECONDARY',
      'fitness bands': 'SECONDARY',
      'pilates bands': 'SECONDARY',
      'stretching bands': 'SECONDARY',
      'weight lifting': 'NEGATIVE',
      'dumbbells': 'NEGATIVE',
    },
    referenceNegatives: ['weight lifting', 'dumbbells'],
    explanation:
      'Primary: terms that match our product exactly. Secondary: related but lower intent or volume. Negatives: complementary equipment (weight lifting, dumbbells) — shoppers searching for these are not in our buying mode. Our product is for low-impact resistance training, not heavy lifting.',
  },

  {
    id: 'kr-beauty-001',
    slug: 'vitamin-c-serum-keyword-research',
    category: 'beauty',
    product: {
      asin: 'B0EVITC001',
      name: 'Vitamin C Brightening Serum 20%',
      category: 'Beauty',
      aov: 1500,
      targetAcos: 0.35,
    },
    seedTerm: 'vitamin c serum',
    candidates: [
      { text: 'vitamin c serum', relevance: 1.0, searchVolumeProxy: 0.95, competitionProxy: 0.90, priority: null },
      { text: 'brightening serum', relevance: 1.0, searchVolumeProxy: 0.80, competitionProxy: 0.80, priority: null },
      { text: 'vitamin c serum for face', relevance: 1.0, searchVolumeProxy: 0.75, competitionProxy: 0.70, priority: null },
      { text: 'anti aging serum', relevance: 0.85, searchVolumeProxy: 0.70, competitionProxy: 0.65, priority: null },
      { text: 'face serum', relevance: 0.85, searchVolumeProxy: 0.70, competitionProxy: 0.65, priority: null },
      { text: 'skincare serum', relevance: 0.80, searchVolumeProxy: 0.60, competitionProxy: 0.55, priority: null },
      { text: 'glow serum', relevance: 0.80, searchVolumeProxy: 0.45, competitionProxy: 0.40, priority: null },
      { text: 'dark spot serum', relevance: 0.90, searchVolumeProxy: 0.55, competitionProxy: 0.50, priority: null },
      { text: 'natural vitamin c serum', relevance: 0.85, searchVolumeProxy: 0.30, competitionProxy: 0.25, priority: null },
      { text: 'facial serum', relevance: 0.70, searchVolumeProxy: 0.45, competitionProxy: 0.40, priority: null },
      { text: 'vitamin c cream', relevance: 0.30, searchVolumeProxy: 0.60, competitionProxy: 0.55, priority: null },
      { text: 'moisturizer', relevance: 0.10, searchVolumeProxy: 1.0, competitionProxy: 0.95, priority: null },
    ],
    referencePriorities: {
      'vitamin c serum': 'PRIMARY',
      'brightening serum': 'PRIMARY',
      'vitamin c serum for face': 'PRIMARY',
      'anti aging serum': 'PRIMARY',
      'face serum': 'PRIMARY',
      'skincare serum': 'SECONDARY',
      'glow serum': 'SECONDARY',
      'dark spot serum': 'SECONDARY',
      'natural vitamin c serum': 'SECONDARY',
      'facial serum': 'SECONDARY',
      'vitamin c cream': 'NEGATIVE',
      'moisturizer': 'NEGATIVE',
    },
    referenceNegatives: ['vitamin c cream', 'moisturizer'],
    explanation:
      'Primary: direct match terms where we have a strong product. Secondary: related benefits and use cases. Negatives: different product form (vitamin c cream is a different SKU — would convert shoppers away from our serum) and complementary products (moisturizer) where shoppers would not be in serum-buying mode.',
  },
];

export function getScenarioBySlug(slug: string): KeywordResearchScenario | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}

export function getScenarioById(id: string): KeywordResearchScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}