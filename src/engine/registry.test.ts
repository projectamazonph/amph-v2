import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY, getToolMeta, getScenarioMeta } from './registry';
import { SCENARIOS as CB_SCENARIOS } from './campaign-builder/scenarios';
import { BTV_SCENARIOS as CB_BTV_SCENARIOS } from './campaign-builder/btv-scenarios';

describe('TOOL_REGISTRY scenario lists', () => {
  it('has no duplicate scenario ids within any tool', () => {
    for (const tool of Object.values(TOOL_REGISTRY)) {
      const ids = tool.scenarios.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size, `${tool.slug} has duplicate scenario ids: ${ids.join(', ')}`).toBe(
        ids.length,
      );
    }
  });

  it('has no duplicate scenario slugs within any tool', () => {
    for (const tool of Object.values(TOOL_REGISTRY)) {
      const slugs = tool.scenarios.map((s) => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(
        uniqueSlugs.size,
        `${tool.slug} has duplicate scenario slugs: ${slugs.join(', ')}`,
      ).toBe(slugs.length);
    }
  });

  it('campaign-builder includes every core scenario plus every real BTV scenario, not the filtered-subset stand-in', () => {
    const scenarios = getToolMeta('campaign-builder')?.scenarios ?? [];
    expect(scenarios).toHaveLength(CB_SCENARIOS.length + CB_BTV_SCENARIOS.length);

    // Every real BTV scenario (from btv-scenarios.ts, not the SCENARIOS.filter()
    // stand-in in scenarios.ts) must be reachable through the registry.
    for (const btv of CB_BTV_SCENARIOS) {
      expect(scenarios.some((s) => s.slug === btv.slug)).toBe(true);
    }
  });

  it('resolves scenario metadata for a real BTV scenario slug (regression: registry previously only knew the single filtered-subset placeholder, so this 404d)', () => {
    const meta = getScenarioMeta('campaign-builder', 'kitchen-cutting-board-btv-launch');
    expect(meta).not.toBeNull();
    expect(meta?.title).toBe('Bamboo Cutting Board with Juice Groove');
  });
});
