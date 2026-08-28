import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { FONT_FAMILY, UI_MOTION } from "./theme";

const GAME_START_TEXTURES = {
  panel: "game-start-panel",
  button: "game-start-button",
} as const;

const openScenes = new WeakSet<Phaser.Scene>();

export type GameStartOverlayConfig = Readonly<{
  placeName: string;
  playDescription: string;
}>;

export function preloadGameStartOverlayAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(GAME_START_TEXTURES.panel)) {
    scene.load.image(GAME_START_TEXTURES.panel, GAME_ASSETS.ui.gameStartPanel);
  }
  if (!scene.textures.exists(GAME_START_TEXTURES.button)) {
    scene.load.image(GAME_START_TEXTURES.button, GAME_ASSETS.ui.gameStartButton);
  }
}

export function isGameStartOverlayOpen(scene: Phaser.Scene) {
  return openScenes.has(scene);
}

export function createGameStartOverlay(
  scene: Phaser.Scene,
  config: GameStartOverlayConfig,
  onStart: () => void = () => {},
) {
  openScenes.add(scene);
  const blocker = scene.add
    .rectangle(0, 0, 1280, 720, 0x102d37, 0.72)
    .setInteractive();
  const panel = scene.add
    .image(0, -8, GAME_START_TEXTURES.panel)
    .setDisplaySize(900, 600);
  const title = scene.add
    .text(0, -154, config.placeName, {
      color: "#315567",
      fontFamily: FONT_FAMILY,
      fontSize: "44px",
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const description = scene.add
    .text(0, -18, config.playDescription, {
      color: "#456a78",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 10,
      wordWrap: { width: 680, useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setResolution(3);
  const buttonImage = scene.add
    .image(0, 0, GAME_START_TEXTURES.button)
    .setDisplaySize(410, 86);
  const buttonLabel = scene.add
    .text(0, -2, "시작하기", {
      color: "#fffdf2",
      fontFamily: FONT_FAMILY,
      fontSize: "30px",
      fontStyle: "bold",
      stroke: "#21777c",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setResolution(3);
  const button = scene.add
    .container(0, 182, [buttonImage, buttonLabel])
    .setSize(410, 86)
    .setInteractive({ useHandCursor: true });
  const keyboardHint = scene.add
    .text(0, 118, "Enter 또는 Space 키로도 시작할 수 있어요", {
      color: "#5e7884",
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const container = scene.add
    .container(640, 360, [
      blocker,
      panel,
      title,
      description,
      button,
      keyboardHint,
    ])
    .setDepth(1_000);

  let starting = false;
  const keyboard = scene.input.keyboard;
  const stopPointer = (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation();
  const removeListeners = () => {
    keyboard?.off("keydown-ENTER", startFromKeyboard);
    keyboard?.off("keydown-SPACE", startFromKeyboard);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, handleShutdown);
  };
  const closeOverlay = () => {
    removeListeners();
    openScenes.delete(scene);
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.98,
      duration: 140,
      ease: "Sine.easeIn",
      onComplete: () => {
        container.destroy(true);
        onStart();
      },
    });
  };
  const animatePress = () => {
    if (starting) return;
    starting = true;
    button.disableInteractive();
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scale: UI_MOTION.pressedScale,
      duration: UI_MOTION.pressDurationMs,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: closeOverlay,
    });
  };
  function startFromKeyboard(event: KeyboardEvent) {
    event.preventDefault();
    animatePress();
  }
  function handleShutdown() {
    removeListeners();
    openScenes.delete(scene);
  }

  blocker.on("pointerdown", stopPointer);
  button.on("pointerdown", stopPointer);
  button.on("pointerup", (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();
    animatePress();
  });
  keyboard?.on("keydown-ENTER", startFromKeyboard);
  keyboard?.on("keydown-SPACE", startFromKeyboard);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, handleShutdown);
  container.setAlpha(0).setScale(0.98);
  scene.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    duration: 180,
    ease: "Back.easeOut",
  });
  return container;
}
