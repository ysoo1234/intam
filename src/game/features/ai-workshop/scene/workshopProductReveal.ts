import Phaser from "phaser";
import type { WorkshopProduct } from "../../../content/aiWorkshop";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { createWorkshopProductArt } from "./workshopProducts";

/**
 * The "완성!" moment after the star catch: the finished product rises over the
 * workshop on a turning burst of light, a ribbon names it, sparkles twinkle,
 * and then it shrinks and flies into Midi's hands.
 */
export const WORKSHOP_REVEAL = {
  center: { x: 640, y: 300 },
  artSize: 128,
  depth: 95,
  popMs: 420,
  holdMs: 480,
  /** When the flash goes off over the product as it pops up. */
  flashMs: 300,
  flyMs: 380,
  rays: { count: 12, inner: 54, outer: 230, color: 0xffe08a },
} as const;

type Point = Readonly<{ x: number; y: number }>;

export function playWorkshopProductReveal(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  /** Where the product lands, read when it starts to fly (Midi may have moved). */
  getTarget: () => Point,
  onDone: () => void,
) {
  const { center, artSize, depth, popMs, holdMs, flyMs, rays } = WORKSHOP_REVEAL;
  const objects: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(object: T) => { objects.push(object); return object; };
  let finished = false;
  const cleanUp = () => {
    scene.tweens.killTweensOf(objects);
    objects.forEach((object) => object.destroy());
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanUp();
    onDone();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { finished = true; cleanUp(); });

  // A soft veil so the reveal reads as a moment of its own.
  const veil = keep(scene.add.graphics().setDepth(depth).setAlpha(0));
  veil.fillStyle(0x1d3a44, 1).fillRect(0, 0, 1280, 720);
  scene.tweens.add({ targets: veil, alpha: 0.42, duration: popMs * 0.6, ease: "Sine.easeOut" });

  // Turning light rays behind the product.
  const burst = keep(scene.add.graphics({ x: center.x, y: center.y }).setDepth(depth + 1));
  for (let index = 0; index < rays.count; index += 1) {
    const angle = (Math.PI * 2 * index) / rays.count;
    const half = Math.PI / rays.count / 2;
    burst.fillStyle(rays.color, index % 2 === 0 ? 0.5 : 0.3);
    burst.fillTriangle(
      Math.cos(angle - half) * rays.inner, Math.sin(angle - half) * rays.inner,
      Math.cos(angle) * rays.outer, Math.sin(angle) * rays.outer,
      Math.cos(angle + half) * rays.inner, Math.sin(angle + half) * rays.inner,
    );
  }
  burst.setBlendMode(Phaser.BlendModes.ADD).setScale(0.2).setAlpha(0);
  scene.tweens.add({ targets: burst, scale: 1, alpha: 1, duration: popMs, ease: "Back.easeOut" });
  scene.tweens.add({ targets: burst, angle: 90, duration: popMs + holdMs + flyMs, ease: "Linear" });

  // A warm halo, with a soft cream disc right behind the product so it stays crisp.
  const halo = keep(scene.add.graphics({ x: center.x, y: center.y }).setDepth(depth + 2));
  [[124, 0.14], [104, 0.2]].forEach(([radius, alpha]) => halo.fillStyle(0xffe9a8, alpha).fillCircle(0, 0, radius));
  halo.fillStyle(0xfffaf0, 0.92).fillCircle(0, 0, 88);
  halo.lineStyle(4, 0xffd36b, 1).strokeCircle(0, 0, 88);
  halo.setScale(0);
  scene.tweens.add({ targets: halo, scale: 1, duration: popMs, ease: "Back.easeOut" });
  scene.tweens.add({ targets: halo, scale: 1.08, duration: 420, yoyo: true, repeat: -1, delay: popMs, ease: "Sine.easeInOut" });

  // The product already turned real on the crafting panel (two thirds of the
  // way), so it pops up as itself here, with a flash.
  const art = createWorkshopProductArt(scene, product, artSize);
  const item = keep(scene.add.container(center.x, center.y + 40, [art]).setDepth(depth + 3).setScale(0).setAngle(-12));
  const flash = keep(scene.add.circle(center.x, center.y, artSize * 0.62, 0xffffff, 0).setDepth(depth + 3.5));
  scene.time.delayedCall(WORKSHOP_REVEAL.flashMs, () => {
    scene.tweens.add({ targets: flash, fillAlpha: { from: 0.9, to: 0 }, scale: { from: 0.6, to: 1.25 }, duration: 320, ease: "Cubic.easeOut" });
  });
  scene.tweens.add({ targets: item, y: center.y, scale: 1, angle: 0, duration: popMs, ease: "Back.easeOut" });
  scene.tweens.add({ targets: item, scale: 1.05, duration: 380, yoyo: true, repeat: -1, delay: popMs, ease: "Sine.easeInOut" });

  // Ribbon with the product's name.
  const label = scene.add.text(0, 0, `${product.label} 완성!`, {
    fontFamily: FONT_FAMILY, fontSize: "30px", fontStyle: "bold", color: "#ffffff",
    stroke: "#9a5a12", strokeThickness: 6,
  }).setOrigin(0.5).setResolution(3);
  const ribbonWidth = Math.max(260, label.width + 70);
  const ribbon = scene.add.graphics();
  ribbon.fillStyle(0x000000, 0.16).fillRoundedRect(-ribbonWidth / 2 + 3, -26 + 5, ribbonWidth, 54, 27);
  ribbon.fillStyle(0xf2a93b, 1).fillRoundedRect(-ribbonWidth / 2, -26, ribbonWidth, 54, 27);
  ribbon.fillStyle(0xffd36b, 1).fillRoundedRect(-ribbonWidth / 2 + 4, -23, ribbonWidth - 8, 26, 14);
  ribbon.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(-ribbonWidth / 2, -26, ribbonWidth, 54, 27);
  const banner = keep(scene.add.container(center.x, center.y + 132, [ribbon, label]).setDepth(depth + 4).setScale(0.4).setAlpha(0));
  scene.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 300, delay: popMs * 0.55, ease: "Back.easeOut" });

  // Sparkles twinkle around the product in a ring.
  for (let index = 0; index < 10; index += 1) {
    const angle = (Math.PI * 2 * index) / 10 + 0.3;
    const radius = 108 + (index % 3) * 18;
    const star = keep(scene.add.star(
      center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius * 0.82,
      4, 3, index % 2 ? 9 : 14, index % 3 === 0 ? 0xffffff : 0xffe27a,
    ).setDepth(depth + 3).setScale(0).setBlendMode(Phaser.BlendModes.ADD));
    scene.tweens.add({ targets: star, scale: 1, angle: 90, duration: 260, delay: popMs * 0.4 + index * 45,
      yoyo: true, hold: 120, repeat: 1, repeatDelay: 140, ease: "Sine.easeOut" });
  }
  scene.cameras.main.flash(140, 255, 246, 214);

  // Then it shrinks into Midi's hands while the light fades.
  scene.time.delayedCall(popMs + holdMs, () => {
    if (finished) return;
    scene.tweens.killTweensOf(item);
    const target = getTarget();
    scene.tweens.add({ targets: veil, alpha: 0, duration: flyMs, ease: "Sine.easeIn" });
    scene.tweens.add({ targets: [burst, halo, banner], alpha: 0, scale: 0.6, duration: flyMs * 0.8, ease: "Sine.easeIn" });
    scene.tweens.add({
      targets: item, x: target.x, y: target.y, scale: 110 / artSize, angle: 360,
      duration: flyMs, ease: "Cubic.easeIn", onComplete: finish,
    });
  });
}
