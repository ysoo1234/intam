import Phaser from "phaser";
import type { WorkshopOrder, WorkshopPhase } from "../model";
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

export function updateWorkshopInteractionPrompt(options: {
  player: Phaser.GameObjects.Container | undefined;
  actionButton: Phaser.GameObjects.Container | undefined;
  actionText: Phaser.GameObjects.Text | undefined;
  phase: WorkshopPhase;
  finished: boolean;
  currentOrder: WorkshopOrder | undefined;
  carriedProductCount: number;
  hangingProducts: WorkshopProductChoice[];
  carriedOrigins: readonly WorkshopProductOrigin[];
}) {
  const { actionButton } = options;
  actionButton?.setVisible(false);
  if (!options.player || options.finished) return;
  if (options.phase === "crafting") {
    actionButton?.setVisible(true);
    options.actionText?.setText("멈춤!");
    return;
  }
  if (options.phase === "choosing") {
    if (
      findNearestWorkshopProductOrigin(options.player, options.carriedOrigins)
    ) {
      actionButton?.setVisible(true);
      options.actionText?.setText("돌려놓기");
      return;
    }
    if (findNearestWorkshopProduct(options.player, options.hangingProducts)) {
      actionButton?.setVisible(true);
      options.actionText?.setText(
        options.currentOrder &&
          options.carriedProductCount >= options.currentOrder.products.length
          ? "바꾸기"
          : "집기",
      );
      return;
    }
    const atWorkbench =
      Phaser.Math.Distance.Between(
        options.player.x,
        options.player.y,
        AI_WORKSHOP_LAYOUT.workbench.x,
        AI_WORKSHOP_LAYOUT.workbench.interactionY,
      ) < 150;
    if (atWorkbench && options.carriedProductCount > 0) {
      actionButton?.setVisible(true);
      options.actionText?.setText("놓기");
    }
    return;
  }
  if (options.phase === "delivery") {
    const customerInteraction = AI_WORKSHOP_LAYOUT.customerInteraction;
    const nearCustomer =
      Phaser.Math.Distance.Between(
        options.player.x,
        options.player.y,
        customerInteraction.x,
        customerInteraction.y,
      ) < customerInteraction.radius;
    if (nearCustomer) {
      actionButton?.setVisible(true);
      options.actionText?.setText("전달");
    }
  }
}

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
