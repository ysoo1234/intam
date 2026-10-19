import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { playSoftNotes } from "../../../core/audio/softTones";
import {
  getWorldExitState,
  getWorldTotalStars,
  type WorldActivityId,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import type { MapDefinition, Point } from "../model/mapDefinition";
import { getGateLevel, getPendingGateMilestone, playGateMilestone, preloadGateSparkles, setUpVillageGate } from "./villageGateGlow";
import type { VillageSceneryLayer } from "./villageScenery";

const PROGRESS_DEPTH = 1_880;
export const VILLAGE_STAR_TEXTURES = {
  empty: "village-activity-star-empty",
  filled: "village-activity-star-filled",
} as const;

export function preloadVillageProgressPresentationAssets(scene: Phaser.Scene) {
  preloadGateSparkles(scene);
  if (!scene.textures.exists(VILLAGE_STAR_TEXTURES.empty)) {
    scene.load.image(
      VILLAGE_STAR_TEXTURES.empty,
      GAME_ASSETS.ui.villageActivityStarEmpty,
    );
  }
  if (!scene.textures.exists(VILLAGE_STAR_TEXTURES.filled)) {
    scene.load.image(
      VILLAGE_STAR_TEXTURES.filled,
      GAME_ASSETS.ui.villageActivityStarFilled,
    );
  }
}

/** Fresh from a place: the stars pop in one after another over its roof. */
const STAR_REVEAL = { delayMs: 650, stepMs: 340, popMs: 420 } as const;

function playStarChime(scene: Phaser.Scene, index: number) {
  const frequency = [784, 988, 1_319][index] ?? 1_319;
  playSoftNotes(scene, [
    [frequency, frequency, 0, 0.42, 0.05, "triangle"],
    [frequency * 2, frequency * 2, 0.01, 0.2, 0.012, "sine"],
  ]);
}

function popStar(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  star: Phaser.GameObjects.Image,
  shadow: Phaser.GameObjects.Image,
  size: number,
  index: number,
) {
  star.setTexture(VILLAGE_STAR_TEXTURES.filled).setDisplaySize(size, size);
  shadow.setTexture(VILLAGE_STAR_TEXTURES.filled).setDisplaySize(size, size);
  playStarChime(scene, index);
  // Drops in big and bright, lands with a bounce.
  const rest = { x: star.scaleX, y: star.scaleY };
  star.setData("restScale", rest);
  star.setScale(rest.x * 2.2, rest.y * 2.2).setAlpha(0);
  scene.tweens.add({
    targets: star, scaleX: rest.x, scaleY: rest.y, alpha: 1,
    duration: STAR_REVEAL.popMs, ease: "Back.easeOut",
  });
  const burst = scene.add.graphics().setPosition(star.x, star.y);
  burst.lineStyle(3, 0xfff1a8, 0.9).strokeCircle(0, 0, size * 0.3);
  burst.fillStyle(0xffffff, 0.5).fillCircle(0, 0, size * 0.22);
  container.add(burst);
  scene.tweens.add({
    targets: burst, scale: 2.4, alpha: 0, duration: 520, ease: "Cubic.easeOut",
    onComplete: () => burst.destroy(),
  });
  // Four little sparks fly out.
  for (let spark = 0; spark < 4; spark += 1) {
    const angle = -Math.PI / 2 + (spark - 1.5) * 0.9;
    const dot = scene.add.image(star.x, star.y, VILLAGE_STAR_TEXTURES.filled).setDisplaySize(10, 10).setAlpha(0.9);
    container.add(dot);
    scene.tweens.add({
      targets: dot, x: star.x + Math.cos(angle) * 34, y: star.y + Math.sin(angle) * 34 - 6,
      alpha: 0, scale: dot.scaleX * 0.3, duration: 480, ease: "Cubic.easeOut",
      onComplete: () => dot.destroy(),
    });
  }
}

function createActivityStars(
  scene: Phaser.Scene,
  position: Point,
  stars: number,
  name: string,
  reveal = false,
) {
  const container = scene.add
    .container(position.x, position.y)
    .setName(name)
    .setDepth(PROGRESS_DEPTH);
  const starYs = [5, -6, 5] as const;
  const earnedStars: Phaser.GameObjects.Image[] = [];
  const pending: (() => void)[] = [];
  for (let starIndex = 0; starIndex < 3; starIndex += 1) {
    const starX = (starIndex - 1) * 38;
    const starY = starYs[starIndex] ?? 0;
    const filled = starIndex < stars;
    const showFilled = filled && !reveal;
    const size = starIndex === 1 ? 43 : 39;
    const shadow = scene.add
      .image(starX, starY + 3, showFilled ? VILLAGE_STAR_TEXTURES.filled : VILLAGE_STAR_TEXTURES.empty)
      .setDisplaySize(size, size)
      .setTint(0x173f43)
      .setAlpha(0.18);
    const star = scene.add
      .image(starX, starY, showFilled ? VILLAGE_STAR_TEXTURES.filled : VILLAGE_STAR_TEXTURES.empty)
      .setDisplaySize(size, size);
    star.setData("restScale", { x: star.scaleX, y: star.scaleY });
    container.add([shadow, star]);
    if (filled) earnedStars.push(star);
    if (filled && reveal) {
      const index = starIndex;
      pending.push(() => popStar(scene, container, star, shadow, size, index));
    }
  }
  // Earned stars stay fully opaque; they twinkle by size, not by fading.
  // Each star breathes from its own size (the middle one is bigger).
  const twinkle = () => {
    earnedStars.forEach((star) => {
      const rest = star.getData("restScale") as { x: number; y: number };
      // Settle exactly on the landed size first (the pop may still be bouncing).
      scene.tweens.killTweensOf(star);
      star.setScale(rest.x, rest.y).setAlpha(1);
      scene.tweens.add({
        targets: star,
        scaleX: rest.x * 1.06,
        scaleY: rest.y * 1.06,
        duration: 1_350,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  };
  if (pending.length === 0) {
    twinkle();
  } else {
    pending.forEach((pop, order) => {
      scene.time.delayedCall(STAR_REVEAL.delayMs + STAR_REVEAL.stepMs * order, pop);
    });
    scene.time.delayedCall(
      STAR_REVEAL.delayMs + STAR_REVEAL.stepMs * (pending.length - 1) + STAR_REVEAL.popMs,
      twinkle,
    );
  }
  return container;
}

export function createVillageProgressPresentation(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
  sceneryLayers: readonly VillageSceneryLayer[],
  progress: WorldProgressSnapshot,
  /** The place just returned from with stars: its row fills star by star. */
  revealFeatureId?: WorldActivityId,
  /** Midi's line when the starlight gate wakes (7 stars) or shines (9). */
  onGateLine?: (line: string) => void,
) {
  const exitState = getWorldExitState(progress);
  mapDefinition.scenery.forEach((scenery) => {
    const marker = scenery.progressMarker;
    if (!marker) return;
    if (marker.kind === "activity-stars") {
      createActivityStars(
        scene,
        marker.position,
        progress[marker.featureId],
        `village-stars-${marker.featureId}`,
        marker.featureId === revealFeatureId,
      );
    }
  });

  const exitLayer = sceneryLayers.find(
    ({ definition }) => definition.id === "ai-world-gate",
  );
  if (exitLayer) {
    exitLayer.image.clearTint().setAlpha(1);
    const totalStars = getWorldTotalStars(progress);
    setUpVillageGate(exitLayer, getGateLevel(totalStars));
    const milestone = getPendingGateMilestone(totalStars);
    if (milestone) {
      // After the roof's stars have popped in (when just back from a place).
      const revealed = revealFeatureId ? progress[revealFeatureId] : 0;
      const delayMs = revealed > 0
        ? STAR_REVEAL.delayMs + STAR_REVEAL.stepMs * (revealed - 1) + STAR_REVEAL.popMs + 450
        : 1_000;
      playGateMilestone(scene, exitLayer, milestone, {
        delayMs, totalStars, onLine: (line) => onGateLine?.(line),
      });
    }
  }
  return exitState;
}
