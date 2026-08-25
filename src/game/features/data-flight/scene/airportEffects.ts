import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";

export function createAirportBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
) {
  for (let index = 0; index < 10; index += 1) {
    const angle = (Math.PI * 2 * index) / 10;
    const particle = scene.add
      .circle(x, y, Phaser.Math.Between(4, 9), color, 0.95)
      .setDepth(45)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * Phaser.Math.Between(35, 75),
      y: y + Math.sin(angle) * Phaser.Math.Between(30, 65),
      alpha: 0,
      scale: 0.25,
      duration: 430,
      onComplete: () => particle.destroy(),
    });
  }
}

export function createAirportFeverSpark(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Container | undefined,
  elapsedMs: number,
  feverColors: readonly number[],
) {
  if (!player) return;
  const color =
    feverColors[Math.floor(elapsedMs / 70) % feverColors.length];
  const trail = scene.add
    .rectangle(
      player.x - Phaser.Math.Between(55, 95),
      player.y + Phaser.Math.Between(-42, 42),
      Phaser.Math.Between(28, 62),
      Phaser.Math.Between(4, 10),
      color,
      0.9,
    )
    .setDepth(18)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: trail,
    x: trail.x - Phaser.Math.Between(100, 190),
    scaleX: 1.8,
    alpha: 0,
    duration: Phaser.Math.Between(280, 480),
    ease: "Quad.easeOut",
    onComplete: () => trail.destroy(),
  });

  if (Math.floor(elapsedMs / 70) % 3 === 0) {
    const sparkle = scene.add
      .text(
        player.x + Phaser.Math.Between(-70, 70),
        player.y + Phaser.Math.Between(-55, 55),
        "✦",
        {
          color: Phaser.Display.Color.IntegerToColor(color).rgba,
          fontFamily: FONT_FAMILY,
          fontSize: `${Phaser.Math.Between(18, 31)}px`,
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5)
      .setDepth(43)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: sparkle,
      y: sparkle.y - Phaser.Math.Between(25, 55),
      angle: 120,
      scale: 1.5,
      alpha: 0,
      duration: 520,
      onComplete: () => sparkle.destroy(),
    });
  }
}
