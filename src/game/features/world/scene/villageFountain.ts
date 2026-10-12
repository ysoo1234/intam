import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { getAmbientRedrawIntervalMs } from "../../../core/runtime/devicePerformance";
import type { SceneryDefinition } from "../model/mapDefinition";

export const FOUNTAIN_ORB_TEXTURE = "village-fountain-orb";
const FOUNTAIN_SHIMMER_TEXTURE = "village-fountain-shimmer";

/**
 * Places on the fountain picture (v5, 1155 x 1218 source), as fractions of
 * its width (x, rx, diameter) and height (y, ry).
 */
const FOUNTAIN = {
  /** The orb resting on top of the jet. */
  orb: { x: 0.5022, y: 0.0575, diameter: 0.1065 },
  /** The small water dish under the orb, where the jet rises from. */
  topWater: { x: 0.5013, y: 0.1724, rx: 0.058, ry: 0.0255 },
  /** Basins whose water carries soft rings spreading out from the middle. */
  basins: [
    { x: 0.5004, y: 0.3596, rx: 0.2407, squash: 0.41, everyS: 1.25 },
    { x: 0.5004, y: 0.6856, rx: 0.3948, squash: 0.395, everyS: 1.05 },
  ],
  /** Where the two falling streams land in the lower basin. */
  splashes: [[0.284, 0.703], [0.706, 0.703]],
} as const;

/** One spreading ring: how long it lives (s), and its brightest alpha. */
const BASIN_RING = { lifeS: 3.6, alpha: 0.34 } as const;
/**
 * The orb's loop: it rests and bobs on the jet, then the water pumps up and
 * throws it higher, it hangs for a moment and drops back with a small bounce.
 */
const ORB_LOOP = {
  periodS: 3.8,
  restS: 2.25,
  pumpS: 0.16,
  riseS: 0.42,
  hangS: 0.14,
  fallS: 0.42,
  /** How high the pump throws the orb (logical px). */
  lift: 17,
} as const;
const GRAVITY = 320;

type Drop = { x: number; y: number; vx: number; vy: number; r: number; floor: number };
type Bubble = { x: number; y: number; r: number; born: number; life: number };

export function preloadFountainAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(FOUNTAIN_ORB_TEXTURE)) {
    scene.load.image(FOUNTAIN_ORB_TEXTURE, GAME_ASSETS.world.fountainOrb);
  }
}

const easeOutQuad = (k: number) => 1 - (1 - k) * (1 - k);
const easeInQuad = (k: number) => k * k;

/**
 * Where the orb is in its loop at time `t` (s): height above its rest spot
 * (logical px, up is positive), squash (x, y) and the jet's extra strength.
 */
function orbPose(t: number) {
  const k = ((t % ORB_LOOP.periodS) + ORB_LOOP.periodS) % ORB_LOOP.periodS;
  const { restS, pumpS, riseS, hangS, fallS, lift } = ORB_LOOP;
  const bob = Math.sin(t * Math.PI * 1.7) * 0.7;
  if (k < restS) return { up: bob, sx: 1, sy: 1, pump: 0, phase: "rest" as const };
  let s = k - restS;
  if (s < pumpS) {
    // The water swells under the orb: it squashes a little, ready to go.
    const p = Math.sin((s / pumpS) * Math.PI * 0.5);
    return { up: bob * (1 - p), sx: 1 + 0.07 * p, sy: 1 - 0.07 * p, pump: p, phase: "pump" as const };
  }
  s -= pumpS;
  if (s < riseS) {
    const p = easeOutQuad(s / riseS);
    return { up: lift * p, sx: 1 - 0.05 * (1 - p), sy: 1 + 0.06 * (1 - p), pump: 1, phase: "rise" as const };
  }
  s -= riseS;
  if (s < hangS) return { up: lift + Math.sin((s / hangS) * Math.PI) * 1.2, sx: 1, sy: 1, pump: 1, phase: "hang" as const };
  s -= hangS;
  if (s < fallS) {
    const p = easeInQuad(s / fallS);
    return { up: lift * (1 - p), sx: 1, sy: 1 + 0.03 * p, pump: 1 - p * 0.8, phase: "fall" as const };
  }
  s -= fallS;
  // Lands: a soft squash that settles.
  const p = Math.min(1, s / 0.3);
  const squash = Math.sin(p * Math.PI) * (1 - p * 0.4);
  return { up: -1.2 * squash, sx: 1 + 0.08 * squash, sy: 1 - 0.08 * squash, pump: 0.2 * (1 - p), phase: "land" as const };
}

/**
 * The fountain's water, all in code over the fountain picture:
 * - the orb rides a jet of water that every few seconds pumps up and throws
 *   it a little higher, with a spray of drops falling back into the dish;
 * - soft rings spread slowly out across both basins;
 * - foam bubbles where the two streams land (the rings fade out around them) (and at the jet's foot),
 *   swelling and popping;
 * - bright streaks slide down the falling streams, and small glints twinkle.
 * Returns the pieces in drawing order (they follow the fountain's depth).
 */
export function createFountainFlow(
  scene: Phaser.Scene,
  scenery: SceneryDefinition,
): Array<Phaser.GameObjects.GameObject & { setDepth(depth: number): unknown }> {
  if (scenery.id !== "fountain" || !scene.textures.exists(scenery.assetKey)) return [];
  const source = scene.textures.get(scenery.assetKey).getSourceImage() as CanvasImageSource & {
    width: number; height: number;
  };
  // Full picture resolution, so the moving light is as crisp as the art.
  const width = source.width;
  const height = source.height;
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

  // --- World placement -------------------------------------------------------
  const { x: cx, y: cy } = scenery.position;
  const { width: dw, height: dh } = scenery.displaySize;
  const flip = scenery.flipX ? -1 : 1;
  const worldX = (fx: number) => cx + (fx - 0.5) * dw * flip;
  const worldY = (fy: number) => cy + (fy - 0.5) * dh;

  // --- Canvas light (masked to the water) -------------------------------------
  const glint = () => ({
    x: 0, y: 0, size: 2.4 + Math.random() * 3.4,
    born: scene.time.now / 1000 + Math.random() * 2, life: 0.7 + Math.random() * 1.1,
  });
  const poolPoints: Array<[number, number]> = [];
  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      if (pool.data[(y * width + x) * 4 + 3] > 0) poolPoints.push([x, y]);
    }
  }
  const place = (g: ReturnType<typeof glint>) => {
    const point = poolPoints[Math.floor(Math.random() * poolPoints.length)];
    if (point) [g.x, g.y] = point;
  };
  const glints = Array.from({ length: 6 }, glint);
  glints.forEach(place);
  const startS = scene.time.now / 1000;
  const basinRings: Array<{ basin: number; born: number }> = [];
  const nextBasinRing = FOUNTAIN.basins.map((_, index) => startS + index * 0.5);
  // Pre-fill so the basins already have rings on screen at the start.
  FOUNTAIN.basins.forEach((basin, index) => {
    for (let back = basin.everyS; back < BASIN_RING.lifeS; back += basin.everyS) {
      basinRings.push({ basin: index, born: startS - back });
    }
  });

  const drawRing = (x: number, y: number, rx: number, ry: number, alpha: number, line: number) => {
    // A wide faint stroke under a thin bright one: a soft edge, not a hard line.
    layerCtx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
    layerCtx.lineWidth = line * 3;
    layerCtx.beginPath();
    layerCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    layerCtx.stroke();
    layerCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
    layerCtx.lineWidth = line;
    layerCtx.stroke();
  };

  const paintWater = (t: number) => {
    ctx.clearRect(0, 0, width, height);
    layerCtx.globalCompositeOperation = "source-over";
    layerCtx.clearRect(0, 0, width, height);
    // A broad, very soft band of light drifting across.
    const shift = ((t * 0.045) % 1) * width * 1.6 - width * 0.3;
    const band = layerCtx.createLinearGradient(shift - 70, -60, shift + 70, 60);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, "rgba(255,255,255,0.13)");
    band.addColorStop(1, "rgba(255,255,255,0)");
    layerCtx.fillStyle = band;
    layerCtx.fillRect(0, 0, width, height);
    // Rings spreading slowly from the middle of each basin.
    FOUNTAIN.basins.forEach((basin, index) => {
      if (t >= nextBasinRing[index]) {
        basinRings.push({ basin: index, born: t });
        nextBasinRing[index] = t + basin.everyS * (0.85 + Math.random() * 0.3);
      }
    });
    for (let i = basinRings.length - 1; i >= 0; i -= 1) {
      const ring = basinRings[i];
      const k = (t - ring.born) / BASIN_RING.lifeS;
      if (k >= 1) { basinRings.splice(i, 1); continue; }
      if (k < 0) continue;
      const basin = FOUNTAIN.basins[ring.basin];
      const rx = basin.rx * width * (0.32 + 0.7 * easeOutQuad(k));
      const fade = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k) ** 0.6;
      drawRing(basin.x * width, basin.y * height, rx, rx * basin.squash, BASIN_RING.alpha * fade, 1.8);
    }
    // Around the foam the rings fade out, so they never cross the bubbles.
    layerCtx.globalCompositeOperation = "destination-out";
    FOUNTAIN.splashes.forEach(([fx, fy]) => {
      const x = fx * width;
      const y = fy * height;
      const r = width * 0.09;
      const hole = layerCtx.createRadialGradient(x, y, 0, x, y, r);
      hole.addColorStop(0, "rgba(0,0,0,1)");
      hole.addColorStop(0.6, "rgba(0,0,0,0.85)");
      hole.addColorStop(1, "rgba(0,0,0,0)");
      layerCtx.fillStyle = hole;
      layerCtx.save();
      layerCtx.translate(x, y);
      layerCtx.scale(1, 0.45);
      layerCtx.translate(-x, -y);
      layerCtx.fillRect(x - r, y - r, r * 2, r * 2);
      layerCtx.restore();
    });
    layerCtx.globalCompositeOperation = "source-over";
    // Glints: each at its own random spot and moment.
    glints.forEach((g) => {
      let k = (t - g.born) / g.life;
      if (k >= 1) {
        Object.assign(g, glint());
        place(g);
        k = (t - g.born) / g.life;
      }
      if (k < 0) return;
      const shine = Math.sin(k * Math.PI);
      layerCtx.fillStyle = `rgba(255,255,255,${0.8 * shine})`;
      layerCtx.beginPath();
      layerCtx.arc(g.x, g.y, g.size * (0.6 + shine * 0.6), 0, Math.PI * 2);
      layerCtx.fill();
    });
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.drawImage(poolMask, 0, 0);
    ctx.drawImage(layer, 0, 0);
    // Streams: bright streaks sliding down the falling water.
    layerCtx.globalCompositeOperation = "source-over";
    layerCtx.clearRect(0, 0, width, height);
    const fall = (t * 96) % 44;
    for (let y = -44 + fall; y < height; y += 44) {
      const streak = layerCtx.createLinearGradient(0, y, 0, y + 22);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(255,255,255,0.6)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      layerCtx.fillStyle = streak;
      layerCtx.fillRect(0, y, width, 22);
    }
    layerCtx.globalCompositeOperation = "destination-in";
    layerCtx.drawImage(streamMask, 0, 0);
    ctx.drawImage(layer, 0, 0);
    canvas.refresh();
  };
  paintWater(startS);

  const shimmer = scene.add
    .image(cx, cy, key)
    .setDisplaySize(dw, dh)
    .setFlipX(Boolean(scenery.flipX))
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.7);

  // --- Foam, jet, orb and drops (drawn every frame, crisp at any size) -----
  const foam = scene.add.graphics();
  const jet = scene.add.graphics();
  const orbDiameter = FOUNTAIN.orb.diameter * dw;
  // The orb picture has a thin clear margin around the ball (136 px box, 123 px ball).
  const orbBox = orbDiameter * (136 / 123);
  const orbRestX = worldX(FOUNTAIN.orb.x);
  const orbRestY = worldY(FOUNTAIN.orb.y);
  const hasOrb = scene.textures.exists(FOUNTAIN_ORB_TEXTURE);
  const orb = scene.add
    .image(orbRestX, orbRestY, hasOrb ? FOUNTAIN_ORB_TEXTURE : "__DEFAULT")
    .setDisplaySize(orbBox, orbBox)
    .setVisible(hasOrb);
  const orbScale = { x: orb.scaleX, y: orb.scaleY };
  const spray = scene.add.graphics();

  const dishX = worldX(FOUNTAIN.topWater.x);
  const dishY = worldY(FOUNTAIN.topWater.y);
  const foamSpots = [
    ...FOUNTAIN.splashes.map(([fx, fy]) => ({ x: worldX(fx), y: worldY(fy), spread: 7.5, rate: 15, size: 1 })),
    { x: dishX, y: dishY + 0.5, spread: 4, rate: 6, size: 0.7 },
  ];
  const bubbles: Bubble[][] = foamSpots.map(() => []);
  const nextBubble = foamSpots.map(() => startS);
  const drops: Drop[] = [];
  let lastPhase = "rest";

  const addDrops = (count: number, fromX: number, fromY: number, speed: number) => {
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      drops.push({
        x: fromX + side * (2 + Math.random() * 3),
        y: fromY,
        vx: side * (14 + Math.random() * 22),
        vy: -(speed * (0.5 + Math.random() * 0.6)),
        r: 0.8 + Math.random() * 0.6,
        floor: dishY + (Math.random() - 0.5) * 3,
      });
    }
  };

  const drawFoam = (t: number) => {
    foam.clear();
    foamSpots.forEach((spot, index) => {
      // A soft white patch that breathes a little.
      const breathe = 0.5 + 0.5 * Math.sin(t * 5.3 + index * 2.1);
      foam.fillStyle(0xffffff, 0.2 + 0.08 * breathe);
      foam.fillEllipse(spot.x, spot.y, spot.spread * 2.2, spot.spread * 0.9);
      // New bubbles at random spots in the patch.
      while (t >= nextBubble[index]) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * spot.spread;
        bubbles[index].push({
          x: spot.x + Math.cos(angle) * distance,
          y: spot.y + Math.sin(angle) * distance * 0.4,
          r: (0.7 + Math.random() * 1.1) * spot.size,
          born: nextBubble[index],
          life: 0.45 + Math.random() * 0.45,
        });
        nextBubble[index] += 1 / spot.rate;
      }
      const list = bubbles[index];
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const bubble = list[i];
        const k = (t - bubble.born) / bubble.life;
        if (k >= 1) { list.splice(i, 1); continue; }
        const y = bubble.y - k * 1.6;
        const r = bubble.r * (0.55 + 0.65 * Math.min(1, k / 0.8));
        if (k < 0.82) {
          // A round bubble: white with a thin blue rim and a tiny shine.
          foam.fillStyle(0xffffff, 0.88);
          foam.fillCircle(bubble.x, y, r);
          foam.lineStyle(0.6, 0x6fcfe6, 0.7);
          foam.strokeCircle(bubble.x, y, r);
          foam.fillStyle(0xffffff, 1);
          foam.fillCircle(bubble.x - r * 0.35, y - r * 0.35, r * 0.28);
        } else {
          // Pop: a fading ring that opens up.
          const p = (k - 0.82) / 0.18;
          foam.lineStyle(0.8, 0xffffff, 0.85 * (1 - p));
          foam.strokeCircle(bubble.x, y, r * (1 + p * 0.9));
        }
      }
    });
  };

  const drawJet = (t: number, pose: ReturnType<typeof orbPose>) => {
    jet.clear();
    if (!hasOrb) return;
    const orbY = orbRestY - pose.up;
    const topY = orbY + orbDiameter * 0.28;
    const bottomY = dishY + 1;
    const length = bottomY - topY;
    if (length <= 0) return;
    const swell = 1 + 0.18 * pose.pump;
    const topHalf = orbDiameter * 0.17 * swell;
    const bottomHalf = orbDiameter * 0.24 * swell;
    const wobble = Math.sin(t * 9) * 0.35;
    const points = [
      new Phaser.Math.Vector2(dishX - bottomHalf, bottomY),
      new Phaser.Math.Vector2(dishX - topHalf + wobble, topY),
      new Phaser.Math.Vector2(dishX + topHalf + wobble, topY),
      new Phaser.Math.Vector2(dishX + bottomHalf, bottomY),
    ];
    jet.fillStyle(0xc9f4fb, 0.8);
    jet.fillPoints(points, true);
    jet.lineStyle(1.1, 0x3cb7d6, 0.55);
    jet.lineBetween(points[0].x, points[0].y, points[1].x, points[1].y);
    jet.lineBetween(points[2].x, points[2].y, points[3].x, points[3].y);
    // A bright line down the left side, and light rising up the water.
    jet.lineStyle(1.4, 0xffffff, 0.75);
    jet.lineBetween(dishX - bottomHalf * 0.45, bottomY - 1, dishX - topHalf * 0.45 + wobble, topY + 1);
    const step = 6;
    const offset = (t * (70 + 60 * pose.pump)) % step;
    for (let y = bottomY - offset; y > topY + 1; y -= step) {
      const along = (bottomY - y) / length;
      const half = bottomHalf + (topHalf - bottomHalf) * along;
      jet.fillStyle(0xffffff, 0.45);
      jet.fillEllipse(dishX + half * 0.25 + wobble * along, y, half * 0.55, 2.2);
    }
    // Where the jet leaves the dish, a little crown of white water.
    jet.fillStyle(0xffffff, 0.55 + 0.25 * pose.pump);
    jet.fillEllipse(dishX, bottomY, bottomHalf * 2.6, 2.8 + 1.4 * pose.pump);
  };

  const drawSpray = (dt: number) => {
    spray.clear();
    for (let i = drops.length - 1; i >= 0; i -= 1) {
      const drop = drops[i];
      drop.vy += GRAVITY * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      if (drop.vy > 0 && drop.y >= drop.floor) {
        drops.splice(i, 1);
        continue;
      }
      spray.fillStyle(0xeafcff, 0.95);
      spray.fillCircle(drop.x, drop.y, drop.r);
      spray.lineStyle(0.6, 0x4fc2dc, 0.7);
      spray.strokeCircle(drop.x, drop.y, drop.r);
    }
  };

  const phase0 = Math.random() * ORB_LOOP.periodS;
  let lastFrame = scene.time.now / 1000;
  const animate = (time: number) => {
    const t = time / 1000;
    const dt = Math.min(0.05, Math.max(0, t - lastFrame));
    lastFrame = t;
    const pose = orbPose(t + phase0);
    if (hasOrb) {
      orb.setPosition(orbRestX, orbRestY - pose.up);
      orb.setScale(orbScale.x * pose.sx, orbScale.y * pose.sy);
      if (pose.phase !== lastPhase) {
        // The pump throws drops off the orb; the landing splashes the dish.
        if (pose.phase === "rise") addDrops(4, orbRestX, orbRestY + orbDiameter * 0.3, 65);
        if (pose.phase === "land") addDrops(2, dishX, dishY - 1, 40);
        lastPhase = pose.phase;
      }
    }
    drawJet(t, pose);
    drawFoam(t);
    drawSpray(dt);
  };
  animate(scene.time.now);

  const redrawMs = getAmbientRedrawIntervalMs();
  let lastPaint = 0;
  const onUpdate = (time: number) => {
    animate(time);
    if (time - lastPaint < redrawMs) return;
    lastPaint = time;
    paintWater(time / 1000);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate));
  return [shimmer, foam, jet, orb, spray];
}
