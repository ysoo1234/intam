import Phaser from "phaser";
import { SCENE_KEYS } from "../scenes/sceneKeys";

/**
 * Phaser runs each frame from requestAnimationFrame and only asks for the
 * next frame after the current one returns, so one uncaught error anywhere in
 * a frame stops the whole game for good (the screen just freezes). This guard
 * catches such errors, remembers the last one so it can be read later, and
 * keeps the frames coming. When the same error returns frame after frame the
 * scene is beyond help, and the game goes back to the village instead.
 */
export const LAST_ERROR_STORAGE_KEY = "intam:last-error:v1";
/** Frames in a row that may fail before the game gives up on the scene. */
const RECOVER_AFTER_FRAMES = 30;

export type GameErrorRecord = Readonly<{
  message: string;
  scene: string;
  at: string;
  stack?: string;
}>;

function describe(error: unknown) {
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  return { message: String(error), stack: undefined };
}

function activeSceneKey(game: Phaser.Game) {
  const scenes = game.scene.getScenes(true);
  return scenes[scenes.length - 1]?.scene.key ?? "";
}

function remember(record: GameErrorRecord) {
  try {
    window.localStorage.setItem(LAST_ERROR_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage may be blocked; the console still has it.
  }
}

export function readLastGameError(): GameErrorRecord | undefined {
  try {
    const raw = window.localStorage.getItem(LAST_ERROR_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<GameErrorRecord>;
    if (typeof parsed.message !== "string") return undefined;
    return { message: parsed.message, scene: parsed.scene ?? "", at: parsed.at ?? "", stack: parsed.stack };
  } catch {
    return undefined;
  }
}

export function clearLastGameError() {
  try {
    window.localStorage.removeItem(LAST_ERROR_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function installGameErrorGuard(game: Phaser.Game) {
  const step = game.step.bind(game);
  let failedFrames = 0;
  let lastMessage = "";
  const report = (error: unknown, where: string) => {
    const { message, stack } = describe(error);
    const record: GameErrorRecord = { message: `${where}: ${message}`, scene: activeSceneKey(game), at: new Date().toISOString(), stack };
    if (message !== lastMessage) console.error("[intam] game error", record, error);
    lastMessage = message;
    remember(record);
  };
  game.step = (time: number, delta: number) => {
    try {
      step(time, delta);
      failedFrames = 0;
    } catch (error) {
      report(error, "frame");
      failedFrames += 1;
      if (failedFrames < RECOVER_AFTER_FRAMES) return;
      failedFrames = 0;
      // The scene keeps failing: back to the village, stars and records kept.
      try {
        game.scene.getScenes(true).forEach((scene) => game.scene.stop(scene.scene.key));
        game.scene.start(SCENE_KEYS.world);
      } catch (recoverError) {
        report(recoverError, "recover");
      }
    }
  };
  // Errors from timers, promises and input handlers outside the frame are remembered too.
  window.addEventListener("error", (event) => report(event.error ?? event.message, "window"));
  window.addEventListener("unhandledrejection", (event) => report(event.reason, "promise"));
}
