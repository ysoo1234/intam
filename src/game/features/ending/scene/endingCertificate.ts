import { ENDING_CERTIFICATE, ENDING_GEMS } from "../../../content/endingStory";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { FONT_FAMILY } from "../../../core/visual/theme";

/**
 * The AI 월드 탐험가 certificate, drawn on a plain canvas: what the student
 * sees on screen is exactly the picture they save. It certifies finishing
 * the textbook (the village is where students come after it).
 */
export const CERTIFICATE_SIZE = { width: 1600, height: 1130 } as const;
/** Where the photo goes inside the polaroid frame (canvas pixels). */
export const CERTIFICATE_PHOTO = { x: 168, y: 330, width: 464, height: 464 } as const;
const POLAROID = { x: 150, y: 312, width: 500, height: 520 } as const;
const COLUMN_X = 880;
const COLUMN_RIGHT = 1_450;
/** Midi waving, stuck like a sticker on the photo's bottom-right corner. */
const STICKER = { x: 650, y: 772, height: 188, angle: 0.1 } as const;
// Stamped boldly up and to the left of the corner, just over the writing's end.
const SEAL = { x: 1_304, y: 898, radius: 122 } as const;
const INK = "#2f3d68";
const QUIET = "#7a86b8";

export type CertificateArt = Readonly<{
  /** Midi waving, stuck on the photo's corner (and in the no-camera picture). */
  midi?: CanvasImageSource;
  /** The village picture behind Midi when there is no camera photo. */
  village?: CanvasImageSource;
  /** The game's star artwork, for the earned-stars row. */
  star?: CanvasImageSource;
}>;

export type CertificateContent = Readonly<{
  /** The camera photo (already mirrored like the preview), "midi" for the drawn fallback, or null for the empty slot. */
  photo: CanvasImageSource | "midi" | null;
  stars: number;
  starsMax: number;
  golden: boolean;
  stamped: boolean;
  art: CertificateArt;
}>;

const sizeOf = (source: CanvasImageSource) => {
  const candidate = source as { videoWidth?: number; videoHeight?: number; width?: number | SVGAnimatedLength; height?: number | SVGAnimatedLength };
  const width = candidate.videoWidth || (typeof candidate.width === "number" ? candidate.width : 0);
  const height = candidate.videoHeight || (typeof candidate.height === "number" ? candidate.height : 0);
  return { width, height };
};

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Draws `source` to fill the rectangle, cropping the overflow (like CSS cover). */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const size = sizeOf(source);
  if (!size.width || !size.height) return;
  const scale = Math.max(width / size.width, height / size.height);
  const sw = width / scale;
  const sh = height / scale;
  ctx.drawImage(source, (size.width - sw) / 2, (size.height - sh) / 2, sw, sh, x, y, width, height);
}

function hexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = Math.PI / 6 + (Math.PI / 3) * side;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (side === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function starShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI / 5) * point;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawPaper(ctx: CanvasRenderingContext2D, golden: boolean) {
  const { width, height } = CERTIFICATE_SIZE;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.shadowColor = "rgba(43, 63, 134, 0.22)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, 24, 24, width - 48, height - 56, 44);
  ctx.fillStyle = "#fffaf0";
  ctx.fill();
  ctx.restore();
  const border = ctx.createLinearGradient(0, 0, width, height);
  if (golden) {
    border.addColorStop(0, "#f2b630");
    border.addColorStop(0.5, "#ffe08a");
    border.addColorStop(1, "#e7a21c");
  } else {
    border.addColorStop(0, "#3d8fe0");
    border.addColorStop(1, "#9a5bd0");
  }
  roundedRect(ctx, 30, 30, width - 60, height - 68, 40);
  ctx.lineWidth = 12;
  ctx.strokeStyle = border;
  ctx.stroke();
  // One quiet inner line; the paper stays calm so the content carries it.
  roundedRect(ctx, 58, 58, width - 116, height - 124, 28);
  ctx.lineWidth = 3;
  ctx.strokeStyle = golden ? "#f3ddae" : "#e4def5";
  ctx.stroke();
}

function drawHeading(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = QUIET;
  ctx.font = `bold 30px ${FONT_FAMILY}`;
  ctx.fillText(ENDING_CERTIFICATE.book, 800, 136);
  ctx.font = `66px ${DISPLAY_FONT_FAMILY}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 18;
  ctx.strokeStyle = "#2b3f86";
  ctx.strokeText(ENDING_CERTIFICATE.title, 800, 222);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(ENDING_CERTIFICATE.title, 800, 222);
  const fill = ctx.createLinearGradient(520, 0, 1_080, 0);
  fill.addColorStop(0, "#2f8fd8");
  fill.addColorStop(1, "#a347b8");
  ctx.fillStyle = fill;
  ctx.fillText(ENDING_CERTIFICATE.title, 800, 222);
  ctx.beginPath();
  ctx.moveTo(150, 278);
  ctx.lineTo(1_450, 278);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e3dcf5";
  ctx.stroke();
}

function drawPhoto(ctx: CanvasRenderingContext2D, content: CertificateContent) {
  ctx.save();
  ctx.shadowColor = "rgba(43, 63, 134, 0.2)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, POLAROID.x, POLAROID.y, POLAROID.width, POLAROID.height, 22);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  roundedRect(ctx, POLAROID.x, POLAROID.y, POLAROID.width, POLAROID.height, 22);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e5e0f5";
  ctx.stroke();

  const { x, y, width, height } = CERTIFICATE_PHOTO;
  ctx.save();
  roundedRect(ctx, x, y, width, height, 14);
  ctx.clip();
  if (content.photo === null) {
    ctx.fillStyle = "#f1f4fb";
    ctx.fillRect(x, y, width, height);
  } else if (content.photo === "midi") {
    if (content.art.village) drawCover(ctx, content.art.village, x, y, width, height);
    else {
      ctx.fillStyle = "#cfe9f7";
      ctx.fillRect(x, y, width, height);
    }
    if (content.art.midi) {
      const size = sizeOf(content.art.midi);
      const drawHeight = height * 0.78;
      const drawWidth = (size.width / size.height) * drawHeight;
      ctx.drawImage(content.art.midi, x + (width - drawWidth) / 2, y + height - drawHeight - 10, drawWidth, drawHeight);
    }
  } else {
    drawCover(ctx, content.photo, x, y, width, height);
  }
  ctx.restore();
  if (content.photo === null) {
    roundedRect(ctx, x + 6, y + 6, width - 12, height - 12, 12);
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#9fb0d6";
    ctx.stroke();
    ctx.setLineDash([]);
    // A little camera.
    const cx = x + width / 2;
    const cy = y + height / 2 - 26;
    roundedRect(ctx, cx - 54, cy - 34, 108, 72, 14);
    ctx.fillStyle = "#c3cfe8";
    ctx.fill();
    ctx.fillRect(cx - 22, cy - 46, 44, 14);
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#f1f4fb";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = QUIET;
    ctx.font = `bold 30px ${FONT_FAMILY}`;
    ctx.fillText("사진 칸", cx, cy + 82);
  }
}

function drawSticker(ctx: CanvasRenderingContext2D, midi: CanvasImageSource) {
  const size = sizeOf(midi);
  if (!size.height) return;
  const width = (size.width / size.height) * STICKER.height;
  ctx.save();
  ctx.translate(STICKER.x, STICKER.y);
  ctx.rotate(STICKER.angle);
  ctx.drawImage(midi, -width / 2, -STICKER.height / 2, width, STICKER.height);
  ctx.restore();
}

function drawColumn(ctx: CanvasRenderingContext2D, content: CertificateContent) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const label = (text: string, y: number) => {
    ctx.fillStyle = QUIET;
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillText(text, COLUMN_X, y);
  };
  label(ENDING_CERTIFICATE.nameLabel, 368);
  ctx.fillStyle = INK;
  ctx.font = `bold 54px ${FONT_FAMILY}`;
  ctx.fillText(ENDING_CERTIFICATE.name, COLUMN_X, 426);
  ctx.beginPath();
  ctx.moveTo(COLUMN_X, 466);
  ctx.lineTo(COLUMN_RIGHT, 466);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#c9c2ec";
  ctx.stroke();

  label(ENDING_CERTIFICATE.gemsLabel, 520);
  ENDING_GEMS.forEach((gem, index) => {
    const cx = COLUMN_X + 28 + index * 63;
    const cy = 580;
    hexagon(ctx, cx, cy, 30);
    ctx.fillStyle = gem.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(36, 48, 90, 0.55)";
    ctx.strokeText(gem.name, cx, cy + 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(gem.name, cx, cy + 1);
  });

  ctx.textAlign = "left";
  label(ENDING_CERTIFICATE.starsLabel, 664);
  // Only the stars actually earned, drawn with the game's own star artwork,
  // each one sitting exactly under a gem of the row above (same 63 px pitch).
  for (let index = 0; index < content.stars; index += 1) {
    const cx = COLUMN_X + 28 + index * 63;
    if (content.art.star) {
      ctx.drawImage(content.art.star, cx - 29, 691, 58, 58);
    } else {
      starShape(ctx, cx, 720, 26, 12);
      ctx.fillStyle = "#f6c445";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#d89b1d";
      ctx.stroke();
    }
  }
}

function drawStatement(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.font = `bold 32px ${FONT_FAMILY}`;
  ENDING_CERTIFICATE.statement.forEach((line, index) => ctx.fillText(line, 800, 934 + index * 52));
}

/** Midi's seal (drawn here until its generated artwork arrives). */
export function drawEndingSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.2);
  const ink = "rgba(46, 124, 205, 0.86)";
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = radius * 0.075;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = radius * 0.035;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  for (let point = 0; point < 12; point += 1) {
    const angle = (Math.PI * 2 * point) / 12;
    starShape(ctx, Math.cos(angle) * radius * 0.88, Math.sin(angle) * radius * 0.88, radius * 0.05, radius * 0.022);
    ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(radius * 0.36)}px ${DISPLAY_FONT_FAMILY}`;
  ctx.fillText("AI 월드", 0, -radius * 0.22);
  ctx.font = `${Math.round(radius * 0.5)}px ${DISPLAY_FONT_FAMILY}`;
  ctx.fillText("인증", 0, radius * 0.26);
  ctx.restore();
}

/** Where the seal lands, for the stamp animation (canvas pixels). */
export const CERTIFICATE_SEAL = SEAL;

export function drawEndingCertificate(canvas: HTMLCanvasElement, content: CertificateContent) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawPaper(ctx, content.golden);
  drawHeading(ctx);
  drawPhoto(ctx, content);
  if (content.photo !== "midi" && content.art.midi) drawSticker(ctx, content.art.midi);
  drawColumn(ctx, content);
  drawStatement(ctx);
  if (content.stamped) drawEndingSeal(ctx, SEAL.x, SEAL.y, SEAL.radius);
}

export function createCertificateCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = CERTIFICATE_SIZE.width;
  canvas.height = CERTIFICATE_SIZE.height;
  return canvas;
}
