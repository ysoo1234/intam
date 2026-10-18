import type Phaser from "phaser";

/** Phaser.Loader.Events.COMPLETE (named here so this file needs only Phaser's types). */
const COMPLETE = "complete";
import { GAME_ASSETS } from "../../../assets";
import { preloadMidiFaces } from "../../../core/player/midiFrames";
import { preloadEndingButtons } from "./endingButtons";
import { ENDING_FINALE_TEXTURES } from "./endingFinale";
import { endingCustomerTexture, ENDING_PORTAL_TEXTURES } from "./endingPortal";
import { ENDING_VILLAGE_TEXTURES } from "./endingVillage";

/** Queues the ending's own pictures (skipping any already loaded). */
export function preloadEndingAssets(scene: Phaser.Scene) {
  const load = (key: string, url: string) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url);
  };
  load(ENDING_VILLAGE_TEXTURES.snapshot, GAME_ASSETS.intro.storyVillage);
  load(ENDING_VILLAGE_TEXTURES.star, GAME_ASSETS.ui.villageActivityStarFilled);
  load(ENDING_PORTAL_TEXTURES.library, GAME_ASSETS.ending.library);
  load(ENDING_PORTAL_TEXTURES.frame, GAME_ASSETS.intro.storyFrame);
  load(ENDING_FINALE_TEXTURES.board, GAME_ASSETS.intro.board);
  GAME_ASSETS.ending.customers.forEach((url, index) => load(endingCustomerTexture(index), url));
  preloadEndingButtons(scene);
  preloadMidiFaces(scene);
}

/**
 * The ending starts straight from the village picture, with no loading
 * screen, so the village quietly loads its few small pictures a moment
 * after it appears (pictures are shared across scenes).
 */
export function preloadEndingInBackground(scene: Phaser.Scene) {
  const queue = () => {
    if (!scene.sys.isActive()) return;
    // The village may still be loading something of its own: go right after it.
    if (scene.load.isLoading()) {
      scene.load.once(COMPLETE, queue);
      return;
    }
    preloadEndingAssets(scene);
    if (scene.load.list.size > 0) scene.load.start();
  };
  window.setTimeout(queue, 900);
}
