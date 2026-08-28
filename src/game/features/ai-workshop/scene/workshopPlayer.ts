import Phaser from "phaser";
import type { ControlKeys } from "../../../core/input/controlKeys";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import type { WorkshopPhase } from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";

export type WorkshopPlayerUpdate = {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Container | undefined;
  playerSprite: Phaser.GameObjects.Image | undefined;
  playerFacing: PlayerFacing;
  carriedVisuals: Phaser.GameObjects.Container[];
  joystick: Phaser.Math.Vector2;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  keys: ControlKeys | undefined;
  phase: WorkshopPhase;
  finished: boolean;
  delta: number;
};

type WorkshopBoundaryPoint = Readonly<{ x: number; y: number }>;
const WORKSHOP_NEXT_POSITION = new Phaser.Math.Vector2();

function sampleWorkshopBoundary(
  x: number,
  points: readonly WorkshopBoundaryPoint[],
) {
  if (x <= points[0].x) return points[0].y;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (x <= current.x) {
      return Phaser.Math.Linear(
        previous.y,
        current.y,
        Phaser.Math.Percent(x, previous.x, current.x),
      );
    }
  }
  return points[points.length - 1].y;
}

export function getWorkshopMinimumY(x: number) {
  const baseMinimumY = sampleWorkshopBoundary(
    x,
    AI_WORKSHOP_LAYOUT.walkableCeiling,
  );
  let minimumY = baseMinimumY;
  for (const obstacle of AI_WORKSHOP_LAYOUT.ceilingObstacles) {
    const normalizedX = (x - obstacle.x) / obstacle.radiusX;
    if (Math.abs(normalizedX) >= 1) continue;
    const obstacleBottom =
      baseMinimumY + obstacle.bumpY * (1 - normalizedX ** 2);
    minimumY = Math.max(minimumY, obstacleBottom);
  }
  return minimumY;
}

export function getWorkshopMaximumY(x: number) {
  return sampleWorkshopBoundary(x, AI_WORKSHOP_LAYOUT.walkableFloor);
}

export function isWorkshopPointWalkable(x: number, y: number) {
  const bounds = AI_WORKSHOP_LAYOUT.playerBounds;
  if (
    x < bounds.left ||
    x > bounds.right ||
    y < getWorkshopMinimumY(x) ||
    y > getWorkshopMaximumY(x)
  ) {
    return false;
  }
  return true;
}

export function projectWorkshopPointToWalkableArea(
  x: number,
  y: number,
  out = new Phaser.Math.Vector2(),
) {
  const projectedX = Phaser.Math.Clamp(
    x,
    AI_WORKSHOP_LAYOUT.playerBounds.left,
    AI_WORKSHOP_LAYOUT.playerBounds.right,
  );
  const projectedY = Phaser.Math.Clamp(
    y,
    getWorkshopMinimumY(projectedX),
    getWorkshopMaximumY(projectedX),
  );

  return out.set(projectedX, projectedY);
}

function moveWorkshopPointWithinWalkableArea(
  desiredX: number,
  desiredY: number,
  out: Phaser.Math.Vector2,
) {
  // Keep the requested axis and apply only the boundary's orthogonal
  // correction. This makes the two sloped floor edges behave like smooth
  // ramps rather than invisible steps.
  return projectWorkshopPointToWalkableArea(desiredX, desiredY, out);
}

export function updateWorkshopPlayer(
  state: WorkshopPlayerUpdate,
): PlayerFacing {
  const { player, playerSprite } = state;
  if (
    !player ||
    state.finished ||
    state.phase === "crafting" ||
    state.phase === "transition"
  ) {
    return state.playerFacing;
  }
  const direction = new Phaser.Math.Vector2(
    state.joystick.x +
      (state.cursors?.right.isDown || state.keys?.right.isDown ? 1 : 0) -
      (state.cursors?.left.isDown || state.keys?.left.isDown ? 1 : 0),
    state.joystick.y +
      (state.cursors?.down.isDown || state.keys?.down.isDown ? 1 : 0) -
      (state.cursors?.up.isDown || state.keys?.up.isDown ? 1 : 0),
  );
  let playerFacing = state.playerFacing;
  if (direction.lengthSq() > 0) {
    direction.normalize();
    playerFacing = setWorkshopPlayerFacing(
      state.scene,
      playerSprite,
      playerFacing,
      direction,
    );
    const travel = AI_WORKSHOP_LAYOUT.playerSpeed * (state.delta / 1000);
    const nextPosition = moveWorkshopPointWithinWalkableArea(
      player.x + direction.x * travel,
      player.y + direction.y * travel,
      WORKSHOP_NEXT_POSITION,
    );
    player.setPosition(nextPosition.x, nextPosition.y);
    player.rotation = Phaser.Math.Linear(
      player.rotation,
      direction.x * 0.035,
      0.2,
    );
    playerSprite?.setY(Math.sin(state.scene.time.now / 65) * 2);
  } else {
    player.rotation *= 0.82;
    playerSprite?.setY(0);
  }
  updateWorkshopPlayerPerspective(player, state.carriedVisuals);
  syncWorkshopCarriedVisualPositions(player, state.carriedVisuals);
  updateWorkshopPlayerDepth(player, state.carriedVisuals);
  return playerFacing;
}

export function updateWorkshopPlayerPerspective(
  player: Phaser.GameObjects.Container | undefined,
  carriedVisuals: Phaser.GameObjects.Container[],
) {
  if (!player) return;
  const perspective = Phaser.Math.Clamp(
    Phaser.Math.Percent(
      player.y,
      AI_WORKSHOP_LAYOUT.playerBounds.top,
      AI_WORKSHOP_LAYOUT.playerBounds.bottom,
    ),
    0,
    1,
  );
  const scale = Phaser.Math.Linear(0.9, 1.2, perspective);
  player.setScale(scale);
  carriedVisuals.forEach((visual) =>
    visual.setScale(AI_WORKSHOP_LAYOUT.playerVisual.carriedBaseScale * scale),
  );
}

export function syncWorkshopCarriedVisualPositions(
  player: Phaser.GameObjects.Container | undefined,
  carriedVisuals: Phaser.GameObjects.Container[],
) {
  if (!player) return;
  const visual = AI_WORKSHOP_LAYOUT.playerVisual;
  const playerScale = player.scaleY;
  const carriedCenterY =
    player.y -
    visual.halfHeight * playerScale -
    visual.carriedArtHalfSize * visual.carriedBaseScale * playerScale -
    visual.carriedGap;
  carriedVisuals.forEach((carried, index) => {
    carried.setPosition(
      player.x +
        (index - (carriedVisuals.length - 1) / 2) *
          visual.carriedSpacing *
          playerScale,
      carriedCenterY,
    );
  });
}

export function updateWorkshopPlayerDepth(
  player: Phaser.GameObjects.Container | undefined,
  carriedVisuals: Phaser.GameObjects.Container[],
) {
  if (!player) return;
  const playerDepth = AI_WORKSHOP_LAYOUT.workbench.depth - 3;
  player.setDepth(playerDepth);
  carriedVisuals.forEach((visual) => visual.setDepth(playerDepth + 1));
}

function setWorkshopPlayerFacing(
  scene: Phaser.Scene,
  playerSprite: Phaser.GameObjects.Image | undefined,
  playerFacing: PlayerFacing,
  direction: Phaser.Math.Vector2,
) {
  if (!playerSprite || direction.lengthSq() === 0) return playerFacing;
  let next: PlayerFacing;
  if (Math.abs(direction.x) > Math.abs(direction.y)) {
    next = direction.x < 0 ? "left" : "right";
  } else {
    next = direction.y < 0 ? "back" : "front";
  }
  if (next === playerFacing) return playerFacing;
  const textureKey = `player-${next}`;
  if (scene.textures.exists(textureKey)) playerSprite.setTexture(textureKey);
  return next;
}
