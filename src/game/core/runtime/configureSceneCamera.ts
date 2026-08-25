import Phaser from "phaser";
import { GAME_SIZE } from "../../assets";

export function configureSceneCamera(scene: Phaser.Scene, renderScale: number) {
  scene.cameras.main
    .setZoom(renderScale)
    .centerOn(GAME_SIZE.width / 2, GAME_SIZE.height / 2);
}
