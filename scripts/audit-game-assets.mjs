import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
const MAX_RUNTIME_BYTES = 20 * 1024 * 1024;
const MAX_RUNTIME_SINGLE_BYTES = 2 * 1024 * 1024;
const EXPECTED_CUSTOMER_COUNT = 52;
const CUSTOMER_RUNTIME_PREFIX = "customers/v3-game/";
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
  ["ethics-review/stamp-tool-approve-v1.webp", { format: "webp", width: 320, height: 287, hasAlpha: true }],
  ["ethics-review/stamp-tool-reject-v1.webp", { format: "webp", width: 320, height: 286, hasAlpha: true }],
  ["ethics-review/stamp-stage-v2.webp", { format: "webp", width: 1672, height: 941, hasAlpha: false }],
  ["ethics-review/stamp-topic-permission-v2.webp", { format: "webp", width: 320, height: 244, hasAlpha: true }],
  ["ethics-review/stamp-topic-privacy-v1.webp", { format: "webp", width: 311, height: 280, hasAlpha: true }],
  ["ethics-review/stamp-topic-checking-v1.webp", { format: "webp", width: 320, height: 263, hasAlpha: true }],
  ["ethics-review/stamp-topic-honesty-v1.webp", { format: "webp", width: 289, height: 280, hasAlpha: true }],
  ["ethics-review/stamp-topic-respect-v1.webp", { format: "webp", width: 320, height: 269, hasAlpha: true }],
  ["ethics-review/stamp-stage-v1.webp", { format: "webp", width: 1672, height: 941, hasAlpha: false }],
  ["ethics-review/stamp-approve-v1.webp", { format: "webp", width: 440, height: 543, hasAlpha: true }],
  ["ethics-review/stamp-reject-v1.webp", { format: "webp", width: 440, height: 526, hasAlpha: true }],
  ["ethics-review/stamp-midi-front-v1.webp", { format: "webp", width: 460, height: 590, hasAlpha: true }],
  ["ethics-review/stamp-midi-left-v1.webp", { format: "webp", width: 459, height: 590, hasAlpha: true }],
  ["ethics-review/stamp-midi-right-v1.webp", { format: "webp", width: 460, height: 590, hasAlpha: true }],
  ["ethics-review/inspection-booth-simple-v1.webp", { format: "webp", width: 1672, height: 941, hasAlpha: false }],
  ["ethics-review/inspection-window-boy-simple-v1.webp", { format: "webp", width: 608, height: 425, hasAlpha: false }],
  ["ethics-review/inspection-window-girl-simple-v1.webp", { format: "webp", width: 608, height: 426, hasAlpha: false }],
  ["ethics-review/inspection-approve-stamp-v2.webp", { format: "webp", width: 308, height: 380, hasAlpha: true }],
  ["ethics-review/inspection-booth-v2.webp", { format: "webp", width: 1672, height: 941, hasAlpha: false }],
  ["ethics-review/inspection-form-v2.webp", { format: "webp", width: 885, height: 532, hasAlpha: true }],
  ["ethics-review/inspection-return-stamp-v2.webp", { format: "webp", width: 308, height: 368, hasAlpha: true }],
  ["ethics-review/inspection-visitor-boy-v3.webp", { format: "webp", width: 198, height: 576, hasAlpha: false }],
  ["ethics-review/inspection-visitor-girl-v3.webp", { format: "webp", width: 360, height: 540, hasAlpha: false }],
  ["ethics-review/inspection-window-boy-v1.webp", { format: "webp", width: 654, height: 458, hasAlpha: false }],
  ["ethics-review/inspection-window-girl-v1.webp", { format: "webp", width: 653, height: 458, hasAlpha: false }],
  [
    "ethics-review/delivery-room-final-v1.webp",
    { format: "webp", width: 1672, height: 941, hasAlpha: false },
  ],
  [
    "ethics-review/delivery-card-panel-v1.webp",
    { format: "webp", width: 1680, height: 501, hasAlpha: true },
  ],
  [
    "ui/game-return-button-house-v2.webp",
    { format: "webp", width: 720, height: 237 },
  ],
  [
    "ui/game-status-panel-blank-v1.webp",
    { format: "webp", width: 1200, height: 194 },
  ],
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
    "ui/village-activity-star-filled-v1.webp",
    { format: "webp", width: 88, height: 85 },
  ],
  [
    "ui/game-result-panel-v1.webp",
    { format: "webp", width: 1560, height: 1000 },
  ],
  [
    "ui/game-result-retry-button-v1.webp",
    { format: "webp", width: 664, height: 144 },
  ],
  [
    "ui/game-result-return-button-v1.webp",
    { format: "webp", width: 674, height: 144 },
  ],
  ["intro/gem-board.webp", { format: "webp", width: 1448, height: 1086 }],
  [
    "intro/village-intro-background-v2.webp",
    { format: "webp", width: 1522, height: 855 },
  ],
  [
    "intro/village-intro-entry-button-v1.webp",
    { format: "webp", width: 800, height: 224 },
  ],
  ["world/village-ground.webp", { format: "webp", width: 1671, height: 941 }],
  ["world/village-ai-shop.webp", { format: "webp", width: 584, height: 555 }],
  ["world/village-airport.webp", { format: "webp", width: 538, height: 504 }],
  ["world/village-ethics-office.webp", { format: "webp", width: 502, height: 542 }],
  ["world/village-ai-world-gate.webp", { format: "webp", width: 648, height: 616 }],
  [
    "world/village-ai-world-portal-v1.webp",
    { format: "webp", width: 512, height: 512 },
  ],
  [
    "world/village-ai-world-portal-frames-v1.webp",
    { format: "webp", width: 2048, height: 1536 },
  ],
  [
    "world/village-ai-world-portal-frames-v2.webp",
    { format: "webp", width: 2048, height: 976 },
  ],
  [
    "world/village-ai-world-portal-frames-v3.webp",
    { format: "webp", width: 2048, height: 1952 },
  ],
  [
    "world/village-ai-world-portal-night-v2.webp",
    { format: "webp", width: 840, height: 840 },
  ],
  [
    "world/village-ai-world-portal-night-v3.webp",
    { format: "webp", width: 840, height: 840 },
  ],
  [
    "world/village-ai-world-portal-night-v4.webp",
    { format: "webp", width: 840, height: 840 },
  ],
  ["world/village-fountain.webp", { format: "webp", width: 422, height: 445 }],
  [
    "world/village-fountain-water-overlay-v1.webp",
    { format: "webp", width: 238, height: 240 },
  ],
  [
    "world/village-fountain-water-frames-v1.webp",
    { format: "webp", width: 1252, height: 1252 },
  ],
  ["characters/midi_front_game.png", { format: "png", width: 176, height: 226 }],
  ["characters/midi_back_game.png", { format: "png", width: 176, height: 226 }],
  ["characters/midi_left_game.png", { format: "png", width: 176, height: 226 }],
  ["characters/midi_right_game.png", { format: "png", width: 176, height: 226 }],
  ["characters/midi_fly.webp", { format: "webp", width: 512, height: 238 }],
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
    "shop/workshop-crafting-panel-v2.webp",
    { format: "webp", width: 1624, height: 818 },
  ],
  [
    "shop/workshop-action-button-v1.webp",
    { format: "webp", width: 384, height: 376 },
  ],
  [
    "shop/workshop-action-button-v2.webp",
    { format: "webp", width: 256, height: 254 },
  ],
  [
    "shop/workshop-action-button-v3.webp",
    { format: "webp", width: 256, height: 255 },
  ],
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
  [
    "shop/workshop-dialogue-bubble-v2.webp",
    { format: "webp", width: 420, height: 231 },
  ],
  ...WORKSHOP_PRODUCT_IDS.map((productId) => [
    `shop/products-v2/${productId}.webp`,
    { format: "webp", width: 256, height: 256 },
  ]),
  ["airport/bg_sky.webp", { format: "webp", width: 3200, height: 1440 }],
  ["airport/bg_city.webp", { format: "webp", width: 3200, height: 1440 }],
  ["airport/bg_ground.webp", { format: "webp", width: 3200, height: 1440 }],
  [
    "airport/data-flight-quiz-card-v1.webp",
    { format: "webp", width: 1967, height: 800 },
  ],
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
  [
    "ethics-review/briefing-sheet-v2.webp",
    { format: "webp", width: 1672, height: 941 },
  ],
  [
    "ethics-review/case-file-v2.webp",
    { format: "webp", width: 1640, height: 924 },
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
const runtime = measured.filter(
  (file) =>
    RUNTIME_FILES.has(file.asset) ||
    (file.asset.startsWith(CUSTOMER_RUNTIME_PREFIX) &&
      file.asset.endsWith(".webp")),
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
    !RUNTIME_FILES.has(file.asset) &&
    !(
      file.asset.startsWith(CUSTOMER_RUNTIME_PREFIX) &&
      file.asset.endsWith(".webp")
    ),
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
