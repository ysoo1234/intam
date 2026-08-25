import Phaser from "phaser";
import type { WorkshopOrder, WorkshopPhase } from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import type { WorkshopProductChoice } from "./workshopProducts";

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
      ) < 220,
  );
}

export function updateWorkshopInteractionPrompt(options: {
  player: Phaser.GameObjects.Container | undefined;
  actionText: Phaser.GameObjects.Text | undefined;
  phase: WorkshopPhase;
  finished: boolean;
  currentOrder: WorkshopOrder | undefined;
  carriedProductCount: number;
  hangingProducts: WorkshopProductChoice[];
}) {
  if (!options.player || options.finished || options.phase === "crafting") return;
  if (options.phase === "choosing") {
    if (findNearestWorkshopProduct(options.player, options.hangingProducts)) {
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
    options.actionText?.setText(atWorkbench ? "놓기" : "톡!");
    return;
  }
  if (options.phase === "delivery") {
    const nearCustomer =
      Phaser.Math.Distance.Between(options.player.x, options.player.y, 245, 500) <
      175;
    options.actionText?.setText(nearCustomer ? "전달" : "톡!");
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
  options.coinText?.setText(`💰 ${options.coins}`);
  const remainingLives = Math.max(0, 3 - options.wrongDeliveries);
  options.mistakeText?.setText(
    `실수 ${"♥ ".repeat(remainingLives)}${"♡ ".repeat(
      3 - remainingLives,
    )}`.trim(),
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
