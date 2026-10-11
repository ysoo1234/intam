import Phaser from "phaser";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { projectWorkshopPointToWalkableArea } from "./workshopPlayer";

/**
 * A tap on something Midi can use (a product, a shelf slot, the workbench,
 * the customer): she walks to `point` and `act` runs as soon as `inReach`
 * says she is close enough. Keyboard movement cancels it.
 */
export type WorkshopWalkGoal = Readonly<{
  point: Readonly<{ x: number; y: number }>;
  inReach: () => boolean;
  act: () => void;
}>;

export type WorkshopControls = {
  keys: ControlKeys | undefined;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  joystick: Phaser.Math.Vector2;
  updateTouchDirection: () => void;
  /** Walk to a tapped thing and use it on arrival (replaces any earlier goal). */
  walkTo: (goal: WorkshopWalkGoal) => void;
  /** Forget the current goal (e.g. when the phase changes under it). */
  cancelWalk: () => void;
};

/** A walk that stalls this close to its spot still uses the thing (Midi's body is ~50px wide). */
const STALL_ACT_DISTANCE = 48;

export function createWorkshopControls(
  scene: Phaser.Scene,
  onBack: () => void,
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
  let goal: WorkshopWalkGoal | undefined;

  const resetTracking = () => {
    lastPlayerX = Number.NaN;
    lastPlayerY = Number.NaN;
    stalledFrames = 0;
  };
  const rememberTarget = (pointer: Phaser.Input.Pointer) => {
    const worldPoint = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    projectWorkshopPointToWalkableArea(worldPoint.x, worldPoint.y, target);
    hasTarget = true;
    goal = undefined;
    resetTracking();
  };
  const walkTo = (next: WorkshopWalkGoal) => {
    goal = next;
    projectWorkshopPointToWalkableArea(next.point.x, next.point.y, target);
    hasTarget = true;
    pointerId = -1;
    resetTracking();
  };
  const cancelWalk = () => {
    goal = undefined;
    hasTarget = false;
    joystick.set(0, 0);
    resetTracking();
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
      goal = undefined;
      resetTracking();
    }
    const player = getPlayerPosition();
    if (!hasTarget || !player) {
      joystick.set(0, 0);
      return;
    }
    // Close enough to the tapped thing: use it now, no need to reach the exact spot.
    if (goal?.inReach()) {
      const reached = goal;
      cancelWalk();
      reached.act();
      return;
    }
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 16) {
      // Arrived at the spot itself: a goal acts now even if its own reach test is stricter.
      const reached = goal;
      cancelWalk();
      reached?.act();
      return;
    }
    const playerTravel = Number.isFinite(lastPlayerX)
      ? Math.hypot(player.x - lastPlayerX, player.y - lastPlayerY)
      : Number.POSITIVE_INFINITY;
    stalledFrames = playerTravel < 0.05 ? stalledFrames + 1 : 0;
    lastPlayerX = player.x;
    lastPlayerY = player.y;
    if (stalledFrames >= 6) {
      // Blocked on the way (a furniture edge under the shelf, say): close
      // enough counts as there; farther away she gives up quietly.
      const reached = goal;
      cancelWalk();
      if (reached && (reached.inReach() || distance <= STALL_ACT_DISTANCE)) reached.act();
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
    cancelWalk();
  };
  scene.input.on("pointerdown", pressTouch);
  scene.input.on("pointermove", updateDraggedTarget);
  scene.input.on("pointerup", releaseTouch);
  scene.input.on("pointerupoutside", releaseTouch);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroyTouchControls);

  return {
    keys,
    cursors,
    joystick,
    updateTouchDirection,
    walkTo,
    cancelWalk,
  };
}
