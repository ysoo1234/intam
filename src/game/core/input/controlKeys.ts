import Phaser from "phaser";

export type ControlKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  action: Phaser.Input.Keyboard.Key;
  enter: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
};

export function makeControlKeys(scene: Phaser.Scene): ControlKeys | undefined {
  if (!scene.input.keyboard) return undefined;

  return scene.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    action: Phaser.Input.Keyboard.KeyCodes.SPACE,
    enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  }) as ControlKeys;
}
