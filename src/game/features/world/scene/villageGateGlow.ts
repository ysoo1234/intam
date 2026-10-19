import Phaser from "phaser";
import { playSoftNotes } from "../../../core/audio/softTones";
import {
  getAiWorldPortalMood,
  type AiWorldPortalLevel,
  type AiWorldPortalMood,
  type VillageSceneryLayer,
} from "./villageScenery";

/**
 * The starlight gate (the tablet) wakes up when the road home opens. Only its
 * screen (the way in) changes; the tablet's case is never lit or moved.
 * - Under 7 stars it looks as it always did.
 * - From 7 the screen gently breathes brighter and dimmer, and every few
 *   seconds a soft band of light glides across the glass: an invitation that
 *   never insists (more stars can still be collected).
 * - The first time 7 and then 9 are reached the screen shines once: it
 *   brightens, light glides across it (twice for all nine), sparkles burst
 *   inside it, a chime plays and Midi says a line. Each moment plays once.
 */
export type GateMilestone = 7 | 9;

const CELEBRATED_KEY = "intam:gate-celebrated:v1";
/** How often the open gate's screen catches the light. */
const IDLE_SWEEP_EVERY_MS = 6_000;

/** Midi's line: 7–8 stars say how many were collected, 9 says all of them. */
export function getGateLine(milestone: GateMilestone, totalStars: number) {
  return milestone === 9
    ? "모든 별을 모았어! 별빛 졸업길로 가보자!"
    : `별을 ${totalStars}개 모아서 별빛 졸업길이 열렸어!`;
}

export function getGateLevel(totalStars: number): AiWorldPortalLevel {
  return totalStars >= 7 ? "awake" : "plain";
}

function readCelebrated(): number {
  try {
    return Number(window.localStorage.getItem(CELEBRATED_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** The milestone that has not been shown yet (9 wins when both are new). */
export function getPendingGateMilestone(totalStars: number): GateMilestone | undefined {
  const shown = readCelebrated();
  if (totalStars >= 9 && shown < 9) return 9;
  if (totalStars >= 7 && shown < 7) return 7;
  return undefined;
}

/** Forgets which moments were shown (the test menu sets stars, so they play again). */
export function resetGateMilestones() {
  try {
    window.localStorage.removeItem(CELEBRATED_KEY);
  } catch {
    // Nothing to forget.
  }
}

function markCelebrated(milestone: GateMilestone) {
  try {
    window.localStorage.setItem(CELEBRATED_KEY, String(Math.max(readCelebrated(), milestone)));
  } catch {
    // Storage blocked: the moment may play again next time, which is harmless.
  }
}

/** Lets one band of light glide across the screen. */
function sweepScreen(scene: Phaser.Scene, mood: AiWorldPortalMood, strength: number, duration: number, delay = 0) {
  scene.tweens.add({
    targets: mood, sweep: { from: 0, to: 1 }, duration, delay, ease: "Sine.easeInOut",
    onStart: () => {
      mood.sweepStrength = strength;
    },
    onComplete: () => {
      mood.sweep = -1;
    },
  });
}

/** The gate's look for its star count (from 7, a soft light glides by now and then). */
export function setUpVillageGate(scene: Phaser.Scene, layer: VillageSceneryLayer, level: AiWorldPortalLevel) {
  const mood = getAiWorldPortalMood(layer.depthBackdrops[0]);
  if (!mood) return;
  mood.level = level;
  if (level !== "awake") return;
  scene.time.addEvent({
    delay: IDLE_SWEEP_EVERY_MS,
    loop: true,
    callback: () => {
      if (mood.sweep < 0 && mood.flare === 0) sweepScreen(scene, mood, 0.55, 1_300);
    },
  });
}

/**
 * The one-off shine. `delayMs` lets the stars over the roof finish first;
 * `onLine` is where Midi says her line.
 */
export function playGateMilestone(
  scene: Phaser.Scene,
  layer: VillageSceneryLayer,
  milestone: GateMilestone,
  options: Readonly<{ delayMs: number; totalStars: number; onLine: (line: string) => void }>,
) {
  markCelebrated(milestone);
  const big = milestone === 9;
  const mood = getAiWorldPortalMood(layer.depthBackdrops[0]);

  scene.time.delayedCall(options.delayMs, () => {
    if (!scene.sys.isActive()) return;
    if (mood) {
      // The screen brightens, light glides across it, sparkles burst inside it.
      mood.flare = 0;
      scene.tweens.add({
        targets: mood, flare: 1, duration: 300, ease: "Sine.easeOut",
        onComplete: () => scene.tweens.add({
          targets: mood, flare: 0, delay: big ? 900 : 600, duration: big ? 1_500 : 1_200, ease: "Sine.easeIn",
        }),
      });
      sweepScreen(scene, mood, 1, 900, 120);
      if (big) sweepScreen(scene, mood, 0.8, 900, 1_150);
      mood.twinkle(big ? 14 : 9);
      if (big) scene.time.delayedCall(900, () => mood.twinkle(8));
    }
    // A rising chime (a fuller one for all nine).
    playSoftNotes(scene, big
      ? [
        [784, 784, 0, 0.32, 0.045, "triangle"], [988, 988, 0.1, 0.32, 0.045, "triangle"],
        [1_175, 1_175, 0.2, 0.32, 0.045, "triangle"], [1_568, 1_568, 0.3, 0.6, 0.05, "triangle"],
        [1_976, 1_976, 0.3, 0.6, 0.018, "sine"], [2_349, 2_349, 0.42, 0.55, 0.014, "sine"],
      ]
      : [
        [784, 784, 0, 0.3, 0.045, "triangle"], [1_047, 1_047, 0.11, 0.3, 0.045, "triangle"],
        [1_319, 1_319, 0.22, 0.5, 0.048, "triangle"], [2_637, 2_637, 0.22, 0.4, 0.012, "sine"],
      ]);
    scene.time.delayedCall(520, () => {
      if (scene.sys.isActive()) options.onLine(getGateLine(milestone, options.totalStars));
    });
  });
}
