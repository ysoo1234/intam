import Phaser from "phaser";
import { applyArtTone } from "../../../core/visual/artTone";
import type {
  MapDefinition,
  Point,
  SceneryDefinition,
} from "../model/mapDefinition";

export const VILLAGE_SCENERY_DEPTH_BASE = 100;
export const VILLAGE_UI_DEPTH = 2_000;

const VILLAGE_SATURATION_ADJUSTMENT = -0.2;
const VILLAGE_BRIGHTNESS_MULTIPLIER = 1.01;

function applyVillageArtTone(image: Phaser.GameObjects.Image) {
  return applyArtTone(image, {
    saturation: VILLAGE_SATURATION_ADJUSTMENT,
    brightness: VILLAGE_BRIGHTNESS_MULTIPLIER,
  });
}

export function getVillagePlayerDepth(playerY: number) {
  return VILLAGE_SCENERY_DEPTH_BASE + Math.round(playerY);
}

export type VillageSceneryLayer = Readonly<{
  definition: SceneryDefinition;
  image: Phaser.GameObjects.Image;
}>;

export function isPointWithinSceneryOcclusionArea(
  scenery: SceneryDefinition,
  point: Point,
) {
  const area = scenery.occlusionArea;
  return (
    point.x >= area.minX &&
    point.x <= area.maxX &&
    point.y >= area.minY &&
    point.y <= area.maxY
  );
}

export function updateVillageSceneryDepths(
  layers: readonly VillageSceneryLayer[],
  playerPosition: Point,
) {
  const playerDepth = getVillagePlayerDepth(playerPosition.y);
  layers.forEach(({ definition, image }) => {
    const occludesPlayer = isPointWithinSceneryOcclusionArea(
      definition,
      playerPosition,
    );
    image.setDepth(playerDepth + (occludesPlayer ? 1 : -1));
  });
}

export function preloadVillageScenery(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
) {
  const assets = [mapDefinition.background, ...mapDefinition.scenery];
  assets.forEach(({ assetKey, url }) => {
    if (!scene.textures.exists(assetKey)) scene.load.image(assetKey, url);
  });
}

export function createVillageScenery(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
) {
  const background = scene.add
    .image(
      mapDefinition.size.width / 2,
      mapDefinition.size.height / 2,
      mapDefinition.background.assetKey,
    )
    .setDisplaySize(mapDefinition.size.width, mapDefinition.size.height)
    .setDepth(0);
  applyVillageArtTone(background);

  return mapDefinition.scenery.map((scenery) => {
    const image = scene.add
      .image(scenery.position.x, scenery.position.y, scenery.assetKey)
      .setDisplaySize(scenery.displaySize.width, scenery.displaySize.height)
      .setDepth(VILLAGE_SCENERY_DEPTH_BASE);
    applyVillageArtTone(image);
    return { definition: scenery, image };
  });
}
