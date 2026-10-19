import Phaser from "phaser";
import { beginSceneTrip, sceneRgb } from "../../../core/visual/sceneTravel";
import { describeGraphics, nextGraphicsMode, readGraphicsMode, saveGraphicsMode } from "../../../core/runtime/graphicsMode";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import {
  createWorldCompletionReadyDetail,
  getWorldExitState,
  getWorldTotalStars,
  mergeWorldActivityResult,
  WORLD_EXIT_REQUIRED_STARS,
  readWorldProgressSnapshot,
  readWorldReturnRequest,
  resolveFeatureSceneKey,
  WORLD_PROGRESS_REGISTRY_KEY,
  createWorldReturnSceneData,
  type WorldActivityId,
  type WorldActivityStars,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import {
  loadStoredWorldProgress,
  mergeWorldProgressSnapshots,
  saveStoredWorldProgress,
} from "../../../core/navigation/worldProgressStorage";
import { markAllTutorialsSeen, markTutorialSeen, shouldPlayTutorial } from "../../../core/navigation/tutorialProgressStorage";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import {
  applyPlayerTexture,
  choosePlayerFacing,
  getPlayerTexture,
  settlePlayerTurn,
  startPlayerBlink,
} from "../../../core/player/playerSprite";
import { askYesNo } from "../../../core/visual/gameStartOverlay";
import { resetAllGameProgress } from "../../../core/navigation/resetProgress";
import { clearEndingSeen } from "../../../core/navigation/endingProgressStorage";
import { readLastGameError } from "../../../core/runtime/gameErrorGuard";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { createEndingStart } from "../../../core/scenes/endingStart";
import { isVillageDoorArrival } from "../../../core/scenes/villagePreview";
import { generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import {
  COLOR_HEX,
  COLORS,
  getTextStyle,
  TEXT_COLORS,
} from "../../../core/visual/theme";
import { getWorldMapDefinition } from "../model/mapRegistry";
import { isPointWithinPortalInteractionArea } from "../model/mapDefinition";
import {
  clampVillageFrameDelta,
  createVillageMovementMemory,
  resetVillageMovementMemory,
  resolveVillageMovement,
  VILLAGE_MOVEMENT_CONFIG,
  type WorldPosition,
} from "../model/villageMovement";
import {
  createVillageCollision,
  isPlayerBehindBuilding,
} from "../model/villageCollision";
import {
  createVillageScenery,
  getVillagePlayerDepth,
  type VillageSceneryLayer,
  updateVillageSceneryDepths,
  VILLAGE_UI_DEPTH,
} from "./villageScenery";
import {
  createVillageProgressPresentation,
} from "./villageProgressPresentation";
import { createVillageNameTags } from "./villageNameTags";
import { createVillageTestMenu } from "./villageTestMenu";
import { preloadWorldSceneAssets } from "./worldSceneAssets";
import { VILLAGE_PLAYER_DISPLAY_HEIGHT } from "./villagePreview";
import { createVillageTutorial, type VillageTutorial } from "./villageTutorial";
import {
  createWorldTouchDirection,
  type WorldTouchDirection,
} from "./worldTouchDirection";

const WORLD_MAP = getWorldMapDefinition();
const WORLD_COLLISION = createVillageCollision(WORLD_MAP);
const WORLD_CURVED_MOVEMENT_GUIDES = [
  ...WORLD_MAP.collision.ellipses.map((ellipse) => ({
    ...ellipse,
    projectToBoundary: true,
  })),
  ...WORLD_MAP.collision.curvedMovementGuides.map((guide) => ({
    ...guide,
    projectToBoundary: false,
  })),
];
type WorldPortal = (typeof WORLD_MAP.portals)[number];

// The building's name now shows above its roof, so the button just says "입장하기".
const WORLD_ENTRY_LABEL = "입장하기";

const WORLD_ENTRY_PROMPT_LAYOUT = {
  /** Plain "입장하기" button (button artwork is 720 x 184). */
  compact: { width: 150, height: 38, fontSize: "16px" },
  /** Two-line notes (locked gate, "별이 부족합니다…") need the wider plate. */
  wide: { width: 220, height: 56, fontSize: "14px" },
  textInset: 30,
  centerOffsetY: -144,
} as const;

// Midi stands 113 px tall in the village (shared with the intro's door preview).
const PLAYER_DISPLAY_HEIGHT = VILLAGE_PLAYER_DISPLAY_HEIGHT;
/** What the trip screen says on the way into each place. */
const TRIP_LABELS: Readonly<Record<string, string>> = {
  "ai-workshop": "AI 제작소 가는 중...",
  "data-flight": "데이터 비행장 가는 중...",
  "ethics-review": "윤리 심사소 가는 중...",
};

export class WorldScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private sceneryLayers: VillageSceneryLayer[] = [];
  private playerFacing: PlayerFacing = WORLD_MAP.defaultSpawn.facing;
  private playerMoving = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: ControlKeys;
  private nearestBuilding?: WorldPortal;
  private prompt?: Phaser.GameObjects.Container;
  private promptText?: Phaser.GameObjects.Text;
  private promptButton?: Phaser.GameObjects.Image;
  private promptSize?: "compact" | "wide";
  private nameTags?: ReturnType<typeof createVillageNameTags>;
  private tutorial?: VillageTutorial;
  private touchDirection = new Phaser.Math.Vector2();
  private touchMovement?: WorldTouchDirection;
  /** True while the "start over" question is open; Midi stays still. */
  private resetAsking = false;
  private testMenu?: ReturnType<typeof createVillageTestMenu>;
  private interactionFeedbackText?: string;
  private interactionFeedbackUntil = 0;
  private actionQueued = false;
  private hasMoved = false;
  private progress: WorldProgressSnapshot = readWorldProgressSnapshot(null);
  private lastSafePosition: WorldPosition = WORLD_MAP.defaultSpawn.position;
  private movementMemory = createVillageMovementMemory();
  /** True once the open gate was entered and the ending is starting. */
  private endingStarted = false;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.world);
  }

  preload() {
    preloadWorldSceneAssets(this);
  }

  create(data?: unknown) {
    configureSceneCamera(this, this.renderScale);
    this.endingStarted = false;
    generatePlayerTexture(this);
    const returnRequest = readWorldReturnRequest(data);
    // Live registry and the saved browser copy both count; the best stars win.
    this.progress = mergeWorldProgressSnapshots(
      readWorldProgressSnapshot(this.registry.get(WORLD_PROGRESS_REGISTRY_KEY)),
      loadStoredWorldProgress(),
    );
    if (returnRequest?.result) {
      this.progress = mergeWorldActivityResult(
        this.progress,
        returnRequest.result,
      );
    }
    this.registry.set(WORLD_PROGRESS_REGISTRY_KEY, this.progress);
    saveStoredWorldProgress(this.progress);
    const returnPortal = returnRequest
      ? WORLD_MAP.portals.find(
          (portal) =>
            portal.destination.kind === "feature" &&
            portal.destination.featureId === returnRequest.sourceFeatureId,
        )
      : undefined;
    const requestedSpawn =
      returnPortal && "returnSpawn" in returnPortal
        ? returnPortal.returnSpawn
        : WORLD_MAP.defaultSpawn;
    const spawn = this.isWorldPositionBlocked(
      requestedSpawn.position.x,
      requestedSpawn.position.y,
    )
      ? WORLD_MAP.defaultSpawn
      : requestedSpawn;
    this.playerFacing = spawn.facing;
    this.playerMoving = false;
    this.lastSafePosition = spawn.position;
    resetVillageMovementMemory(this.movementMemory);

    this.sceneryLayers = createVillageScenery(this, WORLD_MAP);
    createVillageProgressPresentation(
      this,
      WORLD_MAP,
      this.sceneryLayers,
      this.progress,
      // Back from a place with at least one star: its stars pop in one by one.
      returnRequest?.result && returnRequest.result.stars > 0
        ? returnRequest.result.featureId
        : undefined,
    );

    // The place name shows briefly over the sky on entry, then fades so it
    // never covers the buildings while playing. (The first-visit tour shows
    // its own "배움마을" title instead.)
    if (!shouldPlayTutorial("village")) {
      const placeName = this.add
        .text(WORLD_MAP.size.width / 2, 34, "배움마을", {
          ...getTextStyle("title", { color: TEXT_COLORS.onDark }),
          stroke: COLOR_HEX.ink,
          strokeThickness: 6,
        })
        .setOrigin(0.5, 0)
        .setDepth(VILLAGE_UI_DEPTH + 1);
      this.tweens.add({
        targets: placeName,
        alpha: 0,
        delay: 1_800,
        duration: 600,
        ease: "Sine.easeIn",
        onComplete: () => placeName.destroy(),
      });
    }

    this.playerShadow = this.add.ellipse(0, 38, 72, 19, COLORS.ink, 0.22);
    const initialTextureKey = getPlayerTexture(spawn.facing);
    const textureKey = this.textures.exists(initialTextureKey)
      ? initialTextureKey
      : "player-fallback";
    this.playerSprite = this.add.image(0, 0, textureKey);
    if (textureKey === initialTextureKey) {
      applyPlayerTexture(this.playerSprite, textureKey, PLAYER_DISPLAY_HEIGHT);
    } else {
      this.playerSprite.setDisplaySize(88, PLAYER_DISPLAY_HEIGHT).setOrigin(0.5, 0.84);
    }
    startPlayerBlink(
      this,
      this.playerSprite,
      () => !this.playerMoving && this.playerFacing === "front",
      PLAYER_DISPLAY_HEIGHT,
    );
    this.player = this.add.container(
      spawn.position.x,
      spawn.position.y,
      [this.playerShadow, this.playerSprite],
    );
    this.player.setDepth(
      getVillagePlayerDepth(spawn.position.y),
    );
    updateVillageSceneryDepths(
      this.sceneryLayers,
      spawn.position,
      WORLD_MAP.collision,
    );

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = makeControlKeys(this);
    this.createInteractionPrompt();
    this.nameTags = createVillageNameTags(this, WORLD_MAP, this.sceneryLayers, {
      stars: getWorldTotalStars(this.progress),
      required: WORLD_EXIT_REQUIRED_STARS,
    });
    this.createTestMenu();
    this.hasMoved = false;
    this.tutorial = createVillageTutorial(this, {
      mapDefinition: WORLD_MAP,
      sceneryLayers: this.sceneryLayers,
      progress: this.progress,
      firstVisit: shouldPlayTutorial("village"),
      returnedResult: returnRequest?.result,
      playerSprite: this.playerSprite,
      playerDisplayHeight: PLAYER_DISPLAY_HEIGHT,
    });
    this.createTouchControls();

    // Straight out of the intro's door the village is already on screen exactly as
    // drawn there, so it must not fade in again.
    // Back from a place, out of that place's own colour (it faded into it).
    if (!isVillageDoorArrival(data)) {
      const from = returnRequest ? resolveFeatureSceneKey(returnRequest.sourceFeatureId) : SCENE_KEYS.world;
      this.cameras.main.fadeIn(380, ...sceneRgb(from));
    }
  }

  /**
   * The "테스트 ▾" menu in the top-right corner (for teachers trying things
   * out): reset everything, skip every tutorial, fill the stars, finish one place with a chosen
   * number of stars (its stars fill in on return), or watch the ending again.
   */
  private createTestMenu() {
    const finish = (featureId: WorldActivityId, stars: WorldActivityStars) => () => {
      // Exactly this many (not the best so far), then back as if from the place.
      this.applyTestProgress({ ...this.progress, [featureId]: stars }, createWorldReturnSceneData(featureId, stars));
    };
    this.testMenu = createVillageTestMenu(this, {
      sceneWidth: WORLD_MAP.size.width,
      depth: VILLAGE_UI_DEPTH + 30,
      canOpen: () => !this.resetAsking && !this.endingStarted,
      onOpen: () => {
        this.touchMovement?.cancel();
        this.stopPlayer();
      },
      actions: [
        { label: "전체 초기화", run: () => this.confirmFullReset() },
        {
          // Village tour and all three places start straight into play.
          label: "튜토리얼 모두 건너뛰기",
          run: () => {
            markAllTutorialsSeen();
            this.applyTestProgress(this.progress);
          },
        },
        { label: "별 9개 채우기", run: () => this.applyTestProgress({ "ai-workshop": 3, "data-flight": 3, "ethics-review": 3 }) },
        { label: "별 7개 채우기 (2/2/3)", run: () => this.applyTestProgress({ "ai-workshop": 2, "data-flight": 2, "ethics-review": 3 }) },
        { label: "AI 제작소 별 3개로 완료", run: finish("ai-workshop", 3) },
        { label: "데이터 비행장 별 2개로 완료", run: finish("data-flight", 2) },
        { label: "윤리 심사소 별 1개로 완료", run: finish("ethics-review", 1) },
        {
          label: "엔딩 초기화",
          run: () => {
            clearEndingSeen();
            this.testMenu?.notify("엔딩을 처음부터 다시 볼 수 있어요");
          },
        },
        {
          label: "마지막 오류 보기",
          run: () => {
            const error = readLastGameError();
            this.testMenu?.notify(
              error ? `[${error.scene}] ${error.message}` : "기록된 오류가 없어요",
              error ? 6_000 : 1_400,
            );
          },
        },
        {
          // How smoothly this computer draws the game (check on a school computer).
          label: "그래픽 상태 보기",
          run: () => {
            this.testMenu?.notify("1초 동안 재는 중...", 1_000);
            void describeGraphics(this.game).then((text) => this.testMenu?.notify(text, 7_000));
          },
        },
        {
          // 자동 → 가벼운(Canvas) → 선명한(WebGL) → 자동; takes effect after a reload.
          label: "그래픽 모드 바꾸기",
          run: () => {
            const next = nextGraphicsMode(readGraphicsMode());
            saveGraphicsMode(next.mode);
            this.testMenu?.notify(`${next.label}로 다시 불러와요`, 1_200);
            window.setTimeout(() => window.location.reload(), 900);
          },
        },
      ],
    });
  }

  /** Saves `progress` as it is and redraws the village (the tour is not replayed). */
  private applyTestProgress(progress: WorldProgressSnapshot, data?: object) {
    this.progress = progress;
    this.registry.set(WORLD_PROGRESS_REGISTRY_KEY, this.progress);
    saveStoredWorldProgress(this.progress);
    markTutorialSeen("village");
    this.scene.restart(data);
  }

  /** Every saved star and seen tutorial is wiped and the game starts over. */
  private confirmFullReset() {
    if (this.resetAsking || this.endingStarted) return;
    this.resetAsking = true;
    void askYesNo(
      this,
      "처음부터 다시 시작할까요?\n모은 별과 튜토리얼 기록이 모두 지워져요.",
      VILLAGE_UI_DEPTH + 60,
    ).then((yes) => {
      if (yes) {
        resetAllGameProgress();
        return;
      }
      this.resetAsking = false;
    });
  }

  private createInteractionPrompt() {
    const button = this.add
      .image(0, 0, "village-entry-button")
      .setInteractive({ useHandCursor: true });
    this.promptButton = button;
    // Phaser reuses the scene object on restart, so the remembered size must reset.
    this.promptSize = undefined;
    this.promptText = this.add
      .text(0, 0, "", {
        ...getTextStyle("heading", { fontSize: WORLD_ENTRY_PROMPT_LAYOUT.compact.fontSize }),
        align: "center",
      })
      .setOrigin(0.5);
    this.setPromptSize("compact");
    this.prompt = this.add
      .container(0, 0, [button, this.promptText])
      .setDepth(VILLAGE_UI_DEPTH + 10)
      .setVisible(false);

    button.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.prompt?.setScale(0.97);
      },
    );
    button.on(
      "pointerup",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.prompt?.setScale(1);
        this.actionQueued = true;
      },
    );
    button.on("pointerout", () => this.prompt?.setScale(1));
  }

  private createTouchControls() {
    this.touchMovement = createWorldTouchDirection(this, {
      direction: this.touchDirection,
      getOrigin: () =>
        this.player ? { x: this.player.x, y: this.player.y } : undefined,
    });
  }

  private setPlayerFacing(direction: Phaser.Math.Vector2) {
    const nextFacing = choosePlayerFacing(direction, this.playerFacing);
    if (nextFacing === this.playerFacing && this.playerMoving) return;
    const turned = nextFacing !== this.playerFacing;
    this.playerFacing = nextFacing;
    this.playerMoving = true;
    this.refreshPlayerTexture();
    if (turned && this.playerSprite) settlePlayerTurn(this.playerSprite);
  }

  /** Standing still: left/right go back from the leaning walk to the side pose. */
  private stopPlayer() {
    if (!this.playerMoving) return;
    this.playerMoving = false;
    this.refreshPlayerTexture();
  }

  private refreshPlayerTexture() {
    if (!this.playerSprite) return;
    applyPlayerTexture(
      this.playerSprite,
      getPlayerTexture(this.playerFacing, this.playerMoving),
      PLAYER_DISPLAY_HEIGHT,
    );
  }

  private animatePlayer(isMoving: boolean) {
    if (!this.playerSprite || !this.playerShadow) return;

    const wave = Math.sin(this.time.now / (isMoving ? 85 : 360));
    const lift = isMoving ? 4.5 : 2;
    this.playerSprite.y = -3 - Math.abs(wave) * lift;
    this.playerSprite.angle = isMoving ? wave * 1.8 : wave * 0.45;
    const shadowScale = 1 - Math.abs(wave) * (isMoving ? 0.1 : 0.04);
    this.playerShadow.setScale(shadowScale, 1);
    this.playerShadow.setAlpha(isMoving ? 0.19 : 0.22);
  }

  private tryInteraction() {
    if (!this.nearestBuilding) return;

    if (!this.isPortalAvailable(this.nearestBuilding)) {
      const exitState = getWorldExitState(this.progress);
      if (exitState.kind === "locked") {
        // Midi says it herself instead of the button changing.
        this.tutorial?.sayGateLocked(this.nearestBuilding.id);
        return;
      }
      this.showInteractionFeedback("아직 준비 중이에요.");
      this.cameras.main.shake(110, 0.003);
      return;
    }

    if (this.nearestBuilding.destination.kind === "world-completion-placeholder") {
      const detail = createWorldCompletionReadyDetail(this.progress);
      this.events.emit(
        this.nearestBuilding.destination.completionEvent,
        detail,
      );
      this.game.events.emit(
        this.nearestBuilding.destination.completionEvent,
        detail,
      );
      this.touchMovement?.cancel();
      this.stopPlayer();
      this.endingStarted = true;
      markTutorialSeen("village");
      // The ending starts on this same picture of the village, so no fade.
      const midi = this.player ? { x: this.player.x, y: this.player.y } : WORLD_MAP.defaultSpawn.position;
      this.scene.start(SCENE_KEYS.ending, createEndingStart({ progress: this.progress, midi }));
      return;
    }

    markTutorialSeen("village");
    this.tutorial?.notifyEntered();
    const destination = resolveFeatureSceneKey(
      this.nearestBuilding.destination.featureId,
    );
    // The village fades into its green, where the trip to the place plays
    // (sceneTravel). Midi stands still meanwhile (the same "leaving" hold as the ending).
    this.touchMovement?.cancel();
    this.stopPlayer();
    this.endingStarted = true;
    const featureId = this.nearestBuilding.destination.featureId;
    beginSceneTrip(this, destination, TRIP_LABELS[featureId] ?? "이동하는 중...", () => this.scene.start(destination));
  }

  private isPortalAvailable(portal: WorldPortal) {
    switch (portal.availability.kind) {
      case "always":
        return true;
      case "world-star-total":
        return getWorldTotalStars(this.progress) >= portal.availability.requiredStars;
    }
  }

  /** Short plate for "입장하기", the wider one for two-line notes. */
  private setPromptSize(size: "compact" | "wide") {
    if (size === this.promptSize) return;
    this.promptSize = size;
    const layout = WORLD_ENTRY_PROMPT_LAYOUT[size];
    this.promptButton?.setDisplaySize(layout.width, layout.height);
    this.promptText
      ?.setFontSize(layout.fontSize)
      .setWordWrapWidth(layout.width - WORLD_ENTRY_PROMPT_LAYOUT.textInset, true);
  }

  private showInteractionFeedback(message: string) {
    this.interactionFeedbackText = message;
    this.interactionFeedbackUntil = this.time.now + 1_600;
    this.promptText?.setText(message);
  }

  update(_time: number, delta: number) {
    if (!this.player) return;
    if (this.endingStarted || this.resetAsking) return;
    if (this.tutorial?.isBlocking()) {
      // A tutorial card (or Midi's "tap to go on" line) is up: Midi waits.
      this.touchMovement?.cancel();
      this.actionQueued = false;
      this.stopPlayer();
      this.animatePlayer(false);
      this.tutorial.update(
        { x: this.player.x, y: this.player.y },
        this.prompt?.visible ? this.nearestBuilding?.id : undefined,
      );
      return;
    }

    const keyboardMoving = Boolean(
      this.cursors?.left.isDown ||
        this.cursors?.right.isDown ||
        this.cursors?.up.isDown ||
        this.cursors?.down.isDown ||
        this.keys?.left.isDown ||
        this.keys?.right.isDown ||
        this.keys?.up.isDown ||
        this.keys?.down.isDown,
    );
    if (keyboardMoving) this.touchMovement?.cancel();
    else this.touchMovement?.update();

    const recoveredPosition = resolveVillageMovement(
      { x: this.player.x, y: this.player.y },
      { x: 0, y: 0 },
      this.lastSafePosition,
      (x, y) => this.isWorldPositionBlocked(x, y),
      WORLD_CURVED_MOVEMENT_GUIDES,
    );
    this.player.setPosition(recoveredPosition.x, recoveredPosition.y);
    if (!this.isWorldPositionBlocked(this.player.x, this.player.y)) {
      this.lastSafePosition = { x: this.player.x, y: this.player.y };
    }

    const direction = new Phaser.Math.Vector2(
      this.touchDirection.x,
      this.touchDirection.y,
    );
    if (this.cursors?.left.isDown || this.keys?.left.isDown) direction.x -= 1;
    if (this.cursors?.right.isDown || this.keys?.right.isDown) direction.x += 1;
    if (this.cursors?.up.isDown || this.keys?.up.isDown) direction.y -= 1;
    if (this.cursors?.down.isDown || this.keys?.down.isDown) direction.y += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.setPlayerFacing(direction);
      this.animatePlayer(true);
      const sprintMultiplier = this.keys?.sprint.isDown
        ? VILLAGE_MOVEMENT_CONFIG.sprintMultiplier
        : 1;
      const speed =
        VILLAGE_MOVEMENT_CONFIG.playerSpeed *
        sprintMultiplier *
        (clampVillageFrameDelta(delta) / 1000);
      const movementBounds = WORLD_MAP.collision.movementBounds;
      const targetX = Phaser.Math.Clamp(
        this.player.x + direction.x * speed,
        movementBounds.minX,
        movementBounds.maxX,
      );
      const targetY = Phaser.Math.Clamp(
        this.player.y + direction.y * speed,
        movementBounds.minY,
        movementBounds.maxY,
      );
      const nextPosition = resolveVillageMovement(
        { x: this.player.x, y: this.player.y },
        { x: targetX - this.player.x, y: targetY - this.player.y },
        this.lastSafePosition,
        (x, y) => this.isWorldPositionBlocked(x, y),
        WORLD_CURVED_MOVEMENT_GUIDES,
        this.movementMemory,
      );
      this.player.setPosition(nextPosition.x, nextPosition.y);
      if (!this.isWorldPositionBlocked(this.player.x, this.player.y)) {
        this.lastSafePosition = { x: this.player.x, y: this.player.y };
      }
      this.player.rotation = Math.sin(this.time.now / 75) * 0.025;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.tutorial?.notifyMoved();
      }
    } else {
      resetVillageMovementMemory(this.movementMemory);
      this.stopPlayer();
      this.animatePlayer(false);
      this.player.rotation *= 0.8;
    }

    this.player.setDepth(getVillagePlayerDepth(this.player.y));
    updateVillageSceneryDepths(this.sceneryLayers, {
      x: this.player.x,
      y: this.player.y,
    }, WORLD_MAP.collision);

    this.nearestBuilding = WORLD_MAP.portals.find((portal) => {
      switch (portal.interactionComparison) {
        case "strictly-less-than":
          return isPointWithinPortalInteractionArea(portal, {
            x: this.player!.x,
            y: this.player!.y,
          }) && (
            !portal.frontOf ||
            isPlayerBehindBuilding(WORLD_MAP.collision, portal.frontOf, {
              x: this.player!.x,
              y: this.player!.y,
            }) !== true
          );
      }
    });

    // While Midi says the gate is still locked, its entry button stays hidden
    // (it comes back after she leaves and returns to the door).
    const gateLineUp = Boolean(this.tutorial?.isGateLineUp(this.nearestBuilding?.id));
    if (this.nearestBuilding && this.prompt && this.promptText && !gateLineUp) {
      const hasInteractionFeedback = Boolean(
        this.interactionFeedbackText &&
          this.time.now < this.interactionFeedbackUntil,
      );
      this.prompt
        .setVisible(true)
        .setPosition(this.player.x, this.player.y + WORLD_ENTRY_PROMPT_LAYOUT.centerOffsetY);
      // The gate's star count shows on the gate itself, so its button says 입장하기 too.
      const defaultPrompt = WORLD_ENTRY_LABEL;
      const shownPrompt = hasInteractionFeedback
        ? (this.interactionFeedbackText ?? defaultPrompt)
        : defaultPrompt;
      this.setPromptSize(shownPrompt === WORLD_ENTRY_LABEL ? "compact" : "wide");
      this.promptText.setText(shownPrompt);
    } else {
      this.prompt?.setVisible(false);
    }
    const promptPortalId = this.prompt?.visible ? this.nearestBuilding?.id : undefined;
    // The gate's name and star count stay up while Midi says it is locked.
    this.nameTags?.update(gateLineUp ? this.nearestBuilding?.id : promptPortalId);
    this.tutorial?.update(
      { x: this.player.x, y: this.player.y },
      promptPortalId,
      this.nearestBuilding?.id,
      this.playerMoving,
    );

    const keyboardAction =
      (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.action)) ||
      (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.enter));
    if (keyboardAction || this.actionQueued) {
      this.actionQueued = false;
      this.tryInteraction();
    }
  }

  private isWorldPositionBlocked(x: number, y: number) {
    return WORLD_COLLISION.isBlocked(x, y);
  }
}
