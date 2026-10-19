import Phaser from "phaser";
import { playSoftNotes } from "../../../core/audio/softTones";
import {
  getAiWorldPortalMood,
  getAiWorldPortalScreen,
  type AiWorldPortalLevel,
  type VillageSceneryLayer,
} from "./villageScenery";

/**
 * The starlight gate (the tablet) tells how close the road home is:
 * - under 7 stars it sleeps (dim, greyish screen, no sparkles);
 * - from 7 it is awake: its screen breathes and a soft light glows round it,
 *   inviting without asking (more stars can still be collected);
 * - at 9 the same light turns a little golden.
 * The first time 7 and then 9 are reached it wakes with one short flash:
 * rings, sparkles, a chime and a line from Midi. Nothing is dimmed and
 * nothing waits for a tap. Which moments were shown is remembered, so each
 * plays once.
 */
export type GateMilestone = 7 | 9;

const CELEBRATED_KEY = "intam:gate-celebrated:v1";
const GLOW_DEPTH = 1;
const BURST_DEPTH = 1_900;
const COLORS = {
  awake: { glow: 0x8ff3ff, ring: 0xd9fbff },
  full: { glow: 0xffd977, ring: 0xfff1b8 },
} as const;

export const GATE_LINES: Readonly<Record<GateMilestone, string>> = {
  7: "별빛 졸업길이 열렸어! 별을 더 모아도 되고, 지금 가 봐도 돼.",
  9: "별 9개를 다 모았어! 졸업길이 반짝반짝 빛나고 있어.",
};

export function getGateLevel(totalStars: number): AiWorldPortalLevel {
  if (totalStars >= 9) return "full";
  if (totalStars >= 7) return "awake";
  return "sleep";
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

/** The gate's look for its star count; returns the soft glow round it (awake/full). */
export function setUpVillageGate(scene: Phaser.Scene, layer: VillageSceneryLayer, level: AiWorldPortalLevel) {
  const portal = layer.depthBackdrops[0];
  const mood = getAiWorldPortalMood(portal);
  if (mood) mood.level = level;
  if (level !== "awake" && level !== "full") return undefined;
  const { image } = layer;
  const color = COLORS[level].glow;
  const glow = scene.add.graphics().setPosition(image.x, image.y).setDepth(GLOW_DEPTH)
    .setBlendMode(Phaser.BlendModes.ADD);
  const width = image.displayWidth * 1.12;
  const height = image.displayHeight * 0.98;
  for (let ring = 0; ring < 7; ring += 1) {
    const shrink = 1 - ring * 0.11;
    glow.fillStyle(color, 0.05);
    glow.fillEllipse(0, image.displayHeight * 0.08, width * shrink, height * shrink);
  }
  scene.tweens.add({
    targets: glow, alpha: { from: 0.55, to: 1 }, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  });
  return glow;
}

/**
 * The one-off wake-up flash. `delayMs` lets the stars over the roof finish
 * first; `onLine` is where Midi says her line.
 */
export function playGateMilestone(
  scene: Phaser.Scene,
  layer: VillageSceneryLayer,
  milestone: GateMilestone,
  options: Readonly<{ delayMs: number; starTexture: string; onLine: (line: string) => void }>,
) {
  markCelebrated(milestone);
  const big = milestone === 9;
  const palette = big ? COLORS.full : COLORS.awake;
  const screen = getAiWorldPortalScreen(layer.definition);
  const cx = screen.left + screen.width / 2;
  const cy = screen.top + screen.height / 2;
  const mood = getAiWorldPortalMood(layer.depthBackdrops[0]);

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
    const { image } = layer;
    const rest = { x: image.scaleX, y: image.scaleY };
    scene.tweens.add({
      targets: image, scaleX: rest.x * 1.04, scaleY: rest.y * 1.04, duration: 180, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => image.setScale(rest.x, rest.y),
    });
    // Rings of light spread from the screen.
    const rings = big ? 3 : 2;
    for (let index = 0; index < rings; index += 1) {
      const ring = scene.add.graphics().setPosition(cx, cy).setDepth(BURST_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
      ring.lineStyle(5, palette.ring, 0.85).strokeEllipse(0, 0, screen.width * 0.9, screen.height * 0.9);
      ring.setScale(0.7).setAlpha(0);
      scene.tweens.add({
        targets: ring, scale: big ? 2.3 : 1.9, alpha: { from: 0.9, to: 0 }, delay: index * 180,
        duration: 900, ease: "Cubic.easeOut", onComplete: () => ring.destroy(),
      });
    }
    // Little stars fly out of the screen and fade.
    const count = big ? 16 : 10;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distance = Phaser.Math.Between(big ? 120 : 90, big ? 190 : 150);
      const size = Phaser.Math.Between(14, big ? 26 : 22);
      const star = scene.add.image(cx, cy, options.starTexture).setDisplaySize(size, size)
        .setDepth(BURST_DEPTH + 1).setAlpha(0);
      const scale = star.scaleX;
      scene.tweens.add({
        targets: star, x: cx + Math.cos(angle) * distance, y: cy + Math.sin(angle) * distance * 0.8,
        alpha: { from: 1, to: 0 }, scale: { from: scale * 0.4, to: scale * 1.1 }, angle: Phaser.Math.Between(-120, 120),
        delay: 60 + (index % 4) * 40, duration: 950, ease: "Cubic.easeOut", onComplete: () => star.destroy(),
      });
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
      if (scene.sys.isActive()) options.onLine(GATE_LINES[milestone]);
    });
  });
}
