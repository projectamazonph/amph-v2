/**
 * Tool session server actions — start, save, submit.
 *
 * One action per tool. Sessions stored in `ToolSession` (Prisma) with
 * `state` as a JSON column.
 *
 * Pattern:
 *   - startToolSession(toolType, scenarioId) → returns sessionId
 *   - saveToolSession(sessionId, stateJson)  → upserts state
 *   - submitToolSession(sessionId)           → grades, stores result, returns grade
 */

'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createSafeAction, type ActionResult } from '@/lib/validation';
import { type ToolType } from '@/lib/enums';

import { gradeCampaignDraft } from '@/engine/campaign-builder/engine';
import { getScenarioById as getCbScenario } from '@/engine/campaign-builder/scenarios';

import { gradeBidDecisions } from '@/engine/bid-elevator/engine';
import { getScenarioById as getBeScenario } from '@/engine/bid-elevator/scenarios';

import { gradeStrDecisions } from '@/engine/str-triage/engine';
import { getScenarioById as getStrScenario } from '@/engine/str-triage/scenarios';

import { gradeListingAudit } from '@/engine/listing-audit/engine';
import { getScenarioById as getLaScenario } from '@/engine/listing-audit/scenarios';

import { gradeKeywordResearch } from '@/engine/keyword-research/engine';
import { getScenarioById as getKrScenario } from '@/engine/keyword-research/scenarios';

import type { CampaignBuilderSessionState } from '@/engine/campaign-builder/types';
import type { BidElevatorSessionState } from '@/engine/bid-elevator/types';
import type { StrTriageSessionState } from '@/engine/str-triage/types';
import type { ListingAuditSessionState } from '@/engine/listing-audit/types';
import type { KeywordResearchSessionState } from '@/engine/keyword-research/types';

// ---------------------------------------------------------------------------
// startToolSession
// ---------------------------------------------------------------------------

const startSessionSchema = z.object({
  toolType: z.enum(['CAMPAIGN_BUILDER', 'BID_ELEVATOR', 'STR_TRIAGE', 'LISTING_AUDIT', 'KEYWORD_RESEARCH']),
  scenarioId: z.string().min(1),
});

export const startToolSession = createSafeAction(startSessionSchema, async (data) => {
  const user = await requireAuth();

  const session = await db.toolSession.create({
    data: {
      userId: user.id,
      toolType: data.toolType as ToolType,
      scenarioId: data.scenarioId,
      status: 'IN_PROGRESS',
      state: JSON.stringify({ scenarioId: data.scenarioId, hintsUsed: 0, startedAt: new Date().toISOString() }),
    },
  });

  return { sessionId: session.id };
});

// ---------------------------------------------------------------------------
// saveToolSession
// ---------------------------------------------------------------------------

const saveSessionSchema = z.object({
  sessionId: z.string().min(1),
  state: z.unknown(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export const saveToolSession = createSafeAction(saveSessionSchema, async (data) => {
  const user = await requireAuth();
  const session = await db.toolSession.findUnique({ where: { id: data.sessionId } });
  if (!session) throw new Error('Session not found.');
  if (session.userId !== user.id) throw new Error('Forbidden.');

  await db.toolSession.update({
    where: { id: data.sessionId },
    data: {
      state: JSON.stringify(data.state),
      timeSpentSeconds: data.timeSpentSeconds ?? session.timeSpentSeconds,
    },
  });

  return { savedAt: new Date().toISOString() };
});

// ---------------------------------------------------------------------------
// submitToolSession — grades the session
// ---------------------------------------------------------------------------

const submitSessionSchema = z.object({
  sessionId: z.string().min(1),
  state: z.unknown(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export const submitToolSession = createSafeAction(submitSessionSchema, async (data) => {
  const user = await requireAuth();
  const session = await db.toolSession.findUnique({ where: { id: data.sessionId } });
  if (!session) throw new Error('Session not found.');
  if (session.userId !== user.id) throw new Error('Forbidden.');
  if (session.status !== 'IN_PROGRESS') throw new Error('Session already submitted.');

  const scenarioId = session.scenarioId;
  if (!scenarioId) throw new Error('No scenario associated with this session.');

  let grade: { totalScore: number; passed: boolean; criteriaResults: unknown[]; overallFeedback: string };

  if (session.toolType === 'CAMPAIGN_BUILDER') {
    const scenario = getCbScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found.');
    const state = data.state as CampaignBuilderSessionState;
    grade = gradeCampaignDraft(state.draft, scenario);
  } else if (session.toolType === 'BID_ELEVATOR') {
    const scenario = getBeScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found.');
    const state = data.state as BidElevatorSessionState;
    grade = gradeBidDecisions(scenario, state.decisions);
  } else if (session.toolType === 'STR_TRIAGE') {
    const scenario = getStrScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found.');
    const state = data.state as StrTriageSessionState;
    grade = gradeStrDecisions(scenario, state.decisions);
  } else if (session.toolType === 'LISTING_AUDIT') {
    const scenario = getLaScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found.');
    const state = data.state as ListingAuditSessionState;
    grade = gradeListingAudit(scenario, state.findings, state.revisedListing);
  } else if (session.toolType === 'KEYWORD_RESEARCH') {
    const scenario = getKrScenario(scenarioId);
    if (!scenario) throw new Error('Scenario not found.');
    const state = data.state as KeywordResearchSessionState;
    grade = gradeKeywordResearch(scenario, state.decisions, state.negatives);
  } else {
    throw new Error(`Unknown tool type: ${session.toolType}`);
  }

  const updated = await db.toolSession.update({
    where: { id: data.sessionId },
    data: {
      state: JSON.stringify(data.state),
      status: grade.passed ? 'GRADED' : 'SUBMITTED',
      score: grade.totalScore,
      submittedAt: new Date(),
      timeSpentSeconds: data.timeSpentSeconds ?? session.timeSpentSeconds,
    },
  });

  return {
    sessionId: updated.id,
    totalScore: grade.totalScore,
    passed: grade.passed,
    criteriaResults: grade.criteriaResults as Array<{ criterionId: string; passed: boolean; score: number; feedback: string }>,
    overallFeedback: grade.overallFeedback,
  };
});

// ---------------------------------------------------------------------------
// Helper: load a session's state for resume
// ---------------------------------------------------------------------------

export async function loadToolSession(sessionId: string): Promise<unknown | null> {
  const user = await requireAuth();
  const session = await db.toolSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== user.id) return null;
  try {
    return JSON.parse(session.state);
  } catch {
    return null;
  }
}

export async function listRecentSessions(toolType?: ToolType): Promise<
  Array<{ id: string; toolType: ToolType; scenarioId: string | null; status: string; score: number; submittedAt: Date | null }>
> {
  const user = await requireAuth();
  const sessions = await db.toolSession.findMany({
    where: {
      userId: user.id,
      ...(toolType ? { toolType } : {}),
      status: { in: ['SUBMITTED', 'GRADED'] },
    },
    orderBy: { submittedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      toolType: true,
      scenarioId: true,
      status: true,
      score: true,
      submittedAt: true,
    },
  });
  return sessions;
}

// Re-export ActionResult for callers
export type { ActionResult };