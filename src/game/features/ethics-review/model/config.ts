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
  // Stars by score earned in one shift.
  starThresholds: { oneStar: 1_000, twoStars: 2_000, threeStars: 3_000 },
} as const;
