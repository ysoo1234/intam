import Phaser from "phaser";
import type { EthicsDeliveryAction } from "../model";

export type EthicsReviewControls = ReturnType<typeof createEthicsReviewControls>;

/**
 * Stamp buttons and keys share one entry point. A verdict in flight blocks
 * further requests, so rapid taps cannot stamp the same form twice.
 */
export function createEthicsReviewControls(
  scene: Phaser.Scene,
  canMove: () => boolean,
  canRequest: (action: EthicsDeliveryAction) => boolean,
  onBack: () => void,
  onAction: (action: EthicsDeliveryAction) => void,
  onContinue: () => void,
) {
  let pending: EthicsDeliveryAction | undefined;
  const cancelMovement = () => { pending = undefined; };
  const requestAction = (action: EthicsDeliveryAction) => {
    if (pending || !canMove() || !canRequest(action)) return;
    pending = action;
    onAction(action);
  };
  const approve = (event: KeyboardEvent) => {
    if (!event.repeat) { event.preventDefault(); requestAction("approve"); }
  };
  const reject = (event: KeyboardEvent) => {
    if (!event.repeat) { event.preventDefault(); requestAction("reject"); }
  };
  const continueKey = (event: KeyboardEvent) => {
    if (!event.repeat) { event.preventDefault(); onContinue(); }
  };
  const keyboard = scene.input.keyboard;
  const bindings = [
    ["keydown-LEFT", approve], ["keydown-A", approve],
    ["keydown-RIGHT", reject], ["keydown-D", reject],
    ["keydown-ENTER", continueKey], ["keydown-SPACE", continueKey],
    ["keydown-ESC", onBack],
  ] as const;
  for (const [key, handler] of bindings) keyboard?.on(key, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const [key, handler] of bindings) keyboard?.off(key, handler);
    cancelMovement();
  });
  return {
    cancelMovement, requestAction,
    get pendingAction() { return pending; },
  };
}
