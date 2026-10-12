/**
 * A rough read of how much the device can comfortably draw. Classroom
 * Chromebooks and tablets get a 2x canvas at most and slower background
 * animation redraws, so the game stays smooth on them.
 */
type DeviceHints = Navigator & { deviceMemory?: number };

function readNavigator(): DeviceHints | undefined {
  return typeof navigator === "undefined" ? undefined : (navigator as DeviceHints);
}

/** Few CPU cores or little memory: an entry-level Chromebook or tablet. */
export function isLowPowerDevice(): boolean {
  const hints = readNavigator();
  if (!hints) return false;
  const cores = hints.hardwareConcurrency ?? 8;
  const memory = hints.deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

/** A touch-first screen (a tablet or a Chromebook in tablet mode). */
export function isTouchFirstDevice(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** How often (ms) a code-drawn background animation may repaint its canvas. */
export function getAmbientRedrawIntervalMs(): number {
  return isLowPowerDevice() ? 70 : 40;
}
