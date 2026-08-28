import Phaser from "phaser";
import { GAME_SIZE } from "../../assets";
import { configureSceneTextResolution } from "./configureSceneTextResolution";

export function configureSceneCamera(scene: Phaser.Scene, renderScale: number) {
  configureSceneTextResolution(scene, renderScale);
  scene.cameras.main
    .setZoom(renderScale)
    .centerOn(GAME_SIZE.width / 2, GAME_SIZE.height / 2);
}
