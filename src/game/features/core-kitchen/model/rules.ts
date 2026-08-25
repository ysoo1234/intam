import type {
  CoreKind,
  KitchenOrder,
} from "../../../content/coreKitchen";
import { CORE_KINDS } from "./config";

type InstalledCoreLike = {
  core: { id: string };
};

export function countInstalledCoreKinds(
  installed: Partial<Record<CoreKind, InstalledCoreLike>>,
) {
  return CORE_KINDS.filter((kind) => installed[kind]).length;
}

export function getWrongCoreKinds(
  recipe: KitchenOrder["recipe"],
  installed: Partial<Record<CoreKind, InstalledCoreLike>>,
) {
  return CORE_KINDS.filter(
    (kind) => installed[kind]?.core.id !== recipe[kind],
  );
}

export function getKitchenMistakeProgress(mistakeCount: number) {
  return { mistakeCount: mistakeCount + 1, combo: 0 };
}

export function getKitchenSuccessProgress(
  correctCount: number,
  combo: number,
) {
  return { correctCount: correctCount + 1, combo: combo + 1 };
}

export function getKitchenStarRating(mistakeCount: number) {
  return mistakeCount <= 1
    ? "★★★"
    : mistakeCount <= 3
      ? "★★☆"
      : "★☆☆";
}
