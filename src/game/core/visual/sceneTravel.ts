import Phaser from "phaser";
import { configureSceneCamera } from "../runtime/configureSceneCamera";
import { holdPageBackdrop, PAGE_BACKDROPS } from "../runtime/pageBackdrop";
import { PLAYER_TEXTURES } from "../player/playerSprite";
import { SCENE_KEYS, type SceneKey } from "../scenes/sceneKeys";
import { FONT_FAMILY } from "./theme";

/**
 * The trip from the village into a place, timed by what really takes time.
 *
 * The village fades into its green; "OO 가는 중..." and a bar along the
 * bottom fade in there, with Midi running on the bar's tip. Only then does
 * the place start: it takes over the same picture (same bar, same spot) and
 * the bar creeps on while the place loads its pictures (the first visit) and
 * builds itself (every visit: the part that takes about a second on a school
 * computer). Once it is built the bar glides to full, the trip fades out and
 * the place fades in.
 *
 * Leaving a place is a plain fade into the place's own colour; the village
 * then fades in out of that same colour.
 *
 * Everything here moves on the game's render step and real time, because a
 * scene's own clock and tweens do not run while it loads.
 */
const DEPTH = 100_000;
const LEAVE_FADE_MS = 280;
const VILLAGE_FADE_MS = 300;
const UI_FADE_MS = 240;
const FINISH_MS = 650;
/** The whole trip never flashes by quicker than this (from the green). */
const MIN_TRIP_MS = 1_200;
const REVEAL_MS = 360;
const BAR = { left: 290, width: 700, y: 600, height: 22 } as const;
const MIDI_HEIGHT = 104;

type TripState = { key: string; label: string; clock: number; shown: number };
let pendingTrip: TripState | null = null;

const hex = (value: string) => Phaser.Display.Color.HexStringToColor(value);
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Phaser.Math.Clamp(t, 0, 1);
/** Starts from rest (no jolt), then slows as it nears 90%. */
const creepAt = (clock: number) => 0.9 * (1 - Math.exp(-Math.pow(clock / 1_400, 1.4)));

/** The colour a scene sits in (the middle of its page backdrop). */
export function sceneRgb(sceneKey: SceneKey): [number, number, number] {
  const color = hex(PAGE_BACKDROPS[sceneKey].middle);
  return [color.red, color.green, color.blue];
}

/** The green screen with the label, the bar and running Midi. */
function createTripView(scene: Phaser.Scene, label: string) {
  const green = hex(PAGE_BACKDROPS[SCENE_KEYS.world].middle).color;
  // Swallows clicks so nothing underneath can be pressed early.
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

  const draw = (shown: number, clock: number, alpha: number) => {
    const tipX = BAR.left + BAR.width * shown;
    fill.clear();
    if (shown > 0.005) {
      const width = Math.max(BAR.height, BAR.width * shown);
      fill.fillStyle(0xf5bd46, 1).fillRoundedRect(BAR.left, BAR.y, width, BAR.height, BAR.height / 2);
      fill.fillStyle(0xffffff, 0.4).fillRoundedRect(BAR.left + 6, BAR.y + 4, Math.max(0, width - 12), 5, 2.5);
    }
    text.setText(baseLabel + ".".repeat(1 + (Math.floor(clock / 320) % 3)));
    // Running: a light, even sway rather than hops.
    const sway = Math.sin(clock / 95);
    midi.setPosition(tipX, BAR.y + 3 - (1 + sway) * 2.2).setAngle(5 + sway * 1.5);
    shadow.setPosition(tipX, BAR.y + 3);
    parts.forEach((part) => part.setAlpha(alpha));
  };
  const destroy = () => [cover, ...parts].forEach((part) => part.destroy());
  return { cover, draw, destroy };
}

/** The trip's own clock: real time, but a long frame counts as one short step, so Midi never jumps ahead. */
function createTripClock(start: number) {
  let clock = start;
  let last = performance.now();
  return () => {
    const now = performance.now();
    clock += Math.min(now - last, 50);
    last = now;
    return clock;
  };
}

/**
 * The village's side of the trip: fade into green, show the trip, then
 * `start()` the place (which carries the same picture on).
 */
export function beginSceneTrip(scene: Phaser.Scene, destination: SceneKey, label: string, start: () => void) {
  const camera = scene.cameras.main;
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    // The green rectangle takes over from the camera's fade, frame for frame.
    const view = createTripView(scene, label);
    view.draw(0, 0, 0);
    camera.resetFX();
    holdPageBackdrop(SCENE_KEYS.world);
    const tick = createTripClock(0);
    let started = false;
    const step = () => {
      const clock = tick();
      const shown = creepAt(clock);
      view.draw(shown, clock, smooth(clamp01(clock / UI_FADE_MS)));
      // Hand over once the trip is fully on screen (one frame after).
      if (!started && clock >= UI_FADE_MS + 34) {
        started = true;
        scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
        pendingTrip = { key: destination, label, clock, shown };
        start();
      }
    };
    scene.game.events.on(Phaser.Core.Events.PRE_RENDER, step);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step));
  });
  camera.fadeOut(VILLAGE_FADE_MS, ...sceneRgb(SCENE_KEYS.world));
}

/**
 * Call at the end of a place's `preload()`. Carries the trip on when the
 * place was entered from the village; on a restart it only fades the place in.
 */
export function startSceneTravel(scene: Phaser.Scene, renderScale: number) {
  const key = scene.sys.settings.key as SceneKey;
  const trip = pendingTrip?.key === key ? pendingTrip : null;
  // Until the place draws its first frame the canvas shows the camera's
  // background: make that the place's own colour (or the trip's green), not
  // the page's default blue. Matters on 처음부터 다시.
  scene.cameras.main.setBackgroundColor(PAGE_BACKDROPS[trip ? SCENE_KEYS.world : key].middle);
  if (!trip) {
    scene.events.once(Phaser.Scenes.Events.CREATE, () => scene.cameras.main.fadeIn(260, ...sceneRgb(key)));
    return;
  }
  pendingTrip = null;
  configureSceneCamera(scene, renderScale);
  holdPageBackdrop(SCENE_KEYS.world);
  const view = createTripView(scene, trip.label);
  view.draw(trip.shown, trip.clock, 1);

  const tick = createTripClock(trip.clock);
  let shown = trip.shown;
  let loaded = false;
  let created = false;
  // The first frames after building also upload its pictures; let them pass.
  let calmFrames = 0;
  let readyAt = -1;
  let readyFrom = 0;
  let finishMs = FINISH_MS;
  let doneAt = -1;
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => { loaded = true; });
  scene.events.once(Phaser.Scenes.Events.CREATE, () => { loaded = true; created = true; });

  const step = () => {
    const clock = tick();
    if (created) calmFrames += 1;
    if (readyAt < 0 && loaded && calmFrames > 3) {
      readyAt = clock;
      readyFrom = shown;
      finishMs = Math.max(FINISH_MS, MIN_TRIP_MS - clock);
    }
    if (readyAt < 0) {
      shown = Math.max(shown, creepAt(clock));
    } else {
      // Glides from wherever the creep had got to, settling into full.
      const u = clamp01((clock - readyAt) / finishMs);
      shown = readyFrom + (1 - readyFrom) * (1 - Math.pow(1 - u, 2.2));
      if (u >= 1 && doneAt < 0) doneAt = clock;
    }
    if (doneAt < 0) {
      view.draw(shown, clock, 1);
      return;
    }
    const since = clock - doneAt;
    view.draw(1, clock, 1 - smooth(clamp01(since / UI_FADE_MS)));
    if (since >= UI_FADE_MS) {
      holdPageBackdrop(null);
      const reveal = smooth(clamp01((since - UI_FADE_MS) / REVEAL_MS));
      view.cover.setAlpha(1 - reveal);
      if (reveal >= 1) finish();
    }
  };
  const finish = () => {
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
    holdPageBackdrop(null);
    view.destroy();
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
