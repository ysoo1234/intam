import Phaser from "phaser";
import { GAME_SIZE } from "./assets";
import { installGameErrorGuard } from "./core/runtime/gameErrorGuard";
import { syncPageBackdrop } from "./core/runtime/pageBackdrop";
import { isLowPowerDevice, isTouchFirstDevice } from "./core/runtime/devicePerformance";
import { selectRenderScale } from "./core/runtime/renderResolution";
import { createRegisteredScenes } from "./sceneRegistry";

export function createLearningGame(
  parent: HTMLElement,
  onReady: () => void,
) {
  const renderScale = selectRenderScale({
    parentWidth: parent.clientWidth,
    parentHeight: parent.clientHeight,
    gameWidth: GAME_SIZE.width,
    gameHeight: GAME_SIZE.height,
    devicePixelRatio:
      typeof window === "undefined" ? 1 : window.devicePixelRatio,
    screenWidth: typeof window === "undefined" ? 0 : window.screen.width,
    screenHeight: typeof window === "undefined" ? 0 : window.screen.height,
    modestDevice: isTouchFirstDevice() || isLowPowerDevice(),
  });
  const renderWidth = GAME_SIZE.width * renderScale;
  const renderHeight = GAME_SIZE.height * renderScale;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: renderWidth,
    height: renderHeight,
    // Shown only until the first frame: the first screen's sky, like the loading page.
    backgroundColor: "#94b5e5",
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
  installGameErrorGuard(game);
  syncPageBackdrop(game);
  return game;
}
