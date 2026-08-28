import Phaser from "phaser";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import { createGameStartOverlay, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import {
  createGameStatusHud,
  createVillageReturnButton,
  preloadGameChromeAssets,
  type GameStatusHud,
} from "../../../core/visual/gameChrome";
import { ETHICS_REVIEW_CASES } from "../content";
import {
  ETHICS_REVIEW_CONFIG,
  createReviewShift,
  evaluateReviewDecision,
  getEthicsReviewPoints,
  getNextEthicsReviewCombo,
  getEthicsReviewStars,
  type EthicsReviewCase,
  type EthicsReviewEndReason,
  type EthicsReviewPhase,
  type EthicsVerdict,
} from "../model";
import { createEthicsReviewControls } from "./ethicsReviewControls";
import {
  celebrateEthicsResult,
  playEthicsCaseScan,
  playEthicsCountdown,
  playEthicsStationEffect,
  playEthicsVerdictStamp,
  setEthicsStationsReady,
} from "./ethicsReviewEffects";
import {
  createEthicsReviewPlayer,
  type EthicsReviewPlayer,
} from "./ethicsReviewPlayer";
import {
  createEthicsOffice,
  createEthicsReviewDocument,
  createEthicsReviewFeedback,
  createEthicsReviewPrompt,
  createEthicsReviewStations,
  preloadEthicsReviewAssets,
  setEthicsReviewDocumentCase,
  showDocumentEvidence,
  showEthicsReviewFeedback,
  type EthicsReviewDocumentView,
  type EthicsReviewFeedbackView,
  type EthicsReviewStationView,
} from "./ethicsReviewView";
import { createEthicsResultOverlay } from "./ethicsReviewOverlays";

const ETHICS_REVIEW_START = { placeName: "윤리 심사소", playDescription: "사건 내용을 읽고 AI가 책임 있게 쓰였는지 승인 또는 보완 요청을 골라요." } as const;

export class EthicsReviewScene extends Phaser.Scene {
  private phase: EthicsReviewPhase = "briefing";
  private deck: EthicsReviewCase[] = [];
  private caseIndex = 0;
  private completedCount = 0;
  private mistakeCount = 0;
  private score = 0;
  private combo = 0;
  private bestCombo = 0;
  private lives: number = ETHICS_REVIEW_CONFIG.startingLives;
  private remainingMs: number = ETHICS_REVIEW_CONFIG.durationMs;
  private runId = 0;
  private leaving = false;
  private advanceTimer?: Phaser.Time.TimerEvent;
  private player?: EthicsReviewPlayer;
  private document?: EthicsReviewDocumentView;
  private feedback?: EthicsReviewFeedbackView;
  private hud?: GameStatusHud;
  private promptText?: Phaser.GameObjects.Text;
  private stations: readonly EthicsReviewStationView[] = [];
  private result?: Phaser.GameObjects.Container;
  private earnedStars?: 1 | 2 | 3;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.ethicsReview);
  }

  preload() {
    preloadGameChromeAssets(this);
    preloadGameStartOverlayAssets(this);
    preloadEthicsReviewAssets(this);
  }

  create() {
    this.resetSceneState();
    configureSceneCamera(this, this.renderScale);
    generatePlayerTexture(this);
    createEthicsOffice(this);
    createVillageReturnButton(this, () => this.returnToWorld(), { depth: 110 });
    this.hud = createGameStatusHud(this, this.getHudValues(), { depth: 110 });
    this.promptText = createEthicsReviewPrompt(this);
    this.document = createEthicsReviewDocument(this);
    this.feedback = createEthicsReviewFeedback(this, this.document.container);
    this.stations = createEthicsReviewStations(this, (verdict) =>
      this.chooseVerdict(verdict),
    );
    this.player = createEthicsReviewPlayer(this);
    createEthicsReviewControls(
      this,
      () => this.returnToWorld(),
      (verdict) => this.chooseVerdict(verdict),
      () => {},
    );
    createGameStartOverlay(this, ETHICS_REVIEW_START, () => this.startShift());
    this.setStationActivity(false);
    this.updateHud();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.runId += 1;
      this.cancelAdvanceTimer();
    });
  }

  update(_time: number, delta: number) {
    if (
      !this.isTimedGameplayPhase() ||
      this.lives <= 0 ||
      (this.deck.length > 0 && this.completedCount >= this.deck.length) ||
      this.remainingMs <= 0
    ) {
      return;
    }
    const secondsBefore = Math.ceil(this.remainingMs / 1000);
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, delta));
    const secondsAfter = Math.ceil(this.remainingMs / 1000);
    if (secondsAfter !== secondsBefore) {
      this.hud?.setValue(3, this.formatRemainingTime());
    }
    if (this.remainingMs <= 0 && this.phase !== "feedback") {
      this.finishShift("time");
    }
  }

  private resetSceneState() {
    this.earnedStars = undefined;
    this.runId += 1;
    this.cancelAdvanceTimer();
    this.phase = "briefing";
    this.deck = [];
    this.caseIndex = 0;
    this.completedCount = 0;
    this.mistakeCount = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lives = ETHICS_REVIEW_CONFIG.startingLives;
    this.remainingMs = ETHICS_REVIEW_CONFIG.durationMs;
    this.leaving = false;
    this.player = undefined;
    this.document = undefined;
    this.feedback = undefined;
    this.hud = undefined;
    this.promptText = undefined;
    this.stations = [];
    this.result = undefined;
  }

  private get currentCase() {
    return this.deck[this.caseIndex];
  }

  private startShift() {
    this.earnedStars = undefined;
    if (this.leaving) return;
    this.cancelAdvanceTimer();
    const runId = ++this.runId;
    this.phase = "countdown";
    this.result?.destroy(true);
    this.result = undefined;
    this.deck = createReviewShift(
      ETHICS_REVIEW_CASES,
      ETHICS_REVIEW_CONFIG.roundCount,
    );
    this.caseIndex = 0;
    this.completedCount = 0;
    this.mistakeCount = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lives = ETHICS_REVIEW_CONFIG.startingLives;
    this.remainingMs = ETHICS_REVIEW_CONFIG.durationMs;
    this.document?.container.setVisible(false);
    this.feedback?.container.setVisible(false);
    this.player?.container
      .setPosition(640, 584)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true);
    this.setStationActivity(false);
    this.promptText?.setVisible(true).setText("곧 심사가 시작돼요");
    this.updateHud();
    playEthicsCountdown(this, () => {
      if (!this.isCurrentRun(runId, "countdown")) return;
      this.introduceCurrentCase(runId);
    });
  }

  private introduceCurrentCase(runId: number) {
    const reviewCase = this.currentCase;
    if (!reviewCase || !this.document || !this.feedback) {
      this.finishShift("cases");
      return;
    }
    if (runId !== this.runId || this.phase === "result") return;
    this.phase = "entering";
    this.setStationActivity(false);
    this.feedback.container.setVisible(false);
    this.player?.container.setPosition(640, 584).setScale(1).setAlpha(1);
    setEthicsReviewDocumentCase(this.document, reviewCase, this.caseIndex + 1);
    this.document.container
      .setPosition(640, -210)
      .setScale(0.92)
      .setRotation(0.025)
      .setAlpha(0)
      .setDepth(45)
      .setVisible(true);
    this.tweens.add({
      targets: this.document.container,
      y: 272,
      scale: 1,
      alpha: 1,
      rotation: -0.008,
      duration: 480,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!this.isCurrentRun(runId, "entering") || !this.document) return;
        playEthicsCaseScan(this, this.document.container);
        this.phase = "reviewing";
        this.setStationActivity(true);
        this.updatePrompt();
      },
    });
  }

  private chooseVerdict(verdict: EthicsVerdict) {
    if (
      this.phase !== "reviewing" ||
      !this.currentCase ||
      !this.player ||
      !this.document ||
      !this.feedback
    ) {
      return;
    }
    const reviewCase = this.currentCase;
    const runId = this.runId;
    this.phase = "feedback";
    this.setStationActivity(false);
    const decision = evaluateReviewDecision(this.currentCase, verdict);
    const points = getEthicsReviewPoints(decision, this.combo);
    this.combo = getNextEthicsReviewCombo(this.combo, decision.correct);
    if (decision.correct) {
      this.score += points;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
    } else {
      this.mistakeCount += 1;
      this.lives = Math.max(0, this.lives - 1);
    }
    this.completedCount += 1;
    this.caseIndex += 1;
    this.updateHud();
    this.promptText?.setVisible(false);

    const station = this.stations.find((candidate) => candidate.verdict === verdict);
    const targetX = ETHICS_REVIEW_CONFIG.stations[verdict].x;
    this.tweens.add({
      targets: this.player.container,
      x: targetX,
      y: 594,
      scale: 1.12,
      duration: 280,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (
          !this.isCurrentRun(runId, "feedback") ||
          !this.document ||
          !this.feedback
        ) {
          return;
        }
        if (station) {
          playEthicsStationEffect(this, station, decision.correct, points);
        }
        playEthicsVerdictStamp(
          this,
          this.document.container,
          verdict,
          decision.correct,
        );
        showDocumentEvidence(this.document, reviewCase);
        this.document.questionText.setVisible(false);
        showEthicsReviewFeedback(this.feedback, decision, points, this.combo);
      },
    });
    this.tweens.add({
      targets: this.document.container,
      x: 640 + (verdict === "approve" ? -34 : 34),
      rotation: verdict === "approve" ? -0.025 : 0.025,
      duration: 280,
      ease: "Cubic.easeInOut",
    });

    const holdMs = decision.correct
      ? ETHICS_REVIEW_CONFIG.feedbackHoldMs.correct
      : ETHICS_REVIEW_CONFIG.feedbackHoldMs.retry;
    this.advanceTimer = this.time.delayedCall(holdMs, () => {
      this.advanceTimer = undefined;
      if (!this.isCurrentRun(runId, "feedback")) return;
      if (this.remainingMs <= 0) {
        this.finishShift("time");
      } else if (this.lives <= 0) {
        this.finishShift("lives");
      } else {
        this.exitCurrentCase(verdict, runId);
      }
    });
  }

  private exitCurrentCase(verdict: EthicsVerdict, runId: number) {
    if (!this.document || !this.isCurrentRun(runId, "feedback")) return;
    this.phase = "exiting";
    this.feedback?.container.setVisible(false);
    this.tweens.add({
      targets: this.document.container,
      x: verdict === "approve" ? -260 : 1540,
      y: 236,
      scale: 0.72,
      alpha: 0,
      rotation: verdict === "approve" ? -0.16 : 0.16,
      duration: 420,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.isCurrentRun(runId, "exiting")) return;
        this.player?.container.setPosition(640, 584).setScale(1);
        if (this.caseIndex >= this.deck.length) {
          this.finishShift("cases");
        } else {
          this.promptText?.setVisible(true);
          this.introduceCurrentCase(runId);
        }
      },
    });
  }

  private finishShift(endReason: EthicsReviewEndReason) {
    if (this.phase === "result" || this.leaving) return;
    this.cancelAdvanceTimer();
    this.phase = "result";
    if (this.document) this.tweens.killTweensOf(this.document.container);
    if (this.player) this.tweens.killTweensOf(this.player.container);
    this.setStationActivity(false);
    this.document?.container.setVisible(false);
    this.feedback?.container.setVisible(false);
    this.promptText?.setVisible(false);
    this.player?.container.setVisible(false);
    this.stations.forEach((station) => station.container.setAlpha(0.35));
    this.updateHud();
    const correctCount = this.completedCount - this.mistakeCount;
    const stars = endReason === "lives" ? 1 : getEthicsReviewStars(correctCount);
    this.earnedStars = stars;
    celebrateEthicsResult(this, stars);
    this.result?.destroy(true);
    this.result = createEthicsResultOverlay(this, {
      stars,
      score: this.score,
      bestCombo: this.bestCombo,
      correctCount,
      reviewedCount: this.completedCount,
      lives: this.lives,
      endReason,
      onBack: () => this.returnToWorld(),
      onReplay: () => this.startShift(),
    });
  }

  private updateHud() {
    this.hud?.setValues(this.getHudValues());
  }

  private getHudValues(): [string, string, string, string] {
    const hearts = Array.from(
      { length: ETHICS_REVIEW_CONFIG.startingLives },
      (_, index) => (index < this.lives ? "♥" : "♡"),
    ).join(" ");
    return [
      `심사 ${this.completedCount}개`,
      `${this.score}점`,
      hearts,
      this.formatRemainingTime(),
    ];
  }

  private formatRemainingTime() {
    const seconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  private updatePrompt() {
    this.promptText
      ?.setVisible(true)
      .setText("← 승인          → 보완 요청          화면의 판정 장치를 눌러도 돼요");
  }

  private isTimedGameplayPhase() {
    return (
      this.phase === "entering" ||
      this.phase === "reviewing" ||
      this.phase === "feedback" ||
      this.phase === "exiting"
    );
  }

  private isCurrentRun(runId: number, phase: EthicsReviewPhase) {
    return runId === this.runId && this.phase === phase && !this.leaving;
  }

  private cancelAdvanceTimer() {
    this.advanceTimer?.remove(false);
    this.advanceTimer = undefined;
  }

  private setStationActivity(active: boolean) {
    setEthicsStationsReady(this, this.stations, active);
  }

  private returnToWorld() {
    if (this.leaving) return;
    this.leaving = true;
    this.phase = "result";
    this.cancelAdvanceTimer();
    this.setStationActivity(false);
    const navigationId = ++this.runId;
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => {
      if (navigationId !== this.runId) return;
      this.scene.start(
        SCENE_KEYS.world,
        createWorldReturnSceneData("ethics-review", this.earnedStars),
      );
    });
  }
}
