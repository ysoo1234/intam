export const AI_WORKSHOP_CONFIG = {
  gameDurationMs: 120_000,
  sessionRequestLimit: 12,
  requiredStarHits: 3,
  maxWrongDeliveries: 3,
  /**
   * Coins per customer, picked at random in steps of 10: customers 1–3 pay
   * 20–50, 4–6 pay 40–70, 7–9 pay 60–90, and so on (+20 every three).
   */
  reward: {
    firstMin: 20,
    rangeSteps: 3,
    step: 10,
    customersPerTier: 3,
    increasePerTier: 20,
  },
  starThresholds: {
    twoStars: 4,
    threeStars: 8,
  },
} as const;

export const STAR_CATCH_DIFFICULTIES = [
  { speed: 500, zoneWidth: 125 },
  { speed: 575, zoneWidth: 125 },
  { speed: 575, zoneWidth: 100 },
  { speed: 650, zoneWidth: 100 },
  { speed: 650, zoneWidth: 78 },
] as const;
