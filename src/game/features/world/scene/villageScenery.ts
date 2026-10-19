import Phaser from "phaser";
import type {
  CollisionDefinition,
  MapDefinition,
  Point,
  SceneryDefinition,
} from "../model/mapDefinition";
import { isPlayerBehindBuilding } from "../model/villageCollision";
import { getAmbientRedrawIntervalMs } from "../../../core/runtime/devicePerformance";
import { createFountainFlow, preloadFountainAssets } from "./villageFountain";

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

const AI_WORLD_PORTAL_CANVAS = "village-ai-world-portal-swirl";
/**
 * The portal's whirlpool: number of arms, how tightly they curl, how fast
 * the pattern turns (radians a second of its phase; about 16 s per full turn),
 * and its colours from the deep part of an arm to the light part.
 */
const PORTAL_SWIRL = {
  arms: 3,
  curl: 2.4,
  speed: 1.2,
  deep: [38, 118, 150],
  light: [150, 222, 205],
} as const;
let portalCount = 0;

/**
 * How the portal looks: "plain" (as it always was: fewer than 7 stars, the
 * ending) or "awake" (the starlight road is open: it breathes gently brighter
 * and dimmer). `flare` (0–1) is a passing flash.
 */
export type AiWorldPortalLevel = "plain" | "awake";
export type AiWorldPortalMood = { level: AiWorldPortalLevel; flare: number };
const PORTAL_MOOD_KEY = "portal-mood";

/** The mood object a live portal reads every time it is drawn (set its fields). */
export function getAiWorldPortalMood(portal: Phaser.GameObjects.GameObject | undefined) {
  return portal?.getData(PORTAL_MOOD_KEY) as AiWorldPortalMood | undefined;
}
// The starlight gate is an open tablet seen at an angle; its screen (cut out
// of the artwork) shows the portal. Screen corners as fractions of
// the gate image (v5, 640 x 608): top-left, bottom-left, bottom-right, top-right.
const AI_WORLD_PORTAL_SCREEN = [
  [0.5359, 0.2056],
  [0.5344, 0.7961],
  [0.8734, 0.8914],
  [0.8625, 0.2862],
] as const;

export function getAiWorldPortalScreen(scenery: SceneryDefinition) {
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
  grow = 1.08,
) {
  const screen = getAiWorldPortalScreen(scenery);
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  maskShape.fillStyle(0xffffff);
  // Larger than the measured hole so no gap shows at its edges (the frame covers the rest).
  const cx = screen.left + screen.width / 2;
  const cy = screen.top + screen.height / 2;
  maskShape.fillPoints(
    screen.corners.map((corner) => new Phaser.Math.Vector2(
      cx + (corner.x - cx) * grow,
      cy + (corner.y - cy) * grow,
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

/**
 * The far side of the starlight gate: a calm whirlpool of deep teal and soft
 * mint light. Three soft arms curl into the middle and turn slowly (about
 * 16 s a turn), with a gentle glow at the centre and a few sparkles, so it
 * reads clearly as a portal without being dizzy. Drawn into a small canvas
 * about 25 times a second.
 */
function createAiWorldPortal(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): DepthFollower[] {
  if (scenery.id !== "ai-world-gate") return [];
  const portal = createAiWorldPortalView(scene, scenery);
  return portal ? [portal] : [];
}

/**
 * The live portal for `scenery` (the gate). `grow` sizes its mask against the
 * screen hole: a little larger in the village (the gate frame is drawn over
 * it), exact when it is laid over a flat picture of the village (the ending).
 */
export function createAiWorldPortalView(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
  grow = 1.08,
) {
  const screen = getAiWorldPortalScreen(scenery);
  const openingMask = createAiWorldPortalMask(scene, scenery, grow);
  const scale = 2;
  const width = Math.ceil(screen.width * 1.2 * scale);
  const height = Math.ceil(screen.height * 1.2 * scale);
  portalCount += 1;
  const key = `${AI_WORLD_PORTAL_CANVAS}-${portalCount}`;
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) return undefined;
  const ctx = canvas.getContext();

  // The whirlpool is worked out on a half-size canvas (soft anyway, and cheap).
  const sw = Math.max(8, Math.round(width / 2));
  const sh = Math.max(8, Math.round(height / 2));
  const swirlCanvas = document.createElement("canvas");
  swirlCanvas.width = sw;
  swirlCanvas.height = sh;
  const swirlCtx = swirlCanvas.getContext("2d");
  if (!swirlCtx) return undefined;
  const out = swirlCtx.createImageData(sw, sh);
  const scx = sw / 2;
  const scy = sh / 2;
  const maxR = Math.hypot(scx, scy);
  // Each pixel's angle, its curl along the arm, and its distance, worked out once.
  const angle = new Float32Array(sw * sh);
  const curl = new Float32Array(sw * sh);
  const near = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const i = y * sw + x;
      const r = Math.hypot(x - scx, y - scy);
      angle[i] = Math.atan2(y - scy, x - scx);
      curl[i] = PORTAL_SWIRL.curl * Math.log(1 + r / 6);
      near[i] = r / maxR;
    }
  }
  const mood: AiWorldPortalMood = { level: "plain", flare: 0 };
  const { deep, light } = PORTAL_SWIRL;
  const swirl = (t: number) => {
    const phase = t * PORTAL_SWIRL.speed;
    const drift = t * 0.35;
    // The mood, worked out once per drawing.
    const breath = mood.level === "awake" ? Math.sin((t * Math.PI * 2) / 2.6) * 0.08 : 0;
    const gain = 1 + breath;
    const lift = breath * 0.5;
    const flash = Math.min(1, mood.flare) * 0.6;
    for (let i = 0; i < angle.length; i += 1) {
      // Soft arms, with a slow second wave so they never look mechanical.
      const wave = Math.sin(PORTAL_SWIRL.arms * angle[i] + curl[i] - phase)
        + 0.35 * Math.sin(2 * angle[i] - curl[i] * 0.6 + drift);
      let k = 0.5 + 0.38 * wave;
      // A soft glow in the middle and a darker rim, for depth.
      const d = near[i];
      k += 0.45 * Math.exp(-(d * d) / 0.035);
      k -= 0.22 * d * d;
      k = k * gain + lift + mood.flare * 0.35;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      let r = deep[0] + (light[0] - deep[0]) * k;
      let g = deep[1] + (light[1] - deep[1]) * k;
      let b = deep[2] + (light[2] - deep[2]) * k;
      if (flash > 0) {
        r += (255 - r) * flash; g += (255 - g) * flash; b += (255 - b) * flash;
      }
      const o4 = i * 4;
      out.data[o4] = r;
      out.data[o4 + 1] = g;
      out.data[o4 + 2] = b;
      out.data[o4 + 3] = 255;
    }
    swirlCtx.putImageData(out, 0, 0);
  };

  const newSparkle = (now: number) => ({
    x: 0.15 + Math.random() * 0.7,
    y: 0.12 + Math.random() * 0.76,
    size: 3 + Math.random() * 4,
    born: now + Math.random() * 2,
    duration: 0.8 + Math.random() * 1.2,
  });
  const sparkles = Array.from({ length: 4 }, () => newSparkle(scene.time.now / 1000));

  const draw = (time: number) => {
    const t = time / 1000;
    swirl(t);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(swirlCanvas, 0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sparkles.forEach((sparkle) => {
      const life = (t - sparkle.born) / sparkle.duration;
      if (life >= 1) {
        Object.assign(sparkle, newSparkle(t));
        return;
      }
      if (life < 0) return;
      const shine = Math.sin(life * Math.PI) ** 2;
      const arm = sparkle.size * (0.6 + shine);
      const sx = sparkle.x * width;
      const sy = sparkle.y * height;
      const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, arm * 0.7);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.8 * shine})`);
      core.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(sx - arm, sy - arm, arm * 2, arm * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * shine})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(sx - arm, sy);
      ctx.lineTo(sx + arm, sy);
      ctx.moveTo(sx, sy - arm);
      ctx.lineTo(sx, sy + arm);
      ctx.stroke();
    });
    ctx.restore();
    canvas.refresh();
  };
  draw(scene.time.now);

  const portal = scene.add
    .image(screen.left + screen.width / 2, screen.top + screen.height / 2, key)
    .setDisplaySize(width / scale, height / scale);
  portal.setData(PORTAL_MOOD_KEY, mood);
  applyAiWorldPortalMask(portal, openingMask, scene);

  const portalRedrawMs = getAmbientRedrawIntervalMs();
  let last = 0;
  const onUpdate = (time: number) => {
    if (time - last < portalRedrawMs) return;
    last = time;
    draw(time);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  // Stops drawing (and frees its canvas) when the portal goes, e.g. after the
  // intro paints a still picture of the village.
  portal.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    openingMask.destroy();
    if (scene.textures.exists(key)) scene.textures.remove(key);
  });
  return portal;
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

/** The y where a scenery piece meets the ground (its picture's bottom line). */
export function getSceneryGroundY(scenery: SceneryDefinition) {
  return scenery.position.y + (scenery.groundLine - 0.5) * scenery.displaySize.height;
}

export function updateVillageSceneryDepths(
  layers: readonly VillageSceneryLayer[],
  playerPosition: Point,
  collision?: CollisionDefinition,
) {
  const playerDepth = getVillagePlayerDepth(playerPosition.y);
  layers.forEach(({ definition, image, depthBackdrops, depthFollowers }) => {
    // Midi behind the building's ground outline: it draws over her. Pieces
    // without an outline fall back to their ground line.
    const occludesPlayer =
      (collision &&
        isPlayerBehindBuilding(collision, definition.id, playerPosition)) ??
      playerPosition.y < getSceneryGroundY(definition) - 2;
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
  preloadFountainAssets(scene);
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
