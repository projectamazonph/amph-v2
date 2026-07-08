/**
 * Tool route resolution — central registry for all 5 interactive tools.
 *
 * Maps URL slugs to (Prisma ToolType, scenario loader, display metadata).
 */

import { SCENARIOS as CB_SCENARIOS, BTV_SCENARIOS } from './campaign-builder/scenarios';
import { SCENARIOS as BE_SCENARIOS } from './bid-elevator/scenarios';
import { SCENARIOS as STR_SCENARIOS } from './str-triage/scenarios';
import { SCENARIOS as LA_SCENARIOS } from './listing-audit/scenarios';
import { SCENARIOS as KR_SCENARIOS } from './keyword-research/scenarios';
import type { ToolType } from '@/lib/enums';
import type { CampaignBuilderScenario } from './campaign-builder/types';

export type ToolSlug = 'campaign-builder' | 'bid-elevator' | 'str-triage' | 'listing-audit' | 'keyword-research';

export interface ScenarioMeta {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ToolMeta {
  slug: ToolSlug;
  toolType: ToolType;
  name: string;
  description: string;
  scenarios: ScenarioMeta[];
}

const scenarioMetaFromCB = (s: CampaignBuilderScenario): ScenarioMeta => ({
  id: s.id,
  slug: s.slug,
  title: s.product.name,
  category: s.category,
  difficulty: 'intermediate',
});

const scenarioMetaFromBE = (s: typeof BE_SCENARIOS[number]): ScenarioMeta => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  category: 'Bid Elevator',
  difficulty: 'intermediate',
});

const scenarioMetaFromSTR = (s: typeof STR_SCENARIOS[number]): ScenarioMeta => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  category: 'STR',
  difficulty: 'beginner',
});

const scenarioMetaFromLA = (s: typeof LA_SCENARIOS[number]): ScenarioMeta => ({
  id: s.id,
  slug: s.slug,
  title: s.product.name,
  category: s.product.category,
  difficulty: 'intermediate',
});

const scenarioMetaFromKR = (s: typeof KR_SCENARIOS[number]): ScenarioMeta => ({
  id: s.id,
  slug: s.slug,
  title: s.product.name,
  category: s.product.category,
  difficulty: 'beginner',
});

export const TOOL_REGISTRY: Record<ToolSlug, ToolMeta> = {
  'campaign-builder': {
    slug: 'campaign-builder',
    toolType: 'CAMPAIGN_BUILDER',
    name: 'Campaign Builder',
    description: 'Build Sponsored Products, Brands, Display, or Sponsored TV campaigns. Practice the Amazon Advertising Console campaign wizard.',
    scenarios: [
      ...CB_SCENARIOS.map(scenarioMetaFromCB),
      ...BTV_SCENARIOS.map(scenarioMetaFromCB),
    ],
  },
  'bid-elevator': {
    slug: 'bid-elevator',
    toolType: 'BID_ELEVATOR',
    name: 'Bid Elevator',
    description: 'Adjust keyword bids against real performance data.',
    scenarios: BE_SCENARIOS.map(scenarioMetaFromBE),
  },
  'str-triage': {
    slug: 'str-triage',
    toolType: 'STR_TRIAGE',
    name: 'Search Term Triage',
    description: 'Triage search terms weekly: keep, pause, negate, or optimize bid.',
    scenarios: STR_SCENARIOS.map(scenarioMetaFromSTR),
  },
  'listing-audit': {
    slug: 'listing-audit',
    toolType: 'LISTING_AUDIT',
    name: 'Listing Audit',
    description: 'Score a product listing on title, bullets, images, A+ content.',
    scenarios: LA_SCENARIOS.map(scenarioMetaFromLA),
  },
  'keyword-research': {
    slug: 'keyword-research',
    toolType: 'KEYWORD_RESEARCH',
    name: 'Keyword Research',
    description: 'Categorize keywords as primary, secondary, or negative.',
    scenarios: KR_SCENARIOS.map(scenarioMetaFromKR),
  },
};

export function getToolMeta(slug: string): ToolMeta | null {
  return TOOL_REGISTRY[slug as ToolSlug] ?? null;
}

export function getScenarioMeta(toolSlug: string, scenarioSlug: string): ScenarioMeta | null {
  const tool = getToolMeta(toolSlug);
  if (!tool) return null;
  return tool.scenarios.find((s) => s.slug === scenarioSlug) ?? null;
}