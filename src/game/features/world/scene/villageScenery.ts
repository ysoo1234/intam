import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import type {
  MapDefinition,
  Point,
  SceneryDefinition,
} from "../model/mapDefinition";

export const VILLAGE_SCENERY_DEPTH_BASE = 100;
export const VILLAGE_UI_DEPTH = 2_000;

export function getVillagePlayerDepth(playerY: number) {
  return VILLAGE_SCENERY_DEPTH_BASE + Math.round(playerY);
}

export type VillageSceneryLayer = Readonly<{
  definition: SceneryDefinition;
  image: Phaser.GameObjects.Image;
  depthFollowers: readonly DepthFollower[];
}>;

type DepthFollower = Phaser.GameObjects.GameObject & {
  setDepth(depth: number): unknown;
};

const FOUNTAIN_WATER_TEXTURE = "village-fountain-water-frames";
const FOUNTAIN_WATER_ANIMATION = "village-fountain-water-flow";
const FOUNTAIN_WATER_FRAME_SIZE = 313;
const FOUNTAIN_WATER_FRAME_COUNT = 16;

function ensureFountainWaterAnimation(scene: Phaser.Scene) {
  if (scene.anims.exists(FOUNTAIN_WATER_ANIMATION)) return;
  scene.anims.create({
    key: FOUNTAIN_WATER_ANIMATION,
    frames: scene.anims.generateFrameNumbers(FOUNTAIN_WATER_TEXTURE, {
      start: 0,
      end: FOUNTAIN_WATER_FRAME_COUNT - 1,
    }),
    frameRate: 10,
    repeat: -1,
  });
}

function createFountainFlow(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): DepthFollower[] {
  if (scenery.id !== "fountain") return [];
  const { x, y } = scenery.position;
  ensureFountainWaterAnimation(scene);
  const water = scene.add
    .sprite(x, y - 1, FOUNTAIN_WATER_TEXTURE, 0)
    .setDisplaySize(scenery.displaySize.width, scenery.displaySize.height)
    .setAlpha(0.72)
    .setBlendMode(Phaser.BlendModes.ADD)
    .play(FOUNTAIN_WATER_ANIMATION);

  return [water];
}

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
  layers.forEach(({ definition, image, depthFollowers }) => {
    const occludesPlayer = isPointWithinSceneryOcclusionArea(
      definition,
      playerPosition,
    );
    const depth = playerDepth + (occludesPlayer ? 1 : -1);
    image.setDepth(depth);
    depthFollowers.forEach((target) => target.setDepth(depth + 0.01));
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
  if (!scene.textures.exists(FOUNTAIN_WATER_TEXTURE)) {
    scene.load.spritesheet(
      FOUNTAIN_WATER_TEXTURE,
      GAME_ASSETS.world.fountainWaterFrames,
      {
        frameWidth: FOUNTAIN_WATER_FRAME_SIZE,
        frameHeight: FOUNTAIN_WATER_FRAME_SIZE,
        endFrame: FOUNTAIN_WATER_FRAME_COUNT - 1,
      },
    );
  }
}

export function createVillageScenery(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
) {
  scene.add
    .image(
      mapDefinition.size.width / 2,
      mapDefinition.size.height / 2,
      mapDefinition.background.assetKey,
    )
    .setDisplaySize(mapDefinition.size.width, mapDefinition.size.height)
    .setDepth(0);

  return mapDefinition.scenery.map((scenery) => {
    const image = scene.add
      .image(scenery.position.x, scenery.position.y, scenery.assetKey)
      .setDisplaySize(scenery.displaySize.width, scenery.displaySize.height)
      .setDepth(VILLAGE_SCENERY_DEPTH_BASE);
    const depthFollowers = [
      ...createFountainFlow(scene, scenery),
    ];
    depthFollowers.forEach((target) => target.setDepth(VILLAGE_SCENERY_DEPTH_BASE));
    return { definition: scenery, image, depthFollowers };
  });
}
