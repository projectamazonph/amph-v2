/**
 * Keyword Research scoring — grades the student's prioritization + negatives.
 *
 * Two parts:
 * 1. Priority accuracy — did the student correctly assign primary/secondary/negative?
 * 2. Negative identification — did the student catch the irrelevant terms?
 */

import {
  aggregateGrade,
  binaryCriterion,
  gradedCriterion,
  type CriterionResult,
} from '../scoring';
import type {
  KeywordResearchScenario,
  KeywordResearchGrade,
  KeywordPriority,
} from './types';

const PASS = 'Looks right.';
const FAIL = 'Not quite. See the explanation below.';

export function gradeKeywordResearch(
  scenario: KeywordResearchScenario,
  decisions: Array<{ keyword: string; priority: KeywordPriority }>,
  negatives: string[]
): KeywordResearchGrade {
  const decisionMap = new Map(decisions.map((d) => [d.keyword.toLowerCase(), d.priority]));

  let priorityCorrect = 0;
  let totalScored = 0;
  const criteria: CriterionResult[] = [];

  for (const candidate of scenario.candidates) {
    const decision = decisionMap.get(candidate.text.toLowerCase());
    const refPriority = scenario.referencePriorities[candidate.text.toLowerCase()];
    if (!decision || !refPriority) continue;
    totalScored++;

    if (decision === refPriority) {
      priorityCorrect++;
    } else {
      criteria.push({
        criterionId: `priority_${candidate.text}`,
        passed: false,
        score: 0,
        feedback: priorityFeedback(candidate.text, decision, refPriority),
        details: { chosen: decision, ref: refPriority },
      });
    }
  }

  const accuracyRatio = totalScored > 0 ? priorityCorrect / totalScored : 0;
  criteria.push(
    gradedCriterion(
      'priority_accuracy',
      accuracyRatio,
      'All keywords prioritized correctly.',
      'Some keywords were mis-prioritized. Look at the per-keyword feedback below.',
      0.75
    )
  );

  // Negative identification
  const refNegSet = new Set(scenario.referenceNegatives.map((n) => n.toLowerCase()));
  const studentNegSet = new Set(negatives.map((n) => n.toLowerCase()));
  let truePositives = 0;
  let falsePositives = 0;
  for (const n of studentNegSet) {
    if (refNegSet.has(n)) truePositives++;
    else falsePositives++;
  }
  const negativesNeeded = refNegSet.size;
  if (negativesNeeded > 0) {
    criteria.push(
      gradedCriterion(
        'negative_recall',
        truePositives / negativesNeeded,
        `You identified all ${negativesNeeded} keywords that should be on the negative list.`,
        `You missed ${negativesNeeded - truePositives} keyword(s) that should be negative.`,
        0.6
      )
    );
    criteria.push(
      gradedCriterion(
        'negative_precision',
        falsePositives === 0 ? 1 : Math.max(0, 1 - falsePositives / studentNegSet.size),
        falsePositives === 0
          ? 'No false-positive negatives.'
          : `${falsePositives} keyword(s) were added as negatives that should not have been.`,
        'Be careful not to over-negate — adding too many terms as negative cuts reach.',
        0.7
      )
    );
  } else {
    criteria.push(
      binaryCriterion('negative_recall', true, 'No negatives needed for this scenario.', FAIL)
    );
  }

  // Coverage of high-priority keywords
  const primariesNeeded = Object.values(scenario.referencePriorities).filter(
    (p) => p === 'PRIMARY'
  ).length;
  const primariesChosen = decisions.filter((d) => d.priority === 'PRIMARY').length;
  criteria.push(
    gradedCriterion(
      'primary_coverage',
      primariesNeeded === 0 ? 1 : Math.min(primariesChosen / primariesNeeded, 1),
      'Primary keyword coverage is complete.',
      'Some primary keywords were missed.',
      0.7
    )
  );

  return aggregateGrade(criteria, 70);
}

function priorityFeedback(
  keyword: string,
  chosen: KeywordPriority,
  ref: KeywordPriority
): string {
  if (chosen === 'PRIMARY' && ref !== 'PRIMARY') {
    return `"${keyword}" should not be primary — it is ${ref === 'SECONDARY' ? 'a secondary term (lower relevance or volume)' : 'irrelevant to this product (should be negative)'}.`;
  }
  if (chosen === 'SECONDARY' && ref === 'PRIMARY') {
    return `"${keyword}" is a primary term — high relevance and volume. Promote it.`;
  }
  if (chosen === 'NEGATIVE' && ref !== 'NEGATIVE') {
    return `"${keyword}" should not be a negative — it is ${ref === 'PRIMARY' ? 'a primary term' : 'a secondary term'}.`;
  }
  if (chosen === 'SECONDARY' && ref === 'NEGATIVE') {
    return `"${keyword}" should be negative — irrelevant to this product.`;
  }
  return `"${keyword}": chosen ${chosen}, reference is ${ref}.`;
}