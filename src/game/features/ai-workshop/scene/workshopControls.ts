import Phaser from "phaser";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { addUiButton } from "../../../core/visual/uiPrimitives";
import { projectWorkshopPointToWalkableArea } from "./workshopPlayer";

export type WorkshopControls = {
  keys: ControlKeys | undefined;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  joystick: Phaser.Math.Vector2;
  updateTouchDirection: () => void;
  actionButton: Phaser.GameObjects.Container;
  actionText: Phaser.GameObjects.Text;
};

export function createWorkshopControls(
  scene: Phaser.Scene,
  onBack: () => void,
  onAction: () => void,
  getPlayerPosition: () => Readonly<{ x: number; y: number }> | undefined,
): WorkshopControls {
  const keys = makeControlKeys(scene);
  const cursors = scene.input.keyboard?.createCursorKeys();
  scene.input.keyboard?.on("keydown-ESC", onBack);
  const joystick = new Phaser.Math.Vector2();
  const pointerWorldPoint = new Phaser.Math.Vector2();
  const target = new Phaser.Math.Vector2();
  let pointerId = -1;
  let hasTarget = false;
  let lastPlayerX = Number.NaN;
  let lastPlayerY = Number.NaN;
  let stalledFrames = 0;

  const rememberTarget = (pointer: Phaser.Input.Pointer) => {
    const worldPoint = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    projectWorkshopPointToWalkableArea(worldPoint.x, worldPoint.y, target);
    hasTarget = true;
    lastPlayerX = Number.NaN;
    lastPlayerY = Number.NaN;
    stalledFrames = 0;
  };
  const pressTouch = (pointer: Phaser.Input.Pointer) => {
    if (pointerId !== -1) return;
    pointerId = pointer.id;
    rememberTarget(pointer);
  };
  const updateDraggedTarget = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === pointerId && pointer.isDown) rememberTarget(pointer);
  };
  const releaseTouch = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === pointerId) pointerId = -1;
  };
  const updateTouchDirection = () => {
    const keyboardMoving = Boolean(
      cursors?.left.isDown ||
        cursors?.right.isDown ||
        cursors?.up.isDown ||
        cursors?.down.isDown ||
        keys?.left.isDown ||
        keys?.right.isDown ||
        keys?.up.isDown ||
        keys?.down.isDown,
    );
    if (keyboardMoving) {
      hasTarget = false;
      lastPlayerX = Number.NaN;
      lastPlayerY = Number.NaN;
      stalledFrames = 0;
    }
    const player = getPlayerPosition();
    if (!hasTarget || !player) {
      joystick.set(0, 0);
      return;
    }
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 16) {
      hasTarget = false;
      lastPlayerX = Number.NaN;
      lastPlayerY = Number.NaN;
      stalledFrames = 0;
      joystick.set(0, 0);
      return;
    }
    const playerTravel = Number.isFinite(lastPlayerX)
      ? Math.hypot(player.x - lastPlayerX, player.y - lastPlayerY)
      : Number.POSITIVE_INFINITY;
    stalledFrames = playerTravel < 0.05 ? stalledFrames + 1 : 0;
    lastPlayerX = player.x;
    lastPlayerY = player.y;
    if (stalledFrames >= 6) {
      hasTarget = false;
      lastPlayerX = Number.NaN;
      lastPlayerY = Number.NaN;
      stalledFrames = 0;
      joystick.set(0, 0);
      return;
    }
    joystick.set(dx / distance, dy / distance);
  };
  const destroyTouchControls = () => {
    scene.input.off("pointerdown", pressTouch);
    scene.input.off("pointermove", updateDraggedTarget);
    scene.input.off("pointerup", releaseTouch);
    scene.input.off("pointerupoutside", releaseTouch);
    pointerId = -1;
    hasTarget = false;
    lastPlayerX = Number.NaN;
    lastPlayerY = Number.NaN;
    stalledFrames = 0;
    joystick.set(0, 0);
  };
  scene.input.on("pointerdown", pressTouch);
  scene.input.on("pointermove", updateDraggedTarget);
  scene.input.on("pointerup", releaseTouch);
  scene.input.on("pointerupoutside", releaseTouch);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroyTouchControls);

  const { container: action, label: actionText } = addUiButton(scene, {
    x: 1190,
    y: 630,
    width: 80,
    height: 80,
    radius: 40,
    label: "집기",
    onPress: onAction,
    variant: "caution",
    fontSize: "18px",
    depth: 57,
    stopPropagation: true,
  });
  action.setSize(90, 90).setVisible(false);
  return {
    keys,
    cursors,
    joystick,
    updateTouchDirection,
    actionButton: action,
    actionText,
  };
}
