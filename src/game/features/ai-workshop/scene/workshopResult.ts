import Phaser from "phaser";
import {
  createGameResultOverlay,
} from "../../../core/visual/gameResultOverlay";

export type WorkshopResult = {
  timeCompleted: boolean;
  completedCustomers: number;
  coins: number;
  stars: 1 | 2 | 3;
  onRetry: () => void;
  onWorld: () => void;
};

export function createWorkshopResultOverlay(
  scene: Phaser.Scene,
  result: WorkshopResult,
) {
  return createGameResultOverlay(scene, {
    title: "영업을 마쳤어요.",
    stars: result.stars,
    summary: `손님 ${result.completedCustomers}명의 문제를 해결하고 ${result.coins}코인을 얻었어요!`,
    retryLabel: "다시 영업하기",
    onRetry: result.onRetry,
    onWorld: result.onWorld,
  });
}
