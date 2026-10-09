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
  /**
   * Compact layout (no cards): one row per control, e.g.
   * { label: "이동", text: "방향키 또는 화면 터치" }.
   */
  controls?: readonly GameStartControl[];
  /** Line under the start button. */
  keyboardHint?: string;
}>;

export type GameStartControl = Readonly<{ label: string; text: string }>;

const COMPACT_PANEL = { width: 780, height: 500 } as const;

function createControlRows(scene: Phaser.Scene, controls: readonly GameStartControl[], y: number) {
  const rowHeight = 50;
  const rowGap = 12;
  const rowWidth = 520;
  const chipWidth = 128;
  const children: Phaser.GameObjects.GameObject[] = [];
  controls.forEach((control, index) => {
    const rowY = y + index * (rowHeight + rowGap);
    const row = scene.add.graphics();
    row.fillStyle(0xffffff, 1).fillRoundedRect(-rowWidth / 2, rowY - rowHeight / 2, rowWidth, rowHeight, 25);
    row.lineStyle(2.5, 0xd9c7a2, 1).strokeRoundedRect(-rowWidth / 2, rowY - rowHeight / 2, rowWidth, rowHeight, 25);
    row.fillStyle(0x2a8b7e, 1).fillRoundedRect(-rowWidth / 2 + 6, rowY - rowHeight / 2 + 6, chipWidth, rowHeight - 12, 19);
    const chip = scene.add.text(-rowWidth / 2 + 6 + chipWidth / 2, rowY - 1, control.label, {
      color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "19px", fontStyle: "bold",
    }).setOrigin(0.5).setResolution(3);
    const text = scene.add.text(-rowWidth / 2 + chipWidth + 26, rowY - 1, control.text, {
      color: "#315567", fontFamily: FONT_FAMILY, fontSize: "20px", fontStyle: "bold",
    }).setOrigin(0, 0.5).setResolution(3);
    children.push(row, chip, text);
  });
  return children;
}

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

export type GameStartHelp = Readonly<{
  /** The question in the ? dialog, e.g. "튜토리얼을 보고 시작할까요?". */
  question: string;
  /** Hides the ? button when false (the tutorial plays anyway on a first visit). */
  shouldOffer?: () => boolean;
}>;

/**
 * Asks `question` with 예 / 아니요; resolves true for 예. Sits above the start
 * panel and swallows the Space/Enter keys while open.
 */
function askYesNo(scene: Phaser.Scene, question: string, depth: number) {
  return new Promise<boolean>((resolve) => {
    const width = 520;
    const height = 230;
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x102d37, 0.45).setInteractive();
    const panel = scene.add.graphics();
    panel.fillStyle(0x163f4a, 0.25).fillRoundedRect(-width / 2 + 3, -height / 2 + 7, width, height, 28);
    panel.fillStyle(0xfffdf6, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 28);
    panel.lineStyle(4, 0x6fb0b2, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 28);
    const text = scene.add
      .text(0, -46, question, {
        color: "#315567", fontFamily: FONT_FAMILY, fontSize: "27px", fontStyle: "bold", align: "center",
        wordWrap: { width: width - 60, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setResolution(3);
    const makeButton = (x: number, label: string, fill: number, shade: number, color: string) => {
      const buttonWidth = 190;
      const buttonHeight = 58;
      const surface = scene.add.graphics();
      surface.fillStyle(shade, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2 + 4, buttonWidth, buttonHeight, 29);
      surface.fillStyle(fill, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 29);
      const caption = scene.add
        .text(0, -1, label, { color, fontFamily: FONT_FAMILY, fontSize: "24px", fontStyle: "bold" })
        .setOrigin(0.5)
        .setResolution(3);
      return scene.add
        .container(x, 46, [surface, caption])
        .setSize(buttonWidth, buttonHeight)
        .setInteractive({ useHandCursor: true });
    };
    const yes = makeButton(-110, "예", 0x3fa9a3, 0x1f6f6c, "#fffdf2");
    const no = makeButton(110, "아니요", 0xfff2d6, 0xd9c7a2, "#315567");
    const container = scene.add
      .container(640, 360, [panel, text, yes, no])
      .setDepth(depth)
      .setAlpha(0)
      .setScale(0.94);
    blocker.setDepth(depth - 1);
    scene.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 200, ease: "Back.easeOut" });

    const keyboard = scene.input.keyboard;
    const openedAt = Date.now();
    const finish = (answer: boolean) => {
      keyboard?.off("keydown-ENTER", onEnter);
      keyboard?.off("keydown-SPACE", onEnter);
      keyboard?.off("keydown-ESC", onEscape);
      keyboard?.resetKeys();
      scene.tweens.add({
        targets: container, alpha: 0, scale: 0.96, duration: 140, ease: "Sine.easeIn",
        onComplete: () => {
          container.destroy(true);
          blocker.destroy();
          resolve(answer);
        },
      });
    };
    function onEnter(event: KeyboardEvent) {
      event.preventDefault();
      // Ignore a held key and the press that was still down when the dialog opened.
      if (event.repeat || Date.now() - openedAt < 250) return;
      finish(true);
    }
    function onEscape(event: KeyboardEvent) {
      event.preventDefault();
      finish(false);
    }
    const stop = (
      _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
    ) => event.stopPropagation();
    blocker.on("pointerdown", stop);
    yes.on("pointerdown", stop);
    no.on("pointerdown", stop);
    yes.on("pointerup", (
      _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
    ) => { event.stopPropagation(); finish(true); });
    no.on("pointerup", (
      _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
    ) => { event.stopPropagation(); finish(false); });
    keyboard?.on("keydown-ENTER", onEnter);
    keyboard?.on("keydown-SPACE", onEnter);
    keyboard?.on("keydown-ESC", onEscape);
  });
}

/**
 * `onStart(withTutorial)`: `withTutorial` is true when the player chose the
 * tutorial from the ? button, false when they declined it, and undefined
 * when they simply pressed 시작하기.
 */
export function createGameStartOverlay(
  scene: Phaser.Scene,
  config: GameStartOverlayConfig,
  onStart: (withTutorial?: boolean) => void = () => {},
  options: Readonly<{ help?: GameStartHelp }> = {},
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
  const compact = !hasSteps && (config.controls?.length ?? 0) > 0;
  if (compact) panel.setDisplaySize(COMPACT_PANEL.width, COMPACT_PANEL.height);
  const title = scene.add
    .text(0, compact ? -160 : hasSteps ? -224 : -150, config.placeName, {
      color: "#315567",
      fontFamily: FONT_FAMILY,
      fontSize: "44px",
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const description = scene.add
    .text(0, compact ? -100 : hasSteps ? -172 : -40, config.playDescription, {
      color: "#456a78",
      fontFamily: FONT_FAMILY,
      fontSize: compact ? "23px" : hasSteps ? "21px" : "27px",
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
  const controlRows = compact ? createControlRows(scene, config.controls ?? [], -22) : [];
  const controlsHint = config.controlsHint && !compact
    ? scene.add.text(0, hasSteps ? 92 : 70, config.controlsHint, {
        color: "#2f7f7b", fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", align: "center",
      }).setOrigin(0.5).setResolution(3)
    : undefined;
  const button = scene.add
    .container(0, compact ? 112 : hasSteps ? 160 : 100, [buttonImage, buttonLabel])
    .setSize(410, 86)
    .setInteractive({ useHandCursor: true });

  // "?" beside the place name: asks whether to watch the tutorial first.
  const help = options.help;
  const showHelp = Boolean(help && (help.shouldOffer?.() ?? true));
  const helpButton = scene.add.container(0, 0).setVisible(showHelp);
  if (help && showHelp) {
    const radius = 24;
    const helpSurface = scene.add.graphics();
    helpSurface.fillStyle(0x1f6f6c, 1).fillCircle(0, 4, radius);
    helpSurface.fillStyle(0x3fa9a3, 1).fillCircle(0, 0, radius);
    helpSurface.lineStyle(3, 0xffffff, 1).strokeCircle(0, 0, radius);
    const helpLabel = scene.add
      .text(0, -1, "?", { color: "#fffdf2", fontFamily: FONT_FAMILY, fontSize: "30px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setResolution(3);
    helpButton
      .add([helpSurface, helpLabel])
      .setPosition(title.width / 2 + 40, title.y)
      .setSize(radius * 2, radius * 2)
      .setInteractive({ useHandCursor: true });
    scene.tweens.add({
      targets: helpButton, scale: 1.08, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }
  const keyboardHint = scene.add
    .text(0, compact ? 174 : hasSteps ? 218 : 168, config.keyboardHint ?? "Enter 또는 Space 키로도 시작할 수 있어요", {
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
      ...controlRows,
      ...(controlsHint ? [controlsHint] : []),
      button,
      keyboardHint,
      helpButton,
    ])
    .setDepth(1_000);

  let starting = false;
  let chosenTutorial: boolean | undefined;
  let asking = false;
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
        onStart(chosenTutorial);
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
    if (asking) return;
    animatePress();
  }
  const openHelp = () => {
    if (starting || asking || !help) return;
    asking = true;
    keyboard?.off("keydown-ENTER", startFromKeyboard);
    keyboard?.off("keydown-SPACE", startFromKeyboard);
    void askYesNo(scene, help.question, 1_010).then((yes) => {
      asking = false;
      if (!scene.sys.isActive()) return;
      if (yes) {
        chosenTutorial = true;
        animatePress();
        return;
      }
      keyboard?.on("keydown-ENTER", startFromKeyboard);
      keyboard?.on("keydown-SPACE", startFromKeyboard);
    });
  };
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
  helpButton.on("pointerdown", stopPointer);
  helpButton.on("pointerup", (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();
    openHelp();
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
