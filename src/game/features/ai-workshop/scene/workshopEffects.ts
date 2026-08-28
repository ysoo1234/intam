import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import {
  applyWorkshopCustomerVisualTransform,
  syncWorkshopNormalizedCustomerShadow,
} from "./workshopCustomerVisual";

export function animateWorkshopCustomerArtworkJoy(
  scene: Phaser.Scene,
  customerArt: Phaser.GameObjects.Image | undefined,
  customerShadow: Phaser.GameObjects.Ellipse | undefined,
  happyTexture: string,
  requestId: string,
) {
  if (!customerArt) return;
  if (scene.textures.exists(happyTexture)) {
    customerArt.setTexture(happyTexture).setFlipX(true);
    const visualTransform = applyWorkshopCustomerVisualTransform(
      customerArt,
      requestId,
    );
    syncWorkshopNormalizedCustomerShadow(
      customerShadow,
      customerArt,
      visualTransform,
    );
  }
  const restingY = customerArt.y;
  scene.tweens.add({
    targets: customerArt,
    y: restingY - 15,
    angle: -3,
    duration: 150,
    yoyo: true,
    repeat: 2,
  });
}

export function createCustomerJoyEffect(
  scene: Phaser.Scene,
  customerContainer: Phaser.GameObjects.Container | undefined,
) {
  const centerX = customerContainer?.x ?? AI_WORKSHOP_LAYOUT.customerStage.x;
  const centerY =
    (customerContainer?.y ?? AI_WORKSHOP_LAYOUT.customerStage.y) - 64;
  const colors = [0xff7f88, 0xf5bd46, 0x70cfaa, 0x70c6d5];

  [0, 110].forEach((delay, index) => {
    const halo = scene.add
      .circle(centerX, centerY, 58 + index * 12, colors[index + 1], 0)
      .setStrokeStyle(5, colors[index + 1], 0.7)
      .setScale(0.55)
      .setDepth(17);
    scene.tweens.add({
      targets: halo,
      scale: 1.35,
      alpha: 0,
      duration: 720,
      delay,
      ease: "Cubic.easeOut",
      onComplete: () => halo.destroy(),
    });
  });

  const symbols = ["♥", "★", "✦", "✿"];
  for (let index = 0; index < 18; index += 1) {
    const angle =
      (Math.PI * 2 * index) / 18 + Phaser.Math.FloatBetween(-0.14, 0.14);
    const radius = Phaser.Math.Between(58, 108);
    const color = colors[index % colors.length];
    const symbol = scene.add
      .text(
        centerX + Math.cos(angle) * 18,
        centerY + Math.sin(angle) * 12,
        symbols[index % symbols.length],
        {
          color: Phaser.Display.Color.IntegerToColor(color).rgba,
          fontFamily: FONT_FAMILY,
          fontSize: `${Phaser.Math.Between(17, 29)}px`,
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5)
      .setScale(0.55)
      .setDepth(80);
    scene.tweens.add({
      targets: symbol,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius - Phaser.Math.Between(20, 48),
      angle: Phaser.Math.Between(-25, 25),
      scale: 1.35,
      alpha: 0,
      duration: Phaser.Math.Between(760, 1_080),
      delay: index * 22,
      ease: "Cubic.easeOut",
      onComplete: () => symbol.destroy(),
    });
  }
}

export function createWorkshopSparkBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
) {
  for (let index = 0; index < 14; index += 1) {
    const angle = (Math.PI * 2 * index) / 14;
    const sparkle = scene.add
      .text(x, y, index % 3 === 0 ? "★" : "✦", {
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        fontFamily: FONT_FAMILY,
        fontSize: `${Phaser.Math.Between(13, 25)}px`,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: sparkle,
      x: x + Math.cos(angle) * Phaser.Math.Between(45, 100),
      y: y + Math.sin(angle) * Phaser.Math.Between(35, 85),
      angle: 180,
      alpha: 0,
      scale: 0.3,
      duration: 620,
      onComplete: () => sparkle.destroy(),
    });
  }
}

export function createWorkshopCoinBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
) {
  for (let index = 0; index < 12; index += 1) {
    const coin = scene.add
      .text(x, y, "●", {
        color: "#ffd45f",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        stroke: "#a65c28",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(75);
    scene.tweens.add({
      targets: coin,
      x: 920 + Phaser.Math.Between(-35, 35),
      y: 52 + Phaser.Math.Between(-12, 12),
      scale: 0.45,
      angle: 360,
      duration: 650 + index * 40,
      delay: index * 35,
      ease: "Cubic.easeIn",
      onComplete: () => coin.destroy(),
    });
  }
}
