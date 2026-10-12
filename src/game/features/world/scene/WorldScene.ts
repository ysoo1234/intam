import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
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
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import {
  loadStoredWorldProgress,
  mergeWorldProgressSnapshots,
  saveStoredWorldProgress,
} from "../../../core/navigation/worldProgressStorage";
import { markTutorialSeen, shouldPlayTutorial } from "../../../core/navigation/tutorialProgressStorage";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import {
  applyPlayerTexture,
  choosePlayerFacing,
  getPlayerTexture,
  preloadPlayerTextures,
  settlePlayerTurn,
  startPlayerBlink,
} from "../../../core/player/playerSprite";
import { preloadMidiFaces } from "../../../core/player/midiFrames";
import { preloadCoachAssets } from "../../../core/visual/coachGuide";
import { drawOutlinedPill } from "../../../core/visual/outlinedButton";
import { askYesNo } from "../../../core/visual/gameStartOverlay";
import { resetAllGameProgress } from "../../../core/navigation/resetProgress";
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
  preloadVillageScenery,
  updateVillageSceneryDepths,
  VILLAGE_UI_DEPTH,
} from "./villageScenery";
import {
  createVillageProgressPresentation,
  preloadVillageProgressPresentationAssets,
} from "./villageProgressPresentation";
import { createVillageNameTags } from "./villageNameTags";
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
    preloadVillageScenery(this, WORLD_MAP);
    preloadVillageProgressPresentationAssets(this);
    if (!this.textures.exists("village-entry-button")) {
      this.load.image(
        "village-entry-button",
        GAME_ASSETS.ui.villageEntryButton,
      );
    }
    preloadPlayerTextures(this);
    // Textbook face frames, so Midi's mouth and eyes move while she talks.
    preloadMidiFaces(this);
    preloadCoachAssets(this);
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
    this.createResetButton();
    this.createFillStarsButton();
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
    if (!isVillageDoorArrival(data)) this.cameras.main.fadeIn(350, 255, 245, 220);
  }

  /**
   * A small "처음부터" button in the top-right corner: after a yes, every
   * saved star and seen tutorial is wiped and the game reloads on the first
   * screen, like a first visit (for classroom demos and replaying tutorials).
   */
  private createResetButton() {
    const width = 124;
    const height = 42;
    const surface = drawOutlinedPill(this.add.graphics(), width, height, "cream");
    const label = this.add
      // ↻(시계 방향)이 되감기처럼 읽히고, ↺는 앞으로 가는 화살표처럼 보인다.
      .text(0, -1, "↻ 처음부터", getTextStyle("support", { color: "#315567", fontSize: "16px" }))
      .setOrigin(0.5)
      .setResolution(3);
    const button = this.add
      .container(WORLD_MAP.size.width - width / 2 - 14, height / 2 + 12, [surface, label])
      .setSize(width, height)
      .setDepth(VILLAGE_UI_DEPTH + 30)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true });
    const stop = (
      _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
    ) => event.stopPropagation();
    button.on("pointerover", () => button.setAlpha(1));
    button.on("pointerout", () => button.setAlpha(0.85));
    button.on("pointerdown", stop);
    button.on("pointerup", (
      _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (this.resetAsking || this.endingStarted) return;
      this.resetAsking = true;
      this.touchMovement?.cancel();
      this.stopPlayer();
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
    });
  }

  /**
   * "★ 별 채우기" beside 처음부터 (for testing the ending and classroom demos):
   * every building gets all three stars, saved, and the village redraws.
   */
  /**
   * Test buttons under 처음부터: fill every star, or just seven (2·2·3),
   * for trying the ending's two cases without playing the minigames.
   */
  private createFillStarsButton() {
    const presets = [
      {
        label: "★ 별 채우기",
        question: "별을 모두 채울까요?",
        progress: { "ai-workshop": 3, "data-flight": 3, "ethics-review": 3 },
      },
      {
        label: "☆ 별 덜 채우기",
        question: "별을 7개만 채울까요?",
        progress: { "ai-workshop": 2, "data-flight": 2, "ethics-review": 3 },
      },
    ] as const satisfies readonly { label: string; question: string; progress: WorldProgressSnapshot }[];
    const width = 136;
    const height = 42;
    presets.forEach((preset, index) => {
      const surface = drawOutlinedPill(this.add.graphics(), width, height, "cream");
      const label = this.add
        .text(0, -1, preset.label, getTextStyle("support", { color: "#315567", fontSize: "16px" }))
        .setOrigin(0.5)
        .setResolution(3);
      // Stacked under 처음부터 (left of it would cover the gate's name tag).
      const button = this.add
        .container(
          WORLD_MAP.size.width - 14 - width / 2,
          height / 2 + 12 + (height + 8) * (index + 1),
          [surface, label],
        )
        .setSize(width, height)
        .setDepth(VILLAGE_UI_DEPTH + 30)
        .setAlpha(0.85)
        .setInteractive({ useHandCursor: true });
      button.on("pointerover", () => button.setAlpha(1));
      button.on("pointerout", () => button.setAlpha(0.85));
      button.on("pointerdown", (
        _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
      ) => event.stopPropagation());
      button.on("pointerup", (
        _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        if (this.resetAsking || this.endingStarted) return;
        this.resetAsking = true;
        this.touchMovement?.cancel();
        this.stopPlayer();
        void askYesNo(this, preset.question, VILLAGE_UI_DEPTH + 60).then((yes) => {
          this.resetAsking = false;
          if (!yes) return;
          this.progress = preset.progress;
          this.registry.set(WORLD_PROGRESS_REGISTRY_KEY, this.progress);
          saveStoredWorldProgress(this.progress);
          // The village tour is not replayed after the redraw.
          markTutorialSeen("village");
          this.scene.restart();
        });
      });
    });
    // A small note under the two buttons so students know they are for testing.
    const lastButtonBottom = 12 + height + (height + 8) * presets.length;
    this.add
      .text(WORLD_MAP.size.width - 14 - width / 2, lastButtonBottom + 4, "테스트용 버튼",
        getTextStyle("support", { color: "#315567", fontSize: "13px" }))
      .setOrigin(0.5, 0)
      .setResolution(3)
      .setAlpha(0.75)
      .setDepth(VILLAGE_UI_DEPTH + 30);
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
    this.cameras.main.fadeOut(230, 255, 245, 220);
    const destination = resolveFeatureSceneKey(
      this.nearestBuilding.destination.featureId,
    );
    this.time.delayedCall(230, () => this.scene.start(destination));
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
