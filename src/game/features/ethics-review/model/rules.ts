import { ETHICS_REVIEW_CONFIG as CONFIG } from "./config";
import type {
  EthicsDeliveryAction, EthicsReviewCase, EthicsReviewDecision,
  EthicsReviewPhase, EthicsReviewStage, EthicsVerdict, EthicsVisitor,
} from "./types";

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

/** Builds a balanced, shuffled shift: half approve cases, half reject cases. */
export function createReviewShift(
  cases: readonly EthicsReviewCase[], count: number, random: () => number = Math.random,
): EthicsReviewCase[] {
  const targetCount = Math.max(0, Math.min(Math.floor(count), cases.length));
  const approve = shuffled(cases.filter(item => item.verdict === "approve"), random);
  const reject = shuffled(cases.filter(item => item.verdict === "reject"), random);
  const selected = [
    ...approve.slice(0, Math.ceil(targetCount / 2)),
    ...reject.slice(0, Math.floor(targetCount / 2)),
  ];
  const ids = new Set(selected.map(item => item.id));
  const remainder = shuffled(cases.filter(item => !ids.has(item.id)), random);
  selected.push(...remainder.slice(0, targetCount - selected.length));
  return shuffled(selected, random);
}

/** The stage a shift is at after `correct` right stamps. */
export function getEthicsReviewStage(correct: number): EthicsReviewStage {
  let stage: EthicsReviewStage = 1;
  for (const step of CONFIG.stages) if (correct >= step.minCorrect) stage = step.stage as EthicsReviewStage;
  return stage;
}
export function getEthicsReviewPoints(correct: boolean, combo: number, stage: EthicsReviewStage = 1): number {
  if (!correct) return 0;
  const base = CONFIG.stages.find(step => step.stage === stage)?.points ?? CONFIG.scoring.correctDecision;
  return base +
    Math.min(Math.max(0, Math.floor(combo)), CONFIG.scoring.maxComboBonusSteps) * CONFIG.scoring.comboBonus;
}

export function evaluateReviewDecision(
  item: EthicsReviewCase, selected: EthicsVerdict, combo = 0, stage: EthicsReviewStage = 1,
): EthicsReviewDecision {
  const correct = item.verdict === selected;
  return {
    correct, selected, expected: item.verdict, explanation: item.explanation,
    points: getEthicsReviewPoints(correct, combo, stage),
  };
}
export function getNextEthicsReviewCombo(combo: number, correct: boolean): number {
  return correct ? Math.max(0, Math.floor(combo)) + 1 : 0;
}
export function isEthicsComboCelebration(combo: number): boolean {
  return CONFIG.comboCelebrations.includes(combo);
}
export function getEthicsAccuracy(correct: number, processed: number): number {
  return processed <= 0 ? 0 : Math.min(1, Math.max(0, correct / processed));
}
export function getEthicsReviewStars(score: number): 0 | 1 | 2 | 3 {
  const thresholds = CONFIG.starThresholds;
  if (score >= thresholds.threeStars) return 3;
  if (score >= thresholds.twoStars) return 2;
  return score >= thresholds.oneStar ? 1 : 0;
}
export function canRequestEthicsAction(phase: EthicsReviewPhase, action: EthicsDeliveryAction) {
  return phase === "choosing" && (action === "approve" || action === "reject");
}
/** A fresh visiting order for one shift: every student once before anyone returns. */
export function createEthicsVisitorOrder(count: number, random: () => number = Math.random): number[] {
  return shuffled(Array.from({ length: Math.max(0, count) }, (_, index) => index), random);
}
/**
 * The practice meets the first student in `order`; the shift then walks the
 * rest of the order, so no one comes back until all the others have been.
 */
export function getEthicsVisitorForCase(
  visitors: readonly EthicsVisitor[], caseIndex: number, practice: boolean,
  order: readonly number[] = [],
): EthicsVisitor {
  if (visitors.length === 0) throw new Error("Ethics Review needs at least one visitor.");
  const step = practice ? 0 : (caseIndex + 1) % visitors.length;
  const index = order.length === visitors.length ? order[step] : step;
  return visitors[index];
}
