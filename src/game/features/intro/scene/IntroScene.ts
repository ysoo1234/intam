import Phaser from "phaser";
import { addGradientImage } from "../../../core/visual/gradientImage";
import { SCENE_FADE_RGB } from "../../../core/visual/theme";
import { GAME_ASSETS } from "../../../assets";
import { getPointerWorldPoint } from "../../../core/input/pointerCoordinates";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { createVillageDoorArrival, type VillagePreview } from "../../../core/scenes/villagePreview";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { FONT_FAMILY, UI_MOTION } from "../../../core/visual/theme";
import { preloadPlayerTextures } from "../../../core/player/playerSprite";
import {
  createMidiTalker,
  MIDI_FACE,
  MIDI_FRAME_HEIGHT,
  preloadMidiFaces,
  type MidiTalker,
} from "./introMidiTalker";
import { INTRO_STORY_TEXTURES, playIntroStory, shouldPlayIntroStory } from "./introStory";

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
// Hit area of the button plate artwork (intro-entry-button-v3, 640x134 at 2x).
const INTRO_BUTTON = { x: 640, y: 654, width: 300, height: 62 } as const;
// Textbook Midi front frames are 259 x 320; the body ends 6 px (of 415) above the frame bottom.
const INTRO_MASCOT = { x: 124, y: 665, width: 124, height: 153, originY: 0.985 } as const;
const INTRO_MIDI_LINES = ["보석을 모두 모았어.", "마법판을 확인해 보자!"] as const;
// The greeting bubble types a little quicker than the default pace.
const INTRO_BUBBLE_PACE = { letterMs: 30, spaceMs: 24, lineBreakMs: 150, mouthMs: 90 } as const;
const INTRO_BUBBLE_DELAY_MS = 1_000;
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
} as const;

export class IntroScene extends Phaser.Scene {
  private board?: Phaser.GameObjects.Image;
  private boardShadow?: Phaser.GameObjects.Ellipse;
  private mascot?: Phaser.GameObjects.Container;
  private titleGroup?: Phaser.GameObjects.Container;
  private rays?: Phaser.GameObjects.Container;
  private enterButton?: Phaser.GameObjects.Container;
  private pressedPointerId: number | null = null;
  private prefersReducedMotion = false;
  private entering = false;
  private midiSprite?: Phaser.GameObjects.Image;
  private midiBubble?: Phaser.GameObjects.Container;
  private talker?: MidiTalker;

  constructor(
    private readonly onReady: () => void,
    private readonly renderScale: number,
    /** Paints the real village for the story's door (given by the scene registry). */
    private readonly villagePreview?: VillagePreview,
  ) {
    super(SCENE_KEYS.intro);
  }

  preload() {
    this.load.image("gem-board", GAME_ASSETS.intro.board);
    this.load.image("intro-title", GAME_ASSETS.intro.title);
    this.load.image("intro-enter-button", GAME_ASSETS.intro.enterButton);
    preloadMidiFaces(this);
    this.load.image(INTRO_STORY_TEXTURES.village, GAME_ASSETS.intro.storyVillage);
    this.load.image(INTRO_STORY_TEXTURES.frame, GAME_ASSETS.intro.storyFrame);
    // Village sprites are fetched now so the village opens without a wait.
    preloadPlayerTextures(this);
    // The village art too: the story's door shows the real village, drawn live.
    this.villagePreview?.preload(this);
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
    const sky = { top: INTRO_COLORS.skyTop, bottom: INTRO_COLORS.skyBottom };
    addGradientImage(this, { x: 0, y: 0, width: 1280, height: 720 }, sky).setDepth(INTRO_DEPTH.wash);
    const wash = this.add.graphics().setDepth(INTRO_DEPTH.wash);
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
    const fadeWidth = 170;
    addGradientImage(this, { x: 0, y: 0, width: fadeWidth, height: 720 }, { ...sky, alphaLeft: 1, alphaRight: 0 })
      .setDepth(INTRO_DEPTH.rays + 0.5);
    addGradientImage(this, { x: 1280 - fadeWidth, y: 0, width: fadeWidth, height: 720 }, { ...sky, alphaLeft: 0, alphaRight: 1 })
      .setDepth(INTRO_DEPTH.rays + 0.5);

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
    this.boardShadow = this.add
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

  /** Midi waits beside the board and says the invitation letter by letter. */
  private createMascot() {
    const shadow = this.add.ellipse(0, 4, 92, 16, 0x2b3f86, 0.22);
    const sprite = this.add
      .image(0, 0, MIDI_FACE.idle)
      // One scale for every frame, so poses of other sizes keep Midi's size.
      .setScale(INTRO_MASCOT.height / MIDI_FRAME_HEIGHT)
      .setOrigin(0.5, INTRO_MASCOT.originY);
    this.midiSprite = sprite;
    const textStyle = {
      fontFamily: FONT_FAMILY, fontSize: "16px", fontStyle: "bold", color: "#315567",
    } as const;
    // One text per line, laid out from the full sentence so the bubble and the
    // centred lines never move while letters appear.
    const lineHeight = 20;
    const lines = INTRO_MIDI_LINES.map((line, index) => {
      const text = this.add.text(0, 0, line, textStyle).setOrigin(0, 0.5).setResolution(3);
      const y = (index - (INTRO_MIDI_LINES.length - 1) / 2) * lineHeight;
      text.setPosition(-text.width / 2, y);
      return text;
    });
    const textWidth = Math.max(...lines.map((line) => line.width));
    const bubbleWidth = textWidth + 34;
    const bubbleHeight = lineHeight * lines.length + 22;
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
    // Bubble starts just right of Midi's head so it never covers Midi.
    const bubbleGroup = this.add.container(bubbleWidth / 2 - 35, -INTRO_MASCOT.height - half - 12, [bubble, ...lines]);
    // Midi and the bubble bob together, so the bubble never drifts away from Midi.
    const body = this.add.container(0, 0, [sprite, bubbleGroup]);
    this.mascot = this.add
      .container(INTRO_MASCOT.x, INTRO_MASCOT.y, [shadow, body])
      .setDepth(INTRO_DEPTH.mascot);
    this.midiBubble = bubbleGroup;
    const talker = createMidiTalker(this, sprite, { instant: this.prefersReducedMotion });
    this.talker = talker;
    const renderBubble = (visible: string) => {
      const shown = visible.split("\n");
      lines.forEach((line, index) => line.setText(shown[index] ?? ""));
    };
    // Proud of the finished board: happy eyes while talking, then the calm face.
    const speak = () => {
      talker.say(INTRO_MIDI_LINES.join("\n"), renderBubble, () => {
        if (!this.entering) talker.setMood("idle");
      }, INTRO_BUBBLE_PACE, "happy");
    };
    // Tapping Midi replays the line.
    sprite.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      if (!this.entering) speak();
    });
    if (this.prefersReducedMotion) return;
    this.tweens.add({ targets: body, y: -6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: shadow, scaleX: 0.9, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    renderBubble("");
    bubbleGroup.setAlpha(0).setScale(0.7);
    this.tweens.add({
      targets: bubbleGroup, alpha: 1, scale: 1, delay: INTRO_BUBBLE_DELAY_MS - 260, duration: 260, ease: "Back.easeOut",
      onComplete: speak,
    });
  }

  /**
   * A clean, solid pill: one gradient fill, a white border, a soft drop shadow.
   * It gently breathes, and a thin ring ripples outward now and then to say "tap me".
   */
  private createEnterButton() {
    const { width, height } = INTRO_BUTTON;
    const radius = height / 2;
    const ripple = this.add.graphics();
    ripple.lineStyle(2, 0xffffff, 1).strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 6, radius - 2);
    ripple.setAlpha(0);
    // Generated plate artwork; the label and arrow are drawn on top so the text stays crisp and editable.
    const plate = this.add.image(0, 0, "intro-enter-button");
    plate.setScale(width / plate.width);
    const label = this.add
      // First visit opens the story about the board; afterwards it goes straight in.
      .text(-14, -1, shouldPlayIntroStory() ? "마법판 확인하기" : "배움마을 입장하기", {
        color: "#ffffff",
        fontFamily: DISPLAY_FONT_FAMILY,
        fontSize: "24px",
        padding: { x: 4, y: 6 },
        shadow: { offsetX: 0, offsetY: 2, color: "#2b3f86", blur: 0, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(3);
    const arrowX = label.x + label.width / 2 + 16;
    const arrow = this.add.graphics();
    // Text and arrow share one optical centre, on the centre of the plate's top face.
    arrow.fillStyle(0x2b3f86, 1).fillTriangle(arrowX - 6, -9, arrowX - 6, 9, arrowX + 8, 0);
    arrow.fillStyle(0xffffff, 1).fillTriangle(arrowX - 6, -11, arrowX - 6, 7, arrowX + 8, -2);
    const pulse = this.add.container(0, 0, [plate, label, arrow]);
    if (!this.prefersReducedMotion) {
      this.tweens.add({
        targets: pulse, scale: { from: 1, to: 1.04 },
        duration: 1_200, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
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
    this.tweens.add({
      targets: enterButton,
      scaleX: 0.94,
      scaleY: 0.88,
      alpha: 0,
      y: INTRO_BUTTON.y + 14,
      duration: 180,
      ease: "Sine.easeIn",
    });

    // First visit: the short story from textbook p.101 into the village.
    if (shouldPlayIntroStory() && this.mascot && this.midiSprite && this.talker) {
      this.midiSprite.disableInteractive();
      this.talker.stop();
      for (const extra of [this.titleGroup, this.midiBubble, this.boardShadow]) {
        if (!extra) continue;
        this.tweens.killTweensOf(extra);
        this.tweens.add({ targets: extra, alpha: 0, duration: 220, ease: "Sine.easeIn" });
      }
      playIntroStory(this, {
        board,
        rays: this.rays,
        mascot: this.mascot,
        talker: this.talker,
        reducedMotion: this.prefersReducedMotion,
        mascotFrameHeight: INTRO_MASCOT.height,
        villagePreview: this.villagePreview,
        renderScale: this.renderScale,
        // The door zoom ends on the village exactly as it starts, so no fade-in there.
        onFinish: () => this.scene.start(SCENE_KEYS.world, createVillageDoorArrival()),
      });
      return;
    }

    this.talker?.stop();
    // The board's shadow and Midi's bubble go with them, so nothing is left under the opening board.
    for (const extra of [this.mascot, this.titleGroup, this.midiBubble, this.boardShadow]) {
      if (!extra) continue;
      this.tweens.killTweensOf(extra);
      this.tweens.add({ targets: extra, alpha: 0, duration: 220, ease: "Sine.easeIn" });
    }

    if (this.prefersReducedMotion) {
      this.tweens.add({
        targets: board,
        alpha: 0,
        duration: 200,
        ease: "Sine.easeIn",
      });
      this.time.delayedCall(180, () => {
        this.cameras.main.fadeOut(180, ...SCENE_FADE_RGB);
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
      this.cameras.main.fadeOut(300, ...SCENE_FADE_RGB);
    });
    this.time.delayedCall(940, () => this.scene.start(SCENE_KEYS.world));
  }
}
