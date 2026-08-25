import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";

export function showAirportNotice(
  scene: Phaser.Scene,
  title: string,
  detail: string,
  color: number,
) {
  const notice = scene.add.container(640, 330).setDepth(95).setScale(0);
  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.paper, 0.98);
  panel.lineStyle(8, COLORS.ink, 1);
  panel.fillRoundedRect(-355, -96, 710, 192, 46);
  panel.strokeRoundedRect(-355, -96, 710, 192, 46);
  const titleText = scene.add
    .text(0, -40, title, {
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  const detailText = scene.add
    .text(0, 34, detail, {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "21px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 620 },
    })
    .setOrigin(0.5);
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
