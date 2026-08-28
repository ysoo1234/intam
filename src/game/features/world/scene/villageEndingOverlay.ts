import Phaser from "phaser";
import { COLORS, getTextStyle, TEXT_COLORS } from "../../../core/visual/theme";
import { addUiButton, addUiSurface } from "../../../core/visual/uiPrimitives";
import { VILLAGE_UI_DEPTH } from "./villageScenery";

export function createVillageEndingOverlay(scene: Phaser.Scene, onContinue: () => void) {
  const depth = VILLAGE_UI_DEPTH + 100;
  const blocker = scene.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.72)
    .setDepth(depth)
    .setInteractive();
  const card = addUiSurface(
    scene,
    { x: -390, y: -245, width: 780, height: 490 },
    "cream",
    { radius: 44, shadow: "medium", borderWidth: 5 },
  );
  const title = scene.add.text(0, -160, "별빛 졸업길이 열렸어요!", getTextStyle("title", {
    fontSize: "38px",
    color: TEXT_COLORS.primary,
  })).setOrigin(0.5);
  const stars = scene.add.text(0, -82, "★ ★ ★   ★ ★ ★   ★ ★ ★", getTextStyle("title", {
    fontSize: "34px",
    color: "#E9A735",
  })).setOrigin(0.5);
  const body = scene.add.text(
    0,
    20,
    "세 곳의 활동에서 별을 모두 모았어요.\n미디와 함께 책임 있게 AI를 사용하는\n멋진 배움마을 시민이 되었어요!",
    getTextStyle("heading", { fontSize: "25px", color: TEXT_COLORS.primary }),
  ).setOrigin(0.5).setAlign("center").setLineSpacing(9);
  const button = addUiButton(scene, {
    x: 0,
    y: 168,
    width: 300,
    height: 66,
    label: "마을 더 둘러보기",
    variant: "primary",
    fontSize: "23px",
    onPress: onContinue,
  }).container;
  const cardContainer = scene.add.container(640, 360, [card, title, stars, body, button])
    .setDepth(depth + 1)
    .setScale(0.92)
    .setAlpha(0);
  scene.tweens.add({
    targets: cardContainer,
    scale: 1,
    alpha: 1,
    duration: 320,
    ease: "Back.easeOut",
  });
  return scene.add.container(0, 0, [blocker, cardContainer]).setDepth(depth);
}
