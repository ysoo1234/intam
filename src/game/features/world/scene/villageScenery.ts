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
// The starlight gate is an open tablet seen at an angle; its screen (cut out
// of the artwork) shows the swirling portal. Screen corners as fractions of
// the gate image (1153 x 1096): top-left, bottom-left, bottom-right, top-right.
const AI_WORLD_PORTAL_SCREEN = [
  [0.5421, 0.2035],
  [0.5351, 0.7965],
  [0.8482, 0.8923],
  [0.856, 0.292],
] as const;

function getAiWorldPortalScreen(scenery: SceneryDefinition) {
  const { x, y } = scenery.position;
  const { width, height } = scenery.displaySize;
  const corners = AI_WORLD_PORTAL_SCREEN.map(([fx, fy]) => ({
    x: x - width / 2 + fx * width,
    y: y - height / 2 + fy * height,
  }));
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return { corners, left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
}

function createAiWorldPortalMask(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
) {
  const screen = getAiWorldPortalScreen(scenery);
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  maskShape.fillStyle(0xffffff);
  // A touch larger than the hole so no gap shows at its anti-aliased edge.
  const cx = screen.left + screen.width / 2;
  const cy = screen.top + screen.height / 2;
  maskShape.fillPoints(
    screen.corners.map((corner) => new Phaser.Math.Vector2(
      cx + (corner.x - cx) * 1.03,
      cy + (corner.y - cy) * 1.03,
    )),
    true,
  );
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
  const screen = getAiWorldPortalScreen(scenery);
  const portalCenterX = screen.left + screen.width / 2;
  const portalCenterY = screen.top + screen.height / 2;
  // Big enough that the slowly turning swirl always covers the whole screen.
  const portalSize = Math.hypot(screen.width, screen.height) * 1.15;
  const portal = scene.add
    .image(portalCenterX, portalCenterY, AI_WORLD_PORTAL_TEXTURE)
    .setDisplaySize(portalSize, portalSize)
    .setAngle(-8);
  const openingMask = createAiWorldPortalMask(scene, scenery);
  applyAiWorldPortalMask(portal, openingMask, scene);

  // Twinkling dots inside the screen, as fractions of its width and height.
  const starGroups = [
    [
      [0.2, 0.42],
      [0.36, 0.2],
      [0.76, 0.33],
      [0.64, 0.7],
      [0.3, 0.76],
    ],
    [
      [0.55, 0.14],
      [0.84, 0.55],
      [0.24, 0.6],
      [0.5, 0.88],
    ],
  ].map((coordinates, groupIndex) => {
    const stars = scene.add.graphics();
    coordinates.forEach(([starX, starY], starIndex) => {
      const worldX = screen.left + starX * screen.width;
      const worldY = screen.top + starY * screen.height;
      const radius = starIndex % 2 === 0 ? 1.1 : 0.7;
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
      .setFlipX(scenery.flipX === true)
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
