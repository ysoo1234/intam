import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "assets-source", "world");
const FOUNTAIN = path.join(SOURCE_ROOT, "village-fountain-v3.png");
const OUTPUT = path.join(
  SOURCE_ROOT,
  "village-fountain-water-frames-v1.png",
);

const GRID_SIZE = 4;
const FRAME_SIZE = 313;
const SHEET_SIZE = GRID_SIZE * FRAME_SIZE;
const MIN_COMPONENT_AREA = 36;
const STATIC_ORB_CUTOFF_Y = 34;
const LOWER_STONE_CUTOFF_Y = 252;

function isWaterPixel(red, green, blue, alpha) {
  return (
    alpha > 20 &&
    green > 85 &&
    blue > 90 &&
    (blue - red > 8 || green - red > 18)
  );
}

function removeSmallComponents(mask) {
  const visited = new Uint8Array(mask.length);
  const result = new Uint8Array(mask.length);
  const neighbours = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    const queue = [start];
    const component = [];
    visited[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      component.push(index);
      const x = index % FRAME_SIZE;
      const y = Math.floor(index / FRAME_SIZE);
      for (const [offsetX, offsetY] of neighbours) {
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (
          nextX < 0 ||
          nextX >= FRAME_SIZE ||
          nextY < 0 ||
          nextY >= FRAME_SIZE
        ) {
          continue;
        }
        const next = nextY * FRAME_SIZE + nextX;
        if (mask[next] && !visited[next]) {
          visited[next] = 1;
          queue.push(next);
        }
      }
    }
    if (component.length >= MIN_COMPONENT_AREA) {
      component.forEach((index) => {
        result[index] = 255;
      });
    }
  }
  return result;
}

async function createWaterMask() {
  const fountain = await sharp(FOUNTAIN)
    .resize(FRAME_SIZE, FRAME_SIZE, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const seed = new Uint8Array(FRAME_SIZE * FRAME_SIZE);
  for (let index = 0; index < seed.length; index += 1) {
    const offset = index * 4;
    if (
      isWaterPixel(
        fountain[offset],
        fountain[offset + 1],
        fountain[offset + 2],
        fountain[offset + 3],
      )
    ) {
      seed[index] = 1;
    }
  }
  const mask = removeSmallComponents(seed);
  for (let y = 0; y < STATIC_ORB_CUTOFF_Y; y += 1) {
    mask.fill(0, y * FRAME_SIZE, (y + 1) * FRAME_SIZE);
  }
  for (let y = LOWER_STONE_CUTOFF_Y; y < FRAME_SIZE; y += 1) {
    mask.fill(0, y * FRAME_SIZE, (y + 1) * FRAME_SIZE);
  }
  return mask;
}

const waterMask = await createWaterMask();
const output = Buffer.alloc(SHEET_SIZE * SHEET_SIZE * 4);

function positiveWave(value, sharpness = 3) {
  return Math.pow(Math.max(0, Math.sin(value)), sharpness);
}

function getWaterHighlight(x, y, phase) {
  const isLowerBasin = y >= 145;
  const centerY = isLowerBasin ? 205 : 105;
  const radius = Math.hypot(x - FRAME_SIZE / 2, (y - centerY) * 1.45);
  const ripple = positiveWave(radius * 0.23 - phase * 1.8, 5);
  const crossRipple = positiveWave(
    x * 0.095 + y * 0.055 + phase * 1.25,
    7,
  );
  const fallingGlint = positiveWave(
    y * 0.38 - phase * 3.2 + x * 0.035,
    5,
  );
  const isFallingWater = y >= 78 && y <= 220 && (x < 112 || x > 201);
  const isTopJet = y < 86 && Math.abs(x - FRAME_SIZE / 2) < 25;
  const stream = isFallingWater || isTopJet ? fallingGlint * 0.9 : 0;
  return Math.min(1, ripple * 0.62 + crossRipple * 0.28 + stream);
}

for (let frame = 0; frame < GRID_SIZE * GRID_SIZE; frame += 1) {
  const frameX = (frame % GRID_SIZE) * FRAME_SIZE;
  const frameY = Math.floor(frame / GRID_SIZE) * FRAME_SIZE;
  const phase = (frame / (GRID_SIZE * GRID_SIZE)) * Math.PI * 2;
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const destinationOffset =
        ((frameY + y) * SHEET_SIZE + frameX + x) * 4;
      const maskAlpha = waterMask[y * FRAME_SIZE + x] / 255;
      const highlight = getWaterHighlight(x, y, phase);
      output[destinationOffset] = 132;
      output[destinationOffset + 1] = 235;
      output[destinationOffset + 2] = 255;
      output[destinationOffset + 3] = Math.round(
        maskAlpha * highlight * 104,
      );
    }
  }
}

await sharp(output, {
  raw: { width: SHEET_SIZE, height: SHEET_SIZE, channels: 4 },
})
  .png()
  .toFile(OUTPUT);

console.log(`Generated ${path.relative(ROOT, OUTPUT)} (${SHEET_SIZE}x${SHEET_SIZE})`);
