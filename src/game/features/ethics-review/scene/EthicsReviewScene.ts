import Phaser from "phaser";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import {
  createGameStatusHud, createVillageReturnButton, preloadGameChromeAssets, type GameStatusHud,
} from "../../../core/visual/gameChrome";
import { createGameStartOverlay, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import { markTutorialSeen, shouldPlayTutorial } from "../../../core/navigation/tutorialProgressStorage";
import { isCoachCardOpen, playCoachCountdown, preloadCoachAssets } from "../../../core/visual/coachGuide";
import { preloadGameResultOverlayAssets } from "../../../core/visual/gameResultOverlay";
import { ETHICS_REVIEW_CASES, ETHICS_STAGE2_CASES, ETHICS_STAGE3_CASES, ETHICS_VISITOR_LINES } from "../content";
import {
  createReviewShift, createEthicsDeliveryState, getEthicsDeliveryCase, getEthicsDeliveryVisitor,
  actEthicsDelivery, continueEthicsDelivery, tickEthicsDelivery, canRequestEthicsAction,
  getEthicsReviewStars, isEthicsComboCelebration,
  type EthicsDeliveryAction, type EthicsDeliveryState, type EthicsVerdict,
} from "../model";
import { createEthicsReviewControls, type EthicsReviewControls } from "./ethicsReviewControls";
import { createEthicsReviewPlayer, type EthicsReviewPlayer } from "./ethicsReviewPlayer";
import { createEthicsOffice, preloadEthicsReviewAssets } from "./ethicsReviewOffice";
import { createEthicsReviewVisitor, ETHICS_VISITOR_MOTION, type EthicsReviewVisitorView } from "./ethicsReviewVisitor";
import {
  createEthicsReviewForm, createEthicsReviewStations, ETHICS_FORM_MOTION, playEthicsFormArrival,
  playEthicsFormDeparture, setEthicsReviewFormCase, setEthicsStationState, showEthicsFormState, type EthicsReviewFormView, type EthicsReviewStations,
} from "./ethicsReviewView";
import { ETHICS_STAMP_IMPACT_MS, playEthicsVerdictStamp } from "./ethicsReviewEffects";
import { createEthicsResultOverlay } from "./ethicsReviewOverlays";
import { createEthicsReviewTutorial, type EthicsReviewTutorial } from "./ethicsReviewTutorial";
import { createEthicsStampAudio } from "./ethicsReviewAudio";

/** Off until the desk can lay out attachments next to the form. */
const ETHICS_ATTACHMENTS_ON_DESK = false;
/** Start-overlay copy; the untimed practice case teaches the stamps. */
const ETHICS_START = {
  placeName: "윤리 심사소",
  playDescription: "친구들이 가져온 AI 사용 확인서를\n미디가 심사해요.",
  keyboardHint: "방향키로도 도장을 찍을 수 있어요",
} as const;
// The next form becomes stampable once it has landed on the desk.
const ARRIVAL_INPUT_DELAY_MS = ETHICS_FORM_MOTION.arriveMs + 60;
const DEPARTURE_GAP_MS = Math.max(ETHICS_FORM_MOTION.leaveMs, ETHICS_VISITOR_MOTION.leaveMs);

export class EthicsReviewScene extends Phaser.Scene {
  private state?: EthicsDeliveryState;
  private started = false;
  private leaving = false;
  private player?: EthicsReviewPlayer;
  private controls?: EthicsReviewControls;
  private form?: EthicsReviewFormView;
  private visitor?: EthicsReviewVisitorView;
  private tutorial?: EthicsReviewTutorial;
  /** The practice case was chosen again from ?: it ends back on the start screen. */
  private replayingPractice = false;
  private stations: EthicsReviewStations = [];
  private hud?: GameStatusHud;
  private audio?: ReturnType<typeof createEthicsStampAudio>;
  private hudKey = "";
  private uiKey = "";
  private stamp?: Phaser.GameObjects.Container;
  private result?: Phaser.GameObjects.Container;
  private arrivalTimer?: Phaser.Time.TimerEvent;
  private presentGeneration = 0;
  private arrived = true;
  private inputReadyAt = 0;
  private lastTickAt = 0;
  private earnedStars?: 0 | 1 | 2 | 3;
  private lastVerdict?: EthicsVerdict;

  constructor(private readonly renderScale: number) { super(SCENE_KEYS.ethicsReview); }

  preload() {
    preloadGameChromeAssets(this);
    preloadGameResultOverlayAssets(this);
    preloadGameStartOverlayAssets(this);
    preloadEthicsReviewAssets(this);
    preloadCoachAssets(this);
  }

  create() {
    this.resetSceneState();
    configureSceneCamera(this, this.renderScale);
    createEthicsOffice(this);
    this.visitor = createEthicsReviewVisitor(this);
    this.player = createEthicsReviewPlayer(this);
    this.form = createEthicsReviewForm(this, () => this.handleContinue());
    this.stations = createEthicsReviewStations(this, action => this.requestStamp(action));
    createVillageReturnButton(this, () => this.returnToWorld());
    this.hud = createGameStatusHud(this, ["손님 0명", "0점", "콤보 0", "02:00"]);
    this.audio = createEthicsStampAudio(this);
    this.controls = createEthicsReviewControls(
      this, () => this.canStamp(),
      action => Boolean(this.state && canRequestEthicsAction(this.state.phase, action)),
      () => this.returnToWorld(), action => this.handleAction(action), () => this.handleContinue(),
    );
    this.input.keyboard?.on("keydown", this.warmAudio, this);
    this.input.on("pointerdown", this.warmAudio, this);
    createGameStartOverlay(this, ETHICS_START, (withTutorial) => this.startShift(withTutorial), {
      help: { question: "튜토리얼을 다시 볼까요?" },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.started = false;
      this.leaving = true;
      this.arrivalTimer?.remove(false);
      this.tutorial?.destroy();
      this.controls?.cancelMovement();
      this.input.keyboard?.off("keydown", this.warmAudio, this);
      this.input.off("pointerdown", this.warmAudio, this);
    });
  }

  update() {
    if (!this.started || this.leaving || !this.state || !this.player) return;
    // The clock waits for the "이제 진짜 심사 시작!" card and the 3-2-1.
    if (isCoachCardOpen(this)) {
      this.lastTickAt = performance.now();
      this.player.update();
      return;
    }
    this.advanceClock();
    if (this.state.phase === "result") return;
    this.player.update();
    this.updateView();
  }

  private warmAudio() { this.audio?.unlock(); }

  private resetSceneState() {
    this.state = undefined;
    this.started = false;
    this.leaving = false;
    this.player = undefined;
    this.controls = undefined;
    this.form = undefined;
    this.visitor = undefined;
    this.tutorial = undefined;
    this.stations = [];
    this.hud = undefined;
    this.audio = undefined;
    this.hudKey = "";
    this.uiKey = "";
    this.stamp = undefined;
    this.result = undefined;
    this.arrivalTimer = undefined;
    this.presentGeneration = 0;
    this.arrived = true;
    this.inputReadyAt = 0;
    this.lastTickAt = 0;
    this.earnedStars = undefined;
  }

  private canStamp() {
    return this.started && !this.leaving && this.state?.phase === "choosing" && performance.now() >= this.inputReadyAt;
  }

  private requestStamp(action: EthicsDeliveryAction) {
    this.warmAudio();
    this.controls?.requestAction(action);
  }

  /** `withTutorial` is set by the ? button; otherwise first plays get the practice case. */
  private startShift(withTutorial?: boolean) {
    if (this.leaving || !this.player) return;
    const practice = withTutorial ?? shouldPlayTutorial("ethics-review");
    this.replayingPractice = withTutorial === true;
    this.warmAudio();
    this.tutorial?.destroy();
    this.tutorial = undefined;
    this.result?.destroy(true);
    this.result = undefined;
    this.stamp?.destroy(true);
    this.stamp = undefined;
    this.arrivalTimer?.remove(false);
    this.presentGeneration += 1;
    this.arrived = true;
    this.state = createEthicsDeliveryState(
      createReviewShift(ETHICS_REVIEW_CASES, ETHICS_REVIEW_CASES.length), practice, undefined,
      // Stages 2–3 switch on with the two-panel desk, which can show attachments.
      ETHICS_ATTACHMENTS_ON_DESK ? {
        2: createReviewShift(ETHICS_STAGE2_CASES, ETHICS_STAGE2_CASES.length),
        3: createReviewShift(ETHICS_STAGE3_CASES, ETHICS_STAGE3_CASES.length),
      } : undefined,
    );
    this.started = true;
    this.lastTickAt = performance.now();
    this.hudKey = "";
    this.uiKey = "";
    this.player.reset();
    this.visitor?.reset();
    this.controls?.cancelMovement();
    this.presentCase(true);
    this.updateView();
    if (practice) {
      // The practice form has landed: Midi explains the two stamps, then the
      // arrows point at them until the first stamp is pressed.
      this.tutorial = createEthicsReviewTutorial(this, this.stations);
      this.inputReadyAt = Number.POSITIVE_INFINITY;
      this.tutorial.start(() => { this.inputReadyAt = performance.now(); this.uiKey = ""; });
    }
  }

  private advanceClock() {
    if (!this.state || this.state.phase === "result") return;
    const now = performance.now();
    const previous = this.state;
    this.state = tickEthicsDelivery(previous, now - this.lastTickAt);
    this.lastTickAt = now;
    if (this.state.phase === "result") { this.finishShift(); return; }
    if (previous.phase === "feedback" && this.state.phase === "choosing") this.sendOffAndPresentNext();
  }

  /** The stamped form goes back to the visitor, then the next student steps up. */
  private sendOffAndPresentNext() {
    if (!this.form || !this.visitor) return;
    this.controls?.cancelMovement();
    this.stamp?.destroy(true);
    this.stamp = undefined;
    // Approved students pass on to the right; returned ones go back left.
    this.visitor.leave(this.lastVerdict === "approve" ? "right" : "left");
    this.inputReadyAt = performance.now() + DEPARTURE_GAP_MS + ARRIVAL_INPUT_DELAY_MS;
    // The next student steps up once the stamped form has left the desk. A
    // generation counter makes a stale completion (after restart) harmless.
    const generation = ++this.presentGeneration;
    const presentNext = () => {
      if (generation !== this.presentGeneration || this.arrived) return;
      this.arrived = true;
      this.presentCase(true);
    };
    this.arrived = false;
    playEthicsFormDeparture(this, this.form, presentNext);
    this.arrivalTimer?.remove(false);
    this.arrivalTimer = this.time.delayedCall(DEPARTURE_GAP_MS + 120, presentNext);
    this.uiKey = "";
  }

  private presentCase(animate: boolean) {
    if (!this.state || !this.form || !this.visitor || this.leaving) return;
    const item = getEthicsDeliveryCase(this.state);
    if (!item) return;
    const visitor = getEthicsDeliveryVisitor(this.state);
    this.stamp?.destroy(true);
    this.stamp = undefined;
    this.controls?.cancelMovement();
    this.player?.hideBubble();
    setEthicsReviewFormCase(this.form, item);
    this.visitor.enter(visitor);
    this.audio?.bell();
    this.player?.greet();
    playEthicsFormArrival(this, this.form, animate);
    this.inputReadyAt = performance.now() + (animate ? ARRIVAL_INPUT_DELAY_MS : 0);
    this.uiKey = "";
  }

  /** After the practice: the student leaves, 3-2-1, and the clock starts. */
  private startRealShift() {
    if (!this.started || this.leaving || !this.state) return;
    markTutorialSeen("ethics-review");
    if (this.replayingPractice) {
      this.scene.restart();
      return;
    }
    this.state = continueEthicsDelivery(this.state);
    this.visitor?.hideBubble();
    this.sendOffAndPresentNext();
    this.updateView();
    playCoachCountdown(this, () => {
      this.lastTickAt = performance.now();
      this.uiKey = "";
    });
  }

  private handleContinue() {
    if (!this.started || this.leaving || !this.state) return;
    if (!this.state.practice || this.state.phase !== "feedback") return;
    if (performance.now() < this.inputReadyAt) return;
    const wasCorrect = this.state.decision?.correct;
    this.state = continueEthicsDelivery(this.state);
    this.lastTickAt = performance.now();
    this.visitor?.hideBubble();
    if (wasCorrect) markTutorialSeen("ethics-review");
    if (wasCorrect && this.replayingPractice) {
      this.scene.restart();
      return;
    }
    if (wasCorrect) this.sendOffAndPresentNext();
    else this.presentCase(true);
    this.updateView();
  }

  private handleAction(action: EthicsDeliveryAction) {
    if (!this.started || this.leaving || !this.state || !this.player || !this.form || !this.visitor) return;
    if (isCoachCardOpen(this)) { this.controls?.cancelMovement(); return; }
    this.advanceClock();
    if (this.state.phase !== "choosing") { this.controls?.cancelMovement(); return; }
    const previous = this.state;
    this.state = actEthicsDelivery(previous, action);
    if (this.state === previous || !this.state.decision) { this.controls?.cancelMovement(); return; }
    const state = this.state;
    const decision = state.decision!;
    this.lastVerdict = decision.selected;
    const celebrate = !state.practice && decision.correct && isEthicsComboCelebration(state.combo);
    // Practice waits for the reader; the timed shift advances on its own clock.
    this.inputReadyAt = performance.now() + ETHICS_STAMP_IMPACT_MS + 500;
    this.player.react(decision.correct);
    this.tutorial?.notify("stamped");
    this.stamp = playEthicsVerdictStamp(this, decision, this.stations, this.form, () => {
      this.audio?.play(decision.correct);
      if (celebrate) this.audio?.cheer();
      // Only a good use, approved, makes the student beam; a rightly rejected
      // mistake gets a sheepish look and an apology.
      this.visitor?.react(decision.correct && decision.expected === "approve");
      const line = pickVisitorLine(decision.correct, decision.selected, state.caseIndex);
      if (line) this.visitor?.say(line, decision.correct ? 1_200 : 1_800);
      if (!decision.correct) this.player?.say(decision.explanation);
      // A right practice stamp: the "이제 진짜 심사 시작!" card, then 3-2-1.
      if (state.practice && decision.correct) {
        this.time.delayedCall(1_100, () => this.tutorial?.finish(() => this.startRealShift()));
      }
    }, { combo: state.combo, celebrate });
    this.uiKey = "";
    this.updateView();
  }

  private updateView() {
    if (!this.state || !this.form) return;
    const state = this.state;
    const pending = this.controls?.pendingAction;
    const ready = performance.now() >= this.inputReadyAt;
    const key = [state.phase, state.practice, state.caseIndex, pending, state.processedCount, ready].join("|");
    if (key !== this.uiKey) {
      showEthicsFormState(this.form, state, ready);
      setEthicsStationState(this.stations, state.phase === "choosing" && ready, pending);
      this.uiKey = key;
    }
    this.updateHud();
  }

  private updateHud() {
    if (!this.state || !this.hud) return;
    const state = this.state;
    const seconds = Math.ceil(state.remainingMs / 1000);
    const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    const values = [
      `손님 ${state.processedCount}명`, `${state.score.toLocaleString()}점`,
      `콤보 ${state.combo}`, state.practice ? "연습" : clock,
    ] as const;
    const key = values.join("|");
    if (key === this.hudKey) return;
    this.hud.setValues(values);
    this.hud.setValue(3, values[3], seconds <= 10 && !state.practice ? "#c8574a" : "#315567");
    this.hud.setValue(2, values[2], state.combo >= 3 ? "#d4792e" : "#315567");
    this.hudKey = key;
  }

  private finishShift() {
    if (!this.state || this.result || this.leaving) return;
    this.controls?.cancelMovement();
    this.arrivalTimer?.remove(false);
    this.stamp?.destroy(true);
    this.stamp = undefined;
    this.form?.continueButton.setVisible(false);
    this.visitor?.hideBubble();
    this.player?.hideBubble();
    setEthicsStationState(this.stations, false);
    const stars = getEthicsReviewStars(this.state.score);
    if (this.earnedStars === undefined || stars > this.earnedStars) this.earnedStars = stars;
    this.result = createEthicsResultOverlay(this, {
      stars, score: this.state.score, completedCount: this.state.completedCount,
      processedCount: this.state.processedCount, bestCombo: this.state.bestCombo,
      onBack: () => this.returnToWorld(), onReplay: () => this.startShift(),
    });
    this.updateHud();
  }

  private returnToWorld() {
    if (this.leaving) return;
    this.leaving = true;
    this.controls?.cancelMovement();
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => {
      this.scene.start(SCENE_KEYS.world, createWorldReturnSceneData("ethics-review", this.earnedStars));
    });
  }
}

function pickVisitorLine(correct: boolean, selected: EthicsDeliveryAction, index: number) {
  const lines: readonly string[] = ETHICS_VISITOR_LINES[`${selected}${correct ? "Right" : "Wrong"}` as const];
  return lines.length > 0 ? lines[index % lines.length] : undefined;
}
