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
  ...["approve", "reject"].map(verdict => highDpiPanelAsset({
    source: `ethics-review/stamp-tool-${verdict}-v1.png`,
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 160, height: 150 })),
  fullScreenAsset({ source: "ethics-review/stamp-stage-v1.png", quality: 96 }),
  fullScreenAsset({ source: "ethics-review/stamp-stage-v2.png", quality: 96 }),
  ...["permission", "privacy", "checking", "honesty", "respect"].map(topic => highDpiPanelAsset({
    source: `ethics-review/stamp-topic-${topic}-${topic === "permission" ? "v2" : "v1"}.png`,
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 160, height: 140 })),
  highDpiPanelAsset({
    source: "ethics-review/inspection-approve-stamp-v2.png",
    output: "ethics-review/stamp-approve-v1.webp",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 220, height: 275 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-return-stamp-v2.png",
    output: "ethics-review/stamp-reject-v1.webp",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 220, height: 275 }),
  ...["front", "left", "right"].map(facing => highDpiPanelAsset({
    source: `characters/midi_${facing}.png`,
    output: `ethics-review/stamp-midi-${facing}-v1.webp`,
    quality: 96, alphaQuality: 100,
  }, { width: 230, height: 295 })),
  fullScreenAsset({
    source: "intro/gem-board-blue-cutout-v1.png",
    output: "intro/gem-board.webp",
    alphaQuality: 100,
  }),
  fullScreenAsset({
    source: "intro/village-intro-background-v2.png",
    output: "intro/village-intro-background-v2.webp",
    quality: 94,
  }),
  {
    source: "intro/village-intro-entry-button-v1.png",
    output: "intro/village-intro-entry-button-v1.webp",
    trim: true,
    width: 800,
    height: 224,
    fit: "fill",
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
    source: "ui/village-activity-star-filled-v1.png",
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
  highDpiPanelAsset({
    source: "ui/game-result-retry-button-v1.png",
    trim: true,
    quality: 94,
    alphaQuality: 100,
  }, { width: 340, height: 72 }),
  highDpiPanelAsset({
    source: "ui/game-result-return-button-v1.png",
    trim: true,
    quality: 94,
    alphaQuality: 100,
  }, { width: 340, height: 72 }),
  fullScreenAsset({
    source: "world/ai-village-main-background-v4.png",
    output: "world/village-ground.webp",
    lossless: true,
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
  highDpiPanelAsset({
    source: "world/village-ai-world-gate-v3.png",
    output: "world/village-ai-world-gate.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 324 }),
  {
    source: "world/village-ai-world-portal-frames-v3.png",
    output: "world/village-ai-world-portal-frames-v3.webp",
    width: 2048,
    height: 1952,
    fit: "fill",
    quality: 94,
    alphaQuality: 100,
  },
  {
    source: "world/village-ai-world-portal-v2.png",
    output: "world/village-ai-world-portal-v1.webp",
    trim: true,
    width: 512,
    height: 512,
    fit: "cover",
    lossless: true,
    alphaQuality: 100,
  },
  highDpiPanelAsset({
    source: "world/village-ai-world-portal-night-v2.png",
    output: "world/village-ai-world-portal-night-v2.webp",
    quality: 94,
  }, { width: 420, height: 420 }),
  highDpiPanelAsset({
    source: "world/village-ai-world-portal-night-v3.png",
    output: "world/village-ai-world-portal-night-v3.webp",
    quality: 94,
  }, { width: 420, height: 420 }),
  highDpiPanelAsset({
    source: "world/village-ai-world-portal-night-v4.png",
    output: "world/village-ai-world-portal-night-v4.webp",
    quality: 94,
  }, { width: 420, height: 420 }),
  highDpiPanelAsset({
    source: "world/village-fountain-v3.png",
    output: "world/village-fountain.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 211 }),
  highDpiPanelAsset({
    source: "world/village-fountain-water-overlay-v1.png",
    output: "world/village-fountain-water-overlay-v1.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 119 }),
  {
    source: "world/village-fountain-water-frames-v1.png",
    output: "world/village-fountain-water-frames-v1.webp",
    width: 1252,
    height: 1252,
    fit: "fill",
    lossless: true,
    alphaQuality: 100,
  },
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
    source: "shop/workshop-crafting-panel-v2.png",
    output: "shop/workshop-crafting-panel-v2.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 860 }),
  highDpiPanelAsset({
    source: "shop/workshop-action-button-v2.png",
    output: "shop/workshop-action-button-v2.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 128 }),
  highDpiPanelAsset({
    source: "shop/workshop-action-button-v3.png",
    output: "shop/workshop-action-button-v3.webp",
    trim: true,
    lossless: true,
    alphaQuality: 100,
  }, { width: 128 }),
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
  {
    source: "shop/workshop-dialogue-bubble-v2.png",
    output: "shop/workshop-dialogue-bubble-v2.webp",
    trim: true,
    width: 420,
    quality: 92,
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
    source: "airport/data-flight-quiz-card-v3.png",
    output: "airport/data-flight-quiz-card-v1.webp",
    lossless: true,
    alphaQuality: 100,
  },
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
  {
    source: "characters/midi_fly.png",
    width: 512,
    height: 238,
    quality: 90,
    alphaQuality: 100,
  },
  fullScreenAsset({
    source: "ethics-review/inspection-booth-simple-v1.png",
    quality: 96,
  }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-window-girl-simple-v1.png",
    quality: 96,
  }, { width: 304, height: 240 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-window-boy-simple-v1.png",
    quality: 96,
  }, { width: 304, height: 240 }),
  fullScreenAsset({
    source: "ethics-review/inspection-booth-v2.png",
    quality: 96,
  }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-form-v2.png",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 510, height: 266 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-approve-stamp-v2.png",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 154, height: 192 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-return-stamp-v2.png",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 154, height: 192 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-window-girl-v1.png",
    quality: 96,
  }, { width: 327, height: 229 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-window-boy-v1.png",
    quality: 96,
  }, { width: 327, height: 229 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-visitor-girl-v3.png",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 180, height: 288 }),
  highDpiPanelAsset({
    source: "ethics-review/inspection-visitor-boy-v3.png",
    trim: true, quality: 96, alphaQuality: 100,
  }, { width: 180, height: 288 }),
  fullScreenAsset({
    source: "ethics-review/office-v2.png",
    lossless: true,
  }),
  fullScreenAsset({
    source: "ethics-review/delivery-room-final-v1.png",
    quality: 94,
  }),
  highDpiPanelAsset({
    source: "ethics-review/delivery-card-panel-v1.png",
    trim: true,
    alphaQuality: 100,
  }, { width: 840, height: 280 }),
  highDpiPanelAsset({
    source: "ethics-review/briefing-sheet-v2.png",
    alphaQuality: 100,
    fit: "fill",
  }, { width: 1050, height: 590 }),
  highDpiPanelAsset({
    source: "ethics-review/case-file-v2.png",
    alphaQuality: 100,
    fit: "fill",
  }, { width: 820, height: 462 }),
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
