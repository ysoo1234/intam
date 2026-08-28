import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(
  ROOT,
  "assets-source",
  "shop",
  "products-v2",
  "originals-teal-v2",
);
const OUTPUT_DIR = path.join(
  ROOT,
  "assets-source",
  "shop",
  "products-v3-color-review",
);

const PALETTES = {
  coral: { label: "coral", hex: "#F46658" },
  apricot: { label: "apricot", hex: "#F58A4B" },
  mustard: { label: "mustard", hex: "#E2A722" },
  sage: { label: "sage", hex: "#8EA06A" },
  sky: { label: "sky", hex: "#67A9D2" },
  violet: { label: "violet", hex: "#936EB2" },
  berry: { label: "berry", hex: "#D84E79" },
  blue: { label: "deep blue", hex: "#315878" },
};

const PRODUCT_PALETTES = {
  "ai-speaker": "mustard",
  "ai-wheelchair": "berry",
  "autonomous-car": "sky",
  "call-translator": "violet",
  "crop-drone": "sage",
  "delivery-robot": "apricot",
  "drone-taxi": "blue",
  "face-lock": "coral",
  "greenhouse-computer": "sage",
  "harvest-robot": "mustard",
  "medical-reader": "coral",
  "nutrition-kiosk": "apricot",
  "performance-interpreter": "violet",
  "pet-care-robot": "berry",
  "photo-translator": "sky",
  "plant-camera": "sage",
  "road-safety-cctv": "mustard",
  "robot-vacuum": "coral",
  "security-camera": "blue",
  "smart-air-purifier": "sky",
  "smart-band": "violet",
  "smart-fridge": "sage",
  "smart-washer": "blue",
  "smart-watering": "mustard",
  "spell-checker": "berry",
  "study-helper": "apricot",
};

function hexToRgb(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHsv(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToRgb(h, s, v) {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (section < 1) [red, green] = [chroma, x];
  else if (section < 2) [red, green] = [x, chroma];
  else if (section < 3) [green, blue] = [chroma, x];
  else if (section < 4) [green, blue] = [x, chroma];
  else if (section < 5) [red, blue] = [x, chroma];
  else [red, blue] = [chroma, x];
  const match = v - chroma;
  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

async function recolorProduct(productId, palette) {
  const source = path.join(SOURCE_DIR, `${productId}.png`);
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const target = rgbToHsv(...Object.values(hexToRgb(palette.hex)));
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    const original = rgbToHsv(data[index], data[index + 1], data[index + 2]);
    const isTealSurface =
      original.h >= 155 &&
      original.h <= 210 &&
      original.s >= 0.18 &&
      original.v >= 0.28;
    if (!isTealSurface) continue;
    const recolored = hsvToRgb(
      target.h,
      Math.min(0.88, original.s * 0.68 + target.s * 0.32),
      original.v,
    );
    data[index] = recolored.r;
    data[index + 1] = recolored.g;
    data[index + 2] = recolored.b;
  }
  const output = path.join(OUTPUT_DIR, `${productId}.png`);
  await sharp(data, { raw: info }).png().toFile(output);
  return output;
}

async function buildContactSheet(entries) {
  const columns = 4;
  const cellWidth = 400;
  const cellHeight = 300;
  const headerHeight = 120;
  const rows = Math.ceil(entries.length / columns);
  const width = columns * cellWidth;
  const height = headerHeight + rows * cellHeight;
  const composites = [];
  for (const [index, entry] of entries.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * cellWidth;
    const y = headerHeight + row * cellHeight;
    const original = await sharp(entry.source)
      .resize(150, 150, { fit: "contain" })
      .png()
      .toBuffer();
    const candidate = await sharp(entry.output)
      .resize(150, 150, { fit: "contain" })
      .png()
      .toBuffer();
    composites.push(
      { input: original, left: x + 34, top: y + 24 },
      { input: candidate, left: x + 216, top: y + 24 },
    );
    const label = Buffer.from(`
      <svg width="${cellWidth}" height="${cellHeight}">
        <rect width="${cellWidth}" height="${cellHeight}" fill="none" stroke="#D9CDBB"/>
        <text x="200" y="207" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#315878">${escapeXml(entry.productId)}</text>
        <text x="109" y="238" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#756B5E">BEFORE</text>
        <circle cx="246" cy="233" r="9" fill="${entry.palette.hex}"/>
        <text x="262" y="238" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#756B5E">${escapeXml(entry.palette.label.toUpperCase())}</text>
      </svg>`);
    composites.push({ input: label, left: x, top: y });
  }
  const header = Buffer.from(`
    <svg width="${width}" height="${headerHeight}">
      <rect width="${width}" height="${headerHeight}" fill="#FFF9EF"/>
      <text x="48" y="48" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#315878">Products v3 · full-body color review</text>
      <text x="48" y="80" font-family="Arial, sans-serif" font-size="17" fill="#756B5E">Original geometry, outlines, lighting and alpha preserved · teal body surfaces recolored only</text>
    </svg>`);
  composites.push({ input: header, left: 0, top: 0 });
  const output = path.join(OUTPUT_DIR, "products-v3-color-review-sheet.png");
  await sharp({
    create: { width, height, channels: 4, background: "#FFF9EF" },
  })
    .composite(composites)
    .png()
    .toFile(output);
  return output;
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const entries = [];
for (const [productId, paletteId] of Object.entries(PRODUCT_PALETTES)) {
  const palette = PALETTES[paletteId];
  const output = await recolorProduct(productId, palette);
  entries.push({
    productId,
    palette,
    source: path.join(SOURCE_DIR, `${productId}.png`),
    output,
  });
}
const sheet = await buildContactSheet(entries);
console.log(`Created ${entries.length} review-only candidates.`);
console.log(sheet);
