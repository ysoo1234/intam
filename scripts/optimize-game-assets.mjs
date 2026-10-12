import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "assets-source");
const RUNTIME_ROOT = path.join(ROOT, "public", "assets");

// Large-screen rendering can demand up to 2x the 1280 x 720 logical game size.
// Full-screen images and large panels therefore keep enough source pixels for
// that physical canvas whenever the editable original can provide them. We
// never enlarge a smaller source: an offline upscale would add bytes without
// restoring detail. Tile backgrounds are a separate profile because their
// texture dimensions are also their world-space repeat scale.
const HIGH_RESOLUTION_ASSET_POLICY = Object.freeze({
  maxRenderScale: 2,
  fullScreen: Object.freeze({
    logicalWidth: 1280,
    logicalHeight: 720,
    quality: 94,
  }),
  largePanel: Object.freeze({ quality: 94 }),
  tiledBackground: Object.freeze({
    logicalWidth: 1600,
    logicalHeight: 720,
    quality: 98,
  }),
});

function fullScreenAsset(asset) {
  const profile = HIGH_RESOLUTION_ASSET_POLICY.fullScreen;
  return {
    ...asset,
    width: Math.round(
      profile.logicalWidth * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
    ),
    height: Math.round(
      profile.logicalHeight * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
    ),
    fit: "inside",
    quality: asset.quality ?? profile.quality,
    resolutionProfile: "full-screen",
  };
}

function highDpiPanelAsset(asset, displaySize) {
  return {
    ...asset,
    width:
      displaySize.width === undefined
        ? undefined
        : Math.round(
            displaySize.width * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
          ),
    height:
      displaySize.height === undefined
        ? undefined
        : Math.round(
            displaySize.height * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
          ),
    fit: asset.fit ?? "inside",
    quality:
      asset.quality ?? HIGH_RESOLUTION_ASSET_POLICY.largePanel.quality,
    resolutionProfile: "large-panel",
  };
}

function tiledBackgroundAsset(asset) {
  const profile = HIGH_RESOLUTION_ASSET_POLICY.tiledBackground;
  return {
    ...asset,
    width: Math.round(
      profile.logicalWidth * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
    ),
    height: Math.round(
      profile.logicalHeight * HIGH_RESOLUTION_ASSET_POLICY.maxRenderScale,
    ),
    fit: "fill",
    // All three parallax layers must share one physical repeat grid. The city
    // original is smaller than 2x, so a deterministic Lanczos resize is the
    // one deliberate exception to the no-upscale rule.
    allowEnlargement: true,
    quality: asset.quality ?? profile.quality,
    resolutionProfile: "tiled-background",
  };
}

const onlyAssetArgument = process.argv.find(
  (argument) =>
    argument.startsWith("--asset=") || argument.startsWith("--only="),
);
const positionalAsset = process.argv
  .slice(2)
  .find((argument) => !argument.startsWith("-"));
const onlyAsset =
  onlyAssetArgument?.slice(onlyAssetArgument.indexOf("=") + 1) ??
  positionalAsset;

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

const ASSETS = [
  ...["permission", "privacy", "checking", "honesty", "respect"].map(topic => highDpiPanelAsset({
    source: `ethics-review/stamp-topic-${topic}-${topic === "permission" ? "v2" : "v1"}.png`,
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 160, height: 140 })),
  // Textbook Midi (v2): talking faces in other moods, story poses (front-frame
  // scale) and village player frames (2x of the 113 px village height). Sizes
  // keep one shared scale, so every frame lines up when Midi switches pose.
  ...[
    ["front-happy-rest", "front-happy-rest", 259, 320],
    ["front-happy-talk-small", "front-happy-talk-small", 259, 320],
    ["front-happy-talk-o", "front-happy-talk-o", 259, 320],
    ["front-surprised-talk-small", "front-surprised-talk-small", 259, 320],
    ["front-surprised-talk-big", "front-surprised-talk-big", 259, 320],
    ["front-worried", "front-worried", 259, 320],
    ["front-worried-talk-o", "front-worried-talk-o", 259, 320],
    ["pose-wave", "pose-wave", 259, 326],
    ["pose-cheer", "pose-cheer", 336, 325],
    ["pose-fly-right", "pose-fly-right", 372, 271],
    ["pose-side-left", "pose-side-left", 230, 328],
    ["pose-side-right", "pose-side-right", 231, 329],
    ["front-idle", "player-front", 183, 226],
    ["front-blink", "player-blink", 183, 226],
    ["pose-back", "player-back", 185, 227],
    ["pose-side-left", "player-left", 162, 231],
    ["pose-side-right", "player-right", 163, 233],
    ["pose-move-left", "player-move-left", 192, 197],
    ["pose-move-right", "player-move-right", 191, 199],
    ["pose-glide-front", "player-glide-front", 186, 204],
    ["pose-glide-back", "player-glide-back", 180, 200],
    ["fly-1", "fly-1", 340, 340],
    ["fly-ouch", "fly-ouch", 340, 340],
    ["fly-fever", "fly-fever", 340, 340],
  ].map(([source, output, width, height]) => ({
    source: `characters/midi-v2/${source}.png`,
    output: `characters/midi-v2/${output}.webp`,
    width,
    height,
    fit: "fill",
    quality: 94,
    alphaQuality: 100,
  })),
  // Textbook Midi (v2), front view. Every frame shares one body; only the face
  // screen differs (built by assets-source/characters/midi-v2/build_front_frames.py).
  ...["idle", "blink", "talk-small", "talk-big", "talk-o", "happy", "surprised"].map(frame => ({
    source: `characters/midi-v2/front-${frame}.png`,
    output: `characters/midi-v2/front-${frame}.webp`,
    height: 320,
    fit: "inside",
    quality: 94,
    alphaQuality: 100,
  })),
  fullScreenAsset({
    source: "intro/gem-board-blue-cutout-v1.png",
    output: "intro/gem-board.webp",
    alphaQuality: 100,
  }),
  // Textbook-style title, generated from page 1 lettering; source is pre-cropped
  // to the visible glow (raw generation kept as intro-title-ai-world-raw-v1.png).
  {
    source: "intro/intro-title-ai-world-v1.png",
    output: "intro/intro-title-ai-world-v1.webp",
    width: 1100,
    fit: "inside",
    quality: 94,
    alphaQuality: 100,
  },
  {
    source: "intro/story-village-snapshot-v3.png",
    output: "intro/story-village-v5.webp",
    width: 1440,
    fit: "inside",
    quality: 92,
  },
  // The school library seen through the ending's door home (textbook prologue).
  {
    source: "ending/story-library-v1.png",
    output: "ending/story-library-v1.webp",
    width: 1440,
    fit: "inside",
    quality: 92,
  },
  // Generated door frame for the intro story (ring with three gems, transparent inside).
  {
    source: "intro/story-portal-frame-v1.png",
    output: "intro/story-portal-frame-v1.webp",
    quality: 94,
    alphaQuality: 100,
  },
  // Generated entry-button plate (no text); source pre-cropped and cleaned,
  // raw generation kept as intro-entry-button-raw-v3.png.
  {
    source: "intro/intro-entry-button-v3.png",
    output: "intro/intro-entry-button-v3.webp",
    width: 640,
    fit: "inside",
    quality: 94,
    alphaQuality: 100,
  },
  {
    source: "ui/game-return-button-house-v2.png",
    output: "ui/game-return-button-house-v2.webp",
    trim: true,
    width: 720,
    quality: 94,
    alphaQuality: 100,
  },
  {
    source: "ui/game-status-panel-blank-v1.png",
    width: 1200,
    height: 194,
    fit: "fill",
    quality: 92,
    alphaQuality: 100,
  },
  // Tutorial arrow (coach pointer): a glossy yellow arrow pointing right;
  // rotated in code to point at things.
  {
    source: "ui/coach-arrow-v1.png",
    output: "ui/coach-arrow-v1.webp",
    width: 320,
    fit: "inside",
    quality: 92,
    alphaQuality: 100,
  },
  highDpiPanelAsset({
    source: "ui/village-entry-button-v1.png",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 360, height: 120 }),
  highDpiPanelAsset({
    source: "ui/village-activity-star-empty-v1.png",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 44, height: 44 }),
  highDpiPanelAsset({
    source: "ui/village-activity-star-filled-v2.png",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 44, height: 44 }),
  highDpiPanelAsset({
    source: "ui/game-result-panel-v1.png",
    trim: true,
    quality: 94,
    alphaQuality: 100,
  }, { width: 780, height: 520 }),
  // v8: garden village (village_garden_raw_v2.png: the garden with a band of
  // sky, hills and forest added above it, upscaled to 2x). Walkable area:
  // assets-source/world/build_garden_walkable_mask_v8.py.
  fullScreenAsset({
    source: "world/village-ground-v8.png",
    output: "world/village-ground-v8.webp",
    quality: 90,
  }),
  highDpiPanelAsset({
    source: "world/village-ai-shop-v3.png",
    output: "world/village-ai-shop.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 292 }),
  highDpiPanelAsset({
    source: "world/village-airport-v3.png",
    output: "world/village-airport.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 269 }),
  highDpiPanelAsset({
    source: "world/village-ethics-office-v3.png",
    output: "world/village-ethics-office.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 251 }),
  {
    // v5: redrawn tablet (cover and screen on one plane, thin lines, navy camera),
    // sharpened; the white screen is cut out, keeping the camera dot.
    source: "world/village-tablet-gate-v5.png",
    output: "world/village-tablet-gate-v5.webp",
    width: 640,
    fit: "inside",
    quality: 94,
    alphaQuality: 100,
  },
  highDpiPanelAsset({
    // v5: the orb and its water column are cut out (they move in code).
    source: "world/village-fountain-v5.png",
    output: "world/village-fountain-v5.webp",
    // Pre-aligned to the v3 basin (the grid size is fixed), so no trim.
    trim: false,
    lossless: true,
    alphaQuality: 100,
  }, { width: 238 }),
  highDpiPanelAsset({
    // The round orb on top, lifted out of v4 (its cut top rebuilt) so it can bob.
    source: "world/village-fountain-orb-v1.png",
    output: "world/village-fountain-orb.webp",
    trim: false,
    lossless: true,
    alphaQuality: 100,
  }, { width: 28 }),
  fullScreenAsset({
    source: "shop/ai-workshop-interior-v6.png",
    output: "shop/ai-workshop-interior-v6.webp",
    lossless: true,
  }),
  highDpiPanelAsset({
    source: "shop/ai-workbench-foreground-v2.png",
    trim: true,
    alphaQuality: 100,
  }, { width: 820 }),
  highDpiPanelAsset({
    source: "shop/workshop-crafting-machine-v1.png",
    output: "shop/workshop-crafting-machine-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 380 }),
  highDpiPanelAsset({
    source: "shop/workshop-crafting-panel-v3.png",
    output: "shop/workshop-crafting-panel-v3.webp",
    // Pre-cropped to the v2 frame (no bottom plate now), so parts stay where they were.
    trim: false,
    lossless: true,
    alphaQuality: 100,
  }, { width: 860 }),
  highDpiPanelAsset({
    source: "shop/workshop-action-button-v4.png",
    output: "shop/workshop-action-button-v4.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 128 }),
  highDpiPanelAsset({
    source: "shop/workshop-dust-center-v1.png",
    output: "shop/workshop-dust-center-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 150 }),
  highDpiPanelAsset({
    source: "shop/workshop-dust-diagonal-v1.png",
    output: "shop/workshop-dust-diagonal-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 110 }),
  highDpiPanelAsset({
    source: "shop/workshop-dust-sweep-v1.png",
    output: "shop/workshop-dust-sweep-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 124 }),
  highDpiPanelAsset({
    source: "shop/workshop-dust-rise-v1.png",
    output: "shop/workshop-dust-rise-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 100 }),
  highDpiPanelAsset({
    source: "shop/workshop-dust-low-v1.png",
    output: "shop/workshop-dust-low-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 120 }),
  highDpiPanelAsset({
    source: "shop/workshop-tool-hammer-v1.png",
    output: "shop/workshop-tool-hammer-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 48 }),
  highDpiPanelAsset({
    source: "shop/workshop-tool-screw-v1.png",
    output: "shop/workshop-tool-screw-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 48 }),
  highDpiPanelAsset({
    source: "shop/workshop-tool-nut-v1.png",
    output: "shop/workshop-tool-nut-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 48 }),
  highDpiPanelAsset({
    source: "shop/workshop-tool-gear-v1.png",
    output: "shop/workshop-tool-gear-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 48 }),
  highDpiPanelAsset({
    source: "shop/itembox4.png",
    output: "shop/workshop-item-panel-4.webp",
    trim: true,
    lossless: true,
    quality: 90,
    alphaQuality: 100,
  }, { height: 224 }),
  highDpiPanelAsset({
    source: "shop/itembox5.png",
    output: "shop/workshop-item-panel-5.webp",
    trim: true,
    lossless: true,
    quality: 90,
    alphaQuality: 100,
  }, { height: 224 }),
  {
    source: "shop/workshop-customer-nameplate-v4.png",
    output: "shop/workshop-customer-nameplate-v4.webp",
    trim: true,
    width: 360,
    height: 90,
    fit: "fill",
    quality: 94,
    alphaQuality: 100,
  },
  ...WORKSHOP_PRODUCT_IDS.map((productId) => ({
    source: `shop/products-v2/${productId}.png`,
    width: 256,
    height: 256,
    quality: 92,
    alphaQuality: 100,
  })),
  tiledBackgroundAsset({
    source: "airport/bg_sky.png",
  }),
  tiledBackgroundAsset({
    source: "airport/bg_city.png",
  }),
  tiledBackgroundAsset({
    source: "airport/bg_ground.png",
  }),
  {
    source: "airport/data_doc.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/data_image.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/data_sound.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/data_video.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/bad_data_doc.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/bad_data_image.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/bad_data_sound.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/bad_data_video.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_science_technology.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_education.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_transport.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_law.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_industry.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_medical.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_safety.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/public_data_environment.png",
    width: 256,
    height: 256,
    quality: 90,
    alphaQuality: 100,
  },
  highDpiPanelAsset({
    source: "airport/corrupted-data-cloud-top-v5.png",
    output: "airport/corrupted-data-cloud-top-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 190 }),
  highDpiPanelAsset({
    source: "airport/corrupted-data-vortex-bottom-v5.png",
    output: "airport/corrupted-data-vortex-bottom-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 190 }),
  fullScreenAsset({
    source: "ethics-review/office-v2.png",
    lossless: true,
  }),
];

const customerFiles = await readdir(
  path.join(SOURCE_ROOT, "customers", "v3-game"),
);
ASSETS.push(
  ...customerFiles
    .filter((file) => file.endsWith(".png"))
    .map((file) => ({
      source: `customers/v3-game/${file}`,
      quality: 90,
      alphaQuality: 100,
    })),
);

function outputPath(source) {
  return source.replace(/\.png$/u, ".webp");
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function optimizeAsset(asset) {
  const sourcePath = path.join(SOURCE_ROOT, asset.source);
  const destinationPath = path.join(
    RUNTIME_ROOT,
    asset.output ?? outputPath(asset.source),
  );

  await mkdir(path.dirname(destinationPath), { recursive: true });

  let pipeline = sharp(sourcePath, { failOn: "warning" });
  if (asset.trim) {
    pipeline = pipeline.trim();
  }
  if (asset.extract) {
    pipeline = pipeline.extract(asset.extract);
  }
  if (asset.width || asset.height) {
    pipeline = pipeline.resize(asset.width, asset.height, {
      fit: asset.fit ?? "inside",
      withoutEnlargement: asset.allowEnlargement !== true,
      // Transparent artwork using `contain` must not inherit Sharp's default
      // opaque-black padding; those pixels show up as dark edge bars in-game.
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  if (asset.modulate) {
    pipeline = pipeline.modulate(asset.modulate);
  }
  if (asset.linear) {
    pipeline = pipeline.linear(...asset.linear);
  }

  await pipeline
    .webp({
      lossless: asset.lossless ?? false,
      quality: asset.quality,
      alphaQuality: asset.alphaQuality ?? 100,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(destinationPath);

  const [sourceStats, destinationStats] = await Promise.all([
    stat(sourcePath),
    stat(destinationPath),
  ]);

  return {
    asset: asset.source,
    before: sourceStats.size,
    after: destinationStats.size,
  };
}

const selectedAssets = onlyAsset
  ? ASSETS.filter((asset) =>
      [asset.source, asset.output].some((candidate) =>
        candidate?.includes(onlyAsset),
      ),
    )
  : ASSETS;

if (selectedAssets.length === 0) {
  throw new Error(`No game asset matched --asset=${onlyAsset}`);
}

// `--list` prints every registered source (one per line) without writing
// anything; assets-source files not in this list are not part of the game.
if (process.argv.includes("--list")) {
  for (const asset of selectedAssets) console.log(asset.source);
  process.exit(0);
}

const results = [];
for (const asset of selectedAssets) {
  results.push(await optimizeAsset(asset));
}

const totals = results.reduce(
  (sum, result) => ({
    before: sum.before + result.before,
    after: sum.after + result.after,
  }),
  { before: 0, after: 0 },
);

console.table(
  results.map((result) => ({
    asset: result.asset,
    before: formatBytes(result.before),
    after: formatBytes(result.after),
    saved: `${Math.round((1 - result.after / result.before) * 100)}%`,
  })),
);
console.log(
  `Game assets: ${formatBytes(totals.before)} -> ${formatBytes(totals.after)} ` +
    `(${Math.round((1 - totals.after / totals.before) * 100)}% smaller)`,
);
