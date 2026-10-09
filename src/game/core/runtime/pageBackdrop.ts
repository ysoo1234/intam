import Phaser from "phaser";
import { SCENE_KEYS, type SceneKey } from "../scenes/sceneKeys";

/**
 * The 16:9 canvas sits on a full-screen page. Instead of a decorative frame,
 * the page continues the active scene's own edge colours (top, middle, bottom),
 * so the game reads as one full-bleed screen on any window shape.
 */
type PageBackdrop = Readonly<{ top: string; middle: string; bottom: string }>;

export const PAGE_BACKDROPS: Readonly<Record<SceneKey, PageBackdrop>> = {
  [SCENE_KEYS.intro]: { top: "#7fd0f2", middle: "#94b5e5", bottom: "#a99ad8" },
  [SCENE_KEYS.world]: { top: "#94bb86", middle: "#a2ba75", bottom: "#a2ba75" },
  [SCENE_KEYS.airport]: { top: "#92cfe8", middle: "#a8d7d8", bottom: "#855d3d" },
  [SCENE_KEYS.aiWorkshop]: { top: "#bf9574", middle: "#b08e6c", bottom: "#cf9669" },
  [SCENE_KEYS.ethicsReview]: { top: "#cfaf89", middle: "#9e7b56", bottom: "#9a673d" },
};

export function applyPageBackdrop(sceneKey: string) {
  if (typeof document === "undefined") return;
  const backdrop = PAGE_BACKDROPS[sceneKey as SceneKey];
  if (!backdrop) return;
  const style = document.documentElement.style;
  style.setProperty("--page-top", backdrop.top);
  style.setProperty("--page-middle", backdrop.middle);
  style.setProperty("--page-bottom", backdrop.bottom);
}

/**
 * Follows the active scene so the page colour always matches what is on screen.
 * Checked once per frame against the last applied key, so it costs a string compare.
 */
export function syncPageBackdrop(game: Phaser.Game) {
  let appliedKey = "";
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    const scenes = game.scene.getScenes(true);
    const key = scenes[scenes.length - 1]?.sys.settings.key;
    if (!key || key === appliedKey) return;
    appliedKey = key;
    applyPageBackdrop(key);
  });
}
