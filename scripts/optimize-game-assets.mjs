import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "assets-source");
const RUNTIME_ROOT = path.join(ROOT, "public", "assets");

const ASSETS = [
  { source: "intro/gem-board.png", quality: 86 },
  {
    source: "world/village-ground.png",
    width: 1280,
    height: 720,
    fit: "fill",
    quality: 86,
  },
  {
    source: "world/village-ai-shop.png",
    trim: true,
    width: 292,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "world/village-airport.png",
    trim: true,
    width: 269,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "world/village-ethics-office.png",
    trim: true,
    width: 251,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "world/village-ai-world-gate.png",
    trim: true,
    width: 324,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "world/village-fountain.png",
    trim: true,
    width: 211,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "shop/ai-workshop-interior-v6.png",
    width: 1280,
    height: 720,
    fit: "fill",
    quality: 86,
  },
  {
    source: "shop/ai-workbench-foreground-v2.png",
    trim: true,
    width: 820,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "shop/workshop-item-panel-4.png",
    trim: true,
    width: 680,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "shop/workshop-item-panel-5.png",
    trim: true,
    width: 720,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "airport/bg_sky.png",
    width: 1600,
    height: 720,
    fit: "fill",
    quality: 84,
  },
  {
    source: "airport/bg_city.png",
    width: 1600,
    height: 720,
    fit: "fill",
    quality: 84,
  },
  {
    source: "airport/bg_ground.png",
    width: 1600,
    height: 720,
    fit: "fill",
    quality: 84,
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
  {
    source: "airport/corrupted-data-tower-v1.png",
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "characters/midi_fly.png",
    width: 512,
    height: 238,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/office.png",
    width: 1280,
    height: 720,
    quality: 84,
  },
  {
    source: "ethics-review/briefing-dossier.png",
    width: 1120,
    height: 630,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/case-dossier.png",
    width: 900,
    height: 600,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/verdict-consoles.png",
    output: "ethics-review/approve-console.webp",
    extract: { left: 0, top: 0, width: 700, height: 941 },
    width: 430,
    height: 578,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/verdict-consoles.png",
    output: "ethics-review/revise-console.webp",
    extract: { left: 972, top: 0, width: 700, height: 941 },
    width: 430,
    height: 578,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/office-v2.png",
    width: 1280,
    height: 720,
    quality: 86,
  },
  {
    source: "ethics-review/briefing-sheet-v2.png",
    width: 1080,
    height: 608,
    quality: 90,
    alphaQuality: 100,
  },
  {
    source: "ethics-review/case-file-v2.png",
    width: 860,
    height: 484,
    quality: 90,
    alphaQuality: 100,
  },
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
      withoutEnlargement: true,
    });
  }

  await pipeline
    .webp({
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

const results = [];
for (const asset of ASSETS) {
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
