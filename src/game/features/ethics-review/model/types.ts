export type EthicsVerdict = "approve" | "reject";
/** The textbook's five AI 사용 약속 (퀘스트 5). */
export type EthicsCategory = "age" | "label" | "privacy" | "kind" | "logout";
/** The 24 review students (ethics-student-01 … ethics-student-24). */
export type EthicsVisitorId = `ethics-student-${string}`;
export type EthicsVisitor = Readonly<{
  id: EthicsVisitorId;
  name: string;
}>;
/**
 * Papers stapled to the form from stage 2 on. Each one shows a small, visual
 * fact (a sign-up screen, an AI label, a signature, a chat, a tablet screen …) that either
 * supports the form's claim (`ok`) or quietly contradicts it.
 */
export type EthicsAttachmentKind = "signup" | "artwork" | "consent" | "chat" | "tablet";
export type EthicsAttachment = Readonly<{
  kind: EthicsAttachmentKind;
  ok: boolean;
  /** Up to two short lines printed on the attachment. */
  text: string;
}>;
/** 1: the form alone · 2: form + one attachment · 3: form + two attachments. */
export type EthicsReviewStage = 1 | 2 | 3;
export type EthicsReviewCase = Readonly<{
  id: string;
  prompt: string;
  category: EthicsCategory;
  verdict: EthicsVerdict;
  explanation: string;
  /** Empty for stage 1 forms. The verdict is approve only when every attachment is ok. */
  attachments?: readonly EthicsAttachment[];
}>;
/** Shuffled forms for the two harder stages; empty decks keep the shift at stage 1. */
export type EthicsAdvancedDecks = Readonly<{ 2: readonly EthicsReviewCase[]; 3: readonly EthicsReviewCase[] }>;
export type EthicsReviewPhase = "choosing" | "feedback" | "result";
export type EthicsReviewDecision = Readonly<{
  correct: boolean;
  selected: EthicsVerdict;
  expected: EthicsVerdict;
  explanation: string;
  /** Points awarded by this decision, including the combo bonus. */
  points: number;
}>;
export type EthicsDeliveryAction = EthicsVerdict;
export type EthicsDeliveryState = Readonly<{
  deck: readonly EthicsReviewCase[];
  phase: EthicsReviewPhase;
  practice: boolean;
  advancedDecks: EthicsAdvancedDecks;
  /** Difficulty, raised by the number of correct stamps (see `stages` in config). */
  stage: EthicsReviewStage;
  /** Position inside the current stage's deck. */
  stageCursor: number;
  /** Visitor indexes in the order they come to the window this shift. */
  visitorOrder: readonly number[];
  caseIndex: number;
  processedCount: number;
  completedCount: number;
  mistakeCount: number;
  approvedCount: number;
  returnedCount: number;
  score: number;
  combo: number;
  bestCombo: number;
  remainingMs: number;
  feedbackMs: number;
  decision?: EthicsReviewDecision;
}>;
