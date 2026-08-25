import Phaser from "phaser";

import { COLORS } from "../visual/theme";
import { getPointerWorldPoint } from "./pointerCoordinates";

export type FloatingJoystick = {
  direction: Phaser.Math.Vector2;
  destroy: () => void;
};

type FloatingJoystickOptions = Readonly<{
  direction?: Phaser.Math.Vector2;
  radius?: number;
  deadZone?: number;
  depth?: number;
  canStart?: (point: Readonly<Phaser.Math.Vector2>) => boolean;
}>;

export function createFloatingJoystick(
  scene: Phaser.Scene,
  options: FloatingJoystickOptions = {},
): FloatingJoystick {
  const direction = options.direction ?? new Phaser.Math.Vector2();
  const radius = options.radius ?? 46;
  const deadZone = options.deadZone ?? 9;
  const depth = options.depth ?? 60;
  let pointerId = -1;
  let originX = 0;
  let originY = 0;
  let visible = false;
  let gestureVersion = 0;
  const pointerWorldPoint = new Phaser.Math.Vector2();

  const base = scene.add
    .circle(0, 0, radius + 18, COLORS.cream, 0.72)
    .setStrokeStyle(6, COLORS.ink, 0.72)
    .setDepth(depth)
    .setVisible(false);
  const inner = scene.add
    .circle(0, 0, radius, COLORS.blue, 0.13)
    .setStrokeStyle(2, COLORS.blue, 0.42)
    .setDepth(depth + 1)
    .setVisible(false);
  const knob = scene.add
    .circle(0, 0, 27, COLORS.mint, 0.94)
    .setStrokeStyle(5, COLORS.ink, 0.86)
    .setDepth(depth + 2)
    .setVisible(false);
  const parts = [base, inner, knob];

  const reveal = () => {
    if (visible) return;
    visible = true;
    parts.forEach((part) => part.setVisible(true).setAlpha(0).setScale(0.86));
    scene.tweens.add({
      targets: parts,
      alpha: 1,
      scale: 1,
      duration: 110,
      ease: "Back.easeOut",
    });
  };

  const move = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== pointerId || !pointer.isDown) return;
    const point = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    const dx = point.x - originX;
    const dy = point.y - originY;
    const length = Math.hypot(dx, dy);
    if (length < deadZone) return;

    reveal();
    const normalizedX = dx / length;
    const normalizedY = dy / length;
    const strength = Phaser.Math.Clamp(
      (length - deadZone) / Math.max(1, radius - deadZone),
      0,
      1,
    );
    direction.set(normalizedX * strength, normalizedY * strength);
    const knobDistance = Math.min(radius, length);
    knob.setPosition(
      originX + normalizedX * knobDistance,
      originY + normalizedY * knobDistance,
    );
  };

  const press = (pointer: Phaser.Input.Pointer) => {
    if (pointerId !== -1) return;
    const point = getPointerWorldPoint(scene, pointer, pointerWorldPoint);
    if (options.canStart?.(point) === false) return;
    gestureVersion += 1;
    pointerId = pointer.id;
    originX = point.x;
    originY = point.y;
    direction.set(0, 0);
    parts.forEach((part) => part.setPosition(originX, originY));
  };

  const release = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== pointerId) return;
    const releaseVersion = ++gestureVersion;
    pointerId = -1;
    direction.set(0, 0);
    if (!visible) return;
    visible = false;
    scene.tweens.add({
      targets: parts,
      alpha: 0,
      scale: 0.9,
      duration: 100,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (releaseVersion === gestureVersion) {
          parts.forEach((part) => part.setVisible(false));
        }
      },
    });
  };

  const destroy = () => {
    scene.input.off("pointerdown", press);
    scene.input.off("pointermove", move);
    scene.input.off("pointerup", release);
    scene.input.off("pointerupoutside", release);
    direction.set(0, 0);
    parts.forEach((part) => part.destroy());
  };

  scene.input.on("pointerdown", press);
  scene.input.on("pointermove", move);
  scene.input.on("pointerup", release);
  scene.input.on("pointerupoutside", release);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return { direction, destroy };
}
