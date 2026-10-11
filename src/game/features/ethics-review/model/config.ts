export const ETHICS_REVIEW_CONFIG = {
  durationMs: 120_000,
  /** A correct stamp keeps the queue moving quickly. */
  feedbackDurationMs: 1_500,
  /** A mistake pauses long enough to read Midi's one-line explanation. */
  correctionDurationMs: 3_000,
  scoring: { correctDecision: 100, comboBonus: 10, maxComboBonusSteps: 5 },
  /**
   * Difficulty rises with correct stamps: stage 2 adds one attachment to check,
   * stage 3 adds two. Harder forms are worth more.
   */
  stages: [
    { stage: 1, minCorrect: 0, points: 100 },
    { stage: 2, minCorrect: 4, points: 150 },
    { stage: 3, minCorrect: 9, points: 200 },
  ],
  /** Combo milestones that earn a short on-screen celebration. */
  comboCelebrations: [3, 5, 8, 12] as readonly number[],
  starThresholds: {
    twoStars: 6, threeStars: 12,
    twoStarAccuracy: 0.6, threeStarAccuracy: 0.8,
  },
} as const;
