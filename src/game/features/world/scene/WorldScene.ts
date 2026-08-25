import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { createFloatingJoystick } from "../../../core/input/floatingJoystick";
import { resolveFeatureSceneKey } from "../../../core/navigation";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import {
  COLOR_HEX,
  COLORS,
  getTextStyle,
  TEXT_COLORS,
  UI_RADII,
} from "../../../core/visual/theme";
import {
  addUiButton,
  addUiSurface,
  addFlowerBadge,
  addSpeechBubble,
} from "../../../core/visual/uiPrimitives";
import { mapRegistry } from "../model/mapRegistry";
import {
  clampVillageFrameDelta,
  createVillageMovementMemory,
  resetVillageMovementMemory,
  resolveVillageMovement,
  VILLAGE_MOVEMENT_CONFIG,
  type WorldPosition,
} from "../model/villageMovement";
import { createVillageCollision } from "./villageCollision";
import {
  createVillageScenery,
  getVillagePlayerDepth,
  type VillageSceneryLayer,
  preloadVillageScenery,
  updateVillageSceneryDepths,
  VILLAGE_UI_DEPTH,
} from "./villageScenery";

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

export class WorldScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private sceneryLayers: VillageSceneryLayer[] = [];
  private playerFacing: PlayerFacing = WORLD_MAP.defaultSpawn.facing;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: ControlKeys;
  private nearestBuilding?: WorldPortal;
  private prompt?: Phaser.GameObjects.Container;
  private promptText?: Phaser.GameObjects.Text;
  private onboarding?: Phaser.GameObjects.Container;
  private joystick = new Phaser.Math.Vector2();
  private actionQueued = false;
  private hasMoved = false;
  private lastSafePosition: WorldPosition = WORLD_MAP.defaultSpawn.position;
  private movementMemory = createVillageMovementMemory();

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.world);
  }

  preload() {
    preloadVillageScenery(this, WORLD_MAP);
    if (!this.textures.exists("player-front")) {
      this.load.image("player-front", GAME_ASSETS.characters.player.front);
      this.load.image("player-back", GAME_ASSETS.characters.player.back);
      this.load.image("player-left", GAME_ASSETS.characters.player.left);
      this.load.image("player-right", GAME_ASSETS.characters.player.right);
    }
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    generatePlayerTexture(this);
    this.lastSafePosition = WORLD_MAP.defaultSpawn.position;
    resetVillageMovementMemory(this.movementMemory);

    this.sceneryLayers = createVillageScenery(this, WORLD_MAP);

    const shade = this.add.graphics().setDepth(VILLAGE_UI_DEPTH);
    shade.fillStyle(0x173f43, 0.1);
    shade.fillRect(0, 0, WORLD_MAP.size.width, 52);

    this.add
      .text(38, 22, "배움마을", {
        ...getTextStyle("title", { color: TEXT_COLORS.onDark }),
        stroke: COLOR_HEX.ink,
        strokeThickness: 6,
      })
      .setDepth(VILLAGE_UI_DEPTH + 1);

    addFlowerBadge(this, 1220, 64, "★", COLORS.yellow).setDepth(
      VILLAGE_UI_DEPTH + 1,
    );

    this.playerShadow = this.add.ellipse(0, 38, 72, 19, COLORS.ink, 0.22);
    const initialTextureKey = `player-${WORLD_MAP.defaultSpawn.facing}`;
    const textureKey = this.textures.exists(initialTextureKey)
      ? initialTextureKey
      : "player-fallback";
    this.playerSprite = this.add
      .image(0, 0, textureKey)
      .setDisplaySize(88, 113)
      .setOrigin(0.5, 0.84);
    this.player = this.add.container(
      WORLD_MAP.defaultSpawn.position.x,
      WORLD_MAP.defaultSpawn.position.y,
      [this.playerShadow, this.playerSprite],
    );
    this.player.setDepth(
      getVillagePlayerDepth(WORLD_MAP.defaultSpawn.position.y),
    );
    updateVillageSceneryDepths(
      this.sceneryLayers,
      WORLD_MAP.defaultSpawn.position,
    );

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = makeControlKeys(this);
    this.createInteractionPrompt();
    this.createOnboarding();
    this.createTouchControls();

    this.cameras.main.fadeIn(350, 255, 245, 220);
  }

  private createInteractionPrompt() {
    const bubble = addSpeechBubble(this, 330, 66);
    this.promptText = this.add
      .text(165, 32, "", {
        ...getTextStyle("body", { fontSize: "20px" }),
        align: "center",
      })
      .setOrigin(0.5);
    this.prompt = this.add
      .container(0, 0, [bubble, this.promptText])
      .setDepth(VILLAGE_UI_DEPTH + 10)
      .setVisible(false);
  }

  private createOnboarding() {
    const g = addUiSurface(
      this,
      { x: -305, y: -35, width: 610, height: 70 },
      "cream",
      { radius: UI_RADII.panel, shadow: "medium" },
    );
    g.fillStyle(COLORS.mint, 1);
    g.fillRoundedRect(-279, -23, 72, 46, 18);

    const tip = this.add
      .text(-243, -1, "TIP", getTextStyle("support", { fontSize: "17px" }))
      .setOrigin(0.5);
    const text = this.add
      .text(
        45,
        0,
        "방향키 또는 화면을 터치하여 움직여 보세요!",
        getTextStyle("heading", { fontSize: "21px" }),
      )
      .setOrigin(0.5);

    this.onboarding = this.add
      .container(640, 650, [g, tip, text])
      .setDepth(VILLAGE_UI_DEPTH + 20)
      .setAlpha(0)
      .setScale(0.94);
    this.tweens.add({
      targets: this.onboarding,
      alpha: 1,
      scale: 1,
      duration: 260,
      ease: "Back.easeOut",
    });
    this.time.delayedCall(5_200, () => this.hideOnboarding());
  }

  private createTouchControls() {
    createFloatingJoystick(this, {
      direction: this.joystick,
      radius: 48,
      depth: VILLAGE_UI_DEPTH + 30,
      canStart: (pointer) => !(pointer.x > 1080 && pointer.y > 510),
    });

    addUiButton(this, {
      x: 1173,
      y: 610,
      width: 110,
      height: 110,
      radius: 55,
      label: "톡!",
      variant: "caution",
      fontSize: "24px",
      borderWidth: 6,
      depth: VILLAGE_UI_DEPTH + 30,
      stopPropagation: false,
      onPress: () => {
        this.actionQueued = true;
      },
    });
  }

  private hideOnboarding() {
    if (!this.onboarding?.visible || this.onboarding.alpha === 0) return;
    this.tweens.killTweensOf(this.onboarding);
    this.tweens.add({
      targets: this.onboarding,
      alpha: 0,
      y: 674,
      duration: 300,
      ease: "Sine.easeIn",
      onComplete: () => this.onboarding?.setVisible(false),
    });
  }

  private setPlayerFacing(direction: Phaser.Math.Vector2) {
    let nextFacing: PlayerFacing;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      nextFacing = direction.x < 0 ? "left" : "right";
    } else {
      nextFacing = direction.y < 0 ? "back" : "front";
    }

    if (nextFacing === this.playerFacing) return;
    this.playerFacing = nextFacing;
    const textureKey = `player-${nextFacing}`;
    if (this.textures.exists(textureKey)) {
      this.playerSprite
        ?.setTexture(textureKey)
        .setDisplaySize(88, 113)
        .setFlipX(false);
    }
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

    if (!this.nearestBuilding.available) {
      this.promptText?.setText("아직 준비 중이에요. 곧 만나요!");
      this.cameras.main.shake(110, 0.003);
      return;
    }

    this.cameras.main.fadeOut(230, 255, 245, 220);
    const destination = resolveFeatureSceneKey(
      this.nearestBuilding.destination.featureId,
    );
    this.time.delayedCall(230, () => this.scene.start(destination));
  }

  update(_time: number, delta: number) {
    if (!this.player) return;

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

    const direction = new Phaser.Math.Vector2(this.joystick.x, this.joystick.y);
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
        this.time.delayedCall(900, () => this.hideOnboarding());
      }
    } else {
      resetVillageMovementMemory(this.movementMemory);
      this.animatePlayer(false);
      this.player.rotation *= 0.8;
    }

    this.player.setDepth(getVillagePlayerDepth(this.player.y));
    updateVillageSceneryDepths(this.sceneryLayers, {
      x: this.player.x,
      y: this.player.y,
    });

    this.nearestBuilding = WORLD_MAP.portals.find((portal) => {
      const distance = Phaser.Math.Distance.Between(
        this.player!.x,
        this.player!.y,
        portal.position.x,
        portal.position.y,
      );
      switch (portal.interactionComparison) {
        case "strictly-less-than":
          return distance < portal.interactionRadius;
      }
    });

    if (this.nearestBuilding && this.prompt && this.promptText) {
      this.prompt
        .setVisible(true)
        .setPosition(this.player.x - 165, this.player.y - 165);
      this.promptText.setText(
        `${this.nearestBuilding.label}  ·  SPACE`,
      );
    } else {
      this.prompt?.setVisible(false);
    }

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
