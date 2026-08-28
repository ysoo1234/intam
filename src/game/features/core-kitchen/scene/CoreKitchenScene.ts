import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import {
  generateCustomerTexture,
  generatePlayerTexture,
} from "../../../core/visual/fallbackTextures";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { addFlowerBadge } from "../../../core/visual/uiPrimitives";
import {
  CORE_KINDS,
  CORE_KITCHEN_RULES,
  CORE_LANE_Y,
  countInstalledCoreKinds,
  getKitchenMistakeProgress,
  getKitchenStarRating,
  getKitchenSuccessProgress,
  getWrongCoreKinds,
} from "../model";
import { createCoreKitchenControls } from "./coreKitchenControls";
import {
  animateCoreKitchenPlayer,
  celebrateCoreKitchen,
  createCoreKitchenPuff,
  updateCoreKitchenPlayerFacing,
  vibrateDevice,
} from "./coreKitchenEffects";
import {
  createCoreKitchenChip,
  createCoreKitchenCustomer,
  createCoreKitchenDialogue,
  createCoreKitchenMachine,
  createCoreKitchenPlayer,
  drawCoreKitchenWorkshop,
} from "./coreKitchenView";
import {
  AI_CORES,
  CORE_KIND_META,
  KITCHEN_ORDERS,
  KITCHEN_ROUND_COUNT,
  type AiCore,
  type CoreKind,
  type KitchenOrder,
} from "../../../content/coreKitchen";

type MovingCore = {
  core: AiCore;
  container: Phaser.GameObjects.Container;
  direction: 1 | -1;
  speed: number;
};

type InstalledCore = {
  core: AiCore;
  source: MovingCore;
  visual: Phaser.GameObjects.Container;
};

export class CoreKitchenScene extends Phaser.Scene {
  private keys?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private rounds: KitchenOrder[] = [];
  private roundIndex = 0;
  private correctCount = 0;
  private mistakeCount = 0;
  private combo = 0;
  private inputLocked = false;
  private finished = false;
  private movingCores: MovingCore[] = [];
  private installed: Partial<Record<CoreKind, InstalledCore>> = {};
  private carried?: MovingCore;
  private carriedVisual?: Phaser.GameObjects.Container;
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private playerFacing: PlayerFacing = "front";
  private customerContainer?: Phaser.GameObjects.Container;
  private customerArt?: Phaser.GameObjects.Image;
  private situationContainer?: Phaser.GameObjects.Container;
  private situationIcon?: Phaser.GameObjects.Text;
  private dialogueLabel?: Phaser.GameObjects.Text;
  private dialogueText?: Phaser.GameObjects.Text;
  private helperText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private machineStatus?: Phaser.GameObjects.Text;
  private machineGlow?: Phaser.GameObjects.Ellipse;
  private actionText?: Phaser.GameObjects.Text;
  private joystick = new Phaser.Math.Vector2();
  private actionQueued = false;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.coreKitchen);
  }

  preload() {
    if (!this.textures.exists("ai-shop-interior")) {
      this.load.image("ai-shop-interior", GAME_ASSETS.shop.workshop);
    }
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    generatePlayerTexture(this);
    generateCustomerTexture(this);
    this.rounds = Phaser.Utils.Array.Shuffle([...KITCHEN_ORDERS]).slice(
      0,
      KITCHEN_ROUND_COUNT,
    );
    this.roundIndex = 0;
    this.correctCount = 0;
    this.mistakeCount = 0;
    this.combo = 0;
    this.inputLocked = false;
    this.finished = false;
    this.movingCores = [];
    this.installed = {};

    drawCoreKitchenWorkshop(this);
    ({ dialogueLabel: this.dialogueLabel, dialogueText: this.dialogueText } =
      createCoreKitchenDialogue(this));
    ({ machineGlow: this.machineGlow, machineStatus: this.machineStatus } =
      createCoreKitchenMachine(this, () => this.movePlayerToMachine()));
    ({
      player: this.player,
      playerSprite: this.playerSprite,
      playerShadow: this.playerShadow,
    } = createCoreKitchenPlayer(this));
    ({
      progressText: this.progressText,
      comboText: this.comboText,
      helperText: this.helperText,
      joystick: this.joystick,
      actionText: this.actionText,
    } = createCoreKitchenControls(
      this,
      () => this.returnToWorld(),
      () => {
        this.actionQueued = true;
      },
    ));

    this.keys = makeControlKeys(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.showRound();
    this.cameras.main.fadeIn(300, 255, 245, 220);
  }

  private spawnConveyors(order: KitchenOrder) {
    this.clearRoundCores();
    CORE_KINDS.forEach((kind, laneIndex) => {
      const correctId = order.recipe[kind];
      const correct = AI_CORES.find((core) => core.id === correctId);
      const distractors = Phaser.Utils.Array.Shuffle(
        AI_CORES.filter(
          (core) => core.kind === kind && core.id !== correctId,
        ),
      ).slice(0, 2);
      const options = correct
        ? Phaser.Utils.Array.Shuffle([correct, ...distractors])
        : distractors;
      const direction = (laneIndex % 2 === 0 ? 1 : -1) as 1 | -1;

      options.forEach((core, index) => {
        const chip = createCoreKitchenChip(this, core)
          .setPosition(300 + index * 235, CORE_LANE_Y[kind])
          .setDepth(13)
          .setSize(150, 62)
          .setInteractive({ useHandCursor: true });
        const moving: MovingCore = {
          core,
          container: chip,
          direction,
          speed: 22 + laneIndex * 4,
        };
        chip.on("pointerdown", () => this.pickCoreByTouch(moving));
        this.movingCores.push(moving);
      });
    });
  }

  private clearRoundCores() {
    this.carriedVisual?.destroy(true);
    this.carriedVisual = undefined;
    this.carried = undefined;
    this.movingCores.forEach((moving) => moving.container.destroy(true));
    this.movingCores = [];
    CORE_KINDS.forEach((kind) => {
      this.installed[kind]?.visual.destroy(true);
    });
    this.installed = {};
  }

  private pickCoreByTouch(moving: MovingCore) {
    if (
      this.inputLocked ||
      this.finished ||
      this.carried ||
      !moving.container.visible ||
      !this.player
    ) {
      return;
    }
    this.inputLocked = true;
    this.tweens.add({
      targets: this.player,
      x: moving.container.x,
      y: Phaser.Math.Clamp(moving.container.y + 54, 425, 670),
      duration: 220,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.inputLocked = false;
        this.pickupCore(moving);
      },
    });
  }

  private pickupCore(moving: MovingCore) {
    if (this.carried || !moving.container.visible) return;
    this.carried = moving;
    moving.container.setVisible(false);
    this.carriedVisual = createCoreKitchenChip(this, moving.core, true)
      .setDepth(31)
      .setScale(0);
    this.tweens.add({
      targets: this.carriedVisual,
      scale: 1,
      duration: 160,
      ease: "Back.easeOut",
    });
    this.helperText?.setText(
      `${moving.core.label} 코어를 들었어요. 오른쪽 제작기로 가져가세요!`,
    );
    this.actionText?.setText("놓기");
    createCoreKitchenPuff(this, this.player?.x ?? 600, this.player?.y ?? 600, CORE_KIND_META[moving.core.kind].color);
  }

  private dropCarriedCore() {
    if (!this.carried) return;
    this.carried.container
      .setPosition(
        Phaser.Math.Clamp(this.player?.x ?? 500, 230, 850),
        CORE_LANE_Y[this.carried.core.kind],
      )
      .setVisible(true);
    this.carried = undefined;
    this.carriedVisual?.destroy(true);
    this.carriedVisual = undefined;
    this.actionText?.setText("집기");
    this.helperText?.setText("필요한 코어 가까이에서 SPACE를 눌러 집으세요");
  }

  private movePlayerToMachine() {
    if (!this.player || this.inputLocked || this.finished) return;
    this.inputLocked = true;
    this.tweens.add({
      targets: this.player,
      x: 870,
      y: 555,
      duration: 230,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.inputLocked = false;
        this.interact();
      },
    });
  }

  private installCarriedCore() {
    const moving = this.carried;
    if (!moving) return;
    const kind = moving.core.kind;
    const previous = this.installed[kind];
    if (previous) {
      previous.source.container.setVisible(true);
      previous.visual.destroy(true);
    }

    const visual = createCoreKitchenChip(this, moving.core, true)
      .setPosition(1002, CORE_LANE_Y[kind])
      .setDepth(16)
      .setScale(0);
    this.installed[kind] = {
      core: moving.core,
      source: moving,
      visual,
    };
    this.carried = undefined;
    this.carriedVisual?.destroy(true);
    this.carriedVisual = undefined;
    this.actionText?.setText("집기");
    this.tweens.add({
      targets: visual,
      scale: 0.92,
      duration: 210,
      ease: "Back.easeOut",
    });
    createCoreKitchenPuff(this, 1002, CORE_LANE_Y[kind], CORE_KIND_META[kind].color);

    const installedCount = countInstalledCoreKinds(this.installed);
    this.machineStatus?.setText(
      installedCount === 3
        ? "조립 완료 · 시험 중!"
        : `코어 ${installedCount} / 3 장착`,
    );
    this.helperText?.setText(
      installedCount === 3
        ? "제작기가 조합을 시험하고 있어요..."
        : "다음 종류의 코어를 찾아보세요",
    );
    if (installedCount === 3) {
      this.inputLocked = true;
      this.time.delayedCall(420, () => this.testRecipe());
    }
  }

  private interact() {
    if (this.finished) {
      this.returnToWorld();
      return;
    }
    if (this.inputLocked || !this.player) return;

    if (this.carried) {
      const distanceToMachine = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        1002,
        550,
      );
      if (
        distanceToMachine < CORE_KITCHEN_RULES.machineInteractionDistance
      ) {
        this.installCarriedCore();
      } else {
        this.dropCarriedCore();
      }
      return;
    }

    const nearest = this.movingCores
      .filter((moving) => moving.container.visible)
      .map((moving) => ({
        moving,
        distance: Phaser.Math.Distance.Between(
          this.player!.x,
          this.player!.y,
          moving.container.x,
          moving.container.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance < CORE_KITCHEN_RULES.corePickupDistance) {
      this.pickupCore(nearest.moving);
      return;
    }

    this.helperText?.setText("코어 가까이로 이동한 뒤 SPACE를 눌러 보세요");
    this.tweens.add({
      targets: this.helperText,
      scale: 1.08,
      duration: 100,
      yoyo: true,
    });
  }

  private testRecipe() {
    const order = this.rounds[this.roundIndex];
    if (!order) return;
    const wrongKinds = getWrongCoreKinds(order.recipe, this.installed);
    if (wrongKinds.length === 0) {
      this.completeOrder(order);
      return;
    }

    ({ mistakeCount: this.mistakeCount, combo: this.combo } =
      getKitchenMistakeProgress(this.mistakeCount));
    this.updateCombo();
    this.cameras.main.shake(190, 0.006);
    vibrateDevice([35, 45, 35]);
    this.machineStatus?.setText("조합 오류! 다시 점검해요");
    this.dialogueLabel?.setText("시험 결과 · 아직 해결되지 않았어요");
    const firstWrongKind = wrongKinds[0];
    const meta = CORE_KIND_META[firstWrongKind];
    this.dialogueText?.setText(
      `${meta.shortLabel} 코어가 부탁과 맞지 않아요.\n“${meta.label}”를 다시 생각해 보세요.`,
    );
    this.helperText?.setText(
      "틀린 코어만 제작기에서 튕겨 나왔어요. 다시 골라 보세요!",
    );
    createCoreKitchenPuff(this, 1002, 545, COLORS.coral);

    wrongKinds.forEach((kind, index) => {
      const installed = this.installed[kind];
      if (!installed) return;
      delete this.installed[kind];
      this.tweens.add({
        targets: installed.visual,
        x: 850 - index * 55,
        y: 390,
        angle: index % 2 === 0 ? 140 : -140,
        alpha: 0,
        duration: 480,
        ease: "Back.easeIn",
        onComplete: () => {
          installed.visual.destroy(true);
          installed.source.container.setVisible(true);
        },
      });
    });

    this.time.delayedCall(1150, () => {
      this.dialogueLabel?.setText(
        `${order.field} · ${order.customerRole}의 주문`,
      );
      this.dialogueText?.setText(order.dialogue);
      this.machineStatus?.setText("코어를 다시 채워 주세요");
      this.inputLocked = false;
    });
  }

  private completeOrder(order: KitchenOrder) {
    ({ correctCount: this.correctCount, combo: this.combo } =
      getKitchenSuccessProgress(this.correctCount, this.combo));
    this.updateCombo();
    this.machineStatus?.setText(`완성 · ${order.solutionLabel}`);
    this.dialogueLabel?.setText(`제작 성공! · ${order.solutionLabel}`);
    this.dialogueText?.setText(order.explanation);
    this.helperText?.setText("손님의 문제를 해결하는 AI 장치가 완성됐어요!");
    this.progressText?.setText(
      `주문 ${this.roundIndex + 1} / ${this.rounds.length}   ✓ ${this.correctCount}`,
    );
    this.situationIcon?.setText(order.solvedIcon);
    vibrateDevice(30);

    if (this.machineGlow) {
      this.tweens.add({
        targets: this.machineGlow,
        alpha: 0.9,
        scale: 1.4,
        duration: 300,
        yoyo: true,
        repeat: 2,
        ease: "Sine.easeOut",
      });
    }
    CORE_KINDS.forEach((kind, index) => {
      const visual = this.installed[kind]?.visual;
      if (!visual) return;
      this.tweens.add({
        targets: visual,
        angle: 360,
        scale: 1.12,
        duration: 480,
        delay: index * 90,
        ease: "Back.easeOut",
      });
    });

    const result = this.add.container(1000, 545).setDepth(35).setScale(0);
    const resultShape = this.add.graphics();
    resultShape.fillStyle(COLORS.yellow, 1);
    resultShape.fillCircle(0, 0, 79);
    resultShape.lineStyle(7, COLORS.ink, 1);
    resultShape.strokeCircle(0, 0, 79);
    resultShape.fillStyle(COLORS.paper, 1);
    resultShape.fillCircle(0, 0, 61);
    const resultIcon = this.add
      .text(0, -15, order.solvedIcon, { fontSize: "36px" })
      .setOrigin(0.5);
    const resultName = this.add
      .text(0, 31, order.solutionLabel, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 110 },
      })
      .setOrigin(0.5);
    result.add([resultShape, resultIcon, resultName]);
    this.tweens.add({
      targets: result,
      scale: 1,
      angle: 360,
      duration: 520,
      ease: "Back.easeOut",
    });
    createCoreKitchenPuff(this, 1000, 545, COLORS.mint);
    celebrateCoreKitchen(this, false, this.combo);

    this.time.delayedCall(2300, () => {
      this.tweens.add({
        targets: result,
        x: 820,
        y: 335,
        scale: 0.72,
        duration: 430,
        ease: "Sine.easeInOut",
        onComplete: () => result.destroy(true),
      });
      if (this.customerArt) {
        this.tweens.add({
          targets: this.customerArt,
          y: -20,
          angle: -4,
          duration: 150,
          yoyo: true,
          repeat: 2,
        });
      }
    });

    this.time.delayedCall(3100, () => {
      if (this.roundIndex >= this.rounds.length - 1) {
        this.finishGame();
        return;
      }
      this.roundIndex += 1;
      this.showRound();
    });
  }

  private showRound() {
    const order = this.rounds[this.roundIndex];
    if (!order) {
      this.finishGame();
      return;
    }
    this.inputLocked = false;
    this.clearRoundCores();
    this.dialogueLabel?.setText(
      `${order.field} · ${order.customerRole}의 주문`,
    );
    this.dialogueText?.setText(order.dialogue);
    this.helperText?.setText(
      "감각·생각·행동 코어를 하나씩 모아 AI 장치를 만들어 보세요",
    );
    this.progressText?.setText(
      `주문 ${this.roundIndex + 1} / ${this.rounds.length}   ✓ ${this.correctCount}`,
    );
    this.updateCombo();
    this.machineStatus?.setText("코어 3개를 모아 주세요");
    this.actionText?.setText("집기");
    ({
      customerContainer: this.customerContainer,
      customerArt: this.customerArt,
      situationContainer: this.situationContainer,
      situationIcon: this.situationIcon,
    } = createCoreKitchenCustomer(
      this,
      order,
      this.customerContainer,
      this.situationContainer,
    ));
    this.spawnConveyors(order);
    this.player?.setPosition(620, 670);
  }

  private updateCombo() {
    this.comboText?.setText(
      this.combo >= 2 ? `⚡ 연속 제작 ${this.combo}` : "AI 코어 조립 중",
    );
  }

  private finishGame() {
    this.finished = true;
    this.inputLocked = false;
    this.clearRoundCores();
    this.player?.setVisible(false);
    this.customerContainer?.setVisible(false);
    this.situationContainer?.setVisible(false);
    this.dialogueLabel?.setText("오늘의 AI 제작 완료!");
    this.dialogueText?.setText(
      `손님 ${this.correctCount}명의 부탁을 분석하고 알맞은 AI 장치를 직접 만들었어요.`,
    );
    this.helperText?.setText("SPACE 또는 오른쪽 버튼을 눌러 마을로 돌아가요");
    this.progressText?.setText(`완료   ✓ ${this.correctCount}`);
    this.comboText?.setText(`코어 재시험 ${this.mistakeCount}회`);
    this.machineStatus?.setText("영업 완료!");
    this.actionText?.setText("마을");

    const stars = getKitchenStarRating(this.mistakeCount);
    const badge = addFlowerBadge(this, 640, 365, stars, COLORS.yellow)
      .setDepth(50)
      .setScale(0);
    badge.getAll().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text) child.setFontSize(18);
    });
    this.tweens.add({
      targets: badge,
      scale: 1.65,
      angle: 360,
      duration: 560,
      ease: "Back.easeOut",
    });
    celebrateCoreKitchen(this, true, this.combo);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start(SCENE_KEYS.world));
  }

  update(_time: number, delta: number) {
    this.movingCores.forEach((moving) => {
      moving.container.x +=
        moving.direction * moving.speed * (delta / 1000);
      if (
        moving.direction > 0 &&
        moving.container.x > CORE_KITCHEN_RULES.conveyorWrapMaxX
      ) {
        moving.container.x = CORE_KITCHEN_RULES.conveyorWrapMinX;
      } else if (
        moving.direction < 0 &&
        moving.container.x < CORE_KITCHEN_RULES.conveyorWrapMinX
      ) {
        moving.container.x = CORE_KITCHEN_RULES.conveyorWrapMaxX;
      }
    });

    if (!this.player || !this.keys) return;
    const direction = new Phaser.Math.Vector2(this.joystick.x, this.joystick.y);
    if (!this.inputLocked && !this.finished) {
      if (this.cursors?.left.isDown || this.keys.left.isDown) direction.x -= 1;
      if (this.cursors?.right.isDown || this.keys.right.isDown) direction.x += 1;
      if (this.cursors?.up.isDown || this.keys.up.isDown) direction.y -= 1;
      if (this.cursors?.down.isDown || this.keys.down.isDown) direction.y += 1;
    }
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.playerFacing = updateCoreKitchenPlayerFacing(
        this,
        direction,
        this.playerFacing,
        this.playerSprite,
      );
      animateCoreKitchenPlayer(
        this,
        this.playerSprite,
        this.playerShadow,
        true,
      );
      const speed = CORE_KITCHEN_RULES.playerSpeed * (delta / 1000);
      this.player.x = Phaser.Math.Clamp(
        this.player.x + direction.x * speed,
        170,
        895,
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + direction.y * speed,
        415,
        675,
      );
    } else {
      animateCoreKitchenPlayer(
        this,
        this.playerSprite,
        this.playerShadow,
        false,
      );
    }

    if (this.carriedVisual) {
      this.carriedVisual.setPosition(this.player.x, this.player.y - 66);
    }

    const keyboardAction =
      Phaser.Input.Keyboard.JustDown(this.keys.action) ||
      Phaser.Input.Keyboard.JustDown(this.keys.enter);
    if (keyboardAction || this.actionQueued) {
      this.actionQueued = false;
      this.interact();
    }
  }
}
