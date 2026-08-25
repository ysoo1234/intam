import Phaser from "phaser";
import {
  COLORS,
  getTextStyle,
  TEXT_COLORS,
  UI_RADII,
} from "../../../core/visual/theme";
import {
  addUiButton,
  addUiSurface,
} from "../../../core/visual/uiPrimitives";

export type AirportResult = {
  completed: boolean;
  score: number;
  collected: number;
  correctAnswers: number;
  onRetry: () => void;
  onWorld: () => void;
};

export function createAirportResultOverlay(
  scene: Phaser.Scene,
  result: AirportResult,
) {
  const overlay = scene.add.container(640, 360).setDepth(110);
  const shade = scene.add.rectangle(0, 0, 1280, 720, COLORS.ink, 0.82);
  const panel = addUiSurface(
    scene,
    { x: -370, y: -250, width: 740, height: 500 },
    "paper",
    {
      radius: UI_RADII.dialog,
      borderWidth: 6,
      shadow: "medium",
    },
  );
  const icon = scene.add
    .text(0, -180, result.completed ? "🏆" : "💛", { fontSize: "70px" })
    .setOrigin(0.5);
  const title = scene.add
    .text(
      0,
      -92,
      result.completed ? "데이터 비행 완료!" : "비행을 마쳤어요",
      getTextStyle("display", { fontSize: "39px" }),
    )
    .setOrigin(0.5);
  const stats = scene.add
    .text(
      0,
      8,
      `최종 점수  ${result.score.toLocaleString()}점\n수집한 데이터  ${result.collected}개   ·   맞힌 문제  ${result.correctAnswers}개`,
      getTextStyle("heading", {
        color: TEXT_COLORS.accent,
        fontSize: "25px",
        align: "center",
        lineSpacing: 13,
      }),
    )
    .setOrigin(0.5);
  const retry = addUiButton(scene, {
    x: 0,
    y: 122,
    width: 300,
    height: 58,
    label: "다시 비행",
    variant: "caution",
    onPress: result.onRetry,
  }).container;
  const world = addUiButton(scene, {
    x: 0,
    y: 198,
    width: 300,
    height: 58,
    label: "마을로 돌아가기",
    variant: "positive",
    onPress: result.onWorld,
  }).container;
  overlay.add([shade, panel, icon, title, stats, retry, world]);
  overlay.setScale(0.9).setAlpha(0);
  scene.tweens.add({
    targets: overlay,
    scale: 1,
    alpha: 1,
    duration: 420,
    ease: "Back.easeOut",
  });
  return overlay;
}
