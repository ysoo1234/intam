export const ETHICS_REVIEW_CONFIG = {
  roundCount: 6,
  stations: {
    approve: { x: 175 },
    reject: { x: 1105 },
  },
  feedbackHoldMs: {
    correct: 2600,
    retry: 3400,
  },
  scoring: {
    correctDecision: 100,
    comboBonus: 25,
    maxComboBonusSteps: 4,
  },
} as const;

export const ETHICS_PRINCIPLE_LABELS = {
  "age-consent": "나이와 허락",
  "ai-disclosure": "AI 도움 표시",
  privacy: "개인정보 보호",
  respect: "바른 사용 태도",
  "account-safety": "계정 안전",
} as const;
