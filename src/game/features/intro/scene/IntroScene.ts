import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { FONT_FAMILY, UI_MOTION } from "../../../core/visual/theme";
import { getWorldTotalStars, WORLD_EXIT_REQUIRED_STARS } from "../../../core/navigation";
import { loadStoredWorldProgress } from "../../../core/navigation/worldProgressStorage";

// The gem board is textbook artwork and stays untouched; the frame around it
// (title, ambience, mascot, button) is what the intro redesign dresses up.
const INTRO_BOARD = { x: 640, y: 352, width: 660, height: 495 } as const;
const INTRO_BUTTON = { x: 640, y: 656, width: 400, height: 112 } as const;
const INTRO_TITLE = { x: 640, y: 46 } as const;
const INTRO_MASCOT = { x: 262, y: 598, width: 118, height: 152 } as const;
const INTRO_DEPTH = { backdrop: 0, vignette: 1, orbs: 2, board: 4, mascot: 6, title: 8, button: 15 } as const;

export class IntroScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Image;
  private board?: Phaser.GameObjects.Image;
  private mascot?: Phaser.GameObjects.Container;
  private titleGroup?: Phaser.GameObjects.Container;
  private enterButton?: Phaser.GameObjects.Container;
  private pressedPointerId: number | null = null;
  private prefersReducedMotion = false;
  private entering = false;

  constructor(
    private readonly onReady: () => void,
    private readonly renderScale: number,
  ) {
    super(SCENE_KEYS.intro);
  }

  preload() {
    this.load.image("intro-village-backdrop", GAME_ASSETS.intro.backdrop);
    this.load.image("gem-board", GAME_ASSETS.intro.board);
    this.load.image("intro-entry-button", GAME_ASSETS.intro.entryButton);
    this.load.image("player-front", GAME_ASSETS.characters.player.front);
    this.load.image("player-back", GAME_ASSETS.characters.player.back);
    this.load.image("player-left", GAME_ASSETS.characters.player.left);
    this.load.image("player-right", GAME_ASSETS.characters.player.right);
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.createBackdrop();
    this.createAmbience();
    this.createTitle();

    this.board = this.add
      .image(INTRO_BOARD.x, INTRO_BOARD.y, "gem-board")
      .setDepth(INTRO_DEPTH.board);
    const boardScale = Math.min(
      INTRO_BOARD.width / this.board.width,
      INTRO_BOARD.height / this.board.height,
    );
    this.board.setScale(boardScale);
    if (!this.prefersReducedMotion) {
      // The board settles onto the screen; a soft shadow below reads as depth.
      this.board.setY(INTRO_BOARD.y - 34).setAlpha(0).setScale(boardScale * 0.97);
      this.tweens.add({
        targets: this.board, y: INTRO_BOARD.y, alpha: 1, scale: boardScale,
        duration: 620, delay: 120, ease: "Back.easeOut",
      });
    }
    this.add.ellipse(INTRO_BOARD.x + 4, INTRO_BOARD.y + INTRO_BOARD.height / 2 + 6, INTRO_BOARD.width * 0.9, 34, 0x10263a, 0.22)
      .setDepth(INTRO_DEPTH.board - 1);

    this.createMascot();
    this.createEnterButton();
    this.input.keyboard?.on("keydown-SPACE", this.startFromKeyboard);
    this.input.keyboard?.on("keydown-ENTER", this.startFromKeyboard);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-SPACE", this.startFromKeyboard);
      this.input.keyboard?.off("keydown-ENTER", this.startFromKeyboard);
    });
    this.cameras.main.fadeIn(520, 255, 245, 220);
    this.onReady();
  }

  private createBackdrop() {
    // Zoomed past the artwork's own corner caption so the new title stands alone.
    this.backdrop = this.add
      .image(640, 372, "intro-village-backdrop")
      .setDepth(INTRO_DEPTH.backdrop);
    this.fitToScreen(this.backdrop);
    this.backdrop.setScale(this.backdrop.scale * 1.3);
    if (!this.prefersReducedMotion) {
      // A slow breathing zoom keeps the village alive behind the board.
      const scale = this.backdrop.scale;
      this.tweens.add({
        targets: this.backdrop, scale: scale * 1.045, duration: 9_000,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    }
  }

  /** Vignette for legibility plus drifting light motes over the village. */
  private createAmbience() {
    const vignette = this.add.graphics().setDepth(INTRO_DEPTH.vignette);
    for (let band = 0; band < 10; band += 1) {
      const alpha = 0.03 * (10 - band);
      vignette.fillStyle(0x12304a, alpha);
      vignette.fillRect(0, band * 9, 1280, 9);
      vignette.fillRect(0, 720 - (band + 1) * 14, 1280, 14);
    }
    vignette.fillStyle(0x12304a, 0.12).fillRect(0, 0, 1280, 720);
    if (this.prefersReducedMotion) return;
    for (let index = 0; index < 14; index += 1) {
      const x = 60 + Math.random() * 1_160;
      const startY = 160 + Math.random() * 560;
      const radius = 3 + Math.random() * 5;
      const mote = this.add
        .circle(x, startY, radius, 0xfff4c2, 0.7)
        .setDepth(INTRO_DEPTH.orbs)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      this.tweens.add({
        targets: mote, y: startY - 160 - Math.random() * 120, x: x + (Math.random() - 0.5) * 60,
        alpha: { from: 0, to: 0.55 }, duration: 5_200 + Math.random() * 3_000,
        delay: Math.random() * 4_000, repeat: -1, yoyo: true, ease: "Sine.easeInOut",
      });
    }
  }

  private createTitle() {
    const title = this.add
      .text(0, 0, "배움마을", {
        fontFamily: FONT_FAMILY, fontSize: "54px", fontStyle: "bold", color: "#fffaf0",
        stroke: "#2b4f66", strokeThickness: 9, shadow: { offsetX: 0, offsetY: 5, color: "#10263a", blur: 0, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(3);
    const chipLabel = this.add
      .text(0, 50, "생활 속 AI 제작소  ·  데이터 비행 공항  ·  윤리 심사소", {
        fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", color: "#fffaf0",
      })
      .setOrigin(0.5)
      .setResolution(3);
    const chip = this.add.graphics();
    const chipWidth = chipLabel.width + 40;
    chip.fillStyle(0x10263a, 0.5).fillRoundedRect(-chipWidth / 2, 50 - 17, chipWidth, 34, 17);
    this.titleGroup = this.add
      .container(INTRO_TITLE.x, INTRO_TITLE.y, [chip, chipLabel, title])
      .setDepth(INTRO_DEPTH.title);
    if (!this.prefersReducedMotion) {
      this.titleGroup.setAlpha(0).setY(INTRO_TITLE.y - 16);
      this.tweens.add({ targets: this.titleGroup, alpha: 1, y: INTRO_TITLE.y, duration: 520, ease: "Cubic.easeOut" });
    }
  }

  /** Midi waits beside the board with a short invitation. */
  private createMascot() {
    const shadow = this.add.ellipse(0, 4, 92, 18, 0x10263a, 0.24);
    const sprite = this.add
      .image(0, 0, "player-front")
      .setDisplaySize(INTRO_MASCOT.width, INTRO_MASCOT.height)
      .setOrigin(0.5, 0.97);
    const bubbleText = this.add
      .text(0, 0, "별을 모아 졸업길을 열어 보자!", {
        fontFamily: FONT_FAMILY, fontSize: "18px", fontStyle: "bold", color: "#315567",
      })
      .setOrigin(0.5)
      .setResolution(3);
    const bubbleWidth = bubbleText.width + 34;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x10263a, 0.16).fillRoundedRect(-bubbleWidth / 2 + 3, -22 + 4, bubbleWidth, 44, 16);
    bubble.fillStyle(0xfffaf0, 1).fillRoundedRect(-bubbleWidth / 2, -22, bubbleWidth, 44, 16);
    bubble.lineStyle(2.5, 0x6fb0b2, 1).strokeRoundedRect(-bubbleWidth / 2, -22, bubbleWidth, 44, 16);
    bubble.fillStyle(0xfffaf0, 1).fillTriangle(-30, 20, -10, 20, -24, 34);
    bubble.lineStyle(2.5, 0x6fb0b2, 1).lineBetween(-30, 20, -24, 34);
    bubble.lineBetween(-24, 34, -10, 20);
    const bubbleGroup = this.add.container(96, -INTRO_MASCOT.height - 2, [bubble, bubbleText]);
    this.mascot = this.add
      .container(INTRO_MASCOT.x, INTRO_MASCOT.y, [shadow, sprite, bubbleGroup])
      .setDepth(INTRO_DEPTH.mascot);
    if (this.prefersReducedMotion) return;
    this.tweens.add({ targets: sprite, y: -6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: shadow, scaleX: 0.9, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    bubbleGroup.setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: bubbleGroup, alpha: 1, scale: 1, delay: 900, duration: 260, ease: "Back.easeOut" });
  }

  private fitToScreen(image: Phaser.GameObjects.Image) {
    image.setScale(Math.max(1280 / image.width, 720 / image.height));
  }

  private createEnterButton() {
    const plate = this.add
      .image(0, 0, "intro-entry-button")
      .setDisplaySize(INTRO_BUTTON.width, INTRO_BUTTON.height);
    const label = this.add
      .text(0, -8, "배움마을 입장하기", {
        color: "#17386f",
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    const keyHint = this.add
      .text(0, 23, "ENTER  ·  SPACE", {
        color: "#48667f",
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const glow = this.add
      .ellipse(0, 6, INTRO_BUTTON.width + 60, INTRO_BUTTON.height + 10, 0xfff1b8, 0.35)
      .setBlendMode(Phaser.BlendModes.ADD);
    const savedStars = getWorldTotalStars(loadStoredWorldProgress());
    const progressChip = savedStars > 0
      ? this.add
          .text(0, -INTRO_BUTTON.height / 2 - 18, `이어서 모으기  ★ ${savedStars} / ${WORLD_EXIT_REQUIRED_STARS}`, {
            fontFamily: FONT_FAMILY, fontSize: "16px", fontStyle: "bold", color: "#fffaf0",
            stroke: "#2b4f66", strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setResolution(3)
      : undefined;
    this.enterButton = this.add
      .container(INTRO_BUTTON.x, INTRO_BUTTON.y, [glow, plate, label, keyHint, ...(progressChip ? [progressChip] : [])])
      .setDepth(INTRO_DEPTH.button)
      .setSize(INTRO_BUTTON.width, INTRO_BUTTON.height)
      .setInteractive({ useHandCursor: true });
    this.enterButton.on(
      "pointerdown",
      (
        pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        if (this.entering || !this.enterButton) return;
        this.pressedPointerId = pointer.id;
        this.tweens.killTweensOf(this.enterButton);
        this.tweens.add({
          targets: this.enterButton,
          scaleX: 0.97,
          scaleY: 0.94,
          y: INTRO_BUTTON.y + 3,
          duration: UI_MOTION.pressDurationMs,
          ease: "Sine.easeOut",
        });
      },
    );
    this.enterButton.on("pointerover", () => {
      if (this.entering || !this.enterButton) return;
      this.tweens.killTweensOf(this.enterButton);
      this.tweens.add({
        targets: this.enterButton,
        scale: 1.035,
        y: INTRO_BUTTON.y - 2,
        duration: 120,
        ease: "Sine.easeOut",
      });
    });
    const resetButton = () => {
      if (this.entering || !this.enterButton) return;
      this.tweens.killTweensOf(this.enterButton);
      this.tweens.add({
        targets: this.enterButton,
        scaleX: 1,
        scaleY: 1,
        y: INTRO_BUTTON.y,
        duration: 120,
        ease: "Sine.easeOut",
      });
    };
    this.enterButton.on("pointerout", resetButton);
    const releasePointer = (pointer: Phaser.Input.Pointer) => {
      if (this.pressedPointerId !== pointer.id) return;
      this.pressedPointerId = null;
      const worldPoint = getPointerWorldPoint(this, pointer);
      if (this.isInsideButton(worldPoint.x, worldPoint.y)) {
        this.startEntrance();
        return;
      }
      resetButton();
    };
    const releasePointerOutside = (pointer: Phaser.Input.Pointer) => {
      if (this.pressedPointerId !== pointer.id) return;
      this.pressedPointerId = null;
      resetButton();
    };
    this.input.on("pointerup", releasePointer);
    this.input.on("pointerupoutside", releasePointerOutside);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pressedPointerId = null;
      this.input.off("pointerup", releasePointer);
      this.input.off("pointerupoutside", releasePointerOutside);
    });
    if (!this.prefersReducedMotion) {
      this.tweens.add({ targets: glow, alpha: { from: 0.18, to: 0.42 }, scaleX: { from: 0.96, to: 1.04 },
        duration: 1_500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const plateScaleX = plate.scaleX;
      const plateScaleY = plate.scaleY;
      this.tweens.add({
        targets: plate,
        alpha: { from: 0.96, to: 1 },
        scaleX: { from: plateScaleX * 0.99, to: plateScaleX * 1.01 },
        scaleY: { from: plateScaleY * 0.99, to: plateScaleY * 1.01 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private isInsideButton(x: number, y: number) {
    return (
      Math.abs(x - INTRO_BUTTON.x) <= INTRO_BUTTON.width / 2 &&
      Math.abs(y - INTRO_BUTTON.y) <= INTRO_BUTTON.height / 2
    );
  }

  private readonly startFromKeyboard = (event: KeyboardEvent) => {
    event.preventDefault();
    if (this.entering || !this.enterButton) return;
    this.tweens.killTweensOf(this.enterButton);
    this.tweens.add({
      targets: this.enterButton,
      scaleX: 0.97,
      scaleY: 0.94,
      y: INTRO_BUTTON.y + 3,
      duration: UI_MOTION.pressDurationMs,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => this.startEntrance(),
    });
  };

  private startEntrance() {
    if (
      this.entering ||
      !this.enterButton ||
      !this.board ||
      !this.backdrop
    ) {
      return;
    }
    this.entering = true;
    const enterButton = this.enterButton;
    const board = this.board;
    const backdrop = this.backdrop;
    enterButton.disableInteractive();
    this.tweens.killTweensOf([enterButton, board, backdrop]);
    for (const extra of [this.mascot, this.titleGroup]) {
      if (!extra) continue;
      this.tweens.add({ targets: extra, alpha: 0, duration: 220, ease: "Sine.easeIn" });
    }
    this.tweens.add({
      targets: enterButton,
      scaleX: 0.94,
      scaleY: 0.88,
      alpha: 0,
      y: INTRO_BUTTON.y + 18,
      duration: 180,
      ease: "Sine.easeIn",
    });

    if (this.prefersReducedMotion) {
      this.tweens.add({
        targets: board,
        alpha: 0,
        duration: 200,
        ease: "Sine.easeIn",
      });
      this.time.delayedCall(180, () => {
        this.cameras.main.fadeOut(180, 255, 245, 220);
      });
      this.time.delayedCall(380, () => this.scene.start(SCENE_KEYS.world));
      return;
    }

    const boardScaleX = board.scaleX;
    const boardScaleY = board.scaleY;
    const backdropScaleX = backdrop.scaleX;
    const backdropScaleY = backdrop.scaleY;
    this.tweens.add({
      targets: backdrop,
      x: 640,
      y: 382,
      scaleX: backdropScaleX * 1.1,
      scaleY: backdropScaleY * 1.1,
      duration: 920,
      ease: "Cubic.easeInOut",
    });
    this.tweens.add({
      targets: board,
      y: 310,
      scaleX: boardScaleX * 1.4,
      scaleY: boardScaleY * 1.4,
      alpha: 0,
      delay: 100,
      duration: 720,
      ease: "Cubic.easeIn",
    });
    this.time.delayedCall(620, () => {
      this.cameras.main.fadeOut(300, 255, 245, 220);
    });
    this.time.delayedCall(940, () => this.scene.start(SCENE_KEYS.world));
  }
}
