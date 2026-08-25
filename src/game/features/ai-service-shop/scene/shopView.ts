import Phaser from "phaser";
import { GAME_SIZE } from "../../../assets";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";

export function drawShopInterior(scene: Phaser.Scene) {
  scene.add
    .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "ai-shop-interior")
    .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);

  scene.add
    .text(26, 28, "생활 속 AI 가게", {
      color: "#fff7e5",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 8,
    })
    .setDepth(20);

  [
    { x: 321, y: 137 },
    { x: 1068, y: 137 },
  ].forEach((position, index) => {
    const glow = scene.add
      .ellipse(position.x, position.y, 128, 90, COLORS.yellow, 0.14)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.22 },
      scaleX: 1.12,
      scaleY: 1.08,
      duration: 1300 + index * 220,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  });

  [
    { x: 358, y: 280 },
    { x: 875, y: 163 },
    { x: 1010, y: 305 },
    { x: 245, y: 360 },
    { x: 1170, y: 240 },
  ].forEach((position, index) => {
    const sparkle = scene.add
      .star(position.x, position.y, 4, 3, 8, COLORS.yellow, 0.58)
      .setDepth(3);
    scene.tweens.add({
      targets: sparkle,
      alpha: { from: 0.15, to: 0.8 },
      angle: 180,
      scale: { from: 0.7, to: 1.25 },
      duration: 900 + index * 170,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  });
}

export function createShopDialogue(scene: Phaser.Scene) {
  const dialogueLabel = scene.add
    .text(478, 100, "", {
      color: "#2a877f",
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
    })
    .setDepth(12);
  const dialogueText = scene.add
    .text(478, 130, "", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "21px",
      fontStyle: "bold",
      lineSpacing: 8,
      wordWrap: { width: 330 },
    })
    .setDepth(12);
  return { dialogueLabel, dialogueText };
}
