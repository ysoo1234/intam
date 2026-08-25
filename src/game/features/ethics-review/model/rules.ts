import type {
  EthicsReviewCase,
  EthicsReviewDecision,
  EthicsVerdict,
} from "./types";
import { ETHICS_REVIEW_CONFIG } from "./config";

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function createReviewShift(
  cases: readonly EthicsReviewCase[],
  count: number,
  random: () => number = Math.random,
): EthicsReviewCase[] {
  const targetCount = Math.max(0, Math.min(Math.floor(count), cases.length));
  const approve = shuffled(
    cases.filter((reviewCase) => reviewCase.verdict === "approve"),
    random,
  );
  const reject = shuffled(
    cases.filter((reviewCase) => reviewCase.verdict === "reject"),
    random,
  );
  const approveTarget = Math.ceil(targetCount / 2);
  const rejectTarget = Math.floor(targetCount / 2);
  const selected = [
    ...approve.slice(0, approveTarget),
    ...reject.slice(0, rejectTarget),
  ];
  const selectedIds = new Set(selected.map((reviewCase) => reviewCase.id));
  const remainder = shuffled(
    cases.filter((reviewCase) => !selectedIds.has(reviewCase.id)),
    random,
  );
  selected.push(...remainder.slice(0, targetCount - selected.length));
  return shuffled(selected, random);
}

export function evaluateReviewDecision(
  reviewCase: EthicsReviewCase,
  selected: EthicsVerdict,
): EthicsReviewDecision {
  return {
    correct: reviewCase.verdict === selected,
    selected,
    expected: reviewCase.verdict,
    principle: reviewCase.principle,
    evidenceFact: reviewCase.facts[reviewCase.evidenceFactIndex] ?? "",
    explanation: reviewCase.explanation,
    betterAction: reviewCase.betterAction,
  };
}

export function getEthicsReviewPoints(
  decision: EthicsReviewDecision,
  comboBeforeDecision: number,
): number {
  if (!decision.correct) return 0;
  const comboSteps = Math.min(
    Math.max(0, Math.floor(comboBeforeDecision)),
    ETHICS_REVIEW_CONFIG.scoring.maxComboBonusSteps,
  );
  return (
    ETHICS_REVIEW_CONFIG.scoring.correctDecision +
    comboSteps * ETHICS_REVIEW_CONFIG.scoring.comboBonus
  );
}

export function getNextEthicsReviewCombo(
  comboBeforeDecision: number,
  correct: boolean,
): number {
  return correct ? Math.max(0, Math.floor(comboBeforeDecision)) + 1 : 0;
}

export function getEthicsReviewStars(mistakeCount: number): 1 | 2 | 3 {
  if (mistakeCount <= 1) return 3;
  if (mistakeCount <= 3) return 2;
  return 1;
}

export function getEthicsReviewProgress(
  completedCount: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return 0;
  return Math.min(1, Math.max(0, completedCount / totalCount));
}
