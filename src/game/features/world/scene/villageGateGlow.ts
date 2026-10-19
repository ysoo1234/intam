import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { playSoftNotes } from "../../../core/audio/softTones";
import {
  getAiWorldPortalMood,
  getAiWorldPortalScreen,
  type AiWorldPortalLevel,
  type VillageSceneryLayer,
} from "./villageScenery";

/**
 * The starlight gate (the tablet) wakes up when the road home opens:
 * - under 7 stars it looks as it always did;
 * - from 7 its screen gently breathes brighter and dimmer, inviting without
 *   asking (more stars can still be collected).
 * The first time 7 and then 9 are reached it shines once: the screen flashes,
 * Midi's sparkle stars (the Ethics Review office's) burst round it, a chime
 * plays and Midi says a line. Nothing is dimmed and nothing waits for a tap.
 * Which moments were shown is remembered, so each plays once.
 */
export type GateMilestone = 7 | 9;

const CELEBRATED_KEY = "intam:gate-celebrated:v1";
const BURST_DEPTH = 1_900;
/** Midi's hand-drawn sparkle stars (the same art as the Ethics Review office). */
const SPARKLES = ["gate-sparkle-1", "gate-sparkle-2", "gate-sparkle-3"] as const;
const SPARKLE_SOURCES = [
  GAME_ASSETS.ethicsReview.midiEffects.sparkle,
  GAME_ASSETS.ethicsReview.midiEffects.sparkleMid,
  GAME_ASSETS.ethicsReview.midiEffects.sparkleSmall,
] as const;

/** Midi's line: 7–8 stars say how many were collected, 9 says all of them. */
export function getGateLine(milestone: GateMilestone, totalStars: number) {
  return milestone === 9
    ? "모든 별을 모았어! 별빛 졸업길로 가보자!"
    : `별을 ${totalStars}개 모아서 별빛 졸업길이 열렸어!`;
}

export function getGateLevel(totalStars: number): AiWorldPortalLevel {
  return totalStars >= 7 ? "awake" : "plain";
}

export function preloadGateSparkles(scene: Phaser.Scene) {
  SPARKLES.forEach((key, index) => {
    if (!scene.textures.exists(key)) scene.load.image(key, SPARKLE_SOURCES[index]);
  });
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

/** The gate's look for its star count. */
export function setUpVillageGate(layer: VillageSceneryLayer, level: AiWorldPortalLevel) {
  const mood = getAiWorldPortalMood(layer.depthBackdrops[0]);
  if (mood) mood.level = level;
}

/** One of Midi's sparkle stars: pops in, twinkles, then fades. */
function popSparkle(
  scene: Phaser.Scene,
  at: Readonly<{ x: number; y: number }>,
  size: number,
  delay: number,
  drift: Readonly<{ x: number; y: number }>,
) {
  const key = SPARKLES[Phaser.Math.Between(0, SPARKLES.length - 1)];
  if (!scene.textures.exists(key)) return;
  const star = scene.add.image(at.x, at.y, key).setDepth(BURST_DEPTH + 1);
  const full = size / Math.max(star.width, star.height);
  star.setScale(0).setAngle(Phaser.Math.Between(-35, -15));
  scene.tweens.add({
    targets: star, scale: full, angle: 0, x: at.x + drift.x * 0.6, y: at.y + drift.y * 0.6,
    duration: 280, delay, ease: "Back.easeOut",
  });
  scene.tweens.add({
    targets: star, scale: full * 0.78, duration: 220, delay: delay + 330, yoyo: true, repeat: 1, ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: star, alpha: 0, scale: full * 0.5, x: at.x + drift.x, y: at.y + drift.y,
    duration: 360, delay: delay + 1_150, ease: "Sine.easeIn", onComplete: () => star.destroy(),
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
  const screen = getAiWorldPortalScreen(layer.definition);
  const cx = screen.left + screen.width / 2;
  const cy = screen.top + screen.height / 2;
  const mood = getAiWorldPortalMood(layer.depthBackdrops[0]);
  const { image } = layer;

  scene.time.delayedCall(options.delayMs, () => {
    if (!scene.sys.isActive()) return;
    // The screen lights up and settles back slowly.
    if (mood) {
      mood.flare = 0;
      scene.tweens.add({
        targets: mood, flare: 1, duration: 260, ease: "Sine.easeOut",
        onComplete: () => scene.tweens.add({ targets: mood, flare: 0, delay: 350, duration: big ? 1_700 : 1_300, ease: "Sine.easeIn" }),
      });
    }
    // The whole tablet gives a small happy bounce.
    const rest = { x: image.scaleX, y: image.scaleY };
    scene.tweens.add({
      targets: image, scaleX: rest.x * 1.04, scaleY: rest.y * 1.04, duration: 180, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => image.setScale(rest.x, rest.y),
    });

    // One big star blooms in the middle of the screen.
    popSparkle(scene, { x: cx, y: cy }, big ? 150 : 120, 40, { x: 0, y: -10 });
    // Then Midi's sparkle stars burst out round the tablet, in two waves for all nine.
    const waves = big ? 2 : 1;
    const perWave = big ? 9 : 8;
    const reachX = image.displayWidth * 0.5;
    const reachY = image.displayHeight * 0.48;
    for (let wave = 0; wave < waves; wave += 1) {
      for (let index = 0; index < perWave; index += 1) {
        const angle = ((Math.PI * 2) * (index + wave * 0.5)) / perWave + Phaser.Math.FloatBetween(-0.18, 0.18);
        const reach = Phaser.Math.FloatBetween(0.72, 1.05) * (1 + wave * 0.18);
        const at = { x: cx + Math.cos(angle) * reachX * reach, y: cy + Math.sin(angle) * reachY * reach };
        const size = Phaser.Math.Between(big ? 46 : 40, big ? 72 : 62) * (wave ? 0.85 : 1);
        const drift = { x: Math.cos(angle) * 26, y: Math.sin(angle) * 22 - 8 };
        popSparkle(scene, at, size, 160 + wave * 420 + index * 45, drift);
      }
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
