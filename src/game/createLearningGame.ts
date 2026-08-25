import Phaser from "phaser";
import { GAME_SIZE } from "./assets";
import { createRegisteredScenes } from "./sceneRegistry";

export function createLearningGame(
  parent: HTMLElement,
  onReady: () => void,
) {
  const deviceScale =
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2);
  const pixelDemand =
    Math.max(
      parent.clientWidth / GAME_SIZE.width,
      parent.clientHeight / GAME_SIZE.height,
    ) * deviceScale;
  const renderScale = pixelDemand > 1.25 ? 1.5 : pixelDemand > 1 ? 1.25 : 1;
  const renderWidth = GAME_SIZE.width * renderScale;
  const renderHeight = GAME_SIZE.height * renderScale;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: renderWidth,
    height: renderHeight,
    backgroundColor: "#f8d792",
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: renderWidth,
      height: renderHeight,
    },
    input: {
      activePointers: 3,
    },
    scene: createRegisteredScenes({ onReady, renderScale }),
  });
}
