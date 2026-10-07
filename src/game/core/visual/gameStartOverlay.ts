import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { FONT_FAMILY, UI_MOTION } from "./theme";

const GAME_START_TEXTURES = {
  panel: "game-start-panel",
  button: "game-start-button",
} as const;

const openScenes = new WeakSet<Phaser.Scene>();

export type GameStartTutorialStep = Readonly<{
  /** Loaded texture key shown on the card; an emoji-free number badge is always drawn. */
  icon?: string;
  /** Optional display size for the icon (longest side), default 74. */
  iconSize?: number;
  title: string;
  text: string;
}>;

export type GameStartOverlayConfig = Readonly<{
  placeName: string;
  playDescription: string;
  /** Up to three "how to play" cards. Omit for the plain description layout. */
  steps?: readonly GameStartTutorialStep[];
  /** Short control hint under the cards, e.g. key and touch bindings. */
  controlsHint?: string;
}>;

const STEP_CARD = { width: 250, height: 196, gap: 20, y: -36 } as const;

function createTutorialStepCard(
  scene: Phaser.Scene,
  step: GameStartTutorialStep,
  index: number,
  x: number,
) {
  const { width, height } = STEP_CARD;
  const card = scene.add.graphics();
  card.fillStyle(0x315567, 0.1).fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 22);
  card.fillStyle(0xffffff, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 22);
  card.lineStyle(2.5, 0xd9c7a2, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
  const badge = scene.add.graphics();
  badge.fillStyle(0x2a8b7e, 1).fillCircle(-width / 2 + 26, -height / 2 + 26, 18);
  const badgeLabel = scene.add.text(-width / 2 + 26, -height / 2 + 25, String(index + 1), {
    color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "19px", fontStyle: "bold",
  }).setOrigin(0.5).setResolution(3);
  const children: Phaser.GameObjects.GameObject[] = [card, badge, badgeLabel];
  const iconSize = step.iconSize ?? 74;
  if (step.icon && scene.textures.exists(step.icon)) {
    const icon = scene.add.image(0, -height / 2 + 62, step.icon);
    icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
    children.push(icon);
  }
  const title = scene.add.text(0, 22, step.title, {
    color: "#315567", fontFamily: FONT_FAMILY, fontSize: "21px", fontStyle: "bold", align: "center",
  }).setOrigin(0.5).setResolution(3);
  const text = scene.add.text(0, 60, step.text, {
    color: "#5e7884", fontFamily: FONT_FAMILY, fontSize: "16px", fontStyle: "bold", align: "center",
    lineSpacing: 4, wordWrap: { width: width - 28, useAdvancedWrap: true },
  }).setOrigin(0.5).setResolution(3);
  children.push(title, text);
  return scene.add.container(x, STEP_CARD.y, children);
}

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
  const steps = (config.steps ?? []).slice(0, 3);
  const hasSteps = steps.length > 0;
  const title = scene.add
    .text(0, hasSteps ? -224 : -154, config.placeName, {
      color: "#315567",
      fontFamily: FONT_FAMILY,
      fontSize: "44px",
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const description = scene.add
    .text(0, hasSteps ? -172 : -18, config.playDescription, {
      color: "#456a78",
      fontFamily: FONT_FAMILY,
      fontSize: hasSteps ? "21px" : "27px",
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
  const stepCards = steps.map((step, index) => {
    const totalWidth = steps.length * STEP_CARD.width + (steps.length - 1) * STEP_CARD.gap;
    const x = -totalWidth / 2 + STEP_CARD.width / 2 + index * (STEP_CARD.width + STEP_CARD.gap);
    return createTutorialStepCard(scene, step, index, x);
  });
  const controlsHint = config.controlsHint
    ? scene.add.text(0, hasSteps ? 92 : 70, config.controlsHint, {
        color: "#2f7f7b", fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", align: "center",
      }).setOrigin(0.5).setResolution(3)
    : undefined;
  const button = scene.add
    .container(0, hasSteps ? 160 : 182, [buttonImage, buttonLabel])
    .setSize(410, 86)
    .setInteractive({ useHandCursor: true });
  const keyboardHint = scene.add
    .text(0, hasSteps ? 218 : 118, "Enter 또는 Space 키로도 시작할 수 있어요", {
      color: "#5e7884",
      fontFamily: FONT_FAMILY,
      fontSize: hasSteps ? "15px" : "17px",
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
      ...stepCards,
      ...(controlsHint ? [controlsHint] : []),
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
