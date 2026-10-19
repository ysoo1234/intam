import Phaser from "phaser";
import {
  holdCoachCard, isCoachCardOpen, isCoachCountdownRunning, playCoachCountdown, releaseCoachCard, type CoachCountdown,
} from "./coachGuide";
import { GAME_CHROME_TEXTURES, VILLAGE_RETURN_BUTTON_DEPTH } from "./gameChrome";
import { isGameStartOverlayOpen } from "./gameStartOverlay";
import { drawOutlinedPill, outlinedButtonTextStyle, type OutlinedButtonVariant } from "./outlinedButton";
import { FONT_FAMILY } from "./theme";

/**
 * The "멈춤" button in the top-left of every place (where 마을로 돌아가기 used
 * to be). It freezes the game (clock, timers, tweens and the scene's own
 * update, through the same gate the tutorial cards use) and opens a small
 * menu: 이어하기 (3-2-1, then on), 처음부터 다시, 마을로 돌아가기. Leaving a
 * game therefore always goes through this menu, never by one stray tap.
 */
const BUTTON = { x: 122, y: 44.5, width: 210, height: 69 } as const;
const MENU_DEPTH = 1_300;
// While a 3-2-1 shows, the button rises above its shade (1 200) so the game
// can be paused then too; otherwise it stays under the tutorial's spotlight.
const COUNTDOWN_BUTTON_DEPTH = 1_250;
const PANEL = { width: 440, height: 352, radius: 28 } as const;
const MENU_BUTTON = { width: 300, height: 60, gap: 16 } as const;
const TEXT_RESOLUTION = 3;

type PointerHandler = (
  pointer: Phaser.Input.Pointer, x: number, y: number, event: Phaser.Types.Input.EventData,
) => void;
const swallow: PointerHandler = (_pointer, _x, _y, event) => event.stopPropagation();

export type GamePauseMenu = Readonly<{
  /** Opens the menu (also bound to ESC); nothing happens while it is open. */
  open: () => void;
  isOpen: () => boolean;
}>;

export function createGamePauseMenu(
  scene: Phaser.Scene,
  options: Readonly<{
    /** Starts the place over (usually `scene.scene.restart()`). */
    onRestart: () => void;
    /** Back to the village. */
    onWorld: () => void;
    /** False once the result screen is up (its own buttons take over). */
    canPause?: () => boolean;
    /** The 3-2-1's last word after 이어하기 ("출발!" at the airport). */
    goLabel?: string;
    /**
     * True while the place's own start count is running (the airport's
     * HUD 3-2-1): 멈춤 just holds it, and 이어하기 lets it carry on.
     */
    isCountingDown?: () => boolean;
  }>,
) {
  // --- The button -------------------------------------------------------------
  // On the start screen the plate shows the house and goes straight back to
  // the village; once the game runs it shows the pause bars and opens the menu.
  const background = scene.add
    .image(0, 0, GAME_CHROME_TEXTURES.villageReturnButton)
    .setDisplaySize(BUTTON.width, BUTTON.height);
  const label = scene.add
    .text(BUTTON.width * 0.11, 0, "마을로 돌아가기", {
      color: "#315567", fontFamily: FONT_FAMILY, fontSize: "15px", fontStyle: "bold", padding: { right: 4 },
    })
    .setOrigin(0.5)
    .setResolution(TEXT_RESOLUTION);
  let showingReturn = true;
  const refreshButton = () => {
    button.setDepth(isCoachCountdownRunning(scene) ? COUNTDOWN_BUTTON_DEPTH : VILLAGE_RETURN_BUTTON_DEPTH);
    // On the result screen (its own buttons take over) the dead 멈춤 button goes away.
    button.setVisible(isGameStartOverlayOpen(scene) || options.canPause?.() !== false);
    const onStartScreen = isGameStartOverlayOpen(scene);
    if (onStartScreen === showingReturn) return;
    showingReturn = onStartScreen;
    background
      .setTexture(onStartScreen ? GAME_CHROME_TEXTURES.villageReturnButton : GAME_CHROME_TEXTURES.pauseButton)
      .setDisplaySize(BUTTON.width, BUTTON.height);
    label.setText(onStartScreen ? "마을로 돌아가기" : "멈춤").setFontSize(onStartScreen ? 15 : 17);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, refreshButton);
  const button = scene.add
    .container(BUTTON.x, BUTTON.y, [background, label])
    .setDepth(VILLAGE_RETURN_BUTTON_DEPTH)
    .setSize(BUTTON.width, BUTTON.height)
    .setInteractive({ useHandCursor: true });
  // No tweens here: the menu pauses every tween, so the press must not depend on one.
  button.on("pointerover", () => button.setScale(1.018));
  button.on("pointerout", () => button.setScale(1));
  button.on("pointerdown", ((_pointer, _x, _y, event) => {
    event.stopPropagation();
    if (isGameStartOverlayOpen(scene)) {
      options.onWorld();
      return;
    }
    open();
  }) as PointerHandler);

  // --- The menu -----------------------------------------------------------------
  let overlay: Phaser.GameObjects.GameObject[] = [];
  let paused = false;
  /** The 3-2-1 after 이어하기 (everything still frozen); 멈춤 cancels it. */
  let countdown: CoachCountdown | undefined;
  /** Whether the game clock was running when paused (then it resumes with 3-2-1). */
  let wasRunning = false;

  const freeze = () => {
    wasRunning = !isGameStartOverlayOpen(scene) && !isCoachCardOpen(scene) && options.isCountingDown?.() !== true;
    holdCoachCard(scene);
    scene.time.paused = true;
    scene.tweens.pauseAll();
    scene.input.keyboard?.resetKeys();
  };
  const thaw = () => {
    scene.time.paused = false;
    scene.tweens.resumeAll();
    releaseCoachCard(scene);
  };
  const closeMenu = () => {
    overlay.forEach((object) => object.destroy());
    overlay = [];
    paused = false;
    button.setScale(1);
  };

  const makeMenuButton = (y: number, text: string, variant: OutlinedButtonVariant, onPress: () => void) => {
    const surface = drawOutlinedPill(scene.add.graphics(), MENU_BUTTON.width, MENU_BUTTON.height, variant);
    const caption = scene.add
      .text(0, -1, text, { fontFamily: FONT_FAMILY, fontSize: "23px", fontStyle: "bold", ...outlinedButtonTextStyle(variant) })
      .setOrigin(0.5)
      .setResolution(TEXT_RESOLUTION);
    const item = scene.add
      .container(0, y, [surface, caption])
      .setSize(MENU_BUTTON.width, MENU_BUTTON.height)
      .setInteractive({ useHandCursor: true });
    item.on("pointerover", () => item.setScale(1.03));
    item.on("pointerout", () => item.setScale(1));
    item.on("pointerdown", swallow);
    item.on("pointerup", ((_pointer, _x, _y, event) => {
      event.stopPropagation();
      onPress();
    }) as PointerHandler);
    return item;
  };

  const resume = () => {
    if (!paused) return;
    closeMenu();
    if (!wasRunning) {
      thaw();
      return;
    }
    // A 3-2-1 on the browser's clock while everything stays frozen, so no
    // customer walks, no line types and nothing finishes until "시작!".
    countdown = playCoachCountdown(scene, () => {
      countdown = undefined;
      if (scene.sys.isActive()) thaw();
    }, { frozen: true, goLabel: options.goLabel });
  };
  const restart = () => {
    if (!paused) return;
    closeMenu();
    thaw();
    options.onRestart();
  };
  const world = () => {
    if (!paused) return;
    closeMenu();
    thaw();
    options.onWorld();
  };

  function open() {
    if (paused || isGameStartOverlayOpen(scene) || options.canPause?.() === false) return;
    paused = true;
    if (countdown) {
      // Paused again during the 3-2-1 after 이어하기: the game is still
      // frozen, so drop that count; 이어하기 starts a fresh one.
      countdown.cancel();
      countdown = undefined;
    } else {
      // (A 3-2-1 at the very start runs on the game clock, so freezing it
      // here simply holds it; 이어하기 then lets it carry on.)
      freeze();
    }
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x102d37, 0.5).setDepth(MENU_DEPTH - 1).setInteractive();
    blocker.on("pointerdown", swallow);
    blocker.on("pointerup", swallow);
    const panel = scene.add.graphics();
    panel.fillStyle(0x163f4a, 0.25).fillRoundedRect(-PANEL.width / 2 + 3, -PANEL.height / 2 + 7, PANEL.width, PANEL.height, PANEL.radius);
    panel.fillStyle(0xfffdf6, 1).fillRoundedRect(-PANEL.width / 2, -PANEL.height / 2, PANEL.width, PANEL.height, PANEL.radius);
    panel.lineStyle(4, 0x6fb0b2, 1).strokeRoundedRect(-PANEL.width / 2, -PANEL.height / 2, PANEL.width, PANEL.height, PANEL.radius);
    const title = scene.add
      .text(0, -PANEL.height / 2 + 46, "잠깐 멈췄어요", {
        color: "#315567", fontFamily: FONT_FAMILY, fontSize: "28px", fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setResolution(TEXT_RESOLUTION);
    const top = -PANEL.height / 2 + 112;
    const step = MENU_BUTTON.height + MENU_BUTTON.gap;
    const container = scene.add
      .container(640, 360, [
        panel,
        title,
        makeMenuButton(top, "이어하기", "teal", resume),
        makeMenuButton(top + step, "처음부터 다시", "cream", restart),
        makeMenuButton(top + step * 2, "마을로 돌아가기", "cream", world),
      ])
      .setDepth(MENU_DEPTH);
    overlay = [blocker, container];
  }

  const onEscape = (event: KeyboardEvent) => {
    event.preventDefault();
    if (event.repeat) return;
    if (paused) resume();
    else if (isGameStartOverlayOpen(scene)) options.onWorld();
    else open();
  };
  scene.input.keyboard?.on("keydown-ESC", onEscape);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off("keydown-ESC", onEscape);
    scene.events.off(Phaser.Scenes.Events.UPDATE, refreshButton);
    if (paused || countdown) {
      countdown?.cancel();
      closeMenu();
      thaw();
    }
  });

  return { open, isOpen: () => paused } satisfies GamePauseMenu;
}
