import Phaser from "phaser";
import {
  createGameResultOverlay,
} from "../../../core/visual/gameResultOverlay";

export type AirportResult = {
  completed: boolean;
  score: number;
  collected: number;
  correctAnswers: number;
  stars: 0 | 1 | 2 | 3;
  onRetry: () => void;
  onWorld: () => void;
};

export function createAirportResultOverlay(
  scene: Phaser.Scene,
  result: AirportResult,
) {
  return createGameResultOverlay(scene, {
    title: "비행을 마쳤어요.",
    stars: result.stars,
    summary: `데이터 ${result.collected}개를 모으고 ${result.score.toLocaleString()}점을 얻었어요!\n문제 ${result.correctAnswers}개를 맞혔어요.`,
    retryLabel: "다시 비행하기",
    onRetry: result.onRetry,
    onWorld: result.onWorld,
  });
}
