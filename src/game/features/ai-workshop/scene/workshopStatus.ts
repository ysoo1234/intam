import Phaser from "phaser";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import type {
  WorkshopProductChoice,
  WorkshopProductOrigin,
} from "./workshopProducts";

export function findNearestWorkshopProduct(
  player: Phaser.GameObjects.Container | undefined,
  hangingProducts: WorkshopProductChoice[],
) {
  if (!player) return undefined;
  return hangingProducts.find(
    ({ container }) =>
      Phaser.Math.Distance.Between(
        player.x,
        player.y,
        container.x,
        container.y,
      ) < 240,
  );
}

export function findNearestWorkshopProductOrigin(
  player: Phaser.GameObjects.Container | undefined,
  origins: readonly WorkshopProductOrigin[],
) {
  if (!player) return undefined;
  return origins
    .map((origin, index) => ({ origin, index }))
    .find(
      ({ origin }) =>
        Phaser.Math.Distance.Between(player.x, player.y, origin.x, origin.y) <
        240,
    );
}

/** Midi stands close enough to the workbench to use it. */
export function isWorkshopPlayerAtWorkbench(player: Phaser.GameObjects.Container | undefined) {
  if (!player) return false;
  return Phaser.Math.Distance.Between(
    player.x, player.y, AI_WORKSHOP_LAYOUT.workbench.x, AI_WORKSHOP_LAYOUT.workbench.interactionY,
  ) < 150;
}

/** Midi stands close enough to the customer to hand something over. */
export function isWorkshopPlayerAtCustomer(player: Phaser.GameObjects.Container | undefined) {
  if (!player) return false;
  const spot = AI_WORKSHOP_LAYOUT.customerInteraction;
  return Phaser.Math.Distance.Between(player.x, player.y, spot.x, spot.y) < spot.radius;
}

/**
 * Where taps land and where Midi walks for them (1280 x 720 coordinates).
 * Stand points are projected onto the walkable floor by the controls.
 */
export const WORKSHOP_TAP_SPOTS = {
  /** Tap area of a shelf product (around its picture and name), centred a little below the picture. */
  productHit: { width: 118, height: 150 },
  /** The product's tap area is shifted down this much, since its name hangs under the picture. */
  productHitOffsetY: 24,
  /** Tap area of a product Midi carries. */
  carriedHit: 110,
  /** Midi stands at the top of the floor, under the shelf, to reach a product. */
  shelfStandY: AI_WORKSHOP_LAYOUT.playerBounds.top,
  /** The tappable workbench: its top, where the products go. */
  workbench: { x: AI_WORKSHOP_LAYOUT.workbench.x, y: AI_WORKSHOP_LAYOUT.workbench.interactionY + 30, width: 760, height: 150 },
  workbenchStand: { x: AI_WORKSHOP_LAYOUT.workbench.x - 60, y: AI_WORKSHOP_LAYOUT.workbench.interactionY - 30 },
  /** Beside the customer, on the floor. */
  customerStand: { x: AI_WORKSHOP_LAYOUT.customerStage.x + 150, y: AI_WORKSHOP_LAYOUT.customerInteraction.y + 20 },
  /**
   * How close to the stand point Midi gets after a tap before she acts
   * (the keyboard's reach from wherever she stands is looser).
   */
  tapReach: { product: 14, workbench: 40, customer: 40 },
} as const;

export function renderWorkshopHud(options: {
  coinText: Phaser.GameObjects.Text | undefined;
  mistakeText: Phaser.GameObjects.Text | undefined;
  timerText: Phaser.GameObjects.Text | undefined;
  coins: number;
  wrongDeliveries: number;
  remainingMs: number;
}) {
  options.coinText?.setText(`수입 ${options.coins}코인`);
  const remainingLives = Math.max(0, 3 - options.wrongDeliveries);
  options.mistakeText?.setText(
    `${"♥ ".repeat(remainingLives)}${"♡ ".repeat(3 - remainingLives)}`.trim(),
  );
  const seconds = Math.max(0, Math.ceil(options.remainingMs / 1000));
  options.timerText?.setText(
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60,
    ).padStart(2, "0")}`,
  );
}

export function vibrateDevice(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
