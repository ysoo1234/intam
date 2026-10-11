import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import type {
  CollisionDefinition,
  MapDefinition,
  Point,
  SceneryDefinition,
} from "../model/mapDefinition";
import { isPlayerBehindBuilding } from "../model/villageCollision";

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

const FOUNTAIN_SHIMMER_TEXTURE = "village-fountain-shimmer";
/** Light bands over the basins: speed (screens a second), angle, brightness. */
const FOUNTAIN_LIGHT = [
  [0.05, 0.5, 0.22],
  [-0.035, 2.4, 0.16],
] as const;
/** Where the two streams land in the lower basin, as fractions of the fountain picture. */
const FOUNTAIN_SPLASHES = [[0.284, 0.703], [0.706, 0.703]] as const;
/** How long one ripple ring takes to spread out and fade (seconds). */
const FOUNTAIN_RIPPLE_LIFE = 1.7;
// What the starlight gate shows: the ending's school library, seen as through water.
const AI_WORLD_PORTAL_TEXTURE = "village-ai-world-portal-library";
const AI_WORLD_PORTAL_CANVAS = "village-ai-world-portal-water";
/** The whirlpool: how fast it turns (radians a second) and how tightly the middle is twisted. */
const SWIRL = { speed: 0.07, twist: 1.9 } as const;
/** Light veils drifting inside the portal: orbit speed, distance, size, colour. */
const VEILS = [
  { speed: 0.23, offset: 0, orbit: 0.22, size: 0.42, color: "255, 255, 255", alpha: 0.32 },
  { speed: -0.17, offset: 2.1, orbit: 0.28, size: 0.36, color: "150, 220, 255", alpha: 0.4 },
  { speed: 0.11, offset: 4.2, orbit: 0.16, size: 0.5, color: "175, 240, 170", alpha: 0.32 },
] as const;
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
) {
  const screen = getAiWorldPortalScreen(scenery);
  const maskShape = scene.make.graphics({ x: 0, y: 0 });
  maskShape.fillStyle(0xffffff);
  // Larger than the measured hole so no gap shows at its edges (the frame covers the rest).
  const cx = screen.left + screen.width / 2;
  const cy = screen.top + screen.height / 2;
  maskShape.fillPoints(
    screen.corners.map((corner) => new Phaser.Math.Vector2(
      cx + (corner.x - cx) * 1.08,
      cy + (corner.y - cy) * 1.08,
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
 * The fountain's water moves in code, inside the water of the fountain picture
 * itself, so it always lines up: soft light drifts slowly over the basins, small
 * glints twinkle at random spots, and the falling streams shimmer downward.
 */
function createFountainFlow(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): DepthFollower[] {
  if (scenery.id !== "fountain" || !scene.textures.exists(scenery.assetKey)) return [];
  const source = scene.textures.get(scenery.assetKey).getSourceImage() as CanvasImageSource & {
    width: number; height: number;
  };
  // Half the picture's size is plenty for soft light.
  const width = Math.round(source.width / 2);
  const height = Math.round(source.height / 2);
  const read = document.createElement("canvas");
  read.width = width;
  read.height = height;
  const readCtx = read.getContext("2d", { willReadFrequently: true });
  if (!readCtx) return [];
  readCtx.drawImage(source, 0, 0, width, height);
  const pixels = readCtx.getImageData(0, 0, width, height).data;
  // Water: the turquoise basins. Streams: the pale see-through falling water.
  const pool = readCtx.createImageData(width, height);
  const stream = readCtx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (a < 200) continue;
    const isPool = b > 180 && g > 150 && r < 140 && b - r > 80;
    const isStream = !isPool && b > 200 && g > 215 && r > 150 && b >= r;
    const target = isPool ? pool : isStream ? stream : undefined;
    if (!target) continue;
    target.data[i] = 255;
    target.data[i + 1] = 255;
    target.data[i + 2] = 255;
    target.data[i + 3] = 255;
  }
  const toCanvas = (data: ImageData) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    c.getContext("2d")?.putImageData(data, 0, 0);
    return c;
  };
  const poolMask = toCanvas(pool);
  const streamMask = toCanvas(stream);

  const key = `${FOUNTAIN_SHIMMER_TEXTURE}-${scene.sys.settings.key}`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) return [];
  const ctx = canvas.getContext();
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return [];

  const glint = () => ({
    x: Math.random(), y: Math.random(), size: 1.2 + Math.random() * 1.8,
    born: scene.time.now / 1000 + Math.random() * 2, life: 0.7 + Math.random() * 1.1,
  });
  // Glints only where there is water (picked from the pool mask).
  const poolPoints: Array<[number, number]> = [];
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      if (pool.data[(y * width + x) * 4 + 3] > 0) poolPoints.push([x, y]);
    }
  }
  const glints = Array.from({ length: 4 }, glint);
  // Ripples spread from where the streams land, each starting at its own
  // slightly random moment, so the rings never march in step.
  const ripples: Array<{ x: number; y: number; born: number }> = [];
  const nextRipple = FOUNTAIN_SPLASHES.map(() => scene.time.now / 1000 + Math.random() * 0.6);
  const place = (g: ReturnType<typeof glint>) => {
    const point = poolPoints[Math.floor(Math.random() * poolPoints.length)];
    if (point) [g.x, g.y] = [point[0] / width, point[1] / height];
  };
  glints.forEach(place);

  const draw = (time: number) => {
    const t = time / 1000;
    ctx.clearRect(0, 0, width, height);
    // 1) Basins: two broad bands of soft light drifting slowly in different directions.
    layerCtx.globalCompositeOperation = "source-over";
    layerCtx.clearRect(0, 0, width, height);
    for (const [speed, angle, alpha] of FOUNTAIN_LIGHT) {
      const shift = ((t * speed) % 1) * width * 1.6 - width * 0.3;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const band = layerCtx.createLinearGradient(shift - dx * 40, -dy * 40, shift + dx * 40, dy * 40);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
      band.addColorStop(1, "rgba(255,255,255,0)");
      layerCtx.fillStyle = band;
      layerCtx.fillRect(0, 0, width, height);
    }
    // Glints: each appears at its own random spot and moment, then fades.
    glints.forEach((g) => {
      let k = (t - g.born) / g.life;
      if (k >= 1) {
        Object.assign(g, glint());
        place(g);
        k = (t - g.born) / g.life;
      }
      if (k < 0) return;
      const shine = Math.sin(k * Math.PI);
      layerCtx.fillStyle = `rgba(255,255,255,${0.85 * shine})`;
      layerCtx.beginPath();
      layerCtx.arc(g.x * width, g.y * height, g.size * (0.6 + shine * 0.6), 0, Math.PI * 2);
      layerCtx.fill();
    });
    // Ripples: thin flattened rings that widen and fade where the water lands.
    FOUNTAIN_SPLASHES.forEach(([fx, fy], index) => {
      if (t >= nextRipple[index]) {
        ripples.push({ x: fx * width, y: fy * height, born: t });
        nextRipple[index] = t + 0.45 + Math.random() * 0.5;
      }
    });
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const ripple = ripples[i];
      const k = (t - ripple.born) / FOUNTAIN_RIPPLE_LIFE;
      if (k >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      const radius = 3 + k * width * 0.16;
      layerCtx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - k) ** 1.5})`;
      layerCtx.lineWidth = 1.6 - k * 0.8;
      layerCtx.beginPath();
      layerCtx.ellipse(ripple.x, ripple.y, radius, radius * 0.42, 0, 0, Math.PI * 2);
      layerCtx.stroke();
    }
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.drawImage(poolMask, 0, 0);
    ctx.drawImage(layer, 0, 0);
    // 2) Streams: bright streaks sliding down the falling water.
    layerCtx.globalCompositeOperation = "source-over";
    layerCtx.clearRect(0, 0, width, height);
    const fall = (t * 46) % 24;
    for (let y = -24 + fall; y < height; y += 24) {
      const streak = layerCtx.createLinearGradient(0, y, 0, y + 12);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(255,255,255,0.55)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      layerCtx.fillStyle = streak;
      layerCtx.fillRect(0, y, width, 12);
    }
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.drawImage(streamMask, 0, 0);
    ctx.drawImage(layer, 0, 0);
    canvas.refresh();
  };
  draw(scene.time.now);

  const { x, y } = scenery.position;
  const shimmer = scene.add
    .image(x, y, key)
    .setDisplaySize(scenery.displaySize.width, scenery.displaySize.height)
    .setFlipX(Boolean(scenery.flipX))
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.6);
  let last = 0;
  const onUpdate = (time: number) => {
    if (time - last < 40) return;
    last = time;
    draw(time);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate));
  return [shimmer];
}


/**
 * The far side of the starlight gate: the school library from the ending,
 * blurred and rippling like a view through water, so it can only just be
 * made out. Drawn into a small canvas each frame: the blurred picture in thin
 * a slow, smooth whirlpool, a pale misty tint, and soft drifting light.
 */
function createAiWorldPortal(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): DepthFollower[] {
  if (scenery.id !== "ai-world-gate") return [];
  const screen = getAiWorldPortalScreen(scenery);
  const portalCenterX = screen.left + screen.width / 2;
  const portalCenterY = screen.top + screen.height / 2;
  const openingMask = createAiWorldPortalMask(scene, scenery);
  if (!scene.textures.exists(AI_WORLD_PORTAL_TEXTURE)) return [];

  // Canvas a little larger than the screen, at 2x for crispness.
  const scale = 2;
  const width = Math.ceil(screen.width * 1.2 * scale);
  const height = Math.ceil(screen.height * 1.2 * scale);
  const key = `${AI_WORLD_PORTAL_CANVAS}-${scene.sys.settings.key}`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) return [];
  const ctx = canvas.getContext();

  // Blur by shrinking the library picture and drawing it back up (works in every browser).
  const source = scene.textures.get(AI_WORLD_PORTAL_TEXTURE).getSourceImage() as CanvasImageSource & {
    width: number; height: number;
  };
  // The middle of the library (shelves and windows); the screen is tall, so fit by height.
  const cropH = source.height * 0.92;
  const crop = { w: Math.min(source.width, cropH * (width / height)), h: cropH };
  // Blur by shrinking the picture to a few pixels and growing it back in two
  // steps (the second step smooths away the blocky look). Works in every browser.
  const tiny = document.createElement("canvas");
  tiny.width = 5;
  tiny.height = Math.max(1, Math.round((5 * height) / width));
  const mid = document.createElement("canvas");
  mid.width = tiny.width * 4;
  mid.height = tiny.height * 4;
  const blurred = document.createElement("canvas");
  blurred.width = width;
  blurred.height = height;
  const tinyCtx = tiny.getContext("2d");
  const midCtx = mid.getContext("2d");
  const blurCtx = blurred.getContext("2d");
  if (!tinyCtx || !midCtx || !blurCtx) return [];
  tinyCtx.drawImage(source, (source.width - crop.w) / 2, (source.height - crop.h) / 2, crop.w, crop.h, 0, 0, tiny.width, tiny.height);
  midCtx.drawImage(tiny, 0, 0, mid.width, mid.height);
  blurCtx.drawImage(mid, 0, 0, width, height);
  const newSparkle = (now: number) => ({
    x: 0.12 + Math.random() * 0.76,
    y: 0.1 + Math.random() * 0.8,
    size: 4 + Math.random() * 5,
    born: now + Math.random() * 1.6,
    duration: 0.9 + Math.random() * 1.4,
  });
  const sparkles = Array.from({ length: 6 }, () => newSparkle(scene.time.now / 1000 - Math.random() * 2));
  // The swirl is worked out on a half-size copy (smooth anyway, and cheap).
  const sw = Math.max(8, Math.round(width / 2));
  const sh = Math.max(8, Math.round(height / 2));
  const swirlCanvas = document.createElement("canvas");
  swirlCanvas.width = sw;
  swirlCanvas.height = sh;
  const swirlCtx = swirlCanvas.getContext("2d");
  const sourceSmall = document.createElement("canvas");
  sourceSmall.width = sw;
  sourceSmall.height = sh;
  const sourceSmallCtx = sourceSmall.getContext("2d");
  if (!swirlCtx || !sourceSmallCtx) return [];
  // A slightly larger copy, so turning never shows an empty corner.
  sourceSmallCtx.drawImage(blurred, -sw * 0.1, -sh * 0.1, sw * 1.2, sh * 1.2);
  const from = sourceSmallCtx.getImageData(0, 0, sw, sh).data;
  // Only the picture's light and shade are kept, painted from bright sky blue
  // (darker parts) to fresh lime green (lighter parts), so no browns or muddy
  // mixes appear in the swirl.
  for (let i = 0; i < from.length; i += 4) {
    const light = (from[i] * 0.3 + from[i + 1] * 0.59 + from[i + 2] * 0.11) / 255;
    // Gentle contrast and soft, muted colours, so the swirl is calm to look at.
    const k = Math.min(1, Math.max(0, (light - 0.15) / 0.85));
    from[i] = 150 + (182 - 150) * k;
    from[i + 1] = 196 + (210 - 196) * k;
    from[i + 2] = 214 + (170 - 214) * k;
  }
  const out = swirlCtx.createImageData(sw, sh);
  const scx = sw / 2;
  const scy = sh / 2;
  const maxR = Math.hypot(scx, scy);
  // Each pixel's distance and angle from the centre, worked out once.
  const radius = new Float32Array(sw * sh);
  const baseAngle = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const dx = x - scx;
      const dy = y - scy;
      radius[y * sw + x] = Math.hypot(dx, dy);
      baseAngle[y * sw + x] = Math.atan2(dy, dx);
    }
  }
  const swirl = (t: number) => {
    const turn = t * SWIRL.speed;
    for (let i = 0; i < radius.length; i += 1) {
      const r = radius[i];
      const near = 1 - Math.min(1, r / maxR);
      const angle = baseAngle[i] + turn * (0.4 + near) + SWIRL.twist * near * near;
      let x = Math.round(scx + Math.cos(angle) * r);
      let y = Math.round(scy + Math.sin(angle) * r);
      x = x < 0 ? 0 : x >= sw ? sw - 1 : x;
      y = y < 0 ? 0 : y >= sh ? sh - 1 : y;
      const s4 = (y * sw + x) * 4;
      const o4 = i * 4;
      out.data[o4] = from[s4];
      out.data[o4 + 1] = from[s4 + 1];
      out.data[o4 + 2] = from[s4 + 2];
      out.data[o4 + 3] = 255;
    }
    swirlCtx.putImageData(out, 0, 0);
  };
  const draw = (time: number) => {
    const t = time / 1000;
    ctx.clearRect(0, 0, width, height);
    // A slow whirlpool: every pixel is turned around the middle, more near
    // the centre and less at the edge, so the blurred picture twists into a
    // smooth spiral that keeps slowly turning.
    swirl(t);
    ctx.drawImage(swirlCanvas, 0, 0, width, height);
    // Bright, misty portal light: the picture shows through a pale cyan glow.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const tint = ctx.createLinearGradient(0, 0, 0, height);
    // Bright like the textbook portal: clear sky blue at the top, fresh leaf green below.
    tint.addColorStop(0, "rgba(190, 225, 240, 0.18)");
    tint.addColorStop(1, "rgba(205, 230, 190, 0.18)");
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // A soft white glow around the rim, brightest at the edges, like the textbook's portal.
    const cx = width / 2;
    const cy = height / 2;
    const rim = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.28, cx, cy, Math.max(width, height) * 0.62);
    rim.addColorStop(0, "rgba(255, 255, 255, 0)");
    const breathe = 0.32 + 0.06 * Math.sin(t * 0.7) + 0.05 * Math.sin(t * 1.9 + 1.3);
    rim.addColorStop(1, `rgba(235, 250, 255, ${breathe})`);
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, width, height);
    // Soft veils of light drift around the middle at different speeds and
    // distances, so the glow keeps changing shape like a slow nebula.
    VEILS.forEach((veil) => {
      const angle = t * veil.speed + veil.offset;
      const wobble = 1 + 0.18 * Math.sin(t * veil.speed * 2.3 + veil.offset * 3);
      const vx = cx + Math.cos(angle) * width * veil.orbit * wobble;
      const vy = cy + Math.sin(angle * 0.8) * height * veil.orbit;
      const radius = Math.max(width, height) * veil.size;
      const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, radius);
      glow.addColorStop(0, `rgba(${veil.color}, ${veil.alpha})`);
      glow.addColorStop(1, `rgba(${veil.color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    });
    // Sparkles appear at random spots, twinkle once and fade, each on its own clock.
    sparkles.forEach((sparkle) => {
      let life = (t - sparkle.born) / sparkle.duration;
      if (life >= 1 || life < 0) {
        Object.assign(sparkle, newSparkle(t));
        life = 0;
      }
      const shine = Math.sin(life * Math.PI) ** 2;
      if (shine < 0.02) return;
      const arm = sparkle.size * (0.6 + shine);
      const sx = sparkle.x * width;
      const sy = sparkle.y * height;
      const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, arm * 0.7);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.9 * shine})`);
      core.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(sx - arm, sy - arm, arm * 2, arm * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * shine})`;
      ctx.lineWidth = 1.2;
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
    .image(portalCenterX, portalCenterY, key)
    .setDisplaySize(width / scale, height / scale);
  applyAiWorldPortalMask(portal, openingMask, scene);

  // About 30 updates a second is plenty for slow water.
  let last = 0;
  const onUpdate = (time: number) => {
    if (time - last < 33) return;
    last = time;
    draw(time);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  });

  return [portal];
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
  if (!scene.textures.exists(AI_WORLD_PORTAL_TEXTURE)) {
    scene.load.image(
      AI_WORLD_PORTAL_TEXTURE,
      GAME_ASSETS.ending.library,
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
