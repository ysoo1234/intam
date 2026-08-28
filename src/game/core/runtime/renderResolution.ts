export const MAX_RENDER_DEVICE_PIXEL_RATIO = 2;
export const MAX_RENDER_SCALE = 2;

const RENDER_SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2] as const;

export type RenderScaleDemand = Readonly<{
  parentWidth: number;
  parentHeight: number;
  gameWidth: number;
  gameHeight: number;
  devicePixelRatio: number;
}>;

/**
 * Selects the smallest bounded backing-buffer scale that can cover the
 * physical pixels occupied by the FIT-scaled canvas.
 *
 * Phaser 4.2 has no global GameConfig `resolution` setting. The caller uses
 * this value for the renderer dimensions and applies the same value as the
 * scene camera zoom, preserving the 1280 x 720 logical coordinate system.
 */
export function selectRenderScale(demand: RenderScaleDemand): number {
  const parentWidth = Number.isFinite(demand.parentWidth)
    ? Math.max(1, demand.parentWidth)
    : 1;
  const parentHeight = Number.isFinite(demand.parentHeight)
    ? Math.max(1, demand.parentHeight)
    : 1;
  const devicePixelRatio = Number.isFinite(demand.devicePixelRatio)
    ? clamp(
        demand.devicePixelRatio,
        1,
        MAX_RENDER_DEVICE_PIXEL_RATIO,
      )
    : 1;
  const cssFitScale = Math.min(
    parentWidth / demand.gameWidth,
    parentHeight / demand.gameHeight,
  );
  const physicalPixelDemand = Math.max(1, cssFitScale * devicePixelRatio);

  return (
    RENDER_SCALE_STEPS.find((step) => step >= physicalPixelDemand) ??
    MAX_RENDER_SCALE
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
