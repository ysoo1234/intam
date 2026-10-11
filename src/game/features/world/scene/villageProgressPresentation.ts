import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import {
  getWorldExitState,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import type { MapDefinition, Point } from "../model/mapDefinition";
import type { VillageSceneryLayer } from "./villageScenery";

const PROGRESS_DEPTH = 1_880;
export const VILLAGE_STAR_TEXTURES = {
  empty: "village-activity-star-empty",
  filled: "village-activity-star-filled",
} as const;

export function preloadVillageProgressPresentationAssets(scene: Phaser.Scene) {
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

function createActivityStars(
  scene: Phaser.Scene,
  position: Point,
  stars: number,
  name: string,
) {
  const container = scene.add
    .container(position.x, position.y)
    .setName(name)
    .setDepth(PROGRESS_DEPTH);
  const starYs = [5, -6, 5] as const;
  const earnedStars: Phaser.GameObjects.Image[] = [];
  for (let starIndex = 0; starIndex < 3; starIndex += 1) {
    const starX = (starIndex - 1) * 38;
    const starY = starYs[starIndex] ?? 0;
    const filled = starIndex < stars;
    const size = starIndex === 1 ? 43 : 39;
    const shadow = scene.add
      .image(starX, starY + 3, filled ? VILLAGE_STAR_TEXTURES.filled : VILLAGE_STAR_TEXTURES.empty)
      .setDisplaySize(size, size)
      .setTint(0x173f43)
      .setAlpha(0.18);
    const star = scene.add
      .image(starX, starY, filled ? VILLAGE_STAR_TEXTURES.filled : VILLAGE_STAR_TEXTURES.empty)
      .setDisplaySize(size, size);
    container.add([shadow, star]);
    if (filled) earnedStars.push(star);
  }
  if (earnedStars.length > 0) {
    scene.tweens.add({
      targets: earnedStars,
      alpha: { from: 0.88, to: 1 },
      duration: 1_350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
  return container;
}

export function createVillageProgressPresentation(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
  sceneryLayers: readonly VillageSceneryLayer[],
  progress: WorldProgressSnapshot,
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
      );
    }
  });

  const exitLayer = sceneryLayers.find(
    ({ definition }) => definition.id === "ai-world-gate",
  );
  if (exitLayer) {
    if (exitState.kind === "locked") {
      exitLayer.image.clearTint().setAlpha(1);
    } else {
      exitLayer.image.clearTint().setAlpha(1);
      scene.tweens.add({
        targets: exitLayer.image,
        alpha: { from: 0.88, to: 1 },
        duration: 1_600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
  return exitState;
}
