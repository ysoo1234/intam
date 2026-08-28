export const AI_WORKSHOP_CONFIG = {
  gameDurationMs: 120_000,
  sessionRequestLimit: 12,
  requiredStarHits: 3,
  maxWrongDeliveries: 3,
  earlyCustomerReward: 100,
  laterCustomerReward: 130,
  laterCustomerNumber: 4,
  perfectCraftingBonus: 50,
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
