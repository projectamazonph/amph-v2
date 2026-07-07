/**
 * Listing Audit scenario fixtures — 5 scenarios, one per product category.
 *
 * Each scenario has a current listing (with realistic flaws) and a
 * reference (optimized) listing. The student identifies the flaws and
 * can revise the listing.
 */

import type { ListingAuditScenario } from './types';

export const SCENARIOS: ListingAuditScenario[] = [
  {
    id: 'la-kitchen-001',
    slug: 'kitchen-cutting-board-listing',
    category: 'kitchen',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board with Juice Groove',
      category: 'Kitchen',
      aov: 1200,
      targetAcos: 0.30,
    },
    currentListing: {
      title: 'Bamboo Cutting Board',
      bullets: ['Bamboo material', 'Durable', 'For kitchen use'],
      description: 'A cutting board made from bamboo.',
      imageCount: 3,
      hasAplusContent: false,
      pricePhp: 1200,
      reviewCount: 18,
      averageRating: 4.3,
    },
    referenceListing: {
      title: 'Bamboo Cutting Board with Deep Juice Groove — Eco-Friendly Kitchen Chopping Board for Vegetables, Meat, Cheese | Large 16x12 inch with Non-Slip Feet | Durable, Dishwasher Safe',
      bullets: [
        'DEEP JUICE GROOVE — Catches liquids from meat, fruit, and vegetables. No more countertop spills.',
        'ECO-FRIENDLY BAMBOO — Sustainably sourced, naturally antibacterial. Lasts longer than plastic.',
        'LARGE 16x12 INCH — Fits a whole meal prep. Reversible design doubles your workspace.',
        'NON-SLIP FEET — Stays put on the counter. No more chasing the board while chopping.',
        'DISHWASHER SAFE — Easy cleanup. Oil monthly with food-grade mineral oil for best results.',
      ],
      description: '...',
      imageCount: 9,
      hasAplusContent: true,
      pricePhp: 1200,
      reviewCount: 200,
      averageRating: 4.6,
    },
    referenceFindings: [
      { field: 'title', severity: 'critical', message: 'Title is too short — missing keyword coverage and benefit statements.' },
      { field: 'bullets', severity: 'critical', message: 'Only 3 bullets and they are vague. Up to 5 allowed.' },
      { field: 'images', severity: 'critical', message: 'Only 3 images — listings with 7+ convert significantly better.' },
      { field: 'aplus', severity: 'warning', message: 'No A+ content — competitors in this niche use it heavily.' },
      { field: 'reviews', severity: 'warning', message: 'Only 18 reviews — review velocity is critical in the first 90 days.' },
    ],
    explanation:
      'The current listing is underselling the product. Title lacks keywords, bullets are vague, image count is below the conversion threshold, no A+ content. The reference uses all 5 bullets with specific benefits, 9 images including lifestyle/usage shots, and A+ content with comparison charts.',
  },

  {
    id: 'la-electronics-001',
    slug: 'electronics-usb-c-hub-listing',
    category: 'electronics',
    product: {
      asin: 'B0CUSBC001',
      name: 'USB-C Hub 7-in-1 with HDMI 4K',
      category: 'Electronics',
      aov: 2400,
      targetAcos: 0.25,
    },
    currentListing: {
      title: 'USB C Hub 7 in 1 HDMI',
      bullets: ['7 ports', '4K HDMI', 'USB-C', 'Works with MacBook'],
      description: 'Hub for MacBook.',
      imageCount: 5,
      hasAplusContent: false,
      pricePhp: 2400,
      reviewCount: 220,
      averageRating: 4.4,
    },
    referenceListing: {
      title: 'USB-C Hub 7-in-1 with 4K HDMI — MacBook Pro/Air Adapter with 100W PD Charging, 3xUSB 3.0, SD/MicroSD Card Reader | Aluminum, Plug and Play, Thunderbolt 3 Compatible',
      bullets: [
        '7-IN-1 EXPANSION — 4K HDMI output, 100W Power Delivery passthrough, 3 USB 3.0 ports, SD and MicroSD readers. One hub, every port.',
        '4K@30Hz HDMI — Mirror or extend your screen in stunning 4K. Backward compatible with 1080p.',
        '100W PD CHARGING — Charge your MacBook while you work. No more dead batteries mid-presentation.',
        'PLUG AND PLAY — No drivers needed. Works with MacBook, iPad Pro, Chromebook, Windows laptops.',
        'ALUMINUM BODY — Matches your MacBook aesthetic. Stays cool under load.',
      ],
      description: '...',
      imageCount: 8,
      hasAplusContent: true,
      pricePhp: 2400,
      reviewCount: 220,
      averageRating: 4.4,
    },
    referenceFindings: [
      { field: 'title', severity: 'warning', message: 'Title is short — missing key compatibility and feature keywords.' },
      { field: 'bullets', severity: 'critical', message: 'Only 4 bullets and 3 are single words. Specific benefits are missing.' },
      { field: 'images', severity: 'warning', message: '5 images — could be 7+ for full conversion impact.' },
      { field: 'aplus', severity: 'warning', message: 'No A+ content — competitor hubs use it heavily.' },
    ],
    explanation:
      'The current title is keyword-stuffed without benefits. Bullets are single words, not selling points. Reviews and rating are good, so the main fixes are title, bullets, image count, and adding A+ content with comparison vs. competitors.',
  },

  {
    id: 'la-garden-001',
    slug: 'garden-pruning-shears-listing',
    category: 'garden',
    product: {
      asin: 'B0DPRUN001',
      name: 'Titanium Bypass Pruning Shears',
      category: 'Garden',
      aov: 850,
      targetAcos: 0.35,
    },
    currentListing: {
      title: 'Pruning Shears Titanium',
      bullets: ['Titanium', 'Bypass', 'For pruning'],
      description: 'Pruning shears.',
      imageCount: 2,
      hasAplusContent: false,
      pricePhp: 850,
      reviewCount: 5,
      averageRating: 3.9,
    },
    referenceListing: {
      title: 'Titanium Bypass Pruning Shears — Sharp Garden Hand Pruners for Trees, Shrubs, Roses | Rust-Proof Stainless Steel Blades, Ergonomic Grip, 1-Inch Cut Capacity',
      bullets: [
        'TITANIUM-COATED BLADES — Stays sharp 3x longer than steel. Rust-proof for outdoor storage.',
        'BYPASS ACTION — Clean cuts on live wood up to 1 inch. No crushing like anvil pruners.',
        'ERGONOMIC GRIP — Soft-touch handle reduces hand fatigue. Tested by arthritic gardeners.',
        'FOR TREES, SHRUBS, ROSES — Versatile for all your pruning. Also handles tomato suckers, herbs, deadheading.',
        'BUILT TO LAST — Spring-loaded for one-hand operation. Replaceable parts available.',
      ],
      description: '...',
      imageCount: 7,
      hasAplusContent: true,
      pricePhp: 850,
      reviewCount: 50,
      averageRating: 4.5,
    },
    referenceFindings: [
      { field: 'title', severity: 'critical', message: 'Title is too short and missing key use-case keywords.' },
      { field: 'bullets', severity: 'critical', message: 'Only 3 bullets, all single words. No benefits communicated.' },
      { field: 'images', severity: 'critical', message: 'Only 2 images — way below conversion threshold.' },
      { field: 'aplus', severity: 'critical', message: 'No A+ content at this price point is a missed opportunity.' },
      { field: 'reviews', severity: 'critical', message: 'Only 5 reviews — needs Vine program or aggressive review requests.' },
      { field: 'reviews', severity: 'critical', message: 'Rating is 3.9 — anything below 4.0 is a major conversion killer.' },
    ],
    explanation:
      'Early-stage product with major listing issues. Rating below 4.0 is the critical fix (product quality, returns, or Vine). Once rating recovers, the listing overhaul (title length, bullet depth, image count, A+ content) drives the second wave of conversion.',
  },

  {
    id: 'la-fitness-001',
    slug: 'fitness-resistance-bands-listing',
    category: 'fitness',
    product: {
      asin: 'B0ERESI001',
      name: 'Resistance Bands Set (5 Levels)',
      category: 'Sports & Fitness',
      aov: 950,
      targetAcos: 0.30,
    },
    currentListing: {
      title: 'Resistance Bands 5 Levels',
      bullets: ['5 levels', 'For exercise', 'Portable'],
      description: 'A set of 5 resistance bands.',
      imageCount: 4,
      hasAplusContent: false,
      pricePhp: 950,
      reviewCount: 35,
      averageRating: 4.2,
    },
    referenceListing: {
      title: 'Resistance Bands Set (5 Levels) — Premium Workout Bands with Door Anchor, Ankle Wraps, Carry Bag | Pilates, Yoga, Home Gym, Strength Training | Up to 150 lbs',
      bullets: [
        '5 STACKABLE LEVELS — 10, 20, 30, 40, 50 lbs. Build a complete home gym for the cost of a month of gym membership.',
        'DOOR ANCHOR + ANKLE WRAPS — Versatile setup. Target every muscle group from any angle.',
        'NATURAL LATEX — Eco-friendly, no chemical smell. Safer for sensitive skin than synthetic rubber.',
        'PORTABLE — Carry bag included. Train anywhere — hotel room, park, office break room.',
        'WHAT YOU GET — 5 bands, 2 ankle wraps, 1 door anchor, 2 handles, 1 carry bag. 1-year warranty.',
      ],
      description: '...',
      imageCount: 8,
      hasAplusContent: true,
      pricePhp: 950,
      reviewCount: 200,
      averageRating: 4.6,
    },
    referenceFindings: [
      { field: 'title', severity: 'critical', message: 'Title lacks use-case keywords (Pilates, yoga, home gym) and included accessories.' },
      { field: 'bullets', severity: 'critical', message: 'Only 3 bullets, all generic. No specifics on what is included.' },
      { field: 'images', severity: 'warning', message: '4 images — needs lifestyle/usage shots to hit 7+.' },
      { field: 'aplus', severity: 'warning', message: 'No A+ content — comparison charts (resistance bands vs weights) convert well.' },
      { field: 'reviews', severity: 'warning', message: '35 reviews — aggressive request-a-review flow needed to hit 100+.' },
    ],
    explanation:
      'Listing undersells the included accessories and use cases. The "what is in the box" bullet is critical for fitness products where buyers want to know exactly what they get.',
  },

  {
    id: 'la-beauty-001',
    slug: 'beauty-vitamin-c-serum-listing',
    category: 'beauty',
    product: {
      asin: 'B0EVITC001',
      name: 'Vitamin C Brightening Serum 20%',
      category: 'Beauty',
      aov: 1500,
      targetAcos: 0.35,
    },
    currentListing: {
      title: 'Vitamin C Serum',
      bullets: ['20% Vitamin C', 'Brightening', 'For face'],
      description: 'A brightening serum.',
      imageCount: 4,
      hasAplusContent: true,
      pricePhp: 1500,
      reviewCount: 50,
      averageRating: 4.1,
    },
    referenceListing: {
      title: 'Vitamin C Brightening Serum 20% + Hyaluronic Acid — Anti-Aging Face Serum for Dark Spots, Even Tone, Glow | Vegan, Cruelty-Free, 1 fl oz',
      bullets: [
        '20% VITAMIN C + HYALURONIC ACID — Stabilized L-ascorbic acid for maximum brightening. HA locks in moisture.',
        'VISIBLE RESULTS IN 2 WEEKS — Fades dark spots, evens skin tone, boosts radiance. Clinical study shows 87% saw improvement.',
        'VEGAN + CRUELTY-FREE — No animal testing. No parabens, sulfates, or synthetic fragrance.',
        'USE AM — Apply 3-4 drops to clean skin before moisturizer and SPF. Pairs with our Vitamin C cleanser.',
        'MADE FOR ALL SKIN TYPES — Lightweight, fast-absorbing, non-greasy. Won\'t clog pores.',
      ],
      description: '...',
      imageCount: 9,
      hasAplusContent: true,
      pricePhp: 1500,
      reviewCount: 250,
      averageRating: 4.6,
    },
    referenceFindings: [
      { field: 'title', severity: 'critical', message: 'Title lacks key ingredient combinations, use case, and certifications.' },
      { field: 'bullets', severity: 'critical', message: 'Only 3 bullets, all generic phrases. Missing ingredient details and proof points.' },
      { field: 'images', severity: 'warning', message: '4 images — beauty needs 7+ including before/after, swatches, lifestyle.' },
      { field: 'reviews', severity: 'warning', message: '50 reviews — needs aggressive review velocity to compete in the category.' },
      { field: 'reviews', severity: 'warning', message: '4.1 rating — beauty customers demand 4.4+. Investigate quality issues or returns.' },
    ],
    explanation:
      'Beauty listings live or die on perceived ingredient quality and certifications. The current listing gives no reason to believe this serum is different from the 200 others in the category. Reference adds specific ingredients, clinical results, certifications, and use instructions.',
  },
];

export function getScenarioBySlug(slug: string): ListingAuditScenario | undefined {
  return SCENARIOS.find((s) => s.slug === slug);
}

export function getScenarioById(id: string): ListingAuditScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}