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
    player.x +=
      direction.x * AI_WORKSHOP_LAYOUT.playerSpeed * (state.delta / 1000);
    player.y +=
      direction.y * AI_WORKSHOP_LAYOUT.playerSpeed * (state.delta / 1000);
    player.x = Phaser.Math.Clamp(
      player.x,
      AI_WORKSHOP_LAYOUT.playerBounds.left,
      AI_WORKSHOP_LAYOUT.playerBounds.right,
    );
    player.y = Phaser.Math.Clamp(
      player.y,
      AI_WORKSHOP_LAYOUT.playerBounds.top,
      AI_WORKSHOP_LAYOUT.playerBounds.bottom,
    );
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
  state.carriedVisuals.forEach((visual, index) => {
    visual.setPosition(
      player.x + (index - (state.carriedVisuals.length - 1) / 2) * 72,
      player.y - 92,
    );
  });
  updateWorkshopPlayerPerspective(player, state.carriedVisuals);
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
  carriedVisuals.forEach((visual) => visual.setScale(0.52 * scale));
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
