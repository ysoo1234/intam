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
import { preloadCoachAssets } from "../../../core/visual/coachGuide";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import {
  COLOR_HEX,
  COLORS,
  getTextStyle,
  TEXT_COLORS,
} from "../../../core/visual/theme";
import { mapRegistry } from "../model/mapRegistry";
import { isPointWithinPortalInteractionArea } from "../model/mapDefinition";
import {
  clampVillageFrameDelta,
  createVillageMovementMemory,
  resetVillageMovementMemory,
  resolveVillageMovement,
  VILLAGE_MOVEMENT_CONFIG,
  type WorldPosition,
} from "../model/villageMovement";
import { createVillageCollision } from "../model/villageCollision";
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
import { createVillageEndingOverlay } from "./villageEndingOverlay";
import { createVillageTutorial, type VillageTutorial } from "./villageTutorial";
import {
  createWorldTouchDirection,
  type WorldTouchDirection,
} from "./worldTouchDirection";

function getWorldMapDefinition() {
  const definition = mapRegistry.get("world");
  if (!definition) {
    throw new Error('World map definition "world" is not registered.');
  }
  return definition;
}

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

const WORLD_PORTAL_ENTRY_LABELS: Partial<Record<WorldPortal["id"], string>> = {
  shop: "AI 제작소 입장하기",
  library: "데이터 비행장 입장하기",
  workshop: "윤리 심사소 입장하기",
};

const WORLD_ENTRY_PROMPT_LAYOUT = {
  width: 220,
  height: 56,
  centerX: 110,
  centerY: 28,
  textWidth: 190,
  fontSize: "14px",
  centerOffsetY: -144,
} as const;

function getWorldPortalEntryLabel(portal: WorldPortal) {
  return WORLD_PORTAL_ENTRY_LABELS[portal.id] ?? `${portal.label} 입장하기`;
}

function getLockedExitLabel(portal: WorldPortal, progress: WorldProgressSnapshot) {
  const required =
    portal.availability.kind === "world-star-total"
      ? portal.availability.requiredStars
      : 0;
  const collected = Math.min(getWorldTotalStars(progress), required);
  return `별 ${collected} / ${required}\n별 ${required - collected}개를 더 모으면 열려요`;
}

// Midi stands 113 px tall in the village.
const PLAYER_DISPLAY_HEIGHT = 113;

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
  private tutorial?: VillageTutorial;
  private touchDirection = new Phaser.Math.Vector2();
  private touchMovement?: WorldTouchDirection;
  private interactionFeedbackText?: string;
  private interactionFeedbackUntil = 0;
  private actionQueued = false;
  private hasMoved = false;
  private progress: WorldProgressSnapshot = readWorldProgressSnapshot(null);
  private lastSafePosition: WorldPosition = WORLD_MAP.defaultSpawn.position;
  private movementMemory = createVillageMovementMemory();
  private endingOverlay?: Phaser.GameObjects.Container;

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
    preloadCoachAssets(this);
  }

  create(data?: unknown) {
    configureSceneCamera(this, this.renderScale);
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
    // never covers the buildings while playing.
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
    );

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = makeControlKeys(this);
    this.createInteractionPrompt();
    this.hasMoved = false;
    this.tutorial = createVillageTutorial(this, {
      mapDefinition: WORLD_MAP,
      sceneryLayers: this.sceneryLayers,
      progress: this.progress,
      firstVisit: shouldPlayTutorial("village"),
      returnedResult: returnRequest?.result,
    });
    this.createTouchControls();

    this.cameras.main.fadeIn(350, 255, 245, 220);
  }

  private createInteractionPrompt() {
    const button = this.add
      .image(
        WORLD_ENTRY_PROMPT_LAYOUT.centerX,
        WORLD_ENTRY_PROMPT_LAYOUT.centerY,
        "village-entry-button",
      )
      .setDisplaySize(
        WORLD_ENTRY_PROMPT_LAYOUT.width,
        WORLD_ENTRY_PROMPT_LAYOUT.height,
      )
      .setInteractive({ useHandCursor: true });
    this.promptText = this.add
      .text(
        WORLD_ENTRY_PROMPT_LAYOUT.centerX,
        WORLD_ENTRY_PROMPT_LAYOUT.centerY,
        "",
        {
          ...getTextStyle("heading", {
            fontSize: WORLD_ENTRY_PROMPT_LAYOUT.fontSize,
          }),
          align: "center",
          wordWrap: {
            width: WORLD_ENTRY_PROMPT_LAYOUT.textWidth,
            useAdvancedWrap: true,
          },
        },
      )
      .setOrigin(0.5);
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
      this.showInteractionFeedback(
        exitState.kind === "locked"
          ? `별이 부족합니다. ${exitState.missingStars}개를 더 모아 보세요.`
          : "아직 준비 중이에요.",
      );
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
      this.endingOverlay?.destroy(true);
      this.endingOverlay = createVillageEndingOverlay(this, () => {
        this.endingOverlay?.destroy(true);
        this.endingOverlay = undefined;
      });
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

  private showInteractionFeedback(message: string) {
    this.interactionFeedbackText = message;
    this.interactionFeedbackUntil = this.time.now + 1_600;
    this.promptText?.setText(message);
  }

  update(_time: number, delta: number) {
    if (!this.player) return;
    if (this.endingOverlay) return;

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
    });

    this.nearestBuilding = WORLD_MAP.portals.find((portal) => {
      switch (portal.interactionComparison) {
        case "strictly-less-than":
          return isPointWithinPortalInteractionArea(portal, {
            x: this.player!.x,
            y: this.player!.y,
          });
      }
    });

    if (this.nearestBuilding && this.prompt && this.promptText) {
      const hasInteractionFeedback = Boolean(
        this.interactionFeedbackText &&
          this.time.now < this.interactionFeedbackUntil,
      );
      const isLockedExit =
        this.nearestBuilding.destination.kind ===
          "world-completion-placeholder" &&
        !this.isPortalAvailable(this.nearestBuilding);
      // The graduation gate shows how many stars it needs while it is locked.
      this.prompt
        .setVisible(true)
        .setPosition(
          this.player.x - WORLD_ENTRY_PROMPT_LAYOUT.centerX,
          this.player.y +
            WORLD_ENTRY_PROMPT_LAYOUT.centerOffsetY -
            WORLD_ENTRY_PROMPT_LAYOUT.centerY,
        );
      const defaultPrompt = isLockedExit
        ? getLockedExitLabel(this.nearestBuilding, this.progress)
        : getWorldPortalEntryLabel(this.nearestBuilding);
      this.promptText.setText(
        hasInteractionFeedback
          ? (this.interactionFeedbackText ?? defaultPrompt)
          : defaultPrompt,
      );
    } else {
      this.prompt?.setVisible(false);
    }
    this.tutorial?.update(
      { x: this.player.x, y: this.player.y },
      this.prompt?.visible ? this.nearestBuilding?.id : undefined,
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
