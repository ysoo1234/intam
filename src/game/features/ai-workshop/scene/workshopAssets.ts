import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";

const WORKSHOP_SCENE_ASSETS = [
  ["ai-workshop-interior", GAME_ASSETS.shop.workshop],
  ["ai-workbench-foreground", GAME_ASSETS.shop.workbench],
  ["workshop-item-panel-4", GAME_ASSETS.shop.itemPanel4],
  ["workshop-item-panel-5", GAME_ASSETS.shop.itemPanel5],
  ["workshop-customer-nameplate", GAME_ASSETS.shop.customerNameplate],
  ["workshop-dialogue-bubble", GAME_ASSETS.shop.dialogueBubble],
  ["workshop-crafting-machine", GAME_ASSETS.shop.craftingMachine],
  ["workshop-crafting-panel", GAME_ASSETS.shop.craftingPanel],
  ["workshop-action-button", GAME_ASSETS.shop.actionButton],
  ["workshop-dust-center", GAME_ASSETS.shop.craftingDustCenter],
  ["workshop-dust-diagonal", GAME_ASSETS.shop.craftingDustDiagonal],
  ["workshop-dust-sweep", GAME_ASSETS.shop.craftingDustSweep],
  ["workshop-dust-rise", GAME_ASSETS.shop.craftingDustRise],
  ["workshop-dust-low", GAME_ASSETS.shop.craftingDustLow],
  ["workshop-tool-hammer", GAME_ASSETS.shop.craftingToolHammer],
  ["workshop-tool-screw", GAME_ASSETS.shop.craftingToolScrew],
  ["workshop-tool-nut", GAME_ASSETS.shop.craftingToolNut],
  ["workshop-tool-gear", GAME_ASSETS.shop.craftingToolGear],
] as const;

export function preloadWorkshopSceneAssets(scene: Phaser.Scene) {
  WORKSHOP_SCENE_ASSETS.forEach(([key, asset]) => scene.load.image(key, asset));
}

export function unloadWorkshopSceneAssets(scene: Phaser.Scene) {
  WORKSHOP_SCENE_ASSETS.forEach(([key]) => scene.textures.remove(key));
}
