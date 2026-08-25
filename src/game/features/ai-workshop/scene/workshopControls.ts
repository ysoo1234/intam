import Phaser from "phaser";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { createFloatingJoystick } from "../../../core/input/floatingJoystick";
import { addUiButton } from "../../../core/visual/uiPrimitives";

export type WorkshopControls = {
  keys: ControlKeys | undefined;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  joystick: Phaser.Math.Vector2;
  actionText: Phaser.GameObjects.Text;
};

export function createWorkshopControls(
  scene: Phaser.Scene,
  onBack: () => void,
  onAction: () => void,
): WorkshopControls {
  const keys = makeControlKeys(scene);
  const cursors = scene.input.keyboard?.createCursorKeys();
  scene.input.keyboard?.on("keydown-ESC", onBack);
  const joystick = new Phaser.Math.Vector2();
  createFloatingJoystick(scene, {
    direction: joystick,
    radius: 48,
    depth: 55,
    canStart: (pointer) => !(pointer.x > 1080 && pointer.y > 520),
  });

  const { container: action, label: actionText } = addUiButton(scene, {
    x: 1190,
    y: 630,
    width: 96,
    height: 96,
    radius: 48,
    label: "톡!",
    onPress: onAction,
    variant: "caution",
    fontSize: "21px",
    depth: 57,
    stopPropagation: false,
  });
  action.setSize(108, 108);
  return { keys, cursors, joystick, actionText };
}
