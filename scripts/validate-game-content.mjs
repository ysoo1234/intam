import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const workshopPath = path.join(
  ROOT,
  "src",
  "game",
  "content",
  "aiWorkshop.ts",
);
const assetsPath = path.join(ROOT, "src", "game", "assets.ts");
const workshopDialoguesPath = path.join(
  ROOT,
  "src",
  "game",
  "content",
  "aiWorkshopDialogues.ts",
);

const [workshopSource, workshopDialoguesSource, assetsSource] = await Promise.all([
  readFile(workshopPath, "utf8"),
  readFile(workshopDialoguesPath, "utf8"),
  readFile(assetsPath, "utf8"),
]);

const productSection = workshopSource.match(
  /WORKSHOP_PRODUCTS[^=]*=\s*\[([\s\S]*?)\n\];/u,
)?.[1];
if (!productSection) throw new Error("WORKSHOP_PRODUCTS section not found");

const productIds = new Set(
  [...productSection.matchAll(/\bid:\s*"([^"]+)"/gu)].map(
    (match) => match[1],
  ),
);

const requestMatches = [
  ...workshopSource.matchAll(
    /makeWorkshopRequest\(\{\s*id:\s*"([^"]+)"[\s\S]*?productId:\s*"([^"]+)"[\s\S]*?\}\)/gu,
  ),
];
if (requestMatches.length === 0) {
  throw new Error("No workshop requests found");
}

const requestIds = new Set();
const errors = [];
const dialogueIds = new Set(
  [...workshopDialoguesSource.matchAll(/^\s*"([^"]+)":\s*\{/gmu)].map(
    (match) => match[1],
  ),
);
for (const productId of productIds) {
  if (!dialogueIds.has(productId)) {
    errors.push(`Missing ready/thanks dialogue for product: ${productId}`);
  }
}
for (const dialogueId of dialogueIds) {
  if (!productIds.has(dialogueId)) {
    errors.push(`Unknown product dialogue: ${dialogueId}`);
  }
}
for (const [, requestId, productId] of requestMatches) {
  if (requestIds.has(requestId)) errors.push(`Duplicate request id: ${requestId}`);
  requestIds.add(requestId);
  if (!productIds.has(productId)) {
    errors.push(`Unknown product ${productId} in request ${requestId}`);
  }

  for (const mood of ["worried", "happy"]) {
    const customerAsset = path.join(
      ROOT,
      "public",
      "assets",
      "customers",
      "v3-game",
      `${requestId}-${mood}.webp`,
    );
    try {
      await access(customerAsset);
    } catch {
      errors.push(`Missing customer asset: ${path.relative(ROOT, customerAsset)}`);
    }
  }
}

const manifestAssets = [
  ...assetsSource.matchAll(/"(\/assets\/[^"]+)"/gu),
].map((match) => match[1]);
for (const manifestAsset of manifestAssets) {
  const publicPath = path.join(ROOT, "public", manifestAsset.slice(1));
  try {
    await access(publicPath);
  } catch {
    errors.push(`Missing manifest asset: ${manifestAsset}`);
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `${productIds.size} workshop products, ${requestIds.size} requests, ` +
      `${dialogueIds.size} product dialogues, ` +
      `${manifestAssets.length} manifest assets validated`,
  );
}
