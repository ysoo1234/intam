import Phaser from "phaser";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import { ETHICS_REVIEW_CASES } from "../content";
import {
  ETHICS_REVIEW_CONFIG,
  createReviewShift,
  evaluateReviewDecision,
  getEthicsReviewPoints,
  getNextEthicsReviewCombo,
  getEthicsReviewProgress,
  getEthicsReviewStars,
  type EthicsReviewCase,
  type EthicsReviewPhase,
  type EthicsVerdict,
} from "../model";
import { createEthicsReviewControls } from "./ethicsReviewControls";
import {
  celebrateEthicsResult,
  playEthicsCaseScan,
  playEthicsCountdown,
  playEthicsVerdictStamp,
  playEthicsStationEffect,
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
  createEthicsReviewHud,
  createEthicsReviewStations,
  preloadEthicsReviewAssets,
  setEthicsReviewDocumentCase,
  showDocumentEvidence,
  showEthicsReviewFeedback,
  type EthicsReviewDocumentView,
  type EthicsReviewFeedbackView,
  type EthicsReviewHud,
  type EthicsReviewStationView,
} from "./ethicsReviewView";
import {
  createEthicsBriefingOverlay,
  createEthicsResultOverlay,
} from "./ethicsReviewOverlays";

export class EthicsReviewScene extends Phaser.Scene {
  private phase: EthicsReviewPhase = "briefing";
  private deck: EthicsReviewCase[] = [];
  private caseIndex = 0;
  private completedCount = 0;
  private mistakeCount = 0;
  private score = 0;
  private combo = 0;
  private bestCombo = 0;
  private player?: EthicsReviewPlayer;
  private document?: EthicsReviewDocumentView;
  private feedback?: EthicsReviewFeedbackView;
  private hud?: EthicsReviewHud;
  private stations: readonly EthicsReviewStationView[] = [];
  private briefing?: Phaser.GameObjects.Container;
  private result?: Phaser.GameObjects.Container;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.ethicsReview);
  }

  preload() {
    preloadEthicsReviewAssets(this);
  }

  create() {
    this.resetSceneState();
    configureSceneCamera(this, this.renderScale);
    generatePlayerTexture(this);
    createEthicsOffice(this, () => this.returnToWorld());
    this.hud = createEthicsReviewHud(this);
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
      () => this.startFromBriefing(),
    );
    this.briefing = createEthicsBriefingOverlay(this, () =>
      this.startFromBriefing(),
    );
    this.setStationActivity(false);
  }

  private startFromBriefing() {
    if (this.phase !== "briefing") return;
    this.startShift();
  }

  private resetSceneState() {
    this.phase = "briefing";
    this.deck = [];
    this.caseIndex = 0;
    this.completedCount = 0;
    this.mistakeCount = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.player = undefined;
    this.document = undefined;
    this.feedback = undefined;
    this.hud = undefined;
    this.stations = [];
    this.briefing = undefined;
    this.result = undefined;
  }

  private get currentCase() {
    return this.deck[this.caseIndex];
  }

  private startShift() {
    this.briefing?.destroy(true);
    this.briefing = undefined;
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
    this.player?.container
      .setPosition(640, 584)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true);
    this.stations.forEach((station) => station.container.setAlpha(1));
    this.updateHud();
    playEthicsCountdown(this, () => this.introduceCurrentCase());
  }

  private introduceCurrentCase() {
    const reviewCase = this.currentCase;
    if (!reviewCase || !this.document || !this.feedback) {
      this.finishShift();
      return;
    }
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
        if (this.document) playEthicsCaseScan(this, this.document.container);
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
    }
    this.updateHud();
    this.hud?.promptText.setVisible(false);

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
        if (!this.document || !this.feedback || !this.currentCase) return;
        if (station) {
          playEthicsStationEffect(this, station, decision.correct, points);
        }
        playEthicsVerdictStamp(
          this,
          this.document.container,
          verdict,
          decision.correct,
        );
        showDocumentEvidence(this.document, this.currentCase);
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
    this.time.delayedCall(holdMs, () => {
      this.completedCount += 1;
      this.caseIndex += 1;
      this.updateHud();
      this.exitCurrentCase(verdict);
    });
  }

  private exitCurrentCase(verdict: EthicsVerdict) {
    if (!this.document) return;
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
        this.player?.container.setPosition(640, 584).setScale(1);
        if (this.caseIndex >= this.deck.length) {
          this.finishShift();
        } else {
          this.hud?.promptText.setVisible(true);
          this.introduceCurrentCase();
        }
      },
    });
  }

  private finishShift() {
    this.phase = "result";
    this.document?.container.setVisible(false);
    this.feedback?.container.setVisible(false);
    this.hud?.promptText.setVisible(false);
    this.player?.container.setVisible(false);
    this.stations.forEach((station) => station.container.setAlpha(0.35));
    const stars = getEthicsReviewStars(this.mistakeCount);
    celebrateEthicsResult(this, stars);
    this.result = createEthicsResultOverlay(this, {
      mistakes: this.mistakeCount,
      stars,
      score: this.score,
      bestCombo: this.bestCombo,
      onBack: () => this.returnToWorld(),
      onReplay: () => this.startShift(),
    });
  }

  private updateHud() {
    if (!this.hud) return;
    this.hud.progressText.setText(
      `심사 ${Math.min(this.completedCount + 1, ETHICS_REVIEW_CONFIG.roundCount)} / ${ETHICS_REVIEW_CONFIG.roundCount}`,
    );
    this.hud.mistakeText.setText(`놓친 판정 ${this.mistakeCount}`);
    this.hud.scoreText.setText(`신뢰 점수 ${this.score}`);
    this.hud.comboText.setText(this.combo > 1 ? `${this.combo}연속 판정 보너스` : "");
    const progress = getEthicsReviewProgress(
      this.completedCount,
      ETHICS_REVIEW_CONFIG.roundCount,
    );
    this.hud.progressFill.setDisplaySize(142 * progress, 7);
  }

  private updatePrompt() {
    this.hud?.promptText
      .setVisible(true)
      .setText("← 승인          → 보완 요청          화면의 판정 장치를 눌러도 돼요");
  }

  private setStationActivity(active: boolean) {
    setEthicsStationsReady(this, this.stations, active);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start(SCENE_KEYS.world));
  }
}
