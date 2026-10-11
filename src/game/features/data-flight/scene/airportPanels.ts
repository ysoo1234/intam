import Phaser from "phaser";
import { GAME_CHROME_TEXTURES } from "../../../core/visual/gameChrome";

/**
 * Airport pop-ups match the village's shared UI: a cream card like the start
 * screen, and the cream status capsule (a nine-slice of the status-bar art).
 */
const CAPSULE_SLICE = 110;

/**
 * A cream card in the start-card style, `width` x `height` on screen: a soft
 * wooden frame, a cream page and a thin teal line inside. Drawn in code so
 * it stays even at any size (the start-card art distorts when stretched).
 */
export function createAirportCardPanel(scene: Phaser.Scene, width: number, height: number) {
  const g = scene.add.graphics();
  const x = -width / 2;
  const y = -height / 2;
  g.fillStyle(0x163f4a, 0.22).fillRoundedRect(x + 4, y + 9, width, height, 38);
  g.fillStyle(0xeed9b7, 1).fillRoundedRect(x, y, width, height, 38);
  g.lineStyle(2, 0xd8bf96, 1).strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 37);
  g.fillStyle(0xfbf7ec, 1).fillRoundedRect(x + 14, y + 14, width - 28, height - 28, 28);
  g.lineStyle(2.5, 0x5f9ea0, 1).strokeRoundedRect(x + 24, y + 24, width - 48, height - 48, 22);
  return g;
}

/** A cream capsule in the status-bar style, `width` x `height` on screen. */
export function createAirportCapsulePanel(scene: Phaser.Scene, width: number, height: number) {
  const source = scene.textures.get(GAME_CHROME_TEXTURES.statusPanel).getSourceImage();
  const scale = height / source.height;
  return scene.add
    .nineslice(0, 0, GAME_CHROME_TEXTURES.statusPanel, undefined, width / scale, source.height,
      CAPSULE_SLICE, CAPSULE_SLICE, 0, 0)
    .setScale(scale);
}
