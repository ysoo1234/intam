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
    customerArt.setTexture(happyTexture).setFlipX(false);
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

/** A drawn gold coin (rim, face, a "₩"-free shine), made once per game. */
/** The AI coin artwork (loaded with the workshop's assets). */
export const WORKSHOP_COIN_TEXTURE = "workshop-coin";
const COIN_SIZE = 36;

/**
 * Coins hop out of the hand-over in a small fountain, hang for a moment,
 * then fly one after another into the 수입 counter. Each landing makes the
 * counter bounce and gives a soft gold pop; no spinning, no trails.
 */
export function createWorkshopCoinBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  counter?: Phaser.GameObjects.Text,
  /** One coin flies for every 10 earned. */
  count = 6,
) {
  if (!scene.textures.exists(WORKSHOP_COIN_TEXTURE)) return;
  const bounds = counter?.getBounds();
  const target = bounds ? { x: bounds.x + 26, y: bounds.centerY } : { x: 940, y: 46 };
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const baseScale = COIN_SIZE / scene.textures.get(WORKSHOP_COIN_TEXTURE).getSourceImage().width;
  let landed = 0;

  for (let index = 0; index < count; index += 1) {
    const coin = scene.add.image(x, y, WORKSHOP_COIN_TEXTURE).setDepth(75).setScale(0);
    // 1) Hop out in a fan: left to right, the middle ones a little higher.
    const spread = (index - (count - 1) / 2) * Math.min(30, 200 / Math.max(1, count));
    const peakX = x + spread + Phaser.Math.Between(-6, 6);
    const peakY = y - 74 - Math.max(0, 1 - Math.abs(spread) / 110) * 26 + Phaser.Math.Between(-6, 6);
    const hopDelay = index * 45;
    scene.tweens.add({
      targets: coin, x: peakX, y: peakY, scale: baseScale, angle: Phaser.Math.Between(-12, 12),
      delay: hopDelay, duration: 320, ease: "Back.easeOut",
    });
    // A tiny settle while they hang in the air.
    if (!reducedMotion) {
      scene.tweens.add({
        targets: coin, y: peakY + 6, delay: hopDelay + 320, duration: 180, yoyo: true, ease: "Sine.easeInOut",
      });
    }
    // 2) Fly into the counter, one after another.
    scene.tweens.add({
      targets: coin, x: target.x, y: target.y, scale: baseScale * 0.55, angle: 0,
      delay: 620 + index * Math.min(85, 520 / Math.max(1, count)), duration: 460, ease: "Cubic.easeIn",
      onComplete: () => {
        coin.destroy();
        landed += 1;
        const pop = scene.add.circle(target.x, target.y, 12, 0xffe27a, 0.85)
          .setDepth(76).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: pop, scale: 2.4, alpha: 0, duration: 260, onComplete: () => pop.destroy() });
        if (counter?.active) {
          scene.tweens.killTweensOf(counter);
          counter.setScale(1);
          scene.tweens.add({ targets: counter, scale: landed === count ? 1.22 : 1.1, duration: 90, yoyo: true, ease: "Sine.easeOut" });
        }
      },
    });
  }
}
