import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { FONT_FAMILY, UI_MOTION } from "../../../core/visual/theme";
import { getWorldTotalStars, WORLD_EXIT_REQUIRED_STARS } from "../../../core/navigation";
import { loadStoredWorldProgress } from "../../../core/navigation/worldProgressStorage";

/**
 * The intro mirrors page 1 of the textbook ("AI 월드 마법판"): a sky-blue to
 * lavender sky with light rays and sparkles, the chunky outlined title, the
 * gem board in the centre and a frosted note card underneath. Students arrive
 * here by scanning the QR code that appears once all nine gems are attached,
 * so the board is shown complete. The village stays visible behind the wash.
 */
const INTRO_TITLE = { x: 640, y: 66, text: "AI 월드 마법판" } as const;
const INTRO_BOARD = { x: 640, y: 338, width: 560, height: 420 } as const;
const INTRO_NOTE = { x: 640, y: 598, width: 640, height: 64 } as const;
const INTRO_BUTTON = { x: 640, y: 672, width: 252, height: 52 } as const;
const INTRO_MASCOT = { x: 214, y: 636, width: 112, height: 144 } as const;
const INTRO_DEPTH = {
  backdrop: 0, wash: 1, rays: 2, sparkles: 3, boardShadow: 4, board: 5,
  note: 6, mascot: 7, title: 8, button: 15,
} as const;
// Textbook palette: sky #8fd8f5 → lavender #a99ad8, title blue #2f8fd8 → purple #a347b8.
const INTRO_COLORS = {
  skyTop: 0x7fd0f2,
  skyBottom: 0xa99ad8,
  titleOuter: 0x2b3f86,
  titleBlue: "#2f8fd8",
  titlePurple: "#a347b8",
  noteText: "#2f3d68",
  buttonText: "#4b3b8f",
  buttonEdge: 0x8f7fd0,
} as const;

export class IntroScene extends Phaser.Scene {
  private backdrop?: Phaser.GameObjects.Image;
  private board?: Phaser.GameObjects.Image;
  private mascot?: Phaser.GameObjects.Container;
  private titleGroup?: Phaser.GameObjects.Container;
  private note?: Phaser.GameObjects.Container;
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
    this.load.image("intro-village-backdrop", GAME_ASSETS.intro.backdrop);
    this.load.image("gem-board", GAME_ASSETS.intro.board);
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
    this.createBackdrop();
    this.createSky();
    this.createTitle();
    this.createBoard();
    this.createNote();
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

  /** The village stays in place behind the textbook sky. */
  private createBackdrop() {
    this.backdrop = this.add
      .image(640, 372, "intro-village-backdrop")
      .setDepth(INTRO_DEPTH.backdrop);
    this.backdrop.setScale(
      Math.max(1280 / this.backdrop.width, 720 / this.backdrop.height) * 1.3,
    );
  }

  /** Sky-blue to lavender wash, radiating light behind the board, sparkles. */
  private createSky() {
    const wash = this.add.graphics().setDepth(INTRO_DEPTH.wash);
    wash.fillGradientStyle(
      INTRO_COLORS.skyTop, INTRO_COLORS.skyTop,
      INTRO_COLORS.skyBottom, INTRO_COLORS.skyBottom,
      0.86, 0.86, 0.8, 0.8,
    );
    wash.fillRect(0, 0, 1280, 720);
    // A soft bright core behind the board, like the page's glow.
    for (let ring = 0; ring < 6; ring += 1) {
      wash.fillStyle(0xffffff, 0.045);
      wash.fillEllipse(INTRO_BOARD.x, INTRO_BOARD.y + 40, 980 - ring * 120, 620 - ring * 80);
    }

    const rayCount = 18;
    const rays = this.add.graphics();
    for (let index = 0; index < rayCount; index += 1) {
      const angle = (Math.PI * 2 * index) / rayCount;
      const spread = index % 2 === 0 ? 0.07 : 0.04;
      const length = 900;
      rays.fillStyle(0xffffff, index % 2 === 0 ? 0.11 : 0.06);
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
    if (!this.prefersReducedMotion) {
      this.tweens.add({ targets: this.rays, angle: 360, duration: 120_000, repeat: -1 });
    }

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
  private createTitle() {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONT_FAMILY, fontSize: "66px", fontStyle: "bold", color: "#ffffff",
    };
    const shadow = this.add
      .text(0, 7, INTRO_TITLE.text, { ...style, stroke: "#1d2a5e", strokeThickness: 22 })
      .setOrigin(0.5).setResolution(3).setAlpha(0.35);
    const outer = this.add
      .text(0, 0, INTRO_TITLE.text, { ...style, stroke: "#ffffff", strokeThickness: 22 })
      .setOrigin(0.5).setResolution(3);
    const outline = this.add
      .text(0, 0, INTRO_TITLE.text, { ...style, strokeThickness: 13 })
      .setOrigin(0.5).setResolution(3);
    const gradient = outline.context.createLinearGradient(0, 0, outline.width, 0);
    gradient.addColorStop(0, INTRO_COLORS.titleBlue);
    gradient.addColorStop(0.5, "#5b7fd6");
    gradient.addColorStop(1, INTRO_COLORS.titlePurple);
    outline.setStroke(gradient as unknown as string, 13);
    const face = this.add
      .text(0, 0, INTRO_TITLE.text, style)
      .setOrigin(0.5).setResolution(3);
    // A thin glossy band on the upper half of the letters.
    const gloss = this.add
      .text(0, 0, INTRO_TITLE.text, { ...style, color: "#e6f6ff" })
      .setOrigin(0.5).setResolution(3).setAlpha(0.55)
      .setCrop(0, outline.height * 0.55, outline.width, outline.height);
    this.titleGroup = this.add
      .container(INTRO_TITLE.x, INTRO_TITLE.y, [shadow, outer, outline, face, gloss])
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

  /** Frosted note card, styled like the two-line notice on the printed page. */
  private createNote() {
    const { width, height } = INTRO_NOTE;
    const card = this.add.graphics();
    card.fillStyle(0x3b3f86, 0.14).fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 14);
    card.fillStyle(0xffffff, 0.9).fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    card.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    card.lineStyle(1.5, 0xe2def5, 1).strokeRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 10);
    const savedStars = getWorldTotalStars(loadStoredWorldProgress());
    const lines = [
      "✦ 9개의 보석을 모두 모아 AI 월드에 빛을 되찾았어요.",
      savedStars > 0
        ? `✦ 배움마을의 별을 이어서 모아 보세요.  ★ ${savedStars} / ${WORLD_EXIT_REQUIRED_STARS}`
        : "✦ 배움마을의 세 곳을 탐험하고 별을 모아 졸업길을 열어 보세요.",
    ];
    const text = this.add
      .text(-width / 2 + 34, 0, lines.join("\n"), {
        fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold",
        color: INTRO_COLORS.noteText, lineSpacing: 6,
      })
      .setOrigin(0, 0.5).setResolution(3);
    this.note = this.add
      .container(INTRO_NOTE.x, INTRO_NOTE.y, [card, text])
      .setDepth(INTRO_DEPTH.note);
    if (this.prefersReducedMotion) return;
    this.note.setAlpha(0).setY(INTRO_NOTE.y + 12);
    this.tweens.add({ targets: this.note, alpha: 1, y: INTRO_NOTE.y, duration: 420, delay: 380, ease: "Cubic.easeOut" });
  }

  /** Midi waits beside the board with a short invitation. */
  private createMascot() {
    const shadow = this.add.ellipse(0, 4, 88, 16, 0x2b3f86, 0.22);
    const sprite = this.add
      .image(0, 0, "player-front")
      .setDisplaySize(INTRO_MASCOT.width, INTRO_MASCOT.height)
      .setOrigin(0.5, 0.97);
    const bubbleText = this.add
      .text(0, 0, "배움마을로 가 보자!", {
        fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", color: "#315567",
      })
      .setOrigin(0.5)
      .setResolution(3);
    const bubbleWidth = bubbleText.width + 32;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x2b3f86, 0.14).fillRoundedRect(-bubbleWidth / 2 + 3, -20 + 4, bubbleWidth, 40, 16);
    bubble.fillStyle(0xffffff, 1).fillRoundedRect(-bubbleWidth / 2, -20, bubbleWidth, 40, 16);
    bubble.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-bubbleWidth / 2, -20, bubbleWidth, 40, 16);
    bubble.fillStyle(0xffffff, 1).fillTriangle(-26, 18, -8, 18, -22, 32);
    bubble.lineStyle(2, 0xc9c2ec, 1).lineBetween(-26, 18, -22, 32);
    bubble.lineBetween(-22, 32, -8, 18);
    const bubbleGroup = this.add.container(70, -INTRO_MASCOT.height - 4, [bubble, bubbleText]);
    this.mascot = this.add
      .container(INTRO_MASCOT.x, INTRO_MASCOT.y, [shadow, sprite, bubbleGroup])
      .setDepth(INTRO_DEPTH.mascot);
    if (this.prefersReducedMotion) return;
    this.tweens.add({ targets: sprite, y: -6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: shadow, scaleX: 0.9, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    bubbleGroup.setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: bubbleGroup, alpha: 1, scale: 1, delay: 900, duration: 260, ease: "Back.easeOut" });
  }

  /** A small, quiet pill button instead of the ornate sci-fi plate. */
  private createEnterButton() {
    const { width, height } = INTRO_BUTTON;
    const plate = this.add.graphics();
    plate.fillStyle(0x3b3f86, 0.2).fillRoundedRect(-width / 2 + 2, -height / 2 + 5, width, height, height / 2);
    plate.fillStyle(0xffffff, 1).fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    plate.lineStyle(2.5, INTRO_COLORS.buttonEdge, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    const label = this.add
      .text(0, -1, "배움마을 입장하기  →", {
        color: INTRO_COLORS.buttonText,
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setResolution(3);

    this.enterButton = this.add
      .container(INTRO_BUTTON.x, INTRO_BUTTON.y, [plate, label])
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
    for (const extra of [this.mascot, this.titleGroup, this.note]) {
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
    const backdropScaleX = backdrop.scaleX;
    const backdropScaleY = backdrop.scaleY;
    if (this.rays) {
      this.tweens.add({ targets: this.rays, scale: 1.6, alpha: 0, duration: 820, ease: "Cubic.easeIn" });
    }
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
