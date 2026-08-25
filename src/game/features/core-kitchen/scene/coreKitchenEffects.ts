import Phaser from "phaser";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import { COLORS } from "../../../core/visual/theme";

export function updateCoreKitchenPlayerFacing(
  scene: Phaser.Scene,
  direction: Phaser.Math.Vector2,
  playerFacing: PlayerFacing,
  playerSprite?: Phaser.GameObjects.Image,
) {
    let next: PlayerFacing;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      next = direction.x < 0 ? "left" : "right";
    } else {
      next = direction.y < 0 ? "back" : "front";
    }
    if (next === playerFacing) return playerFacing;
        const texture = `player-${next}`;
    if (scene.textures.exists(texture)) {
      playerSprite?.setTexture(texture).setDisplaySize(58, 75);
    }
  
  return next;
}

export function animateCoreKitchenPlayer(
  scene: Phaser.Scene,
  playerSprite: Phaser.GameObjects.Image | undefined,
  playerShadow: Phaser.GameObjects.Ellipse | undefined,
  isMoving: boolean,
) {
    if (!playerSprite || !playerShadow) return;
    const wave = Math.sin(scene.time.now / (isMoving ? 82 : 330));
    playerSprite.y = -2 - Math.abs(wave) * (isMoving ? 3.5 : 1.4);
    playerSprite.angle = isMoving ? wave * 2 : wave * 0.4;
    playerShadow.setScale(1 - Math.abs(wave) * 0.08, 1);
  
}

export function createCoreKitchenPuff(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
) {
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      const puff = scene.add
        .circle(x, y, Phaser.Math.Between(5, 11), color, 0.82)
        .setDepth(42);
      scene.tweens.add({
        targets: puff,
        x: x + Math.cos(angle) * Phaser.Math.Between(25, 65),
        y: y + Math.sin(angle) * Phaser.Math.Between(20, 50),
        alpha: 0,
        scale: 0.3,
        duration: 480,
        onComplete: () => puff.destroy(),
      });
    }
  
}

export function celebrateCoreKitchen(
  scene: Phaser.Scene,
  full: boolean,
  combo: number,
) {
    const amount = full ? 38 : combo >= 2 ? 20 : 12;
    const colors = [COLORS.yellow, COLORS.mint, COLORS.coral, COLORS.blue];
    for (let i = 0; i < amount; i += 1) {
      const confetti = scene.add
        .circle(
          Phaser.Math.Between(300, 980),
          Phaser.Math.Between(270, 390),
          Phaser.Math.Between(4, 9),
          colors[i % colors.length],
        )
        .setDepth(43);
      scene.tweens.add({
        targets: confetti,
        x: confetti.x + Phaser.Math.Between(-170, 170),
        y: 760,
        alpha: 0,
        angle: Phaser.Math.Between(-280, 280),
        duration: Phaser.Math.Between(900, 1700),
        ease: "Quad.easeIn",
        onComplete: () => confetti.destroy(),
      });
    }
    if (full) scene.cameras.main.flash(250, 255, 245, 210);
  
}

export function vibrateDevice(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  
}
