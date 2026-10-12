import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { ENDING_LINES, ENDING_PROMISE_LABEL } from "../../../content/endingStory";
import {
  getWorldTotalStars,
  WORLD_ACTIVITY_IDS,
  WORLD_EXIT_REQUIRED_STARS,
  type WorldProgressSnapshot,
} from "../../../core/navigation/worldProgress";
import { loadStoredWorldProgress } from "../../../core/navigation/worldProgressStorage";
import { hasSeenEnding, markEndingSeen } from "../../../core/navigation/endingProgressStorage";
import { MIDI_POSE, preloadMidiFaces } from "../../../core/player/midiFrames";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { readEndingStart, type EndingStart } from "../../../core/scenes/endingStart";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import type { VillagePreview } from "../../../core/scenes/villagePreview";
import { addEndingArtButton, preloadEndingButtons } from "./endingButtons";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { showEndingCertificate, type FinishedCertificate } from "./endingCertificateView";
import { createEndingDialogue, type EndingDialogue } from "./endingDialogue";
import { ENDING_FINALE_TEXTURES, showEndingFinale } from "./endingFinale";
import {
  ENDING_CINEMA_BAR,
  ENDING_CUSTOMER_SPOTS,
  ENDING_DEPTH,
  ENDING_PROMISE_BUTTON,
  ENDING_SKIP,
} from "./endingLayout";
import { ensureEndingLights } from "./endingLights";
import { createEndingPortal, endingCustomerTexture, ENDING_PORTAL_TEXTURES, type EndingPortal } from "./endingPortal";
import { createEndingVillage, ENDING_VILLAGE_TEXTURES, type EndingVillage } from "./endingVillage";

/** Nine stars in all: three places, three stars each. */
const STARS_MAX = WORLD_ACTIVITY_IDS.length * 3;
/** Shown when the ending is opened directly (?ending) without enough stars saved. */
const DEMO_PROGRESS: WorldProgressSnapshot = { "ai-workshop": 3, "data-flight": 2, "ethics-review": 3 };
// Midi's village body (113 px frame, 110 px body) when there is no village preview.
const FALLBACK_MIDI = { bodyHeight: 110, bottomBelowSpawn: 13 } as const;

/**
 * The ending (textbook pp.102-103 epilogue): after seven stars the gate is
 * entered and, in about forty seconds, the stars wake up, light the three
 * buildings and gather over the fountain; the door home to the school library
 * opens, the customers wave and the student promises to keep AI helpful;
 * then the certificate photo, and the rush through the door to a last
 * screen that mirrors the first one.
 */
export class EndingScene extends Phaser.Scene {
  private calm = false;
  private start: EndingStart = { progress: DEMO_PROGRESS, midi: { x: 642, y: 604 } };
  private village?: EndingVillage;
  private portal?: EndingPortal;
  private dialogue?: EndingDialogue;
  private bars: Phaser.GameObjects.Rectangle[] = [];
  private skipPill?: Phaser.GameObjects.Container;
  /** Bumped when the story is skipped, so the running acts stop where they are. */
  private storyRun = 0;
  private atCertificate = false;
  private finished?: FinishedCertificate;
  private finale?: ReturnType<typeof showEndingFinale>;

  constructor(
    private readonly renderScale: number,
    /** Paints the real village behind the ending (given by the scene registry). */
    private readonly villagePreview?: VillagePreview,
  ) {
    super(SCENE_KEYS.ending);
  }

  preload() {
    this.villagePreview?.preload(this);
    const load = (key: string, url: string) => {
      if (!this.textures.exists(key)) this.load.image(key, url);
    };
    load(ENDING_VILLAGE_TEXTURES.snapshot, GAME_ASSETS.intro.storyVillage);
    load(ENDING_VILLAGE_TEXTURES.star, GAME_ASSETS.ui.villageActivityStarFilled);
    load(ENDING_PORTAL_TEXTURES.library, GAME_ASSETS.ending.library);
    load(ENDING_PORTAL_TEXTURES.frame, GAME_ASSETS.intro.storyFrame);
    load(ENDING_FINALE_TEXTURES.board, GAME_ASSETS.intro.board);
    GAME_ASSETS.ending.customers.forEach((url, index) => load(endingCustomerTexture(index), url));
    preloadEndingButtons(this);
    preloadMidiFaces(this);
  }

  create(data?: unknown) {
    configureSceneCamera(this, this.renderScale);
    this.calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.storyRun = 0;
    this.atCertificate = false;
    this.finished = undefined;
    this.reviewing = false;
    this.bars = [];
    ensureEndingLights(this);
    const fromGate = readEndingStart(data);
    this.start = fromGate ?? this.directStart();
    // A repeat visit through the gate goes straight to the last screen
    // (the story and the photo were already done; ?ending replays in full).
    if (fromGate && hasSeenEnding()) {
      this.finale = showEndingFinale(this, {
        calm: this.calm,
        fromVillage: true,
        onReturn: () => this.returnToVillage(),
        onShowPhoto: () => this.reviewCertificate(),
      });
      return;
    }
    this.village = createEndingVillage(this, {
      preview: this.villagePreview,
      renderScale: this.renderScale,
      progress: this.start.progress,
      calm: this.calm,
    });
    this.portal = createEndingPortal(this, {
      calm: this.calm,
      customers: Math.min(ENDING_CUSTOMER_SPOTS.length, GAME_ASSETS.ending.customers.length),
    });
    this.dialogue = createEndingDialogue(this, { calm: this.calm });
    this.createBars();
    this.createSkipPill();
    this.input.keyboard?.on("keydown-ESC", this.skipFromKeyboard);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-ESC", this.skipFromKeyboard);
    });
    void this.playStory();
  }

  /** Opened directly (?ending or a reload): the saved stars, or a demo set. */
  private directStart(): EndingStart {
    const stored = loadStoredWorldProgress();
    const progress = getWorldTotalStars(stored) >= WORLD_EXIT_REQUIRED_STARS ? stored : DEMO_PROGRESS;
    return { progress, midi: this.villagePreview?.spawn ?? { x: 642, y: 604 } };
  }

  private get stars() {
    return getWorldTotalStars(this.start.progress);
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => this.time.delayedCall(this.calm ? Math.min(ms, 200) : ms, resolve));
  }

  private createBars() {
    const make = (y: number) => this.add
      .rectangle(640, y, 1280, ENDING_CINEMA_BAR, 0x0d1328, 0.92)
      .setDepth(ENDING_DEPTH.bars);
    const top = make(-ENDING_CINEMA_BAR / 2);
    const bottom = make(720 + ENDING_CINEMA_BAR / 2);
    this.bars = [top, bottom];
    const duration = this.calm ? 0 : 600;
    this.tweens.add({ targets: top, y: ENDING_CINEMA_BAR / 2, duration, ease: "Cubic.easeOut" });
    this.tweens.add({ targets: bottom, y: 720 - ENDING_CINEMA_BAR / 2, duration, ease: "Cubic.easeOut" });
  }

  private hideBars() {
    const [top, bottom] = this.bars;
    if (!top || !bottom) return;
    const duration = this.calm ? 0 : 400;
    this.tweens.add({ targets: top, y: -ENDING_CINEMA_BAR / 2, duration, ease: "Sine.easeIn" });
    this.tweens.add({ targets: bottom, y: 720 + ENDING_CINEMA_BAR / 2, duration, ease: "Sine.easeIn" });
  }

  private createSkipPill() {
    const { width, height } = ENDING_SKIP;
    const plate = this.add.graphics();
    plate.fillStyle(0xffffff, 0.86).fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    plate.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    const label = this.add
      .text(-8, 0, "건너뛰기", { fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", color: "#2f3d68" })
      .setOrigin(0.5)
      .setResolution(3);
    const arrowX = label.x + label.width / 2 + 8;
    const arrows = this.add.graphics();
    arrows.fillStyle(0x4b8fe0, 1)
      .fillTriangle(arrowX, -6, arrowX, 6, arrowX + 8, 0)
      .fillTriangle(arrowX + 8, -6, arrowX + 8, 6, arrowX + 16, 0);
    this.skipPill = this.add
      .container(ENDING_SKIP.x, ENDING_SKIP.y, [plate, label, arrows])
      .setDepth(ENDING_DEPTH.skip)
      .setSize(width, height)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: this.skipPill, alpha: 1, delay: this.calm ? 0 : 500, duration: this.calm ? 0 : 300 });
    this.skipPill.on(
      "pointerdown",
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.skipStory();
      },
    );
  }

  private readonly skipFromKeyboard = (event: KeyboardEvent) => {
    event.preventDefault();
    this.skipStory();
  };

  /** Acts 1-3, about forty seconds at the student's own pace. */
  private async playStory() {
    const run = this.storyRun;
    const alive = () => run === this.storyRun && this.sys.isActive();
    const { village, portal, dialogue } = this;
    if (!village || !portal || !dialogue) return;
    const golden = this.stars >= STARS_MAX;

    // Act 1: the stars light up on their buildings and gather above the fountain.
    village.dimTo(0.34, 700);
    const preview = this.villagePreview;
    dialogue.arriveFrom(
      { x: this.start.midi.x, y: this.start.midi.y + (preview?.midiBody.bottomBelowSpawn ?? FALLBACK_MIDI.bottomBelowSpawn) },
      preview?.midiBody.height ?? FALLBACK_MIDI.bodyHeight,
    );
    await this.wait(700);
    if (!alive()) return;
    // The stars circle on a ring above the fountain in the middle of the village.
    const around = village.fountainRing;
    await village.wakeStars(around);
    if (!alive()) return;
    village.orbit(around);
    await dialogue.say(ENDING_LINES.starsAwake, { after: "happy" });
    if (!alive()) return;

    // Act 2: the stars are drawn into the fountain and become one big star.
    dialogue.hidePanel();
    await village.gatherAtFountain(golden);
    if (!alive()) return;
    await dialogue.say(ENDING_LINES.villageShines, { after: "happy" });
    if (!alive()) return;

    // Act 3: the door home opens; the customers wave; the promise.
    dialogue.hidePanel();
    await village.sendBigStarToGate();
    if (!alive()) return;
    village.dimTo(0.2, 500);
    await portal.open();
    if (!alive()) return;
    portal.welcomeCustomers();
    await dialogue.say(ENDING_LINES.doorOpen, { after: "happy" });
    if (!alive()) return;
    await dialogue.say(ENDING_LINES.guide1, { after: "idle" });
    if (!alive()) return;
    await dialogue.say(ENDING_LINES.guide2, { waitForTap: false, after: "idle" });
    if (!alive()) return;
    await this.askPromise();
    if (!alive()) return;
    portal.cheer();
    await dialogue.say(ENDING_LINES.thanks, { after: "happy" });
    if (!alive()) return;
    this.openCertificate();
  }

  /** "약속해요!" — the line waits until the student presses it. */
  private askPromise() {
    const dialogue = this.dialogue;
    dialogue?.setTapEnabled(false);
    return new Promise<void>((resolve) => {
      let pressed = false;
      const button = addEndingArtButton(this, {
        x: ENDING_PROMISE_BUTTON.x,
        y: ENDING_PROMISE_BUTTON.y,
        width: ENDING_PROMISE_BUTTON.width,
        height: ENDING_PROMISE_BUTTON.height,
        label: ENDING_PROMISE_LABEL,
        variant: "primary",
        fontSize: "26px",
        depth: ENDING_DEPTH.button,
        onPress: () => {
          if (pressed) return;
          pressed = true;
          this.tweens.killTweensOf(button);
          this.tweens.add({
            targets: button, alpha: 0, scale: 1.1, duration: this.calm ? 0 : 200,
            onComplete: () => button.destroy(true),
          });
          dialogue?.setTapEnabled(true);
          resolve();
        },
      });
      button.setAlpha(0).setScale(0.8);
      this.tweens.add({ targets: button, alpha: 1, scale: 1, duration: this.calm ? 0 : 280, ease: "Back.easeOut" });
      if (!this.calm) {
        this.tweens.add({ targets: button, scale: 1.05, delay: 300, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => button.destroy(true));
      // A skip while waiting removes the button too.
      const run = this.storyRun;
      const watch = this.time.addEvent({
        delay: 100, loop: true, callback: () => {
          if (run === this.storyRun || pressed) return;
          watch.remove(false);
          button.destroy(true);
        },
      });
    });
  }

  /** Skip: everything of acts 1-3 settles at once and the certificate opens. */
  private skipStory() {
    if (this.atCertificate) return;
    this.storyRun += 1;
    this.dialogue?.cancel();
    this.dialogue?.setTapEnabled(true);
    this.village?.settleLit();
    this.village?.dimTo(0.2, 200);
    void this.portal?.open(true);
    this.portal?.welcomeCustomers(true);
    this.openCertificate();
  }

  /** Act 4: the certificate photo. */
  private openCertificate() {
    if (this.atCertificate) return;
    this.atCertificate = true;
    this.skipPill?.disableInteractive();
    if (this.skipPill) this.tweens.add({ targets: this.skipPill, alpha: 0, duration: this.calm ? 0 : 200 });
    this.hideBars();
    this.dialogue?.hidePanel();
    this.dialogue?.setNarratorVisible(false);
    this.dialogue?.setTapEnabled(false);
    showEndingCertificate(this, {
      calm: this.calm,
      stars: this.stars,
      starsMax: STARS_MAX,
      art: this.certificateArt(),
      onDone: (finished) => {
        this.finished = finished;
        void this.farewell();
      },
    });
  }

  private certificateArt() {
    const source = (key: string) =>
      this.textures.exists(key) ? (this.textures.get(key).getSourceImage() as CanvasImageSource) : undefined;
    return {
      midi: source(MIDI_POSE.wave),
      village: source(ENDING_VILLAGE_TEXTURES.snapshot),
      star: source(ENDING_VILLAGE_TEXTURES.star),
    };
  }

  /** Act 5: goodbye, the rush through the door, and the last screen. */
  private async farewell() {
    const { dialogue, portal } = this;
    if (!dialogue || !portal) return;
    dialogue.setNarratorVisible(true);
    dialogue.setTapEnabled(true);
    await dialogue.say(ENDING_LINES.farewell, { waitForTap: false, after: MIDI_POSE.wave });
    await this.wait(1_100);
    if (!this.sys.isActive()) return;
    dialogue.hidePanel();
    dialogue.setNarratorVisible(false, 300);
    const white = await portal.rushThrough();
    if (!this.sys.isActive()) return;
    markEndingSeen();
    this.finale = showEndingFinale(this, {
      calm: this.calm,
      onReturn: () => this.returnToVillage(),
      onShowPhoto: () => this.reviewCertificate(),
    });
    white.destroy();
  }

  private reviewing = false;

  /**
   * "사진 확인하기" on the last screen: the taken certificate again, with
   * retake and save. On a repeat visit (nothing kept in memory) it starts
   * fresh, so the student can take a new photo any time.
   */
  private reviewCertificate() {
    if (this.reviewing) return;
    this.reviewing = true;
    this.finale?.setButtonsVisible(false);
    showEndingCertificate(this, {
      calm: this.calm,
      stars: this.stars,
      starsMax: STARS_MAX,
      art: this.certificateArt(),
      closeLabel: "닫기",
      ...(this.finished ? { review: this.finished } : {}),
      onDone: (finished) => {
        this.finished = finished;
        this.reviewing = false;
        this.finale?.setButtonsVisible(true);
      },
    });
  }

  /** Back to the village; every star and record stays as it is. */
  private returnToVillage() {
    this.scene.start(SCENE_KEYS.world);
  }
}
