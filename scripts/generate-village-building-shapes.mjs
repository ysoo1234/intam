// Measures each village building picture so Midi walks around its ground
// outline instead of its whole picture:
// - `top` / `bottom`: the first and last painted row of every column (from
//   the WebP's alpha), so the game knows how much of Midi a building hides
//   when she stands behind it.
// - `footprint`: the outline where the building meets the ground. Its front
//   edge is the painted bottom edge (exact, pixel by pixel); its back edge is
//   hidden behind the walls, so it is drawn from the shape below (an
//   isometric box, an ellipse or a thin standing slab).
//
//   node scripts/generate-village-building-shapes.mjs [--preview]
//
// All numbers are fractions of the picture (0 = left/top, 1 = right/bottom)
// so moving or resizing a building in villageLayoutGrid.ts keeps them right.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_PATH = path.resolve(
  "src/game/features/world/model/villageBuildingShapes.ts",
);
const PREVIEW_DIR = path.resolve("tmp/village-building-shapes");
const COLUMNS = 64;
const ALPHA_THRESHOLD = 128;

/**
 * back: how the hidden back half of the ground outline runs.
 * - iso-box: the back corner of a box seen from above at an angle; it sits
 *   at left + right - front of the visible base corners.
 * - ellipse: a round base (centre and radii as picture fractions).
 * - slab: a thin standing piece; the back edge is the bottom edge raised by
 *   `depth`.
 * frontFrom / frontTo: the columns whose painted bottom touches the ground
 * (leaves out a roof that overhangs past the base).
 */
const BUILDINGS = {
  "ai-shop": {
    file: "public/assets/world/village-ai-shop.webp",
    back: { kind: "iso-box" },
  },
  airport: {
    file: "public/assets/world/village-airport.webp",
    frontTo: 0.975,
    // The plane pokes out of the door, so the box corners are given by hand:
    // the base's left foot, its front corner and its right foot.
    back: {
      kind: "iso-box",
      left: [0.03, 0.72],
      front: [0.588, 1.0],
      right: [0.975, 0.79],
    },
  },
  "ethics-office": {
    file: "public/assets/world/village-ethics-office.webp",
    back: { kind: "ellipse", centerX: 0.5, centerY: 0.79, radiusX: 0.5, radiusY: 0.21 },
  },
  "ai-world-gate": {
    file: "public/assets/world/village-tablet-gate-v5.webp",
    // The last column holds only the clasp sticking out of the right edge.
    frontTo: 0.98,
    back: { kind: "slab", depth: 0.08 },
  },
  fountain: {
    file: "public/assets/world/village-fountain-v5.webp",
    // The back follows the basin's painted top rim (not the ground under
    // it), so Midi walking behind the fountain never has the basin drawn
    // over her feet; only the tiers above hide her.
    back: { kind: "ellipse", centerX: 0.5, centerY: 0.69, radiusX: 0.5, radiusY: 0.245 },
  },
};

const round = (value) => Math.round(value * 1000) / 1000;

async function measure(file) {
  const { data, info } = await sharp(path.resolve(file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const top = [];
  const bottom = [];
  for (let column = 0; column < COLUMNS; column += 1) {
    const fromX = Math.floor((column * info.width) / COLUMNS);
    const toX = Math.max(fromX + 1, Math.floor(((column + 1) * info.width) / COLUMNS));
    let first = -1;
    let last = -1;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = fromX; x < toX; x += 1) {
        if (data[(y * info.width + x) * info.channels + 3] < ALPHA_THRESHOLD) continue;
        if (first < 0) first = y;
        last = y;
        break;
      }
    }
    top.push(first < 0 ? -1 : round(first / info.height));
    bottom.push(last < 0 ? -1 : round((last + 1) / info.height));
  }
  return { top, bottom, width: info.width, height: info.height };
}

function buildFootprint(config, bottom) {
  const front = [];
  bottom.forEach((y, column) => {
    const x = round((column + 0.5) / COLUMNS);
    if (y < 0) return;
    if (config.frontFrom !== undefined && x < config.frontFrom) return;
    if (config.frontTo !== undefined && x > config.frontTo) return;
    front.push([x, y]);
  });
  const leftEnd = front[0];
  const rightEnd = front[front.length - 1];
  const { back } = config;
  let backPoints;

  if (back.kind === "iso-box") {
    const lowest = front.reduce((best, point) => (point[1] > best[1] ? point : best));
    const left = back.left ?? leftEnd;
    const right = back.right ?? rightEnd;
    const frontCorner = back.front ?? lowest;
    const corner = [
      round(left[0] + right[0] - frontCorner[0]),
      round(left[1] + right[1] - frontCorner[1]),
    ];
    backPoints = [right, corner, left].filter(
      (point) => point !== rightEnd && point !== leftEnd,
    );
  } else if (back.kind === "ellipse") {
    backPoints = [];
    const steps = 24;
    for (let step = 1; step < steps; step += 1) {
      const angle = (step / steps) * Math.PI;
      backPoints.push([
        round(back.centerX + Math.cos(angle) * back.radiusX),
        round(back.centerY - Math.sin(angle) * back.radiusY),
      ]);
    }
  } else if (back.kind === "slab") {
    backPoints = [...front]
      .reverse()
      .map(([x, y]) => [x, round(y - back.depth)]);
  } else {
    throw new Error(`Unknown back kind ${back.kind}`);
  }

  return [...front, ...backPoints];
}

const shapes = {};
for (const [id, config] of Object.entries(BUILDINGS)) {
  const measured = await measure(config.file);
  shapes[id] = {
    source: path.basename(config.file),
    top: measured.top,
    bottom: measured.bottom,
    footprint: buildFootprint(config, measured.bottom),
    size: [measured.width, measured.height],
  };
}

const list = (values) => `[${values.join(", ")}]`;
const body = Object.entries(shapes)
  .map(([id, shape]) => `  ${JSON.stringify(id)}: {
    source: ${JSON.stringify(shape.source)},
    top: ${list(shape.top)},
    bottom: ${list(shape.bottom)},
    footprint: [
${shape.footprint.map(([x, y]) => `      [${x}, ${y}],`).join("\n")}
    ],
  },`)
  .join("\n");

await writeFile(
  OUTPUT_PATH,
  `// Generated by scripts/generate-village-building-shapes.mjs from each
// building's picture. Regenerate when a building picture changes.
//
// Fractions of the picture (0 = left/top, 1 = right/bottom), unmirrored.
// top / bottom: first and last painted row of each of ${COLUMNS} columns (-1 = empty).
// footprint: the outline where the building meets the ground.

export const VILLAGE_BUILDING_SHAPE_COLUMNS = ${COLUMNS};

export const VILLAGE_BUILDING_SHAPES = {
${body}
} as const;
`,
  "utf8",
);
console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);

if (process.argv.includes("--preview")) {
  await mkdir(PREVIEW_DIR, { recursive: true });
  for (const [id, config] of Object.entries(BUILDINGS)) {
    const shape = shapes[id];
    const [width, height] = shape.size;
    const points = shape.footprint
      .map(([x, y]) => `${x * width},${y * height}`)
      .join(" ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <polygon points="${points}" fill="rgba(230,40,60,0.35)" stroke="rgb(200,0,40)" stroke-width="2"/>
    </svg>`;
    await sharp(path.resolve(config.file))
      .flatten({ background: "#ffffff" })
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(path.join(PREVIEW_DIR, `${id}.png`));
  }
  console.log(`Wrote previews to ${path.relative(process.cwd(), PREVIEW_DIR)}`);
}
