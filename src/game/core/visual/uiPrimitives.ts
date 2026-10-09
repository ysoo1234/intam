import Phaser from "phaser";
import {
  COLORS,
  getTextStyle,
  SURFACE_COLORS,
  TEXT_COLORS,
  UI_MOTION,
  UI_RADII,
  UI_SHADOWS,
  UI_SPACING,
  UI_STROKES,
  type TextRole,
} from "./theme";

export type UiSurfaceVariant = keyof typeof SURFACE_COLORS;
export type UiShadowSize = "none" | keyof typeof UI_SHADOWS;

export type UiBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type UiSurfaceOptions = Readonly<{
  radius?: number;
  fillAlpha?: number;
  borderColor?: number;
  borderAlpha?: number;
  borderWidth?: number;
  shadow?: UiShadowSize;
  depth?: number;
}>;

export function addUiSurface(
  scene: Phaser.Scene,
  bounds: UiBounds,
  variant: UiSurfaceVariant = "paper",
  options: UiSurfaceOptions = {},
) {
  const graphics = scene.add.graphics();
  const radius = options.radius ?? UI_RADII.panel;
  const shadow =
    options.shadow === "none"
      ? undefined
      : UI_SHADOWS[options.shadow ?? "small"];

  if (shadow) {
    graphics.fillStyle(COLORS.ink, shadow.alpha);
    graphics.fillRoundedRect(
      bounds.x + shadow.x,
      bounds.y + shadow.y,
      bounds.width,
      bounds.height,
      radius,
    );
  }

  graphics.fillStyle(SURFACE_COLORS[variant], options.fillAlpha ?? 0.98);
  graphics.lineStyle(
    options.borderWidth ?? UI_STROKES.default,
    options.borderColor ?? COLORS.ink,
    options.borderAlpha ?? 1,
  );
  graphics.fillRoundedRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    radius,
  );
  graphics.strokeRoundedRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    radius,
  );
  if (options.depth !== undefined) graphics.setDepth(options.depth);
  return graphics;
}

export type UiButtonVariant = "paper" | "primary" | "positive" | "caution";

export type UiButtonConfig = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onPress: () => void;
  variant?: UiButtonVariant;
  radius?: number;
  textRole?: TextRole;
  fontSize?: string;
  depth?: number;
  borderWidth?: number;
  stopPropagation?: boolean;
}>;

export type UiButtonView = Readonly<{
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
}>;

export function addUiButton(
  scene: Phaser.Scene,
  config: UiButtonConfig,
): UiButtonView {
  const width = Math.max(config.width, UI_SPACING.minimumTouchTarget);
  const height = Math.max(config.height, UI_SPACING.minimumTouchTarget);
  const radius = config.radius ?? Math.min(UI_RADII.control, height / 2);
  const surface = addUiSurface(
    scene,
    { x: -width / 2, y: -height / 2, width, height },
    config.variant ?? "paper",
    {
      radius,
      borderWidth: config.borderWidth ?? UI_STROKES.default,
      shadow: "medium",
    },
  );
  const label = scene.add
    .text(
      0,
      -1,
      config.label,
      getTextStyle(config.textRole ?? "heading", {
        color: TEXT_COLORS.primary,
        ...(config.fontSize ? { fontSize: config.fontSize } : {}),
      }),
    )
    .setOrigin(0.5);
  const container = scene.add.container(config.x, config.y, [surface, label]);
  if (config.depth !== undefined) container.setDepth(config.depth);
  container
    .setSize(width + UI_SPACING.unit, height + UI_SPACING.unit)
    .setInteractive({ useHandCursor: true });
  let isHovering = false;
  container.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      if (config.stopPropagation ?? true) event.stopPropagation();
      scene.tweens.killTweensOf(container);
      scene.tweens.add({
        targets: container,
        scale: UI_MOTION.pressedScale,
        duration: UI_MOTION.pressDurationMs,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => {
          container.setScale(isHovering ? UI_MOTION.hoverScale : 1);
        },
      });
      config.onPress();
    },
  );
  container.on("pointerover", () => {
    isHovering = true;
    if (scene.tweens.isTweening(container)) return;
    container.setScale(UI_MOTION.hoverScale);
  });
  container.on("pointerout", () => {
    isHovering = false;
    if (scene.tweens.isTweening(container)) return;
    container.setScale(1);
  });
  return { container, label };
}

export function addFlowerBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color: number = COLORS.coral,
) {
  const container = scene.add.container(x, y);
  const petals = scene.add.graphics();
  petals.fillStyle(COLORS.ink, 0.24);
  petals.fillCircle(4, 7, 35);
  petals.fillStyle(color, 1);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    petals.fillCircle(Math.cos(angle) * 25, Math.sin(angle) * 25, 16);
  }
  petals.fillStyle(COLORS.cream, 1);
  petals.fillCircle(0, 0, 25);
  petals.lineStyle(5, COLORS.ink, 1);
  petals.strokeCircle(0, 0, 25);
  const text = scene.add
    .text(0, 0, label, getTextStyle("heading"))
    .setOrigin(0.5);
  container.add([petals, text]);
  return container;
}
