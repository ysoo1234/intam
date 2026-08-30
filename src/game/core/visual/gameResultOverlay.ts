import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { UI_MOTION } from "./theme";

const GAME_RESULT_TEXTURES = {
  panel: "game-result-panel",
  retryButton: "game-result-retry-button",
  returnButton: "game-result-return-button",
} as const;

const RESULT_LAYOUT = {
  titleY: -169,
  starsY: -97,
  summaryY: -22,
  retryButtonY: 72,
  returnButtonY: 152,
} as const;

const RESULT_FONT_FAMILY =
  '"Malgun Gothic", "Apple SD Gothic Neo", "NanumSquareRound", sans-serif';

const RESULT_TEXT_COLORS = {
  title: "#315567",
  summary: "#2a6570",
  button: "#102d37",
} as const;

export type GameResultOverlayConfig = Readonly<{
  title: string;
  stars: number;
  summary: string;
  retryLabel: string;
  onRetry: () => void;
  onWorld: () => void;
}>;

export function preloadGameResultOverlayAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.panel)) {
    scene.load.image(GAME_RESULT_TEXTURES.panel, GAME_ASSETS.ui.gameResultPanel);
  }
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.retryButton)) {
    scene.load.image(
      GAME_RESULT_TEXTURES.retryButton,
      GAME_ASSETS.ui.gameResultRetryButton,
    );
  }
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.returnButton)) {
    scene.load.image(
      GAME_RESULT_TEXTURES.returnButton,
      GAME_ASSETS.ui.gameResultReturnButton,
    );
  }
}

export function createGameResultOverlay(
  scene: Phaser.Scene,
  config: GameResultOverlayConfig,
) {
  const shade = scene.add
    .rectangle(0, 0, 1280, 720, 0x102d37, 0.72)
    .setInteractive();
  const panel = scene.add
    .image(0, 0, GAME_RESULT_TEXTURES.panel)
    .setDisplaySize(780, 520);
  const title = scene.add
    .text(0, RESULT_LAYOUT.titleY, config.title, {
      color: RESULT_TEXT_COLORS.title,
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "38px",
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(4);
  const starRow = createStarRow(scene, config.stars);
  const summary = scene.add
    .text(0, RESULT_LAYOUT.summaryY, config.summary, {
      color: RESULT_TEXT_COLORS.summary,
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 9,
      wordWrap: { width: 610, useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setResolution(4);

  let actionLocked = false;
  const runOnce = (action: () => void) => {
    if (actionLocked) return;
    actionLocked = true;
    retry.disableInteractive();
    world.disableInteractive();
    action();
  };
  const retry = createResultImageButton(
    scene,
    0,
    RESULT_LAYOUT.retryButtonY,
    GAME_RESULT_TEXTURES.retryButton,
    config.retryLabel,
    () => runOnce(config.onRetry),
  );
  const world = createResultImageButton(
    scene,
    0,
    RESULT_LAYOUT.returnButtonY,
    GAME_RESULT_TEXTURES.returnButton,
    "마을로 돌아가기",
    () => runOnce(config.onWorld),
  );
  const overlay = scene.add
    .container(640, 360, [
      shade,
      panel,
      title,
      starRow,
      summary,
      retry,
      world,
    ])
    .setDepth(1_000)
    .setAlpha(0)
    .setScale(0.97);

  shade.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => event.stopPropagation(),
  );
  scene.tweens.add({
    targets: overlay,
    alpha: 1,
    scale: 1,
    duration: 220,
    ease: "Back.easeOut",
  });
  return overlay;
}

function createStarRow(scene: Phaser.Scene, earnedStars: number) {
  const stars = Phaser.Math.Clamp(Math.round(earnedStars), 0, 3);
  const row = scene.add.container(0, RESULT_LAYOUT.starsY);
  for (let index = 0; index < 3; index += 1) {
    const filled = index < stars;
    row.add(
      scene.add
        .text((index - 1) * 54, 0, filled ? "★" : "☆", {
          color: filled ? "#f3bd3f" : "#b8c7c5",
          fontFamily: RESULT_FONT_FAMILY,
          fontSize: "43px",
          fontStyle: "bold",
          stroke: filled ? "#a66c1f" : "#718a8a",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setResolution(4),
    );
  }
  return row;
}

function createResultImageButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  texture: string,
  label: string,
  onPress: () => void,
) {
  const image = scene.add.image(0, 0, texture).setDisplaySize(320, 68);
  const text = scene.add
    .text(0, 3, label, {
      color: RESULT_TEXT_COLORS.button,
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "23px",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(4);
  const button = scene.add
    .container(x, y, [image, text])
    .setSize(320, 68)
    .setInteractive({ useHandCursor: true });
  const stopPointer = (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation();
  button.on("pointerdown", stopPointer);
  button.on("pointerover", () => {
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scale: UI_MOTION.hoverScale,
      duration: 100,
      ease: "Sine.easeOut",
    });
  });
  button.on("pointerout", () => {
    scene.tweens.killTweensOf(button);
    scene.tweens.add({ targets: button, scale: 1, duration: 100 });
  });
  button.on(
    "pointerup",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      scene.tweens.killTweensOf(button);
      scene.tweens.add({
        targets: button,
        scale: UI_MOTION.pressedScale,
        duration: UI_MOTION.pressDurationMs,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: onPress,
      });
    },
  );
  return button;
}
