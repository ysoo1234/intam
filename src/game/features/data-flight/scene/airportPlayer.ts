import Phaser from "phaser";
import { DATA_FLIGHT_CONFIG } from "../model";
import type { AirportControls } from "./airportControls";

export function updateAirportPlayer(
  player: Phaser.GameObjects.Container | undefined,
  controls: AirportControls | undefined,
  finished: boolean,
  deltaMs: number,
) {
  if (!player || !controls || finished) return;
  const { cursors, keys, pointer } = controls;
  const direction = new Phaser.Math.Vector2(
    (cursors?.right.isDown || keys?.right.isDown ? 1 : 0) -
      (cursors?.left.isDown || keys?.left.isDown ? 1 : 0),
    (cursors?.down.isDown || keys?.down.isDown ? 1 : 0) -
      (cursors?.up.isDown || keys?.up.isDown ? 1 : 0),
  );
  if (direction.lengthSq() > 0) direction.normalize();
  const oldX = player.x;
  const oldY = player.y;
  if (pointer.active) {
    const pointerDirection = new Phaser.Math.Vector2(
      pointer.targetX - player.x,
      pointer.targetY - player.y,
    );
    const remainingDistance = pointerDirection.length();
    if (remainingDistance > 0) {
      const distance = Math.min(
        remainingDistance,
        DATA_FLIGHT_CONFIG.playerSpeed * (deltaMs / 1000),
      );
      pointerDirection.normalize();
      player.x += pointerDirection.x * distance;
      player.y += pointerDirection.y * distance;
    }
  } else if (direction.lengthSq() > 0) {
    const distance = DATA_FLIGHT_CONFIG.playerSpeed * (deltaMs / 1000);
    player.x += direction.x * distance;
    player.y += direction.y * distance;
  }
  player.x = Phaser.Math.Clamp(
    player.x,
    DATA_FLIGHT_CONFIG.playerBounds.minX,
    DATA_FLIGHT_CONFIG.playerBounds.maxX,
  );
  player.y = Phaser.Math.Clamp(
    player.y,
    DATA_FLIGHT_CONFIG.playerBounds.minY,
    DATA_FLIGHT_CONFIG.playerBounds.maxY,
  );
  const horizontalMovement = player.x - oldX;
  const movement = player.y - oldY;
  player.rotation = Phaser.Math.Linear(
    player.rotation,
    Phaser.Math.Clamp(
      movement * 0.018 + horizontalMovement * 0.002,
      -0.19,
      0.19,
    ),
    0.18,
  );
}
