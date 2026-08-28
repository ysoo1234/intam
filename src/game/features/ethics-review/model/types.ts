export type EthicsVerdict = "approve" | "reject";

export type EthicsPrinciple =
  | "age-consent"
  | "ai-disclosure"
  | "privacy"
  | "respect"
  | "account-safety";

export type EthicsReviewCase = Readonly<{
  id: string;
  subject: Readonly<{
    name: string;
    age: number;
    tool: string;
    location: string;
  }>;
  facts: readonly string[];
  reviewQuestion: string;
  verdict: EthicsVerdict;
  principle: EthicsPrinciple;
  evidenceFactIndex: number;
  explanation: string;
  betterAction: string;
}>;

export type EthicsReviewDecision = Readonly<{
  correct: boolean;
  selected: EthicsVerdict;
  expected: EthicsVerdict;
  principle: EthicsPrinciple;
  evidenceFact: string;
  explanation: string;
  betterAction: string;
}>;

export type EthicsReviewPhase =
  | "briefing"
  | "countdown"
  | "entering"
  | "reviewing"
  | "feedback"
  | "exiting"
  | "result";

export type EthicsReviewEndReason = "time" | "lives" | "cases";
