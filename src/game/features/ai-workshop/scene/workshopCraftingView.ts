import Phaser from "phaser";
import type { WorkshopProduct } from "../../../content/aiWorkshop";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { AI_WORKSHOP_LAYOUT } from "./layout";

export type WorkshopCraftingAnimation = {
  container: Phaser.GameObjects.Container;
  timer: Phaser.Time.TimerEvent;
};

export function createWorkshopCraftingAnimation(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  isCrafting: () => boolean,
): WorkshopCraftingAnimation {
  const container = scene.add
    .container(
      AI_WORKSHOP_LAYOUT.workbench.x,
      AI_WORKSHOP_LAYOUT.workbench.interactionY - 14,
    )
    .setDepth(AI_WORKSHOP_LAYOUT.workbench.depth + 1);
  const glow = scene.add
    .ellipse(0, 14, 250, 48, product.color, 0.24)
    .setStrokeStyle(4, product.color, 0.72);
  const cloudShadow = scene.add.ellipse(0, 24, 218, 38, COLORS.ink, 0.23);
  const productBadge = scene.add
    .circle(0, -9, 35, COLORS.paper, 0.98)
    .setStrokeStyle(5, product.color, 1);
  const productEmoji = scene.add
    .text(0, -12, product.emoji, { fontSize: "35px" })
    .setOrigin(0.5);
  const puffSpecs = [
    { x: -91, y: 3, radius: 31, tint: 0xe8f7f4 },
    { x: -58, y: -8, radius: 40, tint: 0xf5fbf3 },
    { x: -18, y: -17, radius: 45, tint: 0xffffff },
    { x: 27, y: -16, radius: 47, tint: 0xf8fff9 },
    { x: 69, y: -6, radius: 39, tint: 0xeaf8f5 },
    { x: 99, y: 6, radius: 29, tint: 0xf8fff9 },
    { x: 0, y: 12, radius: 52, tint: 0xffffff },
  ];
  const puffs = puffSpecs.map(({ x, y, radius, tint }, index) => {
    const puff = scene.add
      .circle(x, y, radius, tint, 0.96)
      .setStrokeStyle(3, index % 2 === 0 ? 0xb9e3dc : 0xd7eee8, 0.9);
    scene.tweens.add({
      targets: puff,
      x: x + (index % 2 === 0 ? -5 : 5),
      y: y - Phaser.Math.Between(3, 8),
      scale: { from: 0.9, to: 1.1 },
      duration: 390 + index * 55,
      delay: index * 35,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return puff;
  });
  const impactLeft = scene.add
    .text(-126, -20, "✦", {
      color: "#70c6d5",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const impactRight = scene.add
    .text(126, -18, "✦", {
      color: "#f5bd46",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  container.add([
    glow,
    cloudShadow,
    productBadge,
    productEmoji,
    ...puffs,
    impactLeft,
    impactRight,
  ]);
  scene.tweens.add({
    targets: glow,
    scaleX: { from: 0.84, to: 1.13 },
    alpha: { from: 0.25, to: 0.7 },
    duration: 460,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: [productBadge, productEmoji],
    y: "-=13",
    duration: 520,
    yoyo: true,
    repeat: -1,
    ease: "Back.easeOut",
  });
  scene.tweens.add({
    targets: [impactLeft, impactRight],
    scale: { from: 0.55, to: 1.25 },
    alpha: { from: 0.35, to: 1 },
    angle: { from: -14, to: 14 },
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: "Quad.easeInOut",
  });

  const burstSymbols = ["🔩", "⚙️", "🔧", "🪛", "🔨"];
  let burstIndex = 0;
  const timer = scene.time.addEvent({
    delay: 310,
    loop: true,
    callback: () => {
      if (!isCrafting()) return;
      const direction = burstIndex % 2 === 0 ? -1 : 1;
      const launchX =
        AI_WORKSHOP_LAYOUT.workbench.x +
        direction * Phaser.Math.Between(8, 42);
      const launchY = AI_WORKSHOP_LAYOUT.workbench.interactionY - 20;
      const tool = scene.add
        .text(
          launchX,
          launchY,
          burstSymbols[burstIndex % burstSymbols.length],
          { fontSize: `${Phaser.Math.Between(24, 32)}px` },
        )
        .setOrigin(0.5)
        .setScale(0.45)
        .setDepth(72);
      scene.tweens.add({
        targets: tool,
        x: launchX + direction * Phaser.Math.Between(38, 78),
        y: launchY - Phaser.Math.Between(48, 70),
        scale: 1.05,
        angle: direction * Phaser.Math.Between(65, 145),
        duration: 270,
        ease: "Back.easeOut",
        onComplete: () => {
          scene.tweens.add({
            targets: tool,
            y: launchY + 8,
            alpha: 0,
            scale: 0.62,
            angle: tool.angle + direction * 90,
            duration: 290,
            ease: "Quad.easeIn",
            onComplete: () => tool.destroy(),
          });
        },
      });

      for (let index = 0; index < 4; index += 1) {
        const debris = scene.add
          .text(
            AI_WORKSHOP_LAYOUT.workbench.x + Phaser.Math.Between(-58, 58),
            launchY + Phaser.Math.Between(-7, 8),
            index % 2 === 0 ? "✦" : "·",
            {
              color: Phaser.Display.Color.IntegerToColor(
                index % 2 === 0 ? product.color : COLORS.yellow,
              ).rgba,
              fontFamily: FONT_FAMILY,
              fontSize: `${Phaser.Math.Between(15, 23)}px`,
              fontStyle: "bold",
            },
          )
          .setOrigin(0.5)
          .setDepth(72);
        scene.tweens.add({
          targets: debris,
          x: debris.x + Phaser.Math.Between(-42, 42),
          y: debris.y - Phaser.Math.Between(28, 55),
          alpha: 0,
          scale: 0.25,
          angle: Phaser.Math.Between(-120, 120),
          duration: Phaser.Math.Between(360, 560),
          ease: "Cubic.easeOut",
          onComplete: () => debris.destroy(),
        });
      }
      burstIndex += 1;
    },
  });
  return { container, timer };
}
