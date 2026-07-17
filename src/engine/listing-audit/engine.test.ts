import { describe, it, expect } from 'vitest';
import { gradeListingAudit, generateAutoFindings } from './engine';
import type { ListingAuditScenario, ListingAuditFinding } from './types';

describe('listing-audit engine', () => {
  const mockScenario: ListingAuditScenario = {
    id: 'la-test-001',
    slug: 'test-cutting-board',
    category: 'kitchen',
    product: {
      asin: 'B09KCB001',
      name: 'Bamboo Cutting Board',
      category: 'Kitchen',
      aov: 1200,
      targetAcos: 0.30,
    },
    currentListing: {
      title: 'Bamboo Cutting Board',
      bullets: ['Bamboo material', 'Durable'],
      description: 'A cutting board.',
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
      description: 'A premium cutting board made of 100% natural organic bamboo. Perfect for any kitchen task.',
      imageCount: 9,
      hasAplusContent: true,
      pricePhp: 1200,
      reviewCount: 200,
      averageRating: 4.6,
    },
    referenceFindings: [
      { field: 'title', severity: 'critical', message: 'Title is too short.' },
      { field: 'bullets', severity: 'critical', message: 'Only 2 bullets.' },
      { field: 'images', severity: 'critical', message: 'Only 3 images.' },
      { field: 'aplus', severity: 'warning', message: 'No A+ content.' },
    ],
    explanation: 'Test explanation',
  };

  it('correctly grades ideal student findings matching reference findings', () => {
    const studentFindings: ListingAuditFinding[] = [
      { field: 'title', severity: 'critical', message: 'Title is too short.' },
      { field: 'bullets', severity: 'critical', message: 'Only 2 bullets.' },
      { field: 'images', severity: 'critical', message: 'Only 3 images.' },
      { field: 'aplus', severity: 'warning', message: 'No A+ content.' },
    ];

    const studentRevision = {
      title: 'Bamboo Cutting Board with Deep Juice Groove — Eco-Friendly Kitchen Chopping Board for Vegetables, Meat, Cheese | Large 16x12 inch with Non-Slip Feet | Durable, Dishwasher Safe',
      bullets: [
        'DEEP JUICE GROOVE — Catches liquids from meat, fruit, and vegetables. No more countertop spills.',
        'ECO-FRIENDLY BAMBOO — Sustainably sourced, naturally antibacterial. Lasts longer than plastic.',
        'LARGE 16x12 INCH — Fits a whole meal prep. Reversible design doubles your workspace.',
        'NON-SLIP FEET — Stays put on the counter. No more chasing the board while chopping.',
        'DISHWASHER SAFE — Easy cleanup. Oil monthly with food-grade mineral oil for best results.',
      ],
      imageCount: 9,
      hasAplusContent: true,
    };

    const grade = gradeListingAudit(mockScenario, studentFindings, studentRevision);
    expect(grade.passed).toBe(true);
    expect(grade.totalScore).toBeGreaterThanOrEqual(70);
  });

  it('correctly grades poor or missing student findings', () => {
    const studentFindings: ListingAuditFinding[] = []; // No findings submitted

    const grade = gradeListingAudit(mockScenario, studentFindings);
    expect(grade.passed).toBe(false);
    expect(grade.totalScore).toBeLessThan(70);
  });

  it('generates auto findings correctly based on guidelines', () => {
    const current = mockScenario.currentListing;
    const reference = mockScenario.referenceListing;
    const autoFindings = generateAutoFindings(current, reference);

    expect(autoFindings.length).toBeGreaterThan(0);
    expect(autoFindings.some(f => f.field === 'title' && f.severity === 'critical')).toBe(true);
    expect(autoFindings.some(f => f.field === 'bullets' && f.severity === 'critical')).toBe(true);
    expect(autoFindings.some(f => f.field === 'images' && f.severity === 'critical')).toBe(true);
    expect(autoFindings.some(f => f.field === 'aplus' && f.severity === 'warning')).toBe(true);
  });
});
