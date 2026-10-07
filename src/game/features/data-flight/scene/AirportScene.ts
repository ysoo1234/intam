import Phaser from "phaser";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { preloadGameChromeAssets } from "../../../core/visual/gameChrome";
import { preloadGameResultOverlayAssets } from "../../../core/visual/gameResultOverlay";
import { createGameStartOverlay, isGameStartOverlayOpen, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
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
import { AIRPORT_FEVER_COLORS, AirportHud } from "./airportHud";
import { updateAirportPlayer } from "./airportPlayer";
import { createAirportResultOverlay } from "./airportResult";
import { DATA_FLIGHT_START, showAirportLevelUp, showAirportNotice } from "./airportOverlays";
import { updateAirportObstacleMotion } from "./airportObjectMotion";
import { preloadAirportAssets, releaseAirportTextures } from "./airportTextures";
import { createAirportDataObject, createAirportEdgeObstacles, createAirportMovingObstacle } from "./airportObjects";
import { advanceAirportBackgroundTile, createAirportBackground, createAirportPlayer } from "./airportView";
import type { FlightObject } from "./flightObject";
export class AirportScene extends Phaser.Scene {
  private sky?: Phaser.GameObjects.TileSprite;
  private city?: Phaser.GameObjects.TileSprite;
  private ground?: Phaser.GameObjects.TileSprite;
  private player?: Phaser.GameObjects.Container;
  private playerArt?: Phaser.GameObjects.Image;
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
  private earnedStars?: 1 | 2 | 3;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.airport);
  }
  preload() {
    preloadAirportAssets(this);
    preloadGameChromeAssets(this);
    preloadGameResultOverlayAssets(this);
    preloadGameStartOverlayAssets(this);
  }
  create() {
    configureSceneCamera(this, this.renderScale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      releaseAirportTextures(this);
    });
    this.resetState();
    ({ sky: this.sky, city: this.city, ground: this.ground } =
      createAirportBackground(this));
    ({ player: this.player, playerArt: this.playerArt, playerAura: this.playerAura } =
      createAirportPlayer(this));
    this.hud = new AirportHud(this, () => this.returnToWorld());
    this.controls = createAirportControls(
      this,
      () => this.returnToWorld(),
      () => this.finished,
      () => this.scene.restart(),
    );
    createGameStartOverlay(this, DATA_FLIGHT_START);
    this.cameras.main.fadeIn(350, 220, 250, 255);
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

  private startQuestion() {
    const question =
      this.questions[this.questionIndex % this.questions.length] ??
      FLIGHT_QUESTIONS[0];
    this.questionIndex += 1;
    this.nextQuestionAtMs =
      this.elapsedMs + DATA_FLIGHT_CONFIG.questionIntervalMs;
    this.clearObjects();
    this.activeQuestion = {
      question,
      phase: "reading",
      readingUntilMs: this.elapsedMs + DATA_FLIGHT_CONFIG.questionReadingMs,
    };

    const overlay = this.add.container(640, 360).setDepth(90);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x112f43, 0.82);
    const panel = this.add
      .image(0, 0, "airport-quiz-card")
      .setDisplaySize(1_040, 425);
    const badge = this.add
      .text(0, -172, "데이터 퀴즈", {
        color: "#fffaf1",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
        shadow: {
          offsetY: 2,
          color: "#9f352f",
          blur: 1,
          fill: true,
        },
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(0, -12, question.prompt, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "39px",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5);
    const instruction = this.add
      .text(0, 132, "곧 데이터 4개가 날아옵니다  ·  정답을 향해 비행하세요!", {
        color: "#145c77",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const readingTrack = this.add.graphics();
    readingTrack.fillStyle(0x145c77, 0.78);
    readingTrack.fillRoundedRect(-236, 153, 472, 20, 10);
    readingTrack.lineStyle(2, 0x73d9e4, 0.95);
    readingTrack.strokeRoundedRect(-236, 153, 472, 20, 10);
    const readingFill = this.add.graphics().fillStyle(0xf3b94d, 1);
    readingFill.fillRoundedRect(0, -6, 460, 12, 6).setPosition(-230, 163);
    overlay.add([shade, panel, badge, prompt, instruction, readingTrack, readingFill]);
    overlay.setScale(0.82).setAlpha(0);
    this.tweens.add({
      targets: overlay,
      scale: 1,
      alpha: 1,
      duration: 330,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: readingFill,
      scaleX: 0,
      duration: DATA_FLIGHT_CONFIG.questionReadingMs,
      ease: "Linear",
    });
    this.questionOverlay = overlay;
  }

  private releaseQuestionChoices() {
    const active = this.activeQuestion;
    if (!active || active.phase !== "reading") return;
    active.phase = "choices";
    this.questionOverlay?.destroy(true);
    this.questionOverlay = undefined;

    const order = Phaser.Utils.Array.Shuffle([...FLIGHT_DATA_KINDS]);
    const ys = [165, 295, 425, 555];
    order.forEach((kind, index) => {
      this.spawnData(kind, 1390 + index * 28, ys[index], true);
    });

    const banner = this.add.container(640, 115).setDepth(65);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.ink, 0.92);
    panel.lineStyle(5, 0xdffcff, 0.95);
    panel.fillRoundedRect(-410, -35, 820, 70, 30);
    panel.strokeRoundedRect(-410, -35, 820, 70, 30);
    this.missionText = this.add
      .text(0, 0, active.question.prompt, {
        color: "#fff7df",
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 750 },
      })
      .setOrigin(0.5);
    banner.add([panel, this.missionText]);
    banner.setScale(0);
    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 280,
      ease: "Back.easeOut",
    });
    this.missionBanner = banner;
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

    if (!selected) {
      showAirportNotice(this, "데이터를 놓쳤어요!", "다음 문제에 다시 도전해요.", 0xf5bd46);
      this.nextDataAtMs =
        this.elapsedMs + DATA_FLIGHT_CONFIG.questionMissDataDelayMs;
      this.nextObstacleAtMs =
        this.elapsedMs + DATA_FLIGHT_CONFIG.questionMissObstacleDelayMs;
      return;
    }

    if (!correct) {
      this.hearts = decrementHeart(this.hearts);
      this.invulnerableUntilMs =
        this.elapsedMs + DATA_FLIGHT_CONFIG.invulnerabilityMs;
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
      this.nextDataAtMs =
        this.elapsedMs + DATA_FLIGHT_CONFIG.wrongAnswerDataDelayMs;
      this.nextObstacleAtMs =
        this.elapsedMs + DATA_FLIGHT_CONFIG.wrongAnswerObstacleDelayMs;
      return;
    }

    this.correctAnswers += 1;
    this.addScore(DATA_FLIGHT_CONFIG.correctAnswerScore);
    this.feverUntilMs =
      this.elapsedMs + DATA_FLIGHT_CONFIG.feverDurationMs;
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
    this.addScore(
      getCollectedDataScore(fever),
      getCollectedDifficultyPoints(),
    );
    this.collected += 1;
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
  }

  private hitObstacle(object: FlightObject) {
    this.hearts = decrementHeart(this.hearts);
    this.invulnerableUntilMs =
      this.elapsedMs + DATA_FLIGHT_CONFIG.invulnerabilityMs;
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

    if (this.playerArt) {
      this.tweens.add({
        targets: this.playerArt,
        tint: 0xff786c,
        alpha: 0.35,
        duration: 110,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          this.playerArt?.clearTint();
          this.playerArt?.setAlpha(1);
        },
      });
    }
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
    if (isGameStartOverlayOpen(this)) return;
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
    if (!this.activeQuestion && !fever && (firstQuestionReady || laterQuestionReady)) {
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
          this.nextDataAtMs =
            this.elapsedMs + DATA_FLIGHT_CONFIG.feverFormationIntervalMs;
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
}
