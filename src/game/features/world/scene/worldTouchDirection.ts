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
}>;

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

  const rememberTarget = (pointer: Phaser.Input.Pointer) => {
    const point = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    target.copy(point);
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
      if (nonImprovingFrames >= 14) {
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
