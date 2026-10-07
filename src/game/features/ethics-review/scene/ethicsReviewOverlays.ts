import Phaser from "phaser";
import { createGameResultOverlay } from "../../../core/visual/gameResultOverlay";
import { getEthicsAccuracy } from "../model";

export function createEthicsResultOverlay(scene: Phaser.Scene, options: {
  stars: number;
  score: number;
  completedCount: number;
  processedCount: number;
  bestCombo: number;
  onBack: () => void;
  onReplay: () => void;
}) {
  const accuracy = Math.round(getEthicsAccuracy(options.completedCount, options.processedCount) * 100);
  const comboLine = options.bestCombo >= 3 ? ` · 최고 ${options.bestCombo}연속` : "";
  return createGameResultOverlay(scene, {
    title: "오늘의 심사 끝!",
    stars: options.stars,
    summary: `손님 ${options.processedCount}명 · 정확한 판정 ${options.completedCount}건\n정확도 ${accuracy}% · ${options.score.toLocaleString()}점${comboLine}`,
    retryLabel: "다시 심사하기",
    onRetry: options.onReplay,
    onWorld: options.onBack,
  });
}
