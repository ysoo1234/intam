import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import type { PlayerFacing } from "./playerFacing";

/**
 * Textbook Midi (v2) as the walking player. Every frame is drawn at one shared
 * scale (2x of the village height), so frames of different widths, like the
 * leaning walk poses, keep Midi the same size when they swap.
 */
export const PLAYER_TEXTURES = {
  front: "player-front",
  blink: "player-blink",
  back: "player-back",
  left: "player-left",
  right: "player-right",
  moveLeft: "player-move-left",
  moveRight: "player-move-right",
  glideFront: "player-glide-front",
  glideBack: "player-glide-back",
} as const;

export type PlayerTexture = (typeof PLAYER_TEXTURES)[keyof typeof PLAYER_TEXTURES];

/** Source frames are 2x; the front frame is 226 px tall. */
const PLAYER_SOURCE_HEIGHT = 226;
// The feet sit this far (in source pixels) below the sprite's pivot, as before.
const PLAYER_FEET_BELOW_PIVOT = 33;

export function preloadPlayerTextures(scene: Phaser.Scene) {
  const art = GAME_ASSETS.characters.player;
  const files: Record<PlayerTexture, string> = {
    [PLAYER_TEXTURES.front]: art.front,
    [PLAYER_TEXTURES.blink]: art.blink,
    [PLAYER_TEXTURES.back]: art.back,
    [PLAYER_TEXTURES.left]: art.left,
    [PLAYER_TEXTURES.right]: art.right,
    [PLAYER_TEXTURES.moveLeft]: art.moveLeft,
    [PLAYER_TEXTURES.moveRight]: art.moveRight,
    [PLAYER_TEXTURES.glideFront]: art.glideFront,
    [PLAYER_TEXTURES.glideBack]: art.glideBack,
  };
  for (const [key, file] of Object.entries(files)) {
    if (!scene.textures.exists(key)) scene.load.image(key, file);
  }
}

/**
 * Texture for a facing. Midi floats rather than walks, so while moving every
 * direction leans into the glide: sideways, toward the viewer, or away.
 */
export function getPlayerTexture(facing: PlayerFacing, moving = false): PlayerTexture {
  if (facing === "left") return moving ? PLAYER_TEXTURES.moveLeft : PLAYER_TEXTURES.left;
  if (facing === "right") return moving ? PLAYER_TEXTURES.moveRight : PLAYER_TEXTURES.right;
  if (facing === "back") return moving ? PLAYER_TEXTURES.glideBack : PLAYER_TEXTURES.back;
  return moving ? PLAYER_TEXTURES.glideFront : PLAYER_TEXTURES.front;
}

// A diagonal must lean clearly toward the other axis before Midi turns, so
// moving at about 45 degrees doesn't flicker between the glide and side poses.
const FACING_SWITCH_BIAS = 1.4;

/** Picks the facing for a movement direction, sticking with the current axis on diagonals. */
export function choosePlayerFacing(
  direction: Readonly<{ x: number; y: number }>,
  current: PlayerFacing,
): PlayerFacing {
  const ax = Math.abs(direction.x);
  const ay = Math.abs(direction.y);
  const wasSideways = current === "left" || current === "right";
  const sideways = wasSideways ? ax * FACING_SWITCH_BIAS >= ay : ax > ay * FACING_SWITCH_BIAS;
  if (sideways) return direction.x < 0 ? "left" : "right";
  return direction.y < 0 ? "back" : "front";
}

/**
 * Turning to a new pose gives a tiny squash-and-settle, so the change of
 * silhouette reads as Midi turning rather than the picture jumping.
 */
export function settlePlayerTurn(sprite: Phaser.GameObjects.Image) {
  const scene = sprite.scene;
  const { scaleX, scaleY } = sprite;
  scene.tweens.killTweensOf(sprite);
  sprite.setScale(scaleX * 0.9, scaleY * 1.05);
  scene.tweens.add({ targets: sprite, scaleX, scaleY, duration: 140, ease: "Back.easeOut" });
}

/**
 * Shows `key` at `displayHeight` (the front frame's height on screen), keeping
 * the frame's own proportions and the feet on the same spot.
 */
export function applyPlayerTexture(
  sprite: Phaser.GameObjects.Image,
  key: string,
  displayHeight: number,
) {
  if (!sprite.scene.textures.exists(key)) return sprite;
  if (sprite.texture.key !== key) sprite.setTexture(key);
  const scale = displayHeight / PLAYER_SOURCE_HEIGHT;
  return sprite
    .setScale(scale)
    .setFlipX(false)
    .setOrigin(0.5, 1 - PLAYER_FEET_BELOW_PIVOT / sprite.height);
}

/**
 * Blinks every few seconds while `canBlink` says Midi is facing front and idle.
 * Returns a stop function.
 */
export function startPlayerBlink(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Image,
  canBlink: () => boolean,
  displayHeight: number,
) {
  let stopped = false;
  const schedule = () => {
    scene.time.delayedCall(Phaser.Math.Between(2_400, 4_800), () => {
      if (stopped || !sprite.active) return;
      if (canBlink() && sprite.texture.key === PLAYER_TEXTURES.front) {
        applyPlayerTexture(sprite, PLAYER_TEXTURES.blink, displayHeight);
        scene.time.delayedCall(120, () => {
          if (sprite.active && sprite.texture.key === PLAYER_TEXTURES.blink) {
            applyPlayerTexture(sprite, PLAYER_TEXTURES.front, displayHeight);
          }
        });
      }
      schedule();
    });
  };
  schedule();
  return () => {
    stopped = true;
  };
}
