import type Phaser from "phaser";

/**
 * Small code-drawn buttons (예/아니요, 확인, ?, …): a flat face with a thin
 * darker band along the bottom inside the shape, and one thin outline in a
 * deeper shade of the button's own colour (no foreign navy or white edge).
 */
export type OutlinedButtonVariant = "teal" | "cream";

type OutlinedPalette = Readonly<{ face: number; facePressed: number; band: number; line: number }>;

const LINE_WIDTH = 2.5;

const OUTLINED_PALETTES: Record<OutlinedButtonVariant, OutlinedPalette> = {
  teal: { face: 0x5ec6ca, facePressed: 0x50b8bd, band: 0x44adb4, line: 0x2f8f93 },
  cream: { face: 0xfef5de, facePressed: 0xf6e9cb, band: 0xe9d9bb, line: 0xd2b98c },
};

const OUTLINED_TEXT_STYLES = {
  teal: { color: "#ffffff", stroke: "#2a8a90", strokeThickness: 3 },
  cream: { color: "#315567" },
} as const;

export function outlinedButtonTextStyle(variant: OutlinedButtonVariant) {
  return { ...OUTLINED_TEXT_STYLES[variant] };
}

export type OutlinedDrawOptions = Readonly<{
  pressed?: boolean;
  /** Corner radius; a full pill by default. */
  radius?: number;
}>;

/** Draws a `width` x `height` button centred on (0, 0) into `graphics` (cleared first). */
export function drawOutlinedPill(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  variant: OutlinedButtonVariant = "teal",
  options: OutlinedDrawOptions = {},
) {
  const palette = OUTLINED_PALETTES[variant];
  const half = LINE_WIDTH / 2;
  const x = -width / 2 + half;
  const y = -height / 2 + half;
  const w = width - LINE_WIDTH;
  const h = height - LINE_WIDTH;
  const radius = (boxHeight: number) => Math.min(boxHeight / 2, options.radius ?? boxHeight / 2);
  // The bottom band shows below a slightly shorter face (a thin crescent at the ends).
  const band = Math.max(3, Math.round(height * 0.07));
  graphics.clear();
  graphics.fillStyle(palette.band, 1).fillRoundedRect(x, y, w, h, radius(h));
  graphics
    .fillStyle(options.pressed ? palette.facePressed : palette.face, 1)
    .fillRoundedRect(x, y, w, h - band, radius(h - band));
  graphics.lineStyle(LINE_WIDTH, palette.line, 1).strokeRoundedRect(x, y, w, h, radius(h));
  return graphics;
}

/** The round version (the ? button), centred on (0, 0). */
export function drawOutlinedCircle(
  graphics: Phaser.GameObjects.Graphics,
  radius: number,
  variant: OutlinedButtonVariant = "teal",
  options: Omit<OutlinedDrawOptions, "radius"> = {},
) {
  const palette = OUTLINED_PALETTES[variant];
  const r = radius - LINE_WIDTH / 2;
  const band = Math.max(3, Math.round(radius * 0.12));
  graphics.clear();
  graphics.fillStyle(palette.band, 1).fillCircle(0, 0, r);
  graphics
    .fillStyle(options.pressed ? palette.facePressed : palette.face, 1)
    .fillCircle(0, -band / 2, r - band / 2);
  graphics.lineStyle(LINE_WIDTH, palette.line, 1).strokeCircle(0, 0, r);
  return graphics;
}
