import { ETHICS_PRACTICE_CASE, ETHICS_VISITORS } from "../content/cases";
import { ETHICS_REVIEW_CONFIG as CONFIG } from "./config";
import {
  canRequestEthicsAction, evaluateReviewDecision, getEthicsVisitorForCase,
  getNextEthicsReviewCombo,
} from "./rules";
import type { EthicsDeliveryAction, EthicsDeliveryState, EthicsReviewCase, EthicsVisitor } from "./types";

export function createEthicsDeliveryState(deck: readonly EthicsReviewCase[]): EthicsDeliveryState {
  return {
    deck, phase: deck.length ? "choosing" : "result", practice: deck.length > 0,
    caseIndex: 0, processedCount: 0, completedCount: 0, mistakeCount: 0,
    approvedCount: 0, returnedCount: 0,
    score: 0, combo: 0, bestCombo: 0,
    remainingMs: CONFIG.durationMs, feedbackMs: 0,
  };
}
export function getEthicsDeliveryCase(state: EthicsDeliveryState): EthicsReviewCase | undefined {
  if (state.practice) return ETHICS_PRACTICE_CASE;
  if (state.deck.length === 0) return undefined;
  return state.deck[state.caseIndex % state.deck.length];
}
export function getEthicsDeliveryVisitor(state: EthicsDeliveryState): EthicsVisitor {
  return getEthicsVisitorForCase(ETHICS_VISITORS, state.caseIndex, state.practice);
}
/** Applies one stamp. Only a case in the choosing phase accepts a verdict. */
export function actEthicsDelivery(state: EthicsDeliveryState, action: EthicsDeliveryAction): EthicsDeliveryState {
  const item = getEthicsDeliveryCase(state);
  if (!item || !canRequestEthicsAction(state.phase, action)) return state;
  if (state.practice) {
    // Practice never scores, so its decision carries no points to celebrate.
    return { ...state, phase: "feedback", decision: { ...evaluateReviewDecision(item, action, 0), points: 0 } };
  }
  const decision = evaluateReviewDecision(item, action, state.combo);
  const combo = getNextEthicsReviewCombo(state.combo, decision.correct);
  return {
    ...state, phase: "feedback", decision,
    feedbackMs: decision.correct ? CONFIG.feedbackDurationMs : CONFIG.correctionDurationMs,
    processedCount: state.processedCount + 1,
    completedCount: state.completedCount + Number(decision.correct),
    mistakeCount: state.mistakeCount + Number(!decision.correct),
    approvedCount: state.approvedCount + Number(action === "approve"),
    returnedCount: state.returnedCount + Number(action === "reject"),
    score: state.score + decision.points,
    combo, bestCombo: Math.max(state.bestCombo, combo),
  };
}
// Only the untimed practice waits for the student to confirm the explanation.
export function continueEthicsDelivery(state: EthicsDeliveryState): EthicsDeliveryState {
  if (!state.practice || state.phase !== "feedback" || !state.decision) return state;
  if (!state.decision.correct) return { ...state, phase: "choosing", decision: undefined };
  return { ...createEthicsDeliveryState(state.deck), practice: false };
}
export function tickEthicsDelivery(state: EthicsDeliveryState, deltaMs: number): EthicsDeliveryState {
  if (state.practice || state.phase === "result") return state;
  // Clock time is deliberately not capped like animation: the shift lasts two
  // minutes, including stamp feedback and time spent in another browser tab.
  const delta = Math.max(0, deltaMs);
  const remainingMs = Math.max(0, state.remainingMs - delta);
  if (remainingMs === 0) return { ...state, remainingMs, phase: "result" };
  if (state.phase !== "feedback") return { ...state, remainingMs };
  const feedbackMs = Math.max(0, state.feedbackMs - delta);
  if (feedbackMs > 0) return { ...state, remainingMs, feedbackMs };
  return {
    ...state, remainingMs, feedbackMs: 0, caseIndex: state.caseIndex + 1,
    phase: "choosing", decision: undefined,
  };
}
