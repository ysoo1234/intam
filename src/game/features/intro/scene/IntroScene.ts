import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { FONT_FAMILY, UI_MOTION } from "../../../core/visual/theme";

const INTRO_BOARD = { x: 640, y: 290, width: 760, height: 570 } as const;
const INTRO_BUTTON = { x: 640, y: 640, width: 400, height: 112 } as const;

export class IntroScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Image;
  private board?: Phaser.GameObjects.Image;
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

    this.board = this.add
      .image(INTRO_BOARD.x, INTRO_BOARD.y, "gem-board")
      .setDepth(4);
    this.board.setScale(
      Math.min(
        INTRO_BOARD.width / this.board.width,
        INTRO_BOARD.height / this.board.height,
      ),
    );

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
    this.backdrop = this.add
      .image(640, 360, "intro-village-backdrop")
      .setDepth(0);
    this.fitToScreen(this.backdrop);
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

    this.enterButton = this.add
      .container(INTRO_BUTTON.x, INTRO_BUTTON.y, [plate, label, keyHint])
      .setDepth(15)
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
      y: 370,
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
