import type Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { preloadMidiFaces } from "../../../core/player/midiFrames";
import { preloadPlayerTextures } from "../../../core/player/playerSprite";
import { preloadCoachAssets } from "../../../core/visual/coachGuide";
import { getWorldMapDefinition } from "../model/mapRegistry";
import { preloadVillageProgressPresentationAssets } from "./villageProgressPresentation";
import { preloadVillageScenery } from "./villageScenery";

const WORLD_MAP = getWorldMapDefinition();

/**
 * Everything the village scene draws. The first screen loads it too (through
 * the village preview), so walking through its door into the village needs
 * no loading at all and no empty frame flashes between the two.
 */
export function preloadWorldSceneAssets(scene: Phaser.Scene) {
  preloadVillageScenery(scene, WORLD_MAP);
  preloadVillageProgressPresentationAssets(scene);
  if (!scene.textures.exists("village-entry-button")) {
    scene.load.image("village-entry-button", GAME_ASSETS.ui.villageEntryButton);
  }
  preloadPlayerTextures(scene);
  // Textbook face frames, so Midi's mouth and eyes move while she talks.
  preloadMidiFaces(scene);
  preloadCoachAssets(scene);
}
