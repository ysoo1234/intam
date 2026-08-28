import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const source = path.join(
  process.cwd(),
  "assets-source/ui/game-return-button-filled-v1-original.png",
);
const output = path.join(
  process.cwd(),
  "assets-source/ui/game-return-button-filled-v1.png",
);

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const pixelCount = info.width * info.height;
const visited = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function isExteriorWhite(pixelIndex) {
  const offset = pixelIndex * 4;
  return data[offset] >= 248 && data[offset + 1] >= 248 && data[offset + 2] >= 248;
}

function enqueue(pixelIndex) {
  if (visited[pixelIndex] || !isExteriorWhite(pixelIndex)) return;
  visited[pixelIndex] = 1;
  queue[tail] = pixelIndex;
  tail += 1;
}

for (let x = 0; x < info.width; x += 1) {
  enqueue(x);
  enqueue((info.height - 1) * info.width + x);
}
for (let y = 0; y < info.height; y += 1) {
  enqueue(y * info.width);
  enqueue(y * info.width + info.width - 1);
}

while (head < tail) {
  const pixelIndex = queue[head];
  head += 1;
  const x = pixelIndex % info.width;
  const y = Math.floor(pixelIndex / info.width);
  data[pixelIndex * 4 + 3] = 0;
  if (x > 0) enqueue(pixelIndex - 1);
  if (x + 1 < info.width) enqueue(pixelIndex + 1);
  if (y > 0) enqueue(pixelIndex - info.width);
  if (y + 1 < info.height) enqueue(pixelIndex + info.width);
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png()
  .toFile(output);

console.log(`Prepared transparent return button source: ${tail} exterior pixels removed.`);
