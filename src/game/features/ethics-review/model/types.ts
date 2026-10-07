export type EthicsVerdict = "approve" | "reject";
export type EthicsCategory = "permission" | "privacy" | "checking" | "honesty" | "respect";
export type EthicsVisitorId =
  | "school-prep-student" | "diary-student" | "science-homework-student"
  | "cafeteria-student" | "wrong-answer-student" | "foreign-call-student";
export type EthicsVisitor = Readonly<{
  id: EthicsVisitorId;
  name: string;
}>;
export type EthicsReviewCase = Readonly<{
  id: string;
  prompt: string;
  category: EthicsCategory;
  verdict: EthicsVerdict;
  explanation: string;
}>;
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
