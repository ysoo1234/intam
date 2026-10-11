import type {
  WorkshopProduct,
  WorkshopRequest,
} from "../../../content/aiWorkshop";
import { AI_WORKSHOP_CONFIG, STAR_CATCH_DIFFICULTIES } from "./config";
import type {
  StarCatchDifficulty,
  WorkshopOrder,
} from "./types";

export function createWorkshopOrder(
  request: WorkshopRequest,
  productById: ReadonlyMap<string, WorkshopProduct>,
): WorkshopOrder {
  const product = productById.get(request.productId);
  return {
    requests: [request],
    products: product ? [product] : [],
    requiredStarHits: AI_WORKSHOP_CONFIG.requiredStarHits,
  };
}

export function isWorkshopDeliveryCorrect(
  expectedProducts: readonly WorkshopProduct[],
  carriedProducts: readonly WorkshopProduct[],
) {
  const expected = expectedProducts.map((product) => product.id).sort();
  const carried = carriedProducts.map((product) => product.id).sort();
  return (
    expected.length === carried.length &&
    expected.every((productId, index) => productId === carried[index])
  );
}

/** The lowest and highest coins a customer can pay (both multiples of 10). */
export function getWorkshopRewardRange(customerNumber: number) {
  const rule = AI_WORKSHOP_CONFIG.reward;
  const tier = Math.floor((Math.max(1, customerNumber) - 1) / rule.customersPerTier);
  const min = rule.firstMin + tier * rule.increasePerTier;
  return { min, max: min + rule.rangeSteps * rule.step };
}

/** Coins for a served customer: a lucky draw of 20, 30, 40 or 50 (for 1–3), and so on. */
export function getWorkshopReward(customerNumber: number, random: () => number = Math.random) {
  const rule = AI_WORKSHOP_CONFIG.reward;
  const { min } = getWorkshopRewardRange(customerNumber);
  const steps = Math.min(rule.rangeSteps, Math.floor(random() * (rule.rangeSteps + 1)));
  return { reward: min + steps * rule.step };
}

export function getWorkshopStars(completedCustomers: number): 1 | 2 | 3 {
  if (completedCustomers >= AI_WORKSHOP_CONFIG.starThresholds.threeStars) return 3;
  if (completedCustomers >= AI_WORKSHOP_CONFIG.starThresholds.twoStars) return 2;
  return 1;
}

export function getStarCatchDifficulty(
  customerNumber: number,
): StarCatchDifficulty {
  const tier = Math.min(
    Math.floor((customerNumber - 1) / 3),
    STAR_CATCH_DIFFICULTIES.length - 1,
  );
  return STAR_CATCH_DIFFICULTIES[Math.max(0, tier)];
}
