import Phaser from "phaser";

export type ArtTone = Readonly<{
  /** Relative saturation adjustment. `-0.2` removes 20% of color intensity. */
  saturation?: number;
  /** Brightness multiplier. `1` keeps the source brightness unchanged. */
  brightness?: number;
}>;

/**
 * Applies a non-destructive, single-pass tone adjustment to one artwork image.
 * UI and characters stay opt-in, and non-WebGL renderers keep the source art.
 */
export function applyArtTone<T extends Phaser.GameObjects.Image>(
  image: T,
  tone: ArtTone,
) {
  const saturation = tone.saturation ?? 0;
  const brightness = tone.brightness ?? 1;
  if (saturation === 0 && brightness === 1) return image;
  if (image.scene.game.renderer.type !== Phaser.WEBGL) return image;

  image.enableFilters();
  const filters = image.filters?.internal;
  if (!filters) return image;

  const matrix = filters.addColorMatrix().colorMatrix;
  if (saturation !== 0) matrix.saturate(saturation);
  if (brightness !== 1) matrix.brightness(brightness, true);
  return image;
}
