import Phaser from "phaser";

import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import type { Point } from "../model/mapDefinition";

export type WorldTouchDirection = Readonly<{
  direction: Phaser.Math.Vector2;
  update: () => void;
  cancel: () => void;
  destroy: () => void;
}>;

type WorldTouchDirectionOptions = Readonly<{
  getOrigin: () => Point | undefined;
  direction?: Phaser.Math.Vector2;
  arrivalRadius?: number;
  /**
   * Whether Midi's feet can stand at (x, y). A tap on a building (or any
   * blocked spot) then becomes a tap on the nearest free spot between it
   * and Midi, so she walks up to the wall and stops there instead of
   * pressing into it.
   */
  isBlocked?: (x: number, y: number) => boolean;
}>;

/** How far back from the wall Midi stops, in px (inside the arrival radius). */
const WALL_STOP_GAP = 4;
const WALL_SCAN_STEP = 3;

/**
 * Treat a tap or drag as a destination, rather than as a virtual joystick.
 * The direction is recalculated until arrival; blocked targets time out so the
 * player never keeps pushing against scenery after a single tap.
 */
export function createWorldTouchDirection(
  scene: Phaser.Scene,
  options: WorldTouchDirectionOptions,
): WorldTouchDirection {
  const direction = options.direction ?? new Phaser.Math.Vector2();
  const arrivalRadius = options.arrivalRadius ?? 14;
  const pointerWorldPoint = new Phaser.Math.Vector2();
  const target = new Phaser.Math.Vector2();
  const previousOrigin = new Phaser.Math.Vector2();
  let pointerId = -1;
  let hasTarget = false;
  let hasPreviousOrigin = false;
  let stalledFrames = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let nonImprovingFrames = 0;
  // While the finger is held down the target is live (a drag), so Midi
  // follows it like a leash: she starts once the finger is a little away
  // and stops once it is close, with a gap between the two so she never
  // flickers between running and standing when the finger rides on her.
  const dragStopRadius = arrivalRadius + 10;
  const dragStartRadius = dragStopRadius + 14;
  let dragMoving = false;

  // From a blocked tap, step back toward Midi until her feet would fit.
  const settleTargetOutsideWalls = () => {
    const isBlocked = options.isBlocked;
    const origin = options.getOrigin();
    if (!isBlocked || !origin || !isBlocked(target.x, target.y)) return;
    const dx = origin.x - target.x;
    const dy = origin.y - target.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) return;
    const ux = dx / length;
    const uy = dy / length;
    for (let travelled = WALL_SCAN_STEP; travelled < length; travelled += WALL_SCAN_STEP) {
      const x = target.x + ux * travelled;
      const y = target.y + uy * travelled;
      if (!isBlocked(x, y)) {
        const back = Math.min(WALL_STOP_GAP, length - travelled);
        target.set(x + ux * back, y + uy * back);
        return;
      }
    }
    // Everything between Midi and the tap is blocked: stay put.
    target.set(origin.x, origin.y);
  };

  const rememberTarget = (pointer: Phaser.Input.Pointer) => {
    const point = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    target.copy(point);
    settleTargetOutsideWalls();
    hasTarget = true;
    hasPreviousOrigin = false;
    stalledFrames = 0;
    bestDistance = Number.POSITIVE_INFINITY;
    nonImprovingFrames = 0;
  };

  const press = (pointer: Phaser.Input.Pointer) => {
    if (pointerId !== -1) return;
    pointerId = pointer.id;
    rememberTarget(pointer);
  };

  const move = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== pointerId || !pointer.isDown) return;
    rememberTarget(pointer);
  };

  const release = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== pointerId) return;
    pointerId = -1;
    // A finger lifted close to Midi was a drag that ended, not a far tap.
    const origin = options.getOrigin();
    if (origin && Phaser.Math.Distance.Between(origin.x, origin.y, target.x, target.y) <= dragStopRadius) {
      hasTarget = false;
    }
    dragMoving = false;
    hasPreviousOrigin = false;
    bestDistance = Number.POSITIVE_INFINITY;
    nonImprovingFrames = 0;
    stalledFrames = 0;
  };

  const update = () => {
    if (!hasTarget) {
      direction.set(0, 0);
      return;
    }

    const origin = options.getOrigin();
    if (!origin) {
      direction.set(0, 0);
      return;
    }

    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (pointerId !== -1) {
      if (dragMoving ? distance <= dragStopRadius : distance < dragStartRadius) {
        dragMoving = false;
        direction.set(0, 0);
        return;
      }
      dragMoving = true;
      direction.set(dx / distance, dy / distance);
      return;
    }
    if (distance <= arrivalRadius) {
      hasTarget = false;
      hasPreviousOrigin = false;
      direction.set(0, 0);
      return;
    }

    if (distance < bestDistance - 0.75) {
      bestDistance = distance;
      nonImprovingFrames = 0;
    } else {
      nonImprovingFrames += 1;
      if (nonImprovingFrames >= 40) {
        hasTarget = false;
        hasPreviousOrigin = false;
        direction.set(0, 0);
        return;
      }
    }
    if (hasPreviousOrigin) {
      const moved = Phaser.Math.Distance.Between(
        previousOrigin.x,
        previousOrigin.y,
        origin.x,
        origin.y,
      );
      stalledFrames = moved < 0.12 ? stalledFrames + 1 : 0;
      if (stalledFrames >= 18) {
        hasTarget = false;
        hasPreviousOrigin = false;
        direction.set(0, 0);
        return;
      }
    }
    previousOrigin.set(origin.x, origin.y);
    hasPreviousOrigin = true;
    direction.set(dx / distance, dy / distance);
  };

  const cancel = () => {
    pointerId = -1;
    dragMoving = false;
    hasTarget = false;
    hasPreviousOrigin = false;
    stalledFrames = 0;
    bestDistance = Number.POSITIVE_INFINITY;
    nonImprovingFrames = 0;
    direction.set(0, 0);
  };

  const destroy = () => {
    scene.input.off("pointerdown", press);
    scene.input.off("pointermove", move);
    scene.input.off("pointerup", release);
    scene.input.off("pointerupoutside", release);
    cancel();
  };

  scene.input.on("pointerdown", press);
  scene.input.on("pointermove", move);
  scene.input.on("pointerup", release);
  scene.input.on("pointerupoutside", release);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return { direction, update, cancel, destroy };
}
