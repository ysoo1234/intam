import type Phaser from "phaser";

/**
 * Midi-derived base colors. Feature code should prefer the semantic aliases
 * below when the color carries meaning.
 */
export const COLORS = {
  ink: 0x315567,
  inkSoft: 0x5e7884,
  cream: 0xf5efe3,
  paper: 0xfffbf2,
  paperRaised: 0xffffff,
  coral: 0xe9a095,
  coralDark: 0xc65f58,
  mint: 0x9bd8cf,
  yellow: 0xe8c66c,
  blue: 0x80c9cf,
  teal: 0x66b5ba,
  danger: 0xe35c52,
} as const;

export const COLOR_HEX = {
  ink: "#315567",
  inkSoft: "#5e7884",
  cream: "#f5efe3",
  paper: "#fffbf2",
  paperRaised: "#ffffff",
  coral: "#e9a095",
  coralDark: "#c65f58",
  mint: "#9bd8cf",
  yellow: "#e8c66c",
  blue: "#80c9cf",
  teal: "#66b5ba",
  danger: "#e35c52",
} as const;

export const SURFACE_COLORS = {
  paper: COLORS.paper,
  cream: COLORS.cream,
  raised: COLORS.paperRaised,
  dark: COLORS.ink,
  primary: COLORS.mint,
  positive: COLORS.mint,
  caution: COLORS.coral,
  danger: 0xffe2dd,
} as const;

export const TEXT_COLORS = {
  primary: COLOR_HEX.ink,
  secondary: COLOR_HEX.inkSoft,
  onDark: COLOR_HEX.paper,
  accent: "#397d82",
  positive: "#397044",
  caution: "#8a641d",
  danger: "#a94943",
} as const;

export const UI_RADII = {
  chip: 12,
  control: 18,
  panel: 26,
  dialog: 44,
} as const;

export const UI_STROKES = {
  subtle: 2,
  default: 4,
  emphasis: 6,
} as const;

export const UI_SHADOWS = {
  small: { x: 2, y: 4, alpha: 0.14 },
  medium: { x: 3, y: 6, alpha: 0.17 },
} as const;

export const UI_MOTION = {
  hoverScale: 1.04,
  pressedScale: 0.92,
  pressDurationMs: 90,
} as const;

export const UI_SPACING = {
  unit: 8,
  screenSafe: 24,
  group: 24,
  panelInset: 24,
  minimumTouchTarget: 56,
} as const;

export const FONT_FAMILY =
  '"Arial Rounded MT Bold", "NanumSquareRound", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

export type TextRole =
  | "caption"
  | "support"
  | "body"
  | "label"
  | "heading"
  | "title"
  | "display";

const TEXT_ROLE_STYLES = {
  caption: { fontSize: "14px", fontStyle: "bold" },
  support: { fontSize: "16px", fontStyle: "bold" },
  body: { fontSize: "18px", fontStyle: "bold" },
  label: { fontSize: "16px", fontStyle: "bold" },
  heading: { fontSize: "22px", fontStyle: "bold" },
  title: { fontSize: "28px", fontStyle: "bold" },
  display: { fontSize: "40px", fontStyle: "bold" },
} satisfies Record<TextRole, Phaser.Types.GameObjects.Text.TextStyle>;

export function getTextStyle(
  role: TextRole,
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: TEXT_COLORS.primary,
    fontFamily: FONT_FAMILY,
    ...TEXT_ROLE_STYLES[role],
    ...overrides,
  };
}
