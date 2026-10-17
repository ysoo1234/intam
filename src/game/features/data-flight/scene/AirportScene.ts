import Phaser from "phaser";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { recordActivityStars } from "../../../core/navigation/worldProgressStorage";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { preloadGameChromeAssets } from "../../../core/visual/gameChrome";
import { preloadGameResultOverlayAssets } from "../../../core/visual/gameResultOverlay";
import { createGameStartOverlay, isGameStartOverlayOpen, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import { isCoachCardOpen, playCoachCountdown, preloadCoachAssets } from "../../../core/visual/coachGuide";
import { markTutorialSeen, shouldPlayTutorial } from "../../../core/navigation/tutorialProgressStorage";
import { COLORS } from "../../../core/visual/theme";
import {
  FLIGHT_DATA_KINDS,
  FLIGHT_DATA_META,
  FLIGHT_QUESTIONS,
  type FlightDataKind,
  type FlightQuestion,
} from "../../../content/dataFlight";
import {
  DATA_FLIGHT_CONFIG,
  clampFrameDelta,
  decrementHeart,
  getCollectedDataScore,
  getCollectedDifficultyPoints,
  getDifficultyProfile,
  getDifficultyTier,
  getDataFlightStars,
  getObjectBaseSpeed,
  getObstacleSpawnIntervalBounds,
  isFeverActive,
  shouldSpawnEdgeObstacle,
  type ActiveFlightQuestion,
  type PublicDataKind,
} from "../model";
import {
  createAirportBurst,
  createAirportFeverSpark,
} from "./airportEffects";
import {
  createAirportControls,
  type AirportControls,
} from "./airportControls";
import { vibrateDevice } from "./airportFeedback";
import { createAirportFeverFormation } from "./airportFeverFormation";
import { playAirportSound } from "./airportSounds";
import { AIRPORT_FEVER_COLORS, AirportHud } from "./airportHud";
import { updateAirportPlayer } from "./airportPlayer";
import { createAirportResultOverlay } from "./airportResult";
import { DATA_FLIGHT_START, showAirportLevelUp, showAirportNotice } from "./airportOverlays";
import { createAirportTutorial, type AirportTutorial } from "./airportTutorial";
import { createAirportMissionBanner, createAirportQuestionOverlay } from "./airportQuestionView";
import { updateAirportObstacleMotion } from "./airportObjectMotion";
import { preloadAirportAssets, releaseAirportTextures } from "./airportTextures";
import { createAirportDataObject, createAirportEdgeObstacles, createAirportMovingObstacle } from "./airportObjects";
import { advanceAirportBackgroundTile, createAirportBackground, createAirportPlayer, type AirportPlayerView } from "./airportView";
import type { FlightObject } from "./flightObject";
export class AirportScene extends Phaser.Scene {
  private sky?: Phaser.GameObjects.TileSprite;
  private city?: Phaser.GameObjects.TileSprite;
  private ground?: Phaser.GameObjects.TileSprite;
  private player?: Phaser.GameObjects.Container;
  private reactPlayer?: AirportPlayerView["react"];
  private setPlayerFever?: AirportPlayerView["setFever"];
  private playerAura?: Phaser.GameObjects.Ellipse;
  private objects: FlightObject[] = [];
  private elapsedMs = 0;
  private remainingMs: number = DATA_FLIGHT_CONFIG.gameDurationMs;
  private countdownMs: number = DATA_FLIGHT_CONFIG.countdownMs;
  private nextDataAtMs: number = DATA_FLIGHT_CONFIG.firstDataAtMs;
  private nextObstacleAtMs: number = DATA_FLIGHT_CONFIG.firstObstacleAtMs;
  private nextQuestionAtMs: number = DATA_FLIGHT_CONFIG.questionIntervalMs;
  private feverUntilMs = 0;
  private invulnerableUntilMs = 0;
  private score = 0;
  private difficultyScore = 0;
  private difficultyTier = 0;
  private hearts: number = DATA_FLIGHT_CONFIG.initialHearts;
  private collected = 0;
  private correctAnswers = 0;
  private questionIndex = 0;
  private questions: FlightQuestion[] = [];
  private activeQuestion?: ActiveFlightQuestion;
  private questionOverlay?: Phaser.GameObjects.Container;
  private missionBanner?: Phaser.GameObjects.Container;
  private missionText?: Phaser.GameObjects.Text;
  private hud?: AirportHud;
  private nextFeverSparkAtMs = 0;
  private controls?: AirportControls;
  private failurePending = false;
  private finished = false;
  private earnedStars?: 0 | 1 | 2 | 3;
  /** Set while the first-play lesson runs; the clock and hearts wait for it. */
  private tutorial?: AirportTutorial;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.airport);
  }
  preload() {
    preloadAirportAssets(this);
    preloadGameChromeAssets(this);
    preloadGameResultOverlayAssets(this);
    preloadGameStartOverlayAssets(this);
    preloadCoachAssets(this);
  }
  create() {
    configureSceneCamera(this, this.renderScale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      releaseAirportTextures(this);
    });
    this.resetState();
    ({ sky: this.sky, city: this.city, ground: this.ground } =
      createAirportBackground(this));
    ({ player: this.player, playerAura: this.playerAura, react: this.reactPlayer, setFever: this.setPlayerFever } =
      createAirportPlayer(this));
    this.hud = new AirportHud(this, {
      onRestart: () => this.scene.restart(),
      onWorld: () => this.returnToWorld(),
      canPause: () => !this.finished,
    });
    this.controls = createAirportControls(this, () => this.finished, () => this.scene.restart());
    createGameStartOverlay(this, DATA_FLIGHT_START, (withTutorial) => this.handleStart(withTutorial), {
      help: { question: "튜토리얼을 다시 볼까요?" },
    });
    this.cameras.main.fadeIn(350, 220, 250, 255);
  }

  /** `withTutorial`: set by ? (then it ends on the start screen); else first plays only. */
  private handleStart(withTutorial?: boolean) {
    const replaying = withTutorial === true;
    const playTutorial = withTutorial ?? shouldPlayTutorial("data-flight");
    if (!playTutorial) return;
    this.countdownMs = 0;
    this.hud?.hideCountdown();
    this.tutorial = createAirportTutorial(
      this,
      {
        getPlayer: () => this.player,
        spawnData: (kind, x, y) => this.spawnData(kind, x, y),
        spawnObstacle: () => this.objects.push(createAirportMovingObstacle(this, 0)),
        startQuestion: (question, readingMs) => this.startQuestion(question, readingMs),
        resendChoices: (question) => this.sendQuestionChoices({ question, phase: "choices", readingUntilMs: this.elapsedMs }),
        getChoices: () => this.objects.filter((object) => object.kind === "question" && object.dataKind)
          .map((object) => ({ kind: object.dataKind!, x: object.container.x, y: object.container.y })),
        clearObjects: () => this.clearObjects(),
      },
      () => {
        markTutorialSeen("data-flight");
        this.tutorial = undefined;
        if (replaying) { this.scene.restart(); return; }
        this.resetForRealGame();
        playCoachCountdown(this, () => this.renderHud());
      },
    );
  }

  /** After the lesson: a clean slate, without the HUD countdown (3-2-1 already played). */
  private resetForRealGame() {
    this.clearObjects();
    this.questionOverlay?.destroy(true);
    this.missionBanner?.destroy(true);
    const controls = this.controls;
    this.resetState();
    this.controls = controls;
    this.countdownMs = 0;
    this.hud?.hideFever();
    this.renderHud();
  }
  private resetState() {
    this.earnedStars = undefined;
    this.objects = [];
    this.elapsedMs = 0;
    this.remainingMs = DATA_FLIGHT_CONFIG.gameDurationMs;
    this.countdownMs = DATA_FLIGHT_CONFIG.countdownMs;
    this.nextDataAtMs = DATA_FLIGHT_CONFIG.firstDataAtMs;
    this.nextObstacleAtMs = DATA_FLIGHT_CONFIG.firstObstacleAtMs;
    this.nextQuestionAtMs = DATA_FLIGHT_CONFIG.questionIntervalMs;
    this.feverUntilMs = 0;
    this.invulnerableUntilMs = 0;
    this.score = 0;
    this.difficultyScore = 0;
    this.difficultyTier = 0;
    this.hearts = DATA_FLIGHT_CONFIG.initialHearts;
    this.collected = 0;
    this.correctAnswers = 0;
    this.questionIndex = 0;
    this.questions = Phaser.Utils.Array.Shuffle([...FLIGHT_QUESTIONS]);
    this.activeQuestion = undefined;
    this.questionOverlay = undefined;
    this.missionBanner = undefined;
    this.missionText = undefined;
    this.controls = undefined;
    this.nextFeverSparkAtMs = 0;
    this.failurePending = false;
    this.finished = false;
  }

  private spawnData(
    dataKind = Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS),
    x = 1350,
    y = Phaser.Math.Between(135, 615),
    questionChoice = false,
    publicData = false,
    publicDataKind?: PublicDataKind,
    showLabel = true,
  ) {
    this.objects.push(
      createAirportDataObject(this, {
        dataKind,
        x,
        y,
        questionChoice,
        publicData,
        publicDataKind,
        showLabel,
      }),
    );
  }

  private spawnFeverFormation() {
    const formation = createAirportFeverFormation();
    formation.forEach(({ publicDataKind, x, y, showLabel }) => {
      this.spawnData(
        undefined,
        x,
        y,
        false,
        true,
        publicDataKind,
        showLabel,
      );
    });
  }

  private spawnObstacle() {
    const edgeObstacle = shouldSpawnEdgeObstacle(
      this.difficultyScore,
      Phaser.Math.FloatBetween(0, 1),
    );
    const obstacles = edgeObstacle
      ? createAirportEdgeObstacles(this, this.difficultyScore)
      : [createAirportMovingObstacle(this, this.difficultyScore)];
    this.objects.push(...obstacles);
  }

  private addScore(points: number, difficultyPoints = points) {
    const previousTier = this.difficultyTier;
    this.score += points;
    this.difficultyScore += difficultyPoints;
    this.difficultyTier = getDifficultyTier(this.difficultyScore);
    if (this.difficultyTier <= previousTier) return;
    showAirportLevelUp(this, this.difficultyTier + 1);
  }

  private startQuestion(
    question: FlightQuestion = this.questions[this.questionIndex % this.questions.length] ?? FLIGHT_QUESTIONS[0],
    readingMs: number = DATA_FLIGHT_CONFIG.questionReadingMs,
  ) {
    this.questionIndex += 1;
    this.nextQuestionAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.questionIntervalMs;
    this.clearObjects();
    this.activeQuestion = {
      question,
      phase: "reading",
      readingUntilMs: this.elapsedMs + readingMs,
    };

    this.questionOverlay = createAirportQuestionOverlay(this, question, readingMs);
    playAirportSound(this, "question");
  }

  private releaseQuestionChoices() {
    const active = this.activeQuestion;
    if (!active || active.phase !== "reading") return;
    active.phase = "choices";
    this.questionOverlay?.destroy(true);
    this.questionOverlay = undefined;
    this.sendQuestionChoices(active);
  }

  /** The four answers fly in, with the question kept in view above them. */
  private sendQuestionChoices(active: ActiveFlightQuestion) {
    this.activeQuestion = active;
    const order = Phaser.Utils.Array.Shuffle([...FLIGHT_DATA_KINDS]);
    const ys = [165, 295, 425, 555];
    order.forEach((kind, index) => {
      this.spawnData(kind, 1390 + index * 28, ys[index], true);
    });

    const banner = createAirportMissionBanner(this, active.question.prompt);
    this.missionText = banner.text;
    this.missionBanner = banner.container;
  }

  private resolveQuestion(selected?: FlightDataKind) {
    const active = this.activeQuestion;
    if (!active || active.phase !== "choices") return;
    const correct = selected === active.question.answer;
    this.clearObjects();
    this.missionBanner?.destroy(true);
    this.missionBanner = undefined;
    this.missionText = undefined;
    this.activeQuestion = undefined;

    if (selected) playAirportSound(this, correct ? "correct" : "wrong");
    if (this.tutorial) {
      // The lesson explains the outcome itself; no hearts or fever here.
      if (!correct && selected) this.reactPlayer?.("ouch");
      this.tutorial.notify(correct ? "question-correct" : selected ? "question-wrong" : "question-missed");
      return;
    }

    if (!selected) {
      showAirportNotice(this, "데이터를 놓쳤어요!", "다음 문제에 다시 도전해요.", 0xf5bd46);
      this.nextDataAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.questionMissDataDelayMs;
      this.nextObstacleAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.questionMissObstacleDelayMs;
      return;
    }

    if (!correct) {
      this.reactPlayer?.("ouch");
      this.hearts = decrementHeart(this.hearts);
      this.invulnerableUntilMs = this.elapsedMs + DATA_FLIGHT_CONFIG.invulnerabilityMs;
      this.renderHud();
      this.cameras.main.shake(180, 0.006);
      vibrateDevice([35, 45, 35]);
      showAirportNotice(
        this,
        "앗, 다른 데이터예요!",
        active.question.explanation,
        COLORS.danger,
      );
      if (this.hearts <= 0) {
        this.failurePending = true;
        this.time.delayedCall(
          DATA_FLIGHT_CONFIG.failedQuestionFinishDelayMs,
          () => this.finishGame(false),
        );
        return;
      }
      this.nextDataAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.wrongAnswerDataDelayMs;
      this.nextObstacleAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.wrongAnswerObstacleDelayMs;
      return;
    }

    this.correctAnswers += 1;
    this.addScore(DATA_FLIGHT_CONFIG.correctAnswerScore);
    this.feverUntilMs = this.elapsedMs + DATA_FLIGHT_CONFIG.feverDurationMs;
    this.invulnerableUntilMs = this.feverUntilMs;
    this.nextDataAtMs = this.elapsedMs;
    this.nextObstacleAtMs =
      this.feverUntilMs + DATA_FLIGHT_CONFIG.feverObstacleResumeDelayMs;
    showAirportNotice(
      this,
      "정답! 공공데이터 피버!",
      active.question.explanation,
      COLORS.mint,
    );
    this.cameras.main.flash(260, 180, 255, 245);
    createAirportBurst(
      this,
      this.player?.x ?? 220,
      this.player?.y ?? 360,
      COLORS.yellow,
    );
    vibrateDevice(35);
    this.renderHud();
  }

  private updateFlightObjects(deltaMs: number) {
    if (!this.player) return;
    const fever = isFeverActive(this.elapsedMs, this.feverUntilMs);
    this.setPlayerFever?.(fever);
    const deltaSeconds = deltaMs / 1000;
    const playerX = this.player.x + 20;
    const playerY = this.player.y;
    const survivors: FlightObject[] = [];

    this.objects.forEach((object) => {
      const baseSpeed = getObjectBaseSpeed(object.kind, this.difficultyScore);
      object.container.x -=
        baseSpeed *
        (fever ? DATA_FLIGHT_CONFIG.feverObjectSpeedMultiplier : 1) *
        deltaSeconds;
      object.container.angle += object.spin * deltaSeconds;

      updateAirportObstacleMotion(object, this.elapsedMs);

      if (fever && object.kind === "data") {
        const magnetDistance = Math.hypot(
          (object.container.x - playerX) /
            DATA_FLIGHT_CONFIG.feverMagnetRadius,
          (object.container.y - playerY) /
            DATA_FLIGHT_CONFIG.feverMagnetVerticalRadius,
        );
        if (magnetDistance < 1) {
          const pull = Phaser.Math.Clamp(
            1 - magnetDistance,
            0.08,
            0.72,
          );
          object.container.x = Phaser.Math.Linear(
            object.container.x,
            playerX,
            pull * deltaSeconds * 8,
          );
          object.container.y = Phaser.Math.Linear(
            object.container.y,
            playerY,
            pull * deltaSeconds * 8,
          );
        }
      }

      const distance = Phaser.Math.Distance.Between(
        object.container.x,
        object.container.y,
        playerX,
        playerY,
      );
      const collides =
        object.collisionRadiusX !== undefined &&
        object.collisionRadiusY !== undefined
          ? Math.abs(object.container.x - playerX) <
              object.collisionRadiusX + DATA_FLIGHT_CONFIG.playerCollisionRadius &&
            Math.abs(object.container.y - playerY) <
              object.collisionRadiusY + DATA_FLIGHT_CONFIG.playerCollisionRadius
          : distance < object.radius + DATA_FLIGHT_CONFIG.playerCollisionRadius;
      if (collides) {
        if (object.kind === "data") {
          this.collectData(object);
          return;
        }
        if (object.kind === "question") {
          this.resolveQuestion(object.dataKind);
          return;
        }
        if (
          object.kind === "obstacle" &&
          this.elapsedMs >= this.invulnerableUntilMs &&
          !fever
        ) {
          this.hitObstacle(object);
          return;
        }
      }

      if (object.container.x < DATA_FLIGHT_CONFIG.objectRemovalX) {
        object.container.destroy(true);
        if (object.kind === "obstacle") this.tutorial?.notify("obstacle-passed");
        return;
      }
      survivors.push(object);
    });
    this.objects = survivors.filter((object) => object.container.active);

    if (
      this.activeQuestion?.phase === "choices" &&
      !this.objects.some((object) => object.kind === "question")
    ) {
      this.resolveQuestion();
    }
  }

  private collectData(object: FlightObject) {
    const fever = isFeverActive(this.elapsedMs, this.feverUntilMs);
    this.addScore(getCollectedDataScore(fever), getCollectedDifficultyPoints());
    this.collected += 1;
    playAirportSound(this, fever ? "feverCollect" : "collect");
    createAirportBurst(
      this,
      object.container.x,
      object.container.y,
      FLIGHT_DATA_META[object.dataKind ?? "doc"].color,
    );
    this.tweens.add({
      targets: object.container,
      x: (this.player?.x ?? 220) + 20,
      y: this.player?.y ?? 360,
      scale: 0.2,
      alpha: 0,
      duration: 130,
      ease: "Quad.easeIn",
      onComplete: () => object.container.destroy(true),
    });
    this.renderHud();
    this.tutorial?.notify("collected");
  }

  private hitObstacle(object: FlightObject) {
    this.reactPlayer?.("ouch");
    playAirportSound(this, "bump");
    if (this.tutorial) {
      // A bump in the lesson stings but costs nothing.
      this.cameras.main.shake(170, 0.006);
      createAirportBurst(this, object.container.x, object.container.y, COLORS.danger);
      object.container.destroy(true);
      this.tutorial.notify("obstacle-hit");
      return;
    }
    this.hearts = decrementHeart(this.hearts);
    this.invulnerableUntilMs = this.elapsedMs + DATA_FLIGHT_CONFIG.invulnerabilityMs;
    this.cameras.main.shake(170, 0.006);
    vibrateDevice([35, 45, 35]);
    createAirportBurst(
      this,
      object.container.x,
      object.container.y,
      COLORS.danger,
    );
    object.container.destroy(true);
    this.renderHud();

    if (this.hearts <= 0) this.finishGame(false);
  }

  private clearObjects() {
    this.objects.forEach((object) => object.container.destroy(true));
    this.objects = [];
  }

  private renderHud() {
    this.hud?.render({
      score: this.score,
      hearts: this.hearts,
      remainingMs: this.remainingMs,
      elapsedMs: this.elapsedMs,
      feverUntilMs: this.feverUntilMs,
      difficultyTier: this.difficultyTier,
    });
  }

  private finishGame(completed: boolean) {
    if (this.finished) return;
    this.failurePending = false;
    this.finished = true;
    this.earnedStars = getDataFlightStars(this.score);
    // Saved right away: a replay that does worse must not lose these stars.
    recordActivityStars(this.registry, "data-flight", this.earnedStars);
    if (this.controls) this.controls.pointer.active = false;
    this.clearObjects();
    this.activeQuestion = undefined;
    this.questionOverlay?.destroy(true);
    this.missionBanner?.destroy(true);
    this.hud?.hideFever();
    this.cameras.main.setZoom(this.renderScale);

    createAirportResultOverlay(this, {
      completed,
      score: this.score,
      collected: this.collected,
      correctAnswers: this.correctAnswers,
      stars: this.earnedStars,
      onRetry: () => this.scene.restart(),
      onWorld: () => this.returnToWorld(),
    });
    if (completed) this.cameras.main.flash(250, 255, 248, 205);
  }

  private returnToWorld() {
    if (!this.scene.isActive()) return;
    this.cameras.main.fadeOut(220, 230, 250, 255);
    this.time.delayedCall(220, () => this.scene.start(
      SCENE_KEYS.world,
      createWorldReturnSceneData("data-flight", this.earnedStars),
    ));
  }

  update(_time: number, delta: number) {
    if (isGameStartOverlayOpen(this) || isCoachCardOpen(this)) return;
    const safeDelta = clampFrameDelta(delta);
    const difficultyProfile = getDifficultyProfile(this.difficultyScore);
    const speedMultiplier =
      difficultyProfile.scenerySpeedMultiplier *
      (isFeverActive(this.elapsedMs, this.feverUntilMs) && !this.finished
        ? 1.25
        : 1);
    if (this.sky) advanceAirportBackgroundTile(this.sky, 16 * speedMultiplier * (safeDelta / 1000));
    if (this.city) advanceAirportBackgroundTile(this.city, 65 * speedMultiplier * (safeDelta / 1000));
    if (this.ground) advanceAirportBackgroundTile(this.ground, 249 * speedMultiplier * (safeDelta / 1000));

    if (this.finished) return;
    if (this.tutorial) {
      this.updateTutorial(safeDelta);
      return;
    }
    if (this.countdownMs > 0) {
      this.countdownMs -= safeDelta;
      const count = Math.max(1, Math.ceil(this.countdownMs / 1000));
      this.hud?.setCountdown(count);
      if (this.countdownMs <= 0) this.hud?.completeCountdown();
      updateAirportPlayer(this.player, this.controls, this.finished, safeDelta);
      return;
    }

    this.elapsedMs += safeDelta;
    this.remainingMs = Math.max(0, this.remainingMs - safeDelta);
    if (this.failurePending) {
      this.renderHud();
      return;
    }
    updateAirportPlayer(this.player, this.controls, this.finished, safeDelta);

    const fever = isFeverActive(this.elapsedMs, this.feverUntilMs);
    this.cameras.main.setZoom(
      this.renderScale * (fever ? 1 + Math.sin(this.elapsedMs / 95) * 0.008 : 1),
    );
    if (fever && this.elapsedMs >= this.nextFeverSparkAtMs) {
      createAirportFeverSpark(
        this,
        this.player,
        this.elapsedMs,
        AIRPORT_FEVER_COLORS,
      );
      this.nextFeverSparkAtMs = this.elapsedMs + 58;
    }
    if (this.player) {
      const targetScale = fever ? 1.18 : 1;
      this.player.setScale(
        Phaser.Math.Linear(this.player.scaleX, targetScale, 0.1),
      );
    }
    if (this.playerAura) {
      this.playerAura.setAlpha(fever ? 0.55 : 0);
      this.playerAura.setScale(
        1 + Math.sin(this.elapsedMs / 120) * (fever ? 0.12 : 0),
      );
    }

    const firstQuestionReady =
      this.questionIndex === 0 &&
      this.score >= DATA_FLIGHT_CONFIG.firstQuestionScore;
    const laterQuestionReady =
      this.questionIndex > 0 && this.elapsedMs >= this.nextQuestionAtMs;
    const questionFits = this.remainingMs >= DATA_FLIGHT_CONFIG.lastQuestionWindowMs;
    if (!this.activeQuestion && !fever && questionFits && (firstQuestionReady || laterQuestionReady)) {
      this.startQuestion();
    }
    if (
      this.activeQuestion?.phase === "reading" &&
      this.elapsedMs >= this.activeQuestion.readingUntilMs
    ) {
      this.releaseQuestionChoices();
    }

    if (!this.activeQuestion) {
      if (this.elapsedMs >= this.nextDataAtMs) {
        if (fever) {
          this.spawnFeverFormation();
          this.nextDataAtMs = this.elapsedMs + DATA_FLIGHT_CONFIG.feverFormationIntervalMs;
        } else {
          this.spawnData();
          this.nextDataAtMs =
            this.elapsedMs +
            Phaser.Math.Between(
              DATA_FLIGHT_CONFIG.dataSpawnInterval.minMs,
              DATA_FLIGHT_CONFIG.dataSpawnInterval.maxMs,
            );
        }
      }
      if (!fever && this.elapsedMs >= this.nextObstacleAtMs) {
        this.spawnObstacle();
        const intervalBounds = getObstacleSpawnIntervalBounds(
          this.difficultyScore,
        );
        this.nextObstacleAtMs =
          this.elapsedMs +
          Phaser.Math.Between(
            intervalBounds.min,
            intervalBounds.max,
          );
      }
    }

    this.updateFlightObjects(safeDelta);
    this.renderHud();
    if (this.remainingMs <= 0) this.finishGame(true);
  }

  /** The lesson's frame: Midi flies, the tutorial spawns, the clock stands still. */
  private updateTutorial(safeDelta: number) {
    const tutorial = this.tutorial;
    if (!tutorial) return;
    this.elapsedMs += safeDelta;
    if (!tutorial.isWaiting()) updateAirportPlayer(this.player, this.controls, this.finished, safeDelta);
    tutorial.update(safeDelta);
    if (
      this.activeQuestion?.phase === "reading" &&
      this.elapsedMs >= this.activeQuestion.readingUntilMs
    ) {
      this.releaseQuestionChoices();
    }
    this.updateFlightObjects(safeDelta);
    this.renderHud();
  }
}
