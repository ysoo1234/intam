import Phaser from "phaser";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import {
  releaseClaimedPointer,
  tryClaimPointer,
} from "../../../core/input/pointerOwnership";
import { DATA_FLIGHT_CONFIG } from "../model";

export type AirportPointerState = {
  active: boolean;
  id: number;
  targetX: number;
  targetY: number;
};

export type AirportControls = {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  keys: ControlKeys | undefined;
  pointer: AirportPointerState;
};

export function createAirportControls(
  scene: Phaser.Scene,
  isFinished: () => boolean,
  onRestart: () => void,
): AirportControls {
  const cursors = scene.input.keyboard?.createCursorKeys();
  const keys = makeControlKeys(scene);
  const pointer: AirportPointerState = {
    active: false,
    id: -1,
    targetX: 220,
    targetY: 360,
  };
  const pointerWorldPoint = new Phaser.Math.Vector2();

  const updatePointerTarget = (inputPointer: Phaser.Input.Pointer) => {
    const point = getPointerWorldPoint(
      scene,
      inputPointer,
      pointerWorldPoint,
    );
    pointer.targetX = Phaser.Math.Clamp(
      point.x,
      DATA_FLIGHT_CONFIG.playerBounds.minX,
      DATA_FLIGHT_CONFIG.playerBounds.maxX,
    );
    pointer.targetY = Phaser.Math.Clamp(
      point.y,
      DATA_FLIGHT_CONFIG.playerBounds.minY,
      DATA_FLIGHT_CONFIG.playerBounds.maxY,
    );
    return point;
  };

  scene.input.keyboard?.on("keydown-SPACE", () => {
    if (isFinished()) onRestart();
  });
  scene.input.keyboard?.on("keydown-ENTER", () => {
    if (isFinished()) onRestart();
  });

  scene.input.on("pointerdown", (inputPointer: Phaser.Input.Pointer) => {
    if (isFinished() || pointer.active) return;
    const point = getPointerWorldPoint(
      scene,
      inputPointer,
      pointerWorldPoint,
    );
    if (point.y < 95 || point.x > 1210) return;
    if (!tryClaimPointer(pointer, inputPointer.id)) return;
    updatePointerTarget(inputPointer);
  });
  scene.input.on("pointermove", (inputPointer: Phaser.Input.Pointer) => {
    if (!pointer.active || inputPointer.id !== pointer.id) return;
    updatePointerTarget(inputPointer);
  });
  const releasePointer = (inputPointer: Phaser.Input.Pointer) => {
    releaseClaimedPointer(pointer, inputPointer.id);
  };
  scene.input.on("pointerup", releasePointer);
  scene.input.on("pointerupoutside", releasePointer);

  return { cursors, keys, pointer };
}
