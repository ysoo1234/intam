import Phaser from "phaser";
import { PAGE_BACKDROPS } from "../runtime/pageBackdrop";
import type { SceneKey } from "../scenes/sceneKeys";

/**
 * The "door" between the village and the places: the view closes in a
 * circle onto Midi, into the next place's own colour (the same colour as
 * the page around the game there), and the next place opens out of that
 * colour in a growing circle. No white flash, no hard cut.
 *
 * Drawn as one very thick ring around the open circle (so it needs no masks
 * and works on every renderer), with a soft light rim on the edge.
 */
const DEPTH = 90_000;
const FAR = Math.hypot(1_280, 720) + 40;
const RING = 3_200;
export const IRIS_MS = { close: 460, open: 560 } as const;

/** The colour a scene sits in: the middle of its page backdrop. */
export function sceneColor(sceneKey: SceneKey) {
  return Phaser.Display.Color.HexStringToColor(PAGE_BACKDROPS[sceneKey].middle).color;
}

function drawIris(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number) {
  graphics.clear();
  graphics.lineStyle(RING, color, 1);
  graphics.strokeCircle(x, y, radius + RING / 2);
  if (radius > 2 && radius < FAR - 4) {
    // A soft light rim, like the edge of a magic door.
    graphics.lineStyle(10, 0xffffff, 0.22);
    graphics.strokeCircle(x, y, radius + 5);
    graphics.lineStyle(3, 0xffffff, 0.5);
    graphics.strokeCircle(x, y, radius + 1.5);
  }
}

/** Closes the view onto (x, y) in `color`, then runs `onClosed`. */
export function irisClose(
  scene: Phaser.Scene,
  options: Readonly<{ x: number; y: number; color: number; calm?: boolean }>,
  onClosed: () => void,
) {
  const graphics = scene.add.graphics().setDepth(DEPTH);
  const state = { radius: FAR };
  drawIris(graphics, options.x, options.y, state.radius, options.color);
  scene.tweens.add({
    targets: state,
    radius: 0,
    duration: options.calm ? 1 : IRIS_MS.close,
    ease: "Cubic.easeIn",
    onUpdate: () => drawIris(graphics, options.x, options.y, state.radius, options.color),
    onComplete: () => {
      drawIris(graphics, options.x, options.y, 0, options.color);
      onClosed();
    },
  });
}

/** Opens the view from `color` in a growing circle around (x, y). */
export function irisOpen(
  scene: Phaser.Scene,
  options: Readonly<{ x?: number; y?: number; color: number; calm?: boolean }>,
) {
  const x = options.x ?? 640;
  const y = options.y ?? 360;
  const graphics = scene.add.graphics().setDepth(DEPTH);
  const state = { radius: 0 };
  drawIris(graphics, x, y, 0, options.color);
  scene.tweens.add({
    targets: state,
    radius: FAR,
    duration: options.calm ? 1 : IRIS_MS.open,
    delay: options.calm ? 0 : 60,
    ease: "Cubic.easeOut",
    onUpdate: () => drawIris(graphics, x, y, state.radius, options.color),
    onComplete: () => graphics.destroy(),
  });
}
