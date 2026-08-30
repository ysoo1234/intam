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
  depthBackdrops: readonly DepthFollower[];
  depthFollowers: readonly DepthFollower[];
}>;

type DepthFollower = Phaser.GameObjects.GameObject & {
  setDepth(depth: number): unknown;
};

const FOUNTAIN_WATER_TEXTURE = "village-fountain-water-frames";
const FOUNTAIN_WATER_ANIMATION = "village-fountain-water-flow";
const FOUNTAIN_WATER_FRAME_SIZE = 313;
const FOUNTAIN_WATER_FRAME_COUNT = 16;
const AI_WORLD_PORTAL_TEXTURE = "village-ai-world-portal-night";
const AI_WORLD_PORTAL_MASK_WIDTH = 256;
const AI_WORLD_PORTAL_MASK_HEIGHT = 244;
// 포탈 중심 미세 조정값(1280x720 게임 좌표 px)입니다.
// X는 커질수록 오른쪽, Y는 커질수록 아래로 이동합니다.
const AI_WORLD_PORTAL_OFFSET_X_PX = -2;
const AI_WORLD_PORTAL_OFFSET_Y_PX = 22;

function createAiWorldPortalMask(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
) {
  const { x, y } = scenery.position;
  const { width, height } = scenery.displaySize;
  const left = x - width / 2;
  const top = y - height / 2;
  const scaleX = width / AI_WORLD_PORTAL_MASK_WIDTH;
  const scaleY = height / AI_WORLD_PORTAL_MASK_HEIGHT;
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  const maskX = (value: number) => left + value * scaleX;
  const maskY = (value: number) => top + value * scaleY;
  const point = (pointX: number, pointY: number) =>
    new Phaser.Math.Vector2(maskX(pointX), maskY(pointY));
  // The gate is drawn in perspective: its right foot sits lower than its left.
  // Closing this silhouette on a tilted threshold prevents the portal texture
  // from reading as a rectangular card below the arch.
  const points = [point(76, 192), point(57, 138)];
  const appendCubic = (
    from: readonly [number, number],
    controlA: readonly [number, number],
    controlB: readonly [number, number],
    to: readonly [number, number],
  ) => {
    for (let step = 1; step <= 10; step += 1) {
      const progress = step / 10;
      const inverse = 1 - progress;
      const curveX =
        inverse ** 3 * from[0] +
        3 * inverse ** 2 * progress * controlA[0] +
        3 * inverse * progress ** 2 * controlB[0] +
        progress ** 3 * to[0];
      const curveY =
        inverse ** 3 * from[1] +
        3 * inverse ** 2 * progress * controlA[1] +
        3 * inverse * progress ** 2 * controlB[1] +
        progress ** 3 * to[1];
      points.push(point(curveX, curveY));
    }
  };

  appendCubic(
    [57, 138],
    [52, 103],
    [78, 64],
    [113, 58],
  );
  appendCubic(
    [113, 58],
    [151, 53],
    [187, 83],
    [198, 116],
  );
  appendCubic(
    [198, 116],
    [205, 143],
    [201, 188],
    [188, 207],
  );
  maskShape.fillStyle(0xffffff);
  maskShape.fillPoints(points, true);

  return maskShape;
}

function applyAiWorldPortalMask(
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics,
  openingMask: Phaser.GameObjects.Graphics,
  scene: Phaser.Scene,
) {
  if (scene.game.renderer.type === Phaser.CANVAS) {
    target.setMask(openingMask.createGeometryMask());
    return;
  }

  target.enableFilters();
  target.filters?.external.addMask(
    openingMask,
    false,
    scene.cameras.main,
    "world",
  );
}

function ensureFountainWaterAnimation(scene: Phaser.Scene) {
  if (scene.anims.exists(FOUNTAIN_WATER_ANIMATION)) return;
  scene.anims.create({
    key: FOUNTAIN_WATER_ANIMATION,
    frames: scene.anims.generateFrameNumbers(FOUNTAIN_WATER_TEXTURE, {
      start: 0,
      end: FOUNTAIN_WATER_FRAME_COUNT - 1,
    }),
    frameRate: 6,
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

function createAiWorldPortal(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): DepthFollower[] {
  if (scenery.id !== "ai-world-gate") return [];
  const { x, y } = scenery.position;
  const portalCenterX = x + AI_WORLD_PORTAL_OFFSET_X_PX;
  const portalCenterY = y + AI_WORLD_PORTAL_OFFSET_Y_PX;
  const portalSize = Math.max(
    scenery.displaySize.width,
    scenery.displaySize.height,
  ) * 1.38;
  const portal = scene.add
    .image(portalCenterX, portalCenterY, AI_WORLD_PORTAL_TEXTURE)
    .setDisplaySize(portalSize, portalSize)
    .setAngle(-8);
  const openingMask = createAiWorldPortalMask(scene, scenery);
  applyAiWorldPortalMask(portal, openingMask, scene);

  const portalLeft = x - scenery.displaySize.width / 2;
  const portalTop = y - scenery.displaySize.height / 2;
  const portalScaleX =
    scenery.displaySize.width / AI_WORLD_PORTAL_MASK_WIDTH;
  const portalScaleY =
    scenery.displaySize.height / AI_WORLD_PORTAL_MASK_HEIGHT;
  const starGroups = [
    [
      [88, 127],
      [111, 88],
      [169, 111],
      [151, 172],
      [103, 177],
    ],
    [
      [137, 101],
      [181, 145],
      [93, 153],
      [128, 190],
    ],
  ].map((coordinates, groupIndex) => {
    const stars = scene.add.graphics();
    coordinates.forEach(([starX, starY], starIndex) => {
      const worldX = portalLeft + starX * portalScaleX;
      const worldY = portalTop + starY * portalScaleY;
      const radius = starIndex % 2 === 0 ? 0.9 : 0.55;
      stars.fillStyle(0xffffff, 0.95);
      stars.fillCircle(worldX, worldY, radius);
    });
    stars.setAlpha(0.24);
    applyAiWorldPortalMask(stars, openingMask, scene);
    scene.tweens.add({
      targets: stars,
      alpha: { from: 0.22, to: 0.9 },
      duration: groupIndex === 0 ? 1_700 : 2_300,
      delay: groupIndex === 0 ? 0 : 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return stars;
  });

  scene.tweens.add({
    targets: portal,
    angle: 352,
    duration: 42_000,
    repeat: -1,
    ease: "Linear",
  });

  return [portal, ...starGroups];
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
  layers.forEach(({ definition, image, depthBackdrops, depthFollowers }) => {
    const occludesPlayer = isPointWithinSceneryOcclusionArea(
      definition,
      playerPosition,
    );
    const depth = playerDepth + (occludesPlayer ? 1 : -1);
    depthBackdrops.forEach((target) => target.setDepth(depth - 0.02));
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
  if (!scene.textures.exists(AI_WORLD_PORTAL_TEXTURE)) {
    scene.load.image(
      AI_WORLD_PORTAL_TEXTURE,
      GAME_ASSETS.world.aiWorldPortalNight,
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
    const depthBackdrops = createAiWorldPortal(scene, scenery);
    const depthFollowers = [
      ...createFountainFlow(scene, scenery),
    ];
    depthBackdrops.forEach((target) =>
      target.setDepth(VILLAGE_SCENERY_DEPTH_BASE - 0.02),
    );
    depthFollowers.forEach((target) => target.setDepth(VILLAGE_SCENERY_DEPTH_BASE));
    return { definition: scenery, image, depthBackdrops, depthFollowers };
  });
}
