// Up to 3x for a big, sharp display (a 4K TV or a 150%-scaled 2560 monitor):
// code-drawn shapes and text stay crisp there, pictures are 2x at most.
export const MAX_RENDER_DEVICE_PIXEL_RATIO = 3;
export const MAX_RENDER_SCALE = 3;
export const MODEST_DEVICE_MAX_RENDER_SCALE = 2;

const RENDER_SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;

export type RenderScaleDemand = Readonly<{
  parentWidth: number;
  parentHeight: number;
  gameWidth: number;
  gameHeight: number;
  devicePixelRatio: number;
  /**
   * The whole screen, when known: the canvas is sized once at boot, and the
   * window often grows afterwards (maximised, F11, moved to a projector), so
   * the buffer is sized for the largest the canvas can become on this screen.
   */
  screenWidth?: number;
  screenHeight?: number;
  /**
   * Tablets and entry-level Chromebooks stay at 2x at most: their screens are
   * small enough that 2x is already sharp, and a bigger buffer costs frames.
   */
  modestDevice?: boolean;
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
  const screenWidth = Number.isFinite(demand.screenWidth) ? demand.screenWidth! : 0;
  const screenHeight = Number.isFinite(demand.screenHeight) ? demand.screenHeight! : 0;
  const cssFitScale = Math.max(
    Math.min(parentWidth / demand.gameWidth, parentHeight / demand.gameHeight),
    Math.min(screenWidth / demand.gameWidth, screenHeight / demand.gameHeight),
  );
  const physicalPixelDemand = Math.max(1, cssFitScale * devicePixelRatio);

  const maxScale = demand.modestDevice ? MODEST_DEVICE_MAX_RENDER_SCALE : MAX_RENDER_SCALE;
  const steps = RENDER_SCALE_STEPS.filter((step) => step <= maxScale);
  return steps.find((step) => step >= physicalPixelDemand) ?? maxScale;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
