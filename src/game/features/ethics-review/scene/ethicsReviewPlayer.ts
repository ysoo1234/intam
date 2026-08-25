import Phaser from "phaser";
import { COLORS } from "../../../core/visual/theme";

export type EthicsReviewPlayer = Readonly<{
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
}>;

export function createEthicsReviewPlayer(scene: Phaser.Scene): EthicsReviewPlayer {
  const aura = scene.add
    .circle(0, 8, 49, COLORS.blue, 0.12)
    .setStrokeStyle(3, COLORS.blue, 0.32);
  const shadow = scene.add.ellipse(0, 39, 72, 18, COLORS.ink, 0.23);
  const textureKey = scene.textures.exists("player-front")
    ? "player-front"
    : "player-fallback";
  const sprite = scene.add
    .image(0, 0, textureKey)
    .setDisplaySize(82, 106)
    .setOrigin(0.5, 0.84);
  const container = scene.add
    .container(640, 584, [aura, shadow, sprite])
    .setDepth(62);
  scene.tweens.add({
    targets: sprite,
    y: -6,
    angle: 1.2,
    duration: 720,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: aura,
    scale: 1.14,
    alpha: 0.32,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: shadow,
    scaleX: 0.84,
    alpha: 0.15,
    duration: 720,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return { container, sprite };
}
