import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE_PATH = path.resolve(
  "assets-source/world/village-ai-world-portal-v2.png",
);
const OUTPUT_PATH = path.resolve(
  "assets-source/world/village-ai-world-portal-frames-v3.png",
);
const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 244;
const FRAME_COUNT = 64;
const COLUMNS = 8;
const ROWS = Math.ceil(FRAME_COUNT / COLUMNS);
const ROTATION_CANVAS_SIZE = 544;

const squarePortal = await sharp(SOURCE_PATH)
  .trim()
  .resize(ROTATION_CANVAS_SIZE, ROTATION_CANVAS_SIZE, { fit: "cover" })
  .flatten({ background: "#006783" })
  .png()
  .toBuffer();

const frames = [];
for (let frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex += 1) {
  const angle = (frameIndex / FRAME_COUNT) * 360;
  const rotatedPortal = await sharp(squarePortal)
    .rotate(angle, {
      background: { r: 0, g: 103, b: 131, alpha: 1 },
    })
    .png()
    .toBuffer();
  const metadata = await sharp(rotatedPortal).metadata();
  const left = Math.round(metadata.width / 2 - 130);
  const top = Math.round(metadata.height / 2 - 150);
  const frame = await sharp(rotatedPortal)
    .extract({ left, top, width: FRAME_WIDTH, height: FRAME_HEIGHT })
    .png()
    .toBuffer();
  frames.push({
    input: frame,
    left: (frameIndex % COLUMNS) * FRAME_WIDTH,
    top: Math.floor(frameIndex / COLUMNS) * FRAME_HEIGHT,
  });
}

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await sharp({
  create: {
    width: COLUMNS * FRAME_WIDTH,
    height: ROWS * FRAME_HEIGHT,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(frames)
  .png()
  .toFile(OUTPUT_PATH);

console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);
