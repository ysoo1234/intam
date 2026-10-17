import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
const MAX_RUNTIME_BYTES = 20 * 1024 * 1024;
const MAX_RUNTIME_SINGLE_BYTES = 2 * 1024 * 1024;
const EXPECTED_CUSTOMER_COUNT = 52;
const CUSTOMER_RUNTIME_PREFIX = "customers/v3-game/";
// The 24 ethics review students (both moods each), on a 1.4x customer canvas: 636 x 952.
const STUDENT_RUNTIME_PREFIX = "ethics-review/students/";
const EXPECTED_STUDENT_COUNT = 48;
const CUSTOMER_RUNTIME_SPEC = {
  format: "webp",
  width: 454,
  height: 680,
};
const WORKSHOP_PRODUCT_IDS = [
  "ai-speaker",
  "call-translator",
  "photo-translator",
  "plant-camera",
  "face-lock",
  "spell-checker",
  "smart-fridge",
  "robot-vacuum",
  "pet-care-robot",
  "security-camera",
  "smart-air-purifier",
  "smart-washer",
  "study-helper",
  "nutrition-kiosk",
  "medical-reader",
  "smart-band",
  "ai-wheelchair",
  "road-safety-cctv",
  "autonomous-car",
  "delivery-robot",
  "drone-taxi",
  "crop-drone",
  "harvest-robot",
  "greenhouse-computer",
  "smart-watering",
  "performance-interpreter",
];

const RUNTIME_SPECS = new Map([
  ["ethics-review/stamp-tool-approve-v3.webp", { format: "webp", width: 444, height: 476, hasAlpha: true }],
  ["ethics-review/stamp-tool-reject-v3.webp", { format: "webp", width: 444, height: 476, hasAlpha: true }],
  ["ethics-review/stamp-topic-permission-v2.webp", { format: "webp", width: 320, height: 244, hasAlpha: true }],
  ["ethics-review/stamp-topic-privacy-v1.webp", { format: "webp", width: 311, height: 280, hasAlpha: true }],
  ["ethics-review/stamp-topic-checking-v1.webp", { format: "webp", width: 320, height: 263, hasAlpha: true }],
  ["ethics-review/stamp-topic-honesty-v1.webp", { format: "webp", width: 289, height: 280, hasAlpha: true }],
  ["ethics-review/stamp-topic-respect-v1.webp", { format: "webp", width: 320, height: 269, hasAlpha: true }],
  ["ethics-review/ethics-booth-panel-v8.webp", { format: "webp", width: 1086, height: 1448, hasAlpha: false }],
  ["ethics-review/ethics-booth-front-v8.webp", { format: "webp", width: 1086, height: 1448, hasAlpha: true }],
  ["ethics-review/ethics-desk-panel-v9.webp", { format: "webp", width: 1254, height: 1254, hasAlpha: false }],
  ["ethics-review/inspection-form-v4.webp", { format: "webp", width: 960, height: 440, hasAlpha: true }],
  ["ethics-review/midi-back-v1.webp", { format: "webp", width: 327, height: 405, hasAlpha: true }],
  ["ethics-review/midi-effect-sparkle-1.webp", { format: "webp", width: 119, height: 128, hasAlpha: true }],
  ["ethics-review/midi-effect-sparkle-2.webp", { format: "webp", width: 119, height: 128, hasAlpha: true }],
  ["ethics-review/midi-effect-sparkle-3.webp", { format: "webp", width: 122, height: 128, hasAlpha: true }],
  ["ethics-review/midi-effect-sweat-1.webp", { format: "webp", width: 89, height: 128, hasAlpha: true }],
  ["ethics-review/midi-effect-sweat-2.webp", { format: "webp", width: 90, height: 128, hasAlpha: true }],
  [
    "ui/game-return-button-house-v2.webp",
    { format: "webp", width: 720, height: 237 },
  ],
  ["ui/game-pause-button-v1.webp", { format: "webp", width: 720, height: 237, hasAlpha: true }],
  [
    "ui/game-status-panel-blank-v1.webp",
    { format: "webp", width: 1200, height: 194 },
  ],
  ["ui/coach-arrow-v1.webp", { format: "webp", width: 320, height: 226, hasAlpha: true }],
  [
    "ui/village-entry-button-v1.webp",
    { format: "webp", width: 720, height: 184 },
  ],
  [
    "ui/game-start-panel-v1.webp",
    { format: "webp", width: 1800, height: 1200 },
  ],
  [
    "ui/game-start-button-v1.webp",
    { format: "webp", width: 819, height: 172 },
  ],
  [
    "ui/village-activity-star-empty-v1.webp",
    { format: "webp", width: 88, height: 84 },
  ],
  [
    "ui/village-activity-star-filled-v2.webp",
    { format: "webp", width: 88, height: 85 },
  ],
  [
    "ui/game-result-panel-v1.webp",
    { format: "webp", width: 1560, height: 1000 },
  ],
  ["intro/gem-board.webp", { format: "webp", width: 1448, height: 1086 }],
  ["intro/intro-title-ai-world-v1.webp", { format: "webp", width: 1100, height: 192, hasAlpha: true }],
  ["intro/intro-entry-button-v3.webp", { format: "webp", width: 640, height: 134, hasAlpha: true }],
  ["intro/story-village-v5.webp", { format: "webp", width: 1440, height: 810, hasAlpha: false }],
  ["intro/story-portal-frame-v1.webp", { format: "webp", width: 1639, height: 960, hasAlpha: true }],
  ["ending/story-library-v1.webp", { format: "webp", width: 1440, height: 810, hasAlpha: false }],
  ["world/village-ground-v8.webp", { format: "webp", width: 2560, height: 1440 }],
  ["world/village-ai-shop.webp", { format: "webp", width: 584, height: 555 }],
  ["world/village-airport.webp", { format: "webp", width: 538, height: 504 }],
  ["world/village-ethics-office.webp", { format: "webp", width: 502, height: 542 }],
  ["world/village-tablet-gate-v5.webp", { format: "webp", width: 640, height: 608, hasAlpha: true }],
  ["world/village-fountain-v5.webp", { format: "webp", width: 476, height: 502 }],
  ["world/village-fountain-orb.webp", { format: "webp", width: 56, height: 56, hasAlpha: true }],
  ["characters/midi-v2/front-idle.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-blink.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-talk-small.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-talk-big.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-talk-o.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-happy.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-surprised.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-happy-rest.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-happy-talk-small.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-happy-talk-o.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-surprised-talk-small.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-surprised-talk-big.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-worried.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/front-worried-talk-o.webp", { format: "webp", width: 259, height: 320, hasAlpha: true }],
  ["characters/midi-v2/pose-wave.webp", { format: "webp", width: 259, height: 326, hasAlpha: true }],
  ["characters/midi-v2/pose-cheer.webp", { format: "webp", width: 336, height: 325, hasAlpha: true }],
  ["characters/midi-v2/pose-fly-right.webp", { format: "webp", width: 372, height: 271, hasAlpha: true }],
  ["characters/midi-v2/pose-side-left.webp", { format: "webp", width: 230, height: 328, hasAlpha: true }],
  ["characters/midi-v2/pose-side-right.webp", { format: "webp", width: 231, height: 329, hasAlpha: true }],
  ["characters/midi-v2/player-front.webp", { format: "webp", width: 183, height: 226, hasAlpha: true }],
  ["characters/midi-v2/player-blink.webp", { format: "webp", width: 183, height: 226, hasAlpha: true }],
  ["characters/midi-v2/player-back.webp", { format: "webp", width: 185, height: 227, hasAlpha: true }],
  ["characters/midi-v2/player-left.webp", { format: "webp", width: 162, height: 231, hasAlpha: true }],
  ["characters/midi-v2/player-right.webp", { format: "webp", width: 163, height: 233, hasAlpha: true }],
  ["characters/midi-v2/player-move-left.webp", { format: "webp", width: 192, height: 197, hasAlpha: true }],
  ["characters/midi-v2/player-move-right.webp", { format: "webp", width: 191, height: 199, hasAlpha: true }],
  ["characters/midi-v2/player-glide-front.webp", { format: "webp", width: 186, height: 204, hasAlpha: true }],
  ["characters/midi-v2/player-glide-back.webp", { format: "webp", width: 180, height: 200, hasAlpha: true }],
  ["characters/midi-v2/fly-1.webp", { format: "webp", width: 340, height: 340, hasAlpha: true }],
  ["characters/midi-v2/fly-ouch.webp", { format: "webp", width: 340, height: 340, hasAlpha: true }],
  ["characters/midi-v2/fly-fever.webp", { format: "webp", width: 340, height: 340, hasAlpha: true }],
  [
    "shop/ai-workshop-interior-v6.webp",
    { format: "webp", width: 1672, height: 941 },
  ],
  [
    "shop/ai-workbench-foreground-v2.webp",
    { format: "webp", width: 1640, height: 424 },
  ],
  [
    "shop/workshop-crafting-machine-v1.webp",
    { format: "webp", width: 760, height: 440 },
  ],
  [
    "shop/workshop-crafting-panel-v3.webp",
    { format: "webp", width: 1624, height: 818 },
  ],
  ["shop/workshop-stop-button-normal-v1.webp", { format: "webp", width: 600, height: 205, hasAlpha: true }],
  ["shop/workshop-stop-button-pressed-v1.webp", { format: "webp", width: 600, height: 205, hasAlpha: true }],
  [
    "shop/workshop-action-button-v4.webp",
    { format: "webp", width: 256, height: 264 },
  ],
  [
    "shop/workshop-dust-center-v1.webp",
    { format: "webp", width: 300, height: 264 },
  ],
  [
    "shop/workshop-dust-diagonal-v1.webp",
    { format: "webp", width: 220, height: 204 },
  ],
  [
    "shop/workshop-dust-sweep-v1.webp",
    { format: "webp", width: 248, height: 206 },
  ],
  [
    "shop/workshop-dust-rise-v1.webp",
    { format: "webp", width: 200, height: 217 },
  ],
  [
    "shop/workshop-dust-low-v1.webp",
    { format: "webp", width: 240, height: 87 },
  ],
  [
    "shop/workshop-tool-hammer-v1.webp",
    { format: "webp", width: 96, height: 107 },
  ],
  [
    "shop/workshop-tool-screw-v1.webp",
    { format: "webp", width: 96, height: 118 },
  ],
  [
    "shop/workshop-tool-nut-v1.webp",
    { format: "webp", width: 96, height: 93 },
  ],
  [
    "shop/workshop-tool-gear-v1.webp",
    { format: "webp", width: 96, height: 92 },
  ],
  [
    "shop/workshop-item-panel-4.webp",
    { format: "webp", width: 1429, height: 448 },
  ],
  [
    "shop/workshop-item-panel-5.webp",
    { format: "webp", width: 1722, height: 448 },
  ],
  [
    "shop/workshop-customer-nameplate-v4.webp",
    { format: "webp", width: 360, height: 90 },
  ],
  ["shop/workshop-coin-v1.webp", { format: "webp", width: 128, height: 128, hasAlpha: true }],
  ...WORKSHOP_PRODUCT_IDS.map((productId) => [
    `shop/products-v2/${productId}.webp`,
    { format: "webp", width: 256, height: 256 },
  ]),
  ...WORKSHOP_PRODUCT_IDS.map((productId) => [
    `shop/blueprints-v1/${productId}.webp`,
    { format: "webp", width: 256, height: 256, hasAlpha: true },
  ]),
  ["airport/bg_sky.webp", { format: "webp", width: 3200, height: 1440 }],
  ["airport/bg_city.webp", { format: "webp", width: 3200, height: 1440 }],
  ["airport/bg_ground.webp", { format: "webp", width: 3200, height: 1440 }],
  ["airport/data_doc.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/data_image.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/data_sound.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/data_video.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/bad_data_doc.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/bad_data_image.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/bad_data_sound.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/bad_data_video.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_science_technology.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_education.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_transport.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_law.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_industry.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_medical.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_safety.webp", { format: "webp", width: 256, height: 256 }],
  ["airport/public_data_environment.webp", { format: "webp", width: 256, height: 256 }],
  [
    "airport/corrupted-data-cloud-top-v1.webp",
    { format: "webp", width: 380, height: 871 },
  ],
  [
    "airport/corrupted-data-vortex-bottom-v1.webp",
    { format: "webp", width: 380, height: 718 },
  ],
  [
    "ethics-review/office-v2.webp",
    { format: "webp", width: 1672, height: 941 },
  ],
]);
const RUNTIME_FILES = new Set(RUNTIME_SPECS.keys());

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const files = await listFiles(ASSET_ROOT);
const measured = await Promise.all(
  files.map(async (file) => ({
    absolutePath: file,
    file: path.relative(process.cwd(), file),
    asset: path.relative(ASSET_ROOT, file).replaceAll("\\", "/"),
    bytes: (await stat(file)).size,
  })),
);
const totalBytes = measured.reduce((sum, file) => sum + file.bytes, 0);
const isCastFile = (asset) =>
  (asset.startsWith(CUSTOMER_RUNTIME_PREFIX) || asset.startsWith(STUDENT_RUNTIME_PREFIX)) &&
  asset.endsWith(".webp");
const runtime = measured.filter(
  (file) => RUNTIME_FILES.has(file.asset) || isCastFile(file.asset),
);
const runtimeBytes = runtime.reduce((sum, file) => sum + file.bytes, 0);
const oversized = runtime
  .filter((file) => file.bytes > MAX_RUNTIME_SINGLE_BYTES)
  .sort((a, b) => b.bytes - a.bytes);
const measuredByAsset = new Map(measured.map((file) => [file.asset, file]));
const runtimeMetadata = new Map(
  await Promise.all(
    runtime.map(async (file) => {
      try {
        return [file.asset, { ...(await sharp(file.absolutePath).metadata()) }];
      } catch (error) {
        return [
          file.asset,
          { error: error instanceof Error ? error.message : String(error) },
        ];
      }
    }),
  ),
);
const validationErrors = [];
const unexpectedPublicFiles = measured.filter(
  (file) =>
    !RUNTIME_FILES.has(file.asset) && !isCastFile(file.asset),
);

for (const file of unexpectedPublicFiles) {
  validationErrors.push(`Unexpected public asset: ${file.asset}`);
}

function validateMetadata(asset, expected) {
  const metadata = runtimeMetadata.get(asset);
  if (!metadata) {
    validationErrors.push(`Missing runtime metadata: ${asset}`);
    return;
  }
  if (metadata.error) {
    validationErrors.push(`Unreadable runtime image ${asset}: ${metadata.error}`);
    return;
  }

  for (const field of ["format", "width", "height"]) {
    if (metadata[field] !== expected[field]) {
      validationErrors.push(
        `Unexpected ${field} for ${asset}: ${metadata[field] ?? "unknown"} ` +
          `(expected ${expected[field]})`,
      );
    }
  }
}

for (const [asset, expected] of RUNTIME_SPECS) {
  if (!measuredByAsset.has(asset)) {
    validationErrors.push(`Missing runtime asset: ${asset}`);
    continue;
  }
  validateMetadata(asset, expected);
}

const customerRuntime = runtime.filter(
  (file) =>
    file.asset.startsWith(CUSTOMER_RUNTIME_PREFIX) &&
    file.asset.endsWith(".webp"),
);
if (customerRuntime.length !== EXPECTED_CUSTOMER_COUNT) {
  validationErrors.push(
    `Unexpected customer runtime count: ${customerRuntime.length} ` +
      `(expected ${EXPECTED_CUSTOMER_COUNT})`,
  );
}
for (const customer of customerRuntime) {
  validateMetadata(customer.asset, CUSTOMER_RUNTIME_SPEC);
}
const studentRuntime = runtime.filter((file) => file.asset.startsWith(STUDENT_RUNTIME_PREFIX));
if (studentRuntime.length !== EXPECTED_STUDENT_COUNT) {
  validationErrors.push(
    `Unexpected ethics student runtime count: ${studentRuntime.length} (expected ${EXPECTED_STUDENT_COUNT})`,
  );
}
for (const student of studentRuntime) {
  validateMetadata(student.asset, { format: "webp", width: 636, height: 952 });
}

console.log(
  `${runtime.length} runtime assets, ${formatBytes(runtimeBytes)} loaded on demand; ` +
    `${measured.length} public files, ${formatBytes(totalBytes)} deployed`,
);
if (validationErrors.length === 0) {
  console.log(
    `${RUNTIME_FILES.size} fixed runtime images and ${customerRuntime.length} customer WebP images passed metadata validation.`,
  );
}
if (oversized.length > 0) {
  console.table(
    oversized.map((file) => ({
      file: file.file,
      size: formatBytes(file.bytes),
    })),
  );
}

if (validationErrors.length > 0) {
  validationErrors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
}

if (runtimeBytes > MAX_RUNTIME_BYTES) {
  console.error(
    `Runtime asset budget exceeded: ${formatBytes(runtimeBytes)} > ${formatBytes(MAX_RUNTIME_BYTES)}.`,
  );
  process.exitCode = 1;
}

if (oversized.length > 0) {
  console.error(
    `Single-file runtime budget exceeded: ${oversized.length} file(s) are larger than ${formatBytes(MAX_RUNTIME_SINGLE_BYTES)}.`,
  );
  process.exitCode = 1;
}

if (totalBytes > 35 * 1024 * 1024) {
  console.error(
    "Public asset budget exceeded. Keep editable sources in assets-source and only runtime files in public/assets.",
  );
  process.exitCode = 1;
}
