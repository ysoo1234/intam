import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { FONT_FAMILY, UI_MOTION } from "../../../core/visual/theme";

/**
 * The intro mirrors page 1 of the textbook ("AI 월드 마법판"): a sky-blue to
 * lavender sky with light rays and sparkles, the chunky outlined title, the
 * gem board in the centre and a single entry button. Students arrive
 * here by scanning the QR code that appears once all nine gems are attached
 * (after textbook p.101, before the epilogue), so the board is shown complete.
 */
// Title artwork: AI 월드 마법판 (public/assets/intro/intro-title-ai-world-v1.webp).
// Sized like textbook page 1: title about four-fifths the width of the board frame.
const INTRO_TITLE = { x: 640, y: 82, width: 450 } as const;
const INTRO_BOARD = { x: 640, y: 362, width: 600, height: 450 } as const;
const INTRO_BUTTON = { x: 640, y: 654, width: 280, height: 58 } as const;
const INTRO_MASCOT = { x: 124, y: 640, width: 118, height: 152 } as const;
const INTRO_DEPTH = {
  wash: 1, rays: 2, sparkles: 3, boardShadow: 4, board: 5,
  mascot: 7, title: 8, button: 15,
} as const;
// Textbook palette: sky #8fd8f5 → lavender #a99ad8, title blue #2f8fd8 → purple #a347b8.
const INTRO_COLORS = {
  skyTop: 0x7fd0f2,
  skyBottom: 0xa99ad8,
  titleOuter: 0x2b3f86,
  noteText: "#2f3d68",
  buttonFill: 0x5a6fe0,
  buttonEdge: 0xffffff,
} as const;

export class IntroScene extends Phaser.Scene {
  private board?: Phaser.GameObjects.Image;
  private mascot?: Phaser.GameObjects.Container;
  private titleGroup?: Phaser.GameObjects.Container;
  private rays?: Phaser.GameObjects.Container;
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
    this.load.image("gem-board", GAME_ASSETS.intro.board);
    this.load.image("intro-title", GAME_ASSETS.intro.title);
    this.load.image("player-front", GAME_ASSETS.characters.player.front);
    this.load.image("player-back", GAME_ASSETS.characters.player.back);
    this.load.image("player-left", GAME_ASSETS.characters.player.left);
    this.load.image("player-right", GAME_ASSETS.characters.player.right);
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.entering = false;
    this.pressedPointerId = null;
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.createSky();
    this.createTitle();
    this.createBoard();
    this.createMascot();
    this.createEnterButton();
    this.input.keyboard?.on("keydown-SPACE", this.startFromKeyboard);
    this.input.keyboard?.on("keydown-ENTER", this.startFromKeyboard);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-SPACE", this.startFromKeyboard);
      this.input.keyboard?.off("keydown-ENTER", this.startFromKeyboard);
    });
    this.cameras.main.fadeIn(520, 236, 240, 255);
    this.onReady();
  }

  /** Sky-blue to lavender wash, radiating light behind the board, sparkles. */
  private createSky() {
    const wash = this.add.graphics().setDepth(INTRO_DEPTH.wash);
    wash.fillGradientStyle(
      INTRO_COLORS.skyTop, INTRO_COLORS.skyTop,
      INTRO_COLORS.skyBottom, INTRO_COLORS.skyBottom,
      1, 1, 1, 1,
    );
    wash.fillRect(0, 0, 1280, 720);
    // A soft bright core behind the board, like the page's glow.
    for (let ring = 0; ring < 6; ring += 1) {
      wash.fillStyle(0xffffff, 0.05);
      wash.fillEllipse(INTRO_BOARD.x, INTRO_BOARD.y + 40, 980 - ring * 120, 620 - ring * 80);
    }

    const rayCount = 18;
    const rays = this.add.graphics();
    for (let index = 0; index < rayCount; index += 1) {
      const angle = (Math.PI * 2 * index) / rayCount;
      const spread = index % 2 === 0 ? 0.07 : 0.04;
      const length = 900;
      rays.fillStyle(0xffffff, index % 2 === 0 ? 0.16 : 0.09);
      rays.fillTriangle(
        0, 0,
        Math.cos(angle - spread) * length, Math.sin(angle - spread) * length,
        Math.cos(angle + spread) * length, Math.sin(angle + spread) * length,
      );
    }
    this.rays = this.add
      .container(INTRO_BOARD.x, INTRO_BOARD.y + 60, [rays])
      .setDepth(INTRO_DEPTH.rays)
      .setBlendMode(Phaser.BlendModes.ADD);
    // The rays stay still (a spinning burst felt dizzying); only a slow, faint breath.
    if (!this.prefersReducedMotion) {
      this.tweens.add({ targets: this.rays, alpha: { from: 0.75, to: 1 }, duration: 3_200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    // Fade the rays out toward the left and right edges so the canvas melts
    // into the page colour (pageBackdrop.ts) on wide windows.
    const edgeFade = this.add.graphics().setDepth(INTRO_DEPTH.rays + 0.5);
    const fadeWidth = 170;
    edgeFade.fillGradientStyle(
      INTRO_COLORS.skyTop, INTRO_COLORS.skyTop, INTRO_COLORS.skyBottom, INTRO_COLORS.skyBottom,
      1, 0, 1, 0,
    );
    edgeFade.fillRect(0, 0, fadeWidth, 720);
    edgeFade.fillGradientStyle(
      INTRO_COLORS.skyTop, INTRO_COLORS.skyTop, INTRO_COLORS.skyBottom, INTRO_COLORS.skyBottom,
      0, 1, 0, 1,
    );
    edgeFade.fillRect(1280 - fadeWidth, 0, fadeWidth, 720);

    // Four-point sparkles scattered around the board, like the printed page.
    const sparkleSpots = [
      [168, 210, 1], [116, 360, 0.7], [250, 470, 0.55], [1080, 196, 0.9], [1170, 330, 0.65],
      [1040, 470, 1], [1188, 520, 0.6], [330, 150, 0.6], [960, 120, 0.55], [92, 540, 0.8],
    ] as const;
    sparkleSpots.forEach(([x, y, size], index) => {
      const sparkle = this.add
        .star(x, y, 4, 3 * size, 22 * size, 0xffffff, 0.95)
        .setDepth(INTRO_DEPTH.sparkles)
        .setBlendMode(Phaser.BlendModes.ADD);
      if (this.prefersReducedMotion) return;
      this.tweens.add({
        targets: sparkle, scale: { from: 0.55, to: 1.1 }, alpha: { from: 0.35, to: 1 },
        duration: 1_100 + (index % 4) * 260, delay: index * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    });
  }

  /**
   * "AI 월드 마법판" in the textbook's chunky style: white letters, a blue to
   * purple outline, and a deep navy outer edge with a drop shadow.
   */
  /** "AI 월드 마법판" artwork drawn in the textbook's lettering style. */
  private createTitle() {
    const title = this.add.image(0, 0, "intro-title");
    title.setScale(INTRO_TITLE.width / title.width);
    this.titleGroup = this.add
      .container(INTRO_TITLE.x, INTRO_TITLE.y, [title])
      .setDepth(INTRO_DEPTH.title);
    if (!this.prefersReducedMotion) {
      this.titleGroup.setAlpha(0).setY(INTRO_TITLE.y - 18).setScale(0.96);
      this.tweens.add({
        targets: this.titleGroup, alpha: 1, y: INTRO_TITLE.y, scale: 1,
        duration: 560, ease: "Back.easeOut",
      });
    }
  }

  /** The textbook gem board, unchanged, completed with all nine gems. */
  private createBoard() {
    this.add
      .ellipse(INTRO_BOARD.x + 4, INTRO_BOARD.y + INTRO_BOARD.height / 2 + 4, INTRO_BOARD.width * 0.86, 30, 0x2b3f86, 0.22)
      .setDepth(INTRO_DEPTH.boardShadow);
    this.board = this.add
      .image(INTRO_BOARD.x, INTRO_BOARD.y, "gem-board")
      .setDepth(INTRO_DEPTH.board);
    const boardScale = Math.min(
      INTRO_BOARD.width / this.board.width,
      INTRO_BOARD.height / this.board.height,
    );
    this.board.setScale(boardScale);
    if (this.prefersReducedMotion) return;
    this.board.setY(INTRO_BOARD.y - 30).setAlpha(0).setScale(boardScale * 0.97);
    this.tweens.add({
      targets: this.board, y: INTRO_BOARD.y, alpha: 1, scale: boardScale,
      duration: 620, delay: 140, ease: "Back.easeOut",
    });
  }

  /** Midi waits beside the board with a short invitation. */
  private createMascot() {
    const shadow = this.add.ellipse(0, 4, 88, 16, 0x2b3f86, 0.22);
    const sprite = this.add
      .image(0, 0, "player-front")
      .setDisplaySize(INTRO_MASCOT.width, INTRO_MASCOT.height)
      .setOrigin(0.5, 0.97);
    const bubbleText = this.add
      .text(0, 0, "마법판에 보석을 모두 모아\n배움마을로 갈 수 있게 되었어!", {
        fontFamily: FONT_FAMILY, fontSize: "16px", fontStyle: "bold", color: "#315567",
        align: "center", lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setResolution(3);
    const bubbleWidth = bubbleText.width + 34;
    const bubbleHeight = bubbleText.height + 22;
    const half = bubbleHeight / 2;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x2b3f86, 0.14).fillRoundedRect(-bubbleWidth / 2 + 3, -half + 4, bubbleWidth, bubbleHeight, 16);
    bubble.fillStyle(0xffffff, 1).fillRoundedRect(-bubbleWidth / 2, -half, bubbleWidth, bubbleHeight, 16);
    bubble.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-bubbleWidth / 2, -half, bubbleWidth, bubbleHeight, 16);
    // Tail leaves the bubble a little right of Midi's head, not straight above it.
    const tailX = -bubbleWidth / 2 + 62;
    bubble.fillStyle(0xffffff, 1).fillTriangle(tailX, half - 2, tailX + 18, half - 2, tailX + 2, half + 14);
    bubble.lineStyle(2, 0xc9c2ec, 1).lineBetween(tailX, half - 2, tailX + 2, half + 14);
    bubble.lineBetween(tailX + 2, half + 14, tailX + 18, half - 2);
    // Bubble sits above Midi and leans right, staying clear of the board's left edge.
    // Bubble starts just right of Midi's head so it no longer covers Midi.
    const bubbleGroup = this.add.container(bubbleWidth / 2 - 40, -INTRO_MASCOT.height - half - 8, [bubble, bubbleText]);
    // Midi and the bubble bob together, so the bubble never drifts away from Midi.
    const body = this.add.container(0, 0, [sprite, bubbleGroup]);
    this.mascot = this.add
      .container(INTRO_MASCOT.x, INTRO_MASCOT.y, [shadow, body])
      .setDepth(INTRO_DEPTH.mascot);
    if (this.prefersReducedMotion) return;
    this.tweens.add({ targets: body, y: -6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: shadow, scaleX: 0.9, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    bubbleGroup.setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: bubbleGroup, alpha: 1, scale: 1, delay: 900, duration: 260, ease: "Back.easeOut" });
  }

  /**
   * A clean, solid pill: one gradient fill, a white border, a soft drop shadow.
   * It gently breathes, and a thin ring ripples outward now and then to say "tap me".
   */
  private createEnterButton() {
    const { width, height } = INTRO_BUTTON;
    const radius = height / 2;
    const ripple = this.add.graphics();
    ripple.lineStyle(2, 0xffffff, 1).strokeRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, radius + 2);
    ripple.setAlpha(0);
    // A chunky "game button": soft shadow, darker base peeking out below, bright top
    // face with a lighter inner band, framed by a white border. Solid fills only
    // (a gradient on a rounded rect shows a diagonal seam in WebGL).
    const plate = this.add.graphics();
    plate.fillStyle(0x2b3f86, 0.22).fillRoundedRect(-width / 2 + 1, -height / 2 + 10, width, height, radius);
    plate.fillStyle(0xffffff, 1).fillRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 9, radius + 3);
    plate.fillStyle(0x3d46a8, 1).fillRoundedRect(-width / 2, -height / 2 + 3, width, height + 3, radius);
    plate.fillStyle(INTRO_COLORS.buttonFill, 1).fillRoundedRect(-width / 2, -height / 2, width, height - 2, radius);
    plate.fillStyle(0x7488ee, 1).fillRoundedRect(-width / 2 + 8, -height / 2 + 4, width - 16, height / 2 - 4, radius - 6);
    const label = this.add
      .text(-14, 0, "배움마을 입장하기", {
        color: "#ffffff",
        fontFamily: DISPLAY_FONT_FAMILY,
        fontSize: "25px",
        padding: { x: 4, y: 6 },
      })
      .setOrigin(0.5)
      .setResolution(3);
    const arrowX = label.x + label.width / 2 + 16;
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffffff, 1).fillTriangle(arrowX - 6, -9, arrowX - 6, 9, arrowX + 8, 0);
    const pulse = this.add.container(0, 0, [plate, label, arrow]);
    if (!this.prefersReducedMotion) {
      this.tweens.add({
        targets: pulse, scale: { from: 1, to: 1.02 },
        duration: 1_400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: ripple, scaleX: { from: 1, to: 1.04 }, scaleY: { from: 1, to: 1.14 }, alpha: { from: 0.6, to: 0 },
        duration: 1_100, repeat: -1, repeatDelay: 2_400, ease: "Sine.easeOut",
      });
      this.tweens.add({ targets: arrow, x: 4, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    this.enterButton = this.add
      .container(INTRO_BUTTON.x, INTRO_BUTTON.y, [ripple, pulse])
      .setDepth(INTRO_DEPTH.button)
      .setSize(width, height)
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
          y: INTRO_BUTTON.y + 2,
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
        scale: 1.04,
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
      y: INTRO_BUTTON.y + 2,
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
      !this.board
    ) {
      return;
    }
    this.entering = true;
    const enterButton = this.enterButton;
    const board = this.board;
    enterButton.disableInteractive();
    this.tweens.killTweensOf([enterButton, board]);
    for (const extra of [this.mascot, this.titleGroup]) {
      if (!extra) continue;
      this.tweens.add({ targets: extra, alpha: 0, duration: 220, ease: "Sine.easeIn" });
    }
    this.tweens.add({
      targets: enterButton,
      scaleX: 0.94,
      scaleY: 0.88,
      alpha: 0,
      y: INTRO_BUTTON.y + 14,
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

    // The board flares and opens like a portal into the village.
    const boardScaleX = board.scaleX;
    const boardScaleY = board.scaleY;
    if (this.rays) {
      this.tweens.add({ targets: this.rays, scale: 1.6, alpha: 0, duration: 820, ease: "Cubic.easeIn" });
    }
    this.tweens.add({
      targets: board,
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
