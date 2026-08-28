import Phaser from "phaser";
import type { WorkshopProduct } from "../../../content/aiWorkshop";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import { createWorkshopProductArt } from "./workshopProducts";

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
      AI_WORKSHOP_LAYOUT.workbench.interactionY - 92,
    )
    .setDepth(AI_WORKSHOP_LAYOUT.workbench.depth + 1);
  const machine = scene.add
    .image(0, 0, "workshop-crafting-machine")
    .setDisplaySize(300, 174);
  const productArt = createWorkshopProductArt(scene, product, 58).setY(-17);
  const leftSpark = scene.add
    .text(-50, -28, "✦", {
      color: "#66dce3",
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const rightSpark = scene.add
    .text(50, -28, "✦", {
      color: "#ffd66d",
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setAlpha(0.25);
  container.add([machine, productArt, leftSpark, rightSpark]);
  scene.tweens.add({
    targets: productArt,
    y: { from: -14, to: -21 },
    angle: { from: -2, to: 2 },
    duration: 360,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: leftSpark,
    alpha: { from: 0.2, to: 1 },
    scale: { from: 0.65, to: 1.2 },
    angle: { from: -10, to: 10 },
    duration: 280,
    yoyo: true,
    repeat: -1,
    repeatDelay: 120,
    ease: "Quad.easeInOut",
  });
  scene.tweens.add({
    targets: rightSpark,
    alpha: { from: 0.2, to: 1 },
    scale: { from: 0.65, to: 1.2 },
    angle: { from: 10, to: -10 },
    duration: 280,
    yoyo: true,
    repeat: -1,
    repeatDelay: 120,
    delay: 140,
    ease: "Quad.easeInOut",
  });

  const timer = scene.time.addEvent({
    delay: 540,
    loop: true,
    callback: () => {
      if (!isCrafting()) return;
      scene.tweens.add({
        targets: machine,
        alpha: { from: 0.86, to: 1 },
        duration: 150,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    },
  });
  return { container, timer };
}
