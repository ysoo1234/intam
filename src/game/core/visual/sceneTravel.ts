import Phaser from "phaser";
import { configureSceneCamera } from "../runtime/configureSceneCamera";
import { holdPageBackdrop, PAGE_BACKDROPS } from "../runtime/pageBackdrop";
import { PLAYER_TEXTURES } from "../player/playerSprite";
import { SCENE_KEYS, type SceneKey } from "../scenes/sceneKeys";
import { FONT_FAMILY } from "./theme";

/**
 * The trip from the village into a place. The village fades out into its
 * green; on that green "OO 가는 중..." and a bar along the bottom fade in, and
 * Midi runs along the tip of a bar along the bottom. The bar only creeps
 * while the place loads and is built; then it eases in, speeds up and
 * settles into full (1.8 s), the trip fades out and the place fades in.
 * That is the first visit only (when the pictures really load); after that
 * the green simply fades into the place.
 *
 * Leaving a place is a plain fade into the place's own colour; the village
 * then fades in out of that same colour.
 *
 * Everything here moves on the game's render step and real time, because a
 * scene's own clock and tweens do not run while it loads.
 */
const DEPTH = 100_000;
const FIRST_TRIP_MS = 1_800;
const LEAVE_FADE_MS = 280;
/** The village's fade into green before the trip. */
export const TRIP_FADE_OUT_MS = 300;
const UI_FADE_MS = 240;
const REVEAL_MS = 360;
const BAR = { left: 290, width: 700, y: 600, height: 22 } as const;
const MIDI_HEIGHT = 104;

let pendingTrip: string | null = null;
const visited = new Set<string>();

const hex = (value: string) => Phaser.Display.Color.HexStringToColor(value);

/** The colour a scene sits in (the middle of its page backdrop). */
export function sceneRgb(sceneKey: SceneKey): [number, number, number] {
  const color = hex(PAGE_BACKDROPS[sceneKey].middle);
  return [color.red, color.green, color.blue];
}

/** Called by the village right before it starts a place. */
export function markSceneTrip(sceneKey: string) {
  pendingTrip = sceneKey;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Call at the end of a place's `preload()`. Plays the trip when the place
 * was entered from the village; on a restart it only fades the place in.
 */
export function startSceneTravel(scene: Phaser.Scene, renderScale: number, label: string) {
  const key = scene.sys.settings.key as SceneKey;
  // Until the place draws its first frame the canvas shows the camera's
  // background: make that the place's own colour (or the trip's green), not
  // the page's default blue. Matters on 처음부터 다시.
  scene.cameras.main.setBackgroundColor(PAGE_BACKDROPS[pendingTrip === key ? SCENE_KEYS.world : key].middle);
  if (pendingTrip !== key) {
    scene.events.once(Phaser.Scenes.Events.CREATE, () => scene.cameras.main.fadeIn(260, ...sceneRgb(key)));
    return;
  }
  pendingTrip = null;
  const firstVisit = !visited.has(key);
    visited.add(key);
  configureSceneCamera(scene, renderScale);
  holdPageBackdrop(SCENE_KEYS.world);

  const green = hex(PAGE_BACKDROPS[SCENE_KEYS.world].middle).color;
  // Swallows clicks so the start screen underneath can't be pressed early.
  const cover = scene.add.rectangle(640, 360, 1280, 720, green, 1).setDepth(DEPTH).setInteractive();
  const track = scene.add.graphics().setDepth(DEPTH + 1);
  track.fillStyle(0x5f7f45, 0.28).fillRoundedRect(BAR.left, BAR.y + 4, BAR.width, BAR.height, BAR.height / 2);
  track.fillStyle(0xfffdf6, 0.5).fillRoundedRect(BAR.left, BAR.y, BAR.width, BAR.height, BAR.height / 2);
  track.lineStyle(3, 0xfffdf6, 0.95).strokeRoundedRect(BAR.left, BAR.y, BAR.width, BAR.height, BAR.height / 2);
  const fill = scene.add.graphics().setDepth(DEPTH + 2);
  const shadow = scene.add.ellipse(BAR.left, BAR.y + 2, 46, 10, 0x3f5c2c, 0.22).setDepth(DEPTH + 3);
  const midi = scene.add.image(BAR.left, BAR.y, PLAYER_TEXTURES.moveRight).setOrigin(0.5, 0.96).setDepth(DEPTH + 4);
  midi.setScale(MIDI_HEIGHT / Math.max(1, midi.height)).setAngle(5);
  const baseLabel = label.replace(/\.+$/, "");
  const text = scene.add
    .text(640, 318, `${baseLabel}...`, {
      color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "40px", fontStyle: "bold",
      stroke: "#6f8c4f", strokeThickness: 9,
    })
    .setOrigin(0, 0.5)
    .setResolution(3)
    .setDepth(DEPTH + 2);
  // Centred with all three dots, so the name stays put as they come and go.
  text.setX(640 - text.width / 2);
  const parts = [track, fill, shadow, midi, text];
  parts.forEach((part) => part.setAlpha(0).setVisible(firstVisit));

  const startedAt = performance.now();
  let loaded = false;
  let created = false;
  let shown = 0;
  let last = startedAt;
  // The trip's own clock: real time, but a long frame (pictures being
  // decoded, the place being built) counts as one short step, so Midi never
  // jumps ahead.
  let clock = 0;
  let readyAt = -1;
  let creepAtReady = 0;
  let doneAt = 0;
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => { loaded = true; });
  scene.events.once(Phaser.Scenes.Events.CREATE, () => { loaded = true; created = true; });
  // The first frames after building also upload its pictures; let them pass.
  let calmFrames = 0;

  const step = () => {
    const now = performance.now();
    clock += Math.min(now - last, 50);
    last = now;
    const elapsed = clock;
    // Until the place is loaded and built (the heavy part) the bar only
    // creeps, so the run starts afterwards, on a calm frame. Then it eases
    // in from that creep, speeds up and settles into full: no sudden start.
    if (created) calmFrames += 1;
    if (!firstVisit) {
      // Already been here: no bar, the green just fades into the place once it is built.
      if (!doneAt && loaded && calmFrames > 3) doneAt = elapsed;
      if (doneAt) reveal(elapsed - doneAt);
      return;
    }
    if (readyAt < 0 && loaded && calmFrames > 3 && elapsed >= UI_FADE_MS) readyAt = elapsed;
    const creep = 0.08 * (1 - Math.exp(-elapsed / 900));
    let target = creep;
    if (readyAt >= 0) {
      const u = Phaser.Math.Clamp((elapsed - readyAt) / FIRST_TRIP_MS, 0, 1);
      const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      target = creepAtReady + (1 - creepAtReady) * eased;
      if (u >= 1) target = 1;
    } else {
      creepAtReady = creep;
    }
    shown = Math.max(shown, target);
    const u = shown >= 1 ? 1 : 0;

    const tipX = BAR.left + BAR.width * shown;
    fill.clear();
    if (shown > 0.005) {
      const width = Math.max(BAR.height, BAR.width * shown);
      fill.fillStyle(0xf5bd46, 1).fillRoundedRect(BAR.left, BAR.y, width, BAR.height, BAR.height / 2);
      fill.fillStyle(0xffffff, 0.4).fillRoundedRect(BAR.left + 6, BAR.y + 4, Math.max(0, width - 12), 5, 2.5);
    }
    text.setText(baseLabel + ".".repeat(1 + (Math.floor(elapsed / 320) % 3)));

    // Running: a light, even sway rather than hops.
    const sway = Math.sin(elapsed / 95);
    midi.setPosition(tipX, BAR.y + 3 - (1 + sway) * 2.2).setAngle(5 + sway * 1.5);
    shadow.setPosition(tipX, BAR.y + 3);

    if (!doneAt && u >= 1) doneAt = elapsed;
    if (!doneAt) {
      const appear = smooth(Phaser.Math.Clamp(elapsed / UI_FADE_MS, 0, 1));
      parts.forEach((part) => part.setAlpha(appear));
      return;
    }
    const since = elapsed - doneAt;
    const vanish = smooth(Phaser.Math.Clamp(since / UI_FADE_MS, 0, 1));
    parts.forEach((part) => part.setAlpha(1 - vanish));
    if (since >= UI_FADE_MS) reveal(since - UI_FADE_MS);
  };
  const reveal = (since: number) => {
    holdPageBackdrop(null);
    const shown = smooth(Phaser.Math.Clamp(since / REVEAL_MS, 0, 1));
    cover.setAlpha(1 - shown);
    if (shown >= 1) finish();
  };
  const finish = () => {
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
    holdPageBackdrop(null);
    [cover, ...parts].forEach((part) => part.destroy());
  };
  scene.game.events.on(Phaser.Core.Events.PRE_RENDER, step);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
    holdPageBackdrop(null);
  });
}

/** Fades a place out into its own colour, then runs `onFaded` (start the village). */
export function fadeOutOfPlace(scene: Phaser.Scene, onFaded: () => void) {
  const camera = scene.cameras.main;
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, onFaded);
  camera.fadeOut(LEAVE_FADE_MS, ...sceneRgb(scene.sys.settings.key as SceneKey));
}
