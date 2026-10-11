import Phaser from "phaser";
import type { GameStartOverlayConfig } from "../../../core/visual/gameStartOverlay";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { createAirportCardPanel } from "./airportPanels";

export function showAirportNotice(
  scene: Phaser.Scene,
  title: string,
  detail: string,
  color: number,
) {
  const notice = scene.add.container(640, 330).setDepth(95).setScale(0);
  // The start-card style again: cream card, colored title, one line of explanation.
  const panel = createAirportCardPanel(scene, 700, 250);
  const titleText = scene.add
    .text(0, -40, title, {
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      fontFamily: FONT_FAMILY,
      fontSize: "36px",
      fontStyle: "bold",
      stroke: "#ffffff",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setResolution(3);
  const detailText = scene.add
    .text(0, 38, detail, {
      color: "#315567",
      fontFamily: FONT_FAMILY,
      fontSize: "21px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 580 },
    })
    .setOrigin(0.5)
    .setResolution(3);
  notice.add([panel, titleText, detailText]);
  scene.tweens.add({
    targets: notice,
    scale: 1,
    duration: 260,
    ease: "Back.easeOut",
  });
  scene.time.delayedCall(1_350, () => {
    scene.tweens.add({
      targets: notice,
      alpha: 0,
      y: 295,
      duration: 260,
      onComplete: () => notice.destroy(true),
    });
  });
}

export function showAirportLevelUp(scene: Phaser.Scene, level: number) {
  const notice = scene.add.container(640, 176).setDepth(94).setAlpha(0).setY(196);
  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.ink, 0.9);
  panel.lineStyle(4, COLORS.yellow, 0.95);
  panel.fillRoundedRect(-190, -31, 380, 62, 24);
  panel.strokeRoundedRect(-190, -31, 380, 62, 24);
  const text = scene.add
    .text(0, 0, `비행 ${level}단계 · 난이도 상승!`, {
      color: "#fff8d8",
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  notice.add([panel, text]);
  scene.tweens.add({
    targets: notice,
    alpha: 1,
    y: 176,
    duration: 220,
    ease: "Back.easeOut",
  });
  scene.time.delayedCall(1_250, () => {
    scene.tweens.add({
      targets: notice,
      alpha: 0,
      y: 156,
      duration: 220,
      onComplete: () => notice.destroy(true),
    });
  });
}

/** Start-overlay copy for the airport; the first flight teaches the rest. */
export const DATA_FLIGHT_START = {
  placeName: "데이터 비행장",
  playDescription: "미디와 함께 하늘을 날며\n좋은 데이터를 모아요.",
  keyboardHint: "방향키로도 움직일 수 있어요",
} as const satisfies GameStartOverlayConfig;
