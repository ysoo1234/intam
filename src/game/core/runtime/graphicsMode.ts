import Phaser from "phaser";

/**
 * Which renderer the game draws with.
 *
 * WebGL is sharp and fast on a real graphics chip, but many school computers
 * run the browser with graphics acceleration off (old drivers, virtual
 * desktops), and then WebGL is drawn by the processor: a few frames a
 * second, and Midi crawls. The plain Canvas renderer copes far better there
 * (measured: 3–6 fps in WebGL vs 60 fps in Canvas on the same machine), at
 * the cost of a few soft colour effects.
 *
 * - "auto": Canvas when acceleration is plainly off, or when an earlier
 *   visit on this computer found WebGL too slow; WebGL otherwise.
 * - "light": always Canvas.  - "sharp": always WebGL.
 */
export type GraphicsMode = "auto" | "light" | "sharp";

const MODE_KEY = "intam:graphics-mode:v1";
/** Set by the frame check when, in "auto", WebGL turned out too slow here. */
const AUTO_LIGHT_KEY = "intam:graphics-auto-light:v1";
/** One automatic reload per tab at most, so a slow machine can't loop. */
const RELOADED_KEY = "intam:graphics-reloaded:v1";
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;
/** Below this the game visibly struggles (Midi's step is capped at 20 fps). */
const SLOW_FPS = 26;

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readGraphicsMode(): GraphicsMode {
  const value = storage("local")?.getItem(MODE_KEY);
  return value === "light" || value === "sharp" ? value : "auto";
}

export function saveGraphicsMode(mode: GraphicsMode) {
  try {
    const local = storage("local");
    local?.setItem(MODE_KEY, mode);
    // A fresh choice: let "auto" look at this computer again from scratch.
    local?.removeItem(AUTO_LIGHT_KEY);
  } catch {
    // Storage blocked: the choice lasts until the page is reloaded.
  }
}

/** True when the browser's WebGL is drawn without a graphics chip. */
function isWebGlSoftware(): boolean {
  try {
    const strict = document.createElement("canvas").getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!strict) return true;
    const ext = strict.getExtension("WEBGL_debug_renderer_info");
    const name = String(strict.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : strict.RENDERER));
    strict.getExtension("WEBGL_lose_context")?.loseContext();
    return SOFTWARE_GPU.test(name);
  } catch {
    return false;
  }
}

/** The Phaser renderer type to boot with. */
export function chooseRendererType(): number {
  if (typeof window === "undefined") return Phaser.AUTO;
  const mode = readGraphicsMode();
  if (mode === "light") return Phaser.CANVAS;
  if (mode === "sharp") return Phaser.WEBGL;
  if (storage("local")?.getItem(AUTO_LIGHT_KEY) === "1") return Phaser.CANVAS;
  return isWebGlSoftware() ? Phaser.CANVAS : Phaser.AUTO;
}

/**
 * In "auto" with WebGL, counts frames for a few seconds once the first screen
 * is up. Too slow: this computer switches to Canvas (remembered) and the page
 * reloads once, on the first screen, before any playing starts.
 */
export function watchFrameRate(game: Phaser.Game) {
  if (readGraphicsMode() !== "auto" || game.renderer.type !== Phaser.WEBGL) return;
  if (storage("session")?.getItem(RELOADED_KEY) === "1") return;
  window.setTimeout(() => {
    if (!game.isRunning) return;
    const startFrame = game.loop.frame;
    const startedAt = performance.now();
    window.setTimeout(() => {
      if (!game.isRunning || document.hidden) return;
      const fps = (game.loop.frame - startFrame) / ((performance.now() - startedAt) / 1_000);
      if (fps >= SLOW_FPS) return;
      try {
        storage("local")?.setItem(AUTO_LIGHT_KEY, "1");
        storage("session")?.setItem(RELOADED_KEY, "1");
      } catch {
        return;
      }
      window.location.reload();
    }, 2_500);
  }, 2_500);
}

/** For the test menu: what is drawing and how fast, in plain words. */
export function describeGraphics(game: Phaser.Game): Promise<string> {
  return new Promise((resolve) => {
    const startFrame = game.loop.frame;
    const startedAt = performance.now();
    window.setTimeout(() => {
      const fps = Math.round((game.loop.frame - startFrame) / ((performance.now() - startedAt) / 1_000));
      const mode = { auto: "자동", light: "가벼운", sharp: "선명한" }[readGraphicsMode()];
      const renderer = game.renderer.type === Phaser.WEBGL ? "WebGL" : "Canvas";
      const scale = (game.canvas.width / 1_280).toFixed(2).replace(/\.?0+$/, "");
      resolve(`초당 ${fps}프레임 · ${mode} 모드(${renderer}) · 화면 배율 ${scale}x`);
    }, 1_000);
  });
}

/** The next mode in the test menu's cycle, and its name. */
export function nextGraphicsMode(mode: GraphicsMode): { mode: GraphicsMode; label: string } {
  if (mode === "auto") return { mode: "light", label: "가벼운 모드" };
  if (mode === "light") return { mode: "sharp", label: "선명한 모드" };
  return { mode: "auto", label: "자동 모드" };
}
