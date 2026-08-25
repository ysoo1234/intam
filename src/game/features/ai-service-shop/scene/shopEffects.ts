import Phaser from "phaser";
import { COLORS } from "../../../core/visual/theme";

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function createShopPuff(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
) {
  for (let i = 0; i < 9; i += 1) {
    const angle = (Math.PI * 2 * i) / 9;
    const puff = scene.add
      .circle(x, y, Phaser.Math.Between(6, 13), color, 0.85)
      .setDepth(41);
    scene.tweens.add({
      targets: puff,
      x: x + Math.cos(angle) * Phaser.Math.Between(35, 75),
      y: y + Math.sin(angle) * Phaser.Math.Between(25, 60),
      alpha: 0,
      scale: 0.35,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => puff.destroy(),
    });
  }
}

export function celebrateShop(
  scene: Phaser.Scene,
  full: boolean,
  combo: number,
) {
  const amount = full ? 42 : combo >= 2 ? 20 : 12;
  for (let i = 0; i < amount; i += 1) {
    const colors = [
      COLORS.yellow,
      COLORS.mint,
      COLORS.coral,
      COLORS.blue,
    ];
    const confetti = scene.add
      .circle(
        Phaser.Math.Between(300, 980),
        Phaser.Math.Between(250, 390),
        Phaser.Math.Between(5, 10),
        colors[i % colors.length],
      )
      .setDepth(40);
    scene.tweens.add({
      targets: confetti,
      x: confetti.x + Phaser.Math.Between(-180, 180),
      y: 760,
      angle: Phaser.Math.Between(-300, 300),
      alpha: 0,
      duration: Phaser.Math.Between(1000, 1900),
      ease: "Quad.easeIn",
      onComplete: () => confetti.destroy(),
    });
  }
  if (full) scene.cameras.main.flash(260, 255, 245, 210);
}
