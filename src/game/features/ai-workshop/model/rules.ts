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

export function getWorkshopReward(
  customerNumber: number,
  starMisses: number,
) {
  const baseReward =
    customerNumber >= AI_WORKSHOP_CONFIG.laterCustomerNumber
      ? AI_WORKSHOP_CONFIG.laterCustomerReward
      : AI_WORKSHOP_CONFIG.earlyCustomerReward;
  const perfectBonus =
    starMisses === 0 ? AI_WORKSHOP_CONFIG.perfectCraftingBonus : 0;
  return { baseReward, perfectBonus, reward: baseReward + perfectBonus };
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
