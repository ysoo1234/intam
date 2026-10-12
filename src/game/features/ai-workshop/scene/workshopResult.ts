import Phaser from "phaser";
import { recordBestScore } from "../../../core/navigation/bestScoreStorage";
import {
  createGameResultOverlay,
} from "../../../core/visual/gameResultOverlay";

export type WorkshopResult = {
  timeCompleted: boolean;
  completedCustomers: number;
  coins: number;
  stars: 0 | 1 | 2 | 3;
  onRetry: () => void;
  onWorld: () => void;
};

export function createWorkshopResultOverlay(
  scene: Phaser.Scene,
  result: WorkshopResult,
) {
  // The coins earned are the workshop's score.
  const best = recordBestScore("ai-workshop", result.coins);
  return createGameResultOverlay(scene, {
    title: "영업을 마쳤어요!",
    stars: result.stars,
    stats: [
      { label: "도와준 손님", value: `${result.completedCustomers}명` },
      { label: "번 코인", value: `${result.coins}코인` },
    ],
    best: { label: "최고 기록", value: `${best.best}코인`, isNew: best.isNew },
    retryLabel: "다시 영업하기",
    onRetry: result.onRetry,
    onWorld: result.onWorld,
  });
}
