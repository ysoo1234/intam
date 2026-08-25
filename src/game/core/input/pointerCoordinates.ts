import Phaser from "phaser";

export function getPointerWorldPoint(
  scene: Phaser.Scene,
  pointer: Phaser.Input.Pointer,
  output = new Phaser.Math.Vector2(),
) {
  return scene.cameras.main.getWorldPoint(pointer.x, pointer.y, output);
}
