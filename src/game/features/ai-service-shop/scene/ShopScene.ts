import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import {
  makeControlKeys,
  type ControlKeys,
} from "../../../core/input/controlKeys";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import {
  generateCustomerTexture,
  generatePlayerTexture,
} from "../../../core/visual/fallbackTextures";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { addFlowerBadge } from "../../../core/visual/uiPrimitives";
import {
  AI_SERVICE_SHOP_LAYOUT,
  getServiceChoiceCount,
  getServiceMistakeProgress,
  getServicePadIndices,
  getServiceStarCount,
  getServiceSuccessProgress,
  isCorrectServiceChoice,
} from "../model";
import { createShopControls } from "./shopControls";
import {
  celebrateShop,
  createShopPuff,
  vibrateDevice,
} from "./shopEffects";
import { generateAiToolTextures } from "./shopToolTextures";
import { createShopDialogue, drawShopInterior } from "./shopView";
import {
  AI_SERVICE_QUESTIONS,
  AI_SERVICE_ROUND_COUNT,
  AI_TOOLS,
  type AiServiceQuestion,
  type AiTool,
} from "../../../content/questions";

type PlateChoice = {
  tool: AiTool;
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  content: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  stamp: Phaser.GameObjects.Container;
  homeX: number;
};

export class ShopScene extends Phaser.Scene {
  private keys?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private choices: PlateChoice[] = [];
  private inactiveCovers: Phaser.GameObjects.Container[] = [];
  private rounds: AiServiceQuestion[] = [];
  private roundIndex = 0;
  private selectedIndex = 0;
  private correctCount = 0;
  private mistakeCount = 0;
  private combo = 0;
  private missedCurrentRound = false;
  private inputLocked = false;
  private finished = false;
  private dialogueText?: Phaser.GameObjects.Text;
  private dialogueLabel?: Phaser.GameObjects.Text;
  private helperText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private serveText?: Phaser.GameObjects.Text;
  private customerContainer?: Phaser.GameObjects.Container;
  private customerArt?: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private situationContainer?: Phaser.GameObjects.Container;
  private situationIcon?: Phaser.GameObjects.Text;
  private situationCaption?: Phaser.GameObjects.Text;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.aiServiceShop);
  }

  preload() {
    this.load.image("ai-shop-interior", GAME_ASSETS.shop.interior);
    AI_TOOLS.forEach((tool) => {
      this.load.image(`ai-tool-${tool.id}`, tool.image);
    });
    AI_SERVICE_QUESTIONS.forEach((question) => {
      this.load.image(`customer-${question.id}`, question.customerImage);
    });
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    generatePlayerTexture(this);
    generateCustomerTexture(this);
    generateAiToolTextures(this);
    this.rounds = Phaser.Utils.Array.Shuffle([
      ...AI_SERVICE_QUESTIONS,
    ]).slice(0, AI_SERVICE_ROUND_COUNT);
    this.roundIndex = 0;
    this.selectedIndex = 0;
    this.correctCount = 0;
    this.mistakeCount = 0;
    this.combo = 0;
    this.missedCurrentRound = false;
    this.inputLocked = false;
    this.finished = false;
    this.choices = [];
    this.inactiveCovers = [];

    drawShopInterior(this);
    ({ dialogueLabel: this.dialogueLabel, dialogueText: this.dialogueText } =
      createShopDialogue(this));
    ({
      helperText: this.helperText,
      serveText: this.serveText,
      progressText: this.progressText,
      comboText: this.comboText,
    } = createShopControls(
      this,
      () => this.returnToWorld(),
      () => this.serveSelected(),
    ));

    this.keys = makeControlKeys(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.showRound();
    this.cameras.main.fadeIn(300, 255, 245, 220);
  }

  private createCustomer(question: AiServiceQuestion) {
    this.customerContainer?.destroy(true);
    this.situationContainer?.destroy(true);

    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.ink, 0.18);
    shadow.fillEllipse(0, 61, 128, 25);

    const textureKey = `customer-${question.id}`;
    if (this.textures.exists(textureKey)) {
      this.customerArt = this.add
        .image(0, 0, textureKey)
        .setDisplaySize(130, 145);
    } else {
      this.customerArt = this.add
        .image(0, 0, "customer-fallback")
        .setDisplaySize(145, 143);
    }

    const roleBadge = this.add.graphics();
    roleBadge.fillStyle(COLORS.ink, 0.2);
    roleBadge.fillCircle(58, -39, 29);
    roleBadge.fillStyle(question.customerTone, 1);
    roleBadge.fillCircle(55, -43, 27);
    roleBadge.lineStyle(4, COLORS.ink, 1);
    roleBadge.strokeCircle(55, -43, 27);
    roleBadge.fillStyle(COLORS.cream, 1);
    roleBadge.fillCircle(55, -43, 20);
    const roleEmoji = this.add
      .text(55, -43, question.customerEmoji, { fontSize: "25px" })
      .setOrigin(0.5);

    const ribbon = this.add.graphics();
    ribbon.fillStyle(COLORS.ink, 0.22);
    ribbon.fillRoundedRect(-116, 80, 238, 52, 24);
    ribbon.fillStyle(COLORS.paper, 1);
    ribbon.lineStyle(4, COLORS.ink, 1);
    ribbon.fillRoundedRect(-122, 74, 238, 52, 24);
    ribbon.strokeRoundedRect(-122, 74, 238, 52, 24);

    const role = this.add
      .text(-3, 86, question.customerRole, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.customerContainer = this.add
      .container(-160, 350, [
        shadow,
        this.customerArt,
        roleBadge,
        roleEmoji,
        ribbon,
        role,
      ])
      .setDepth(9);

    this.tweens.add({
      targets: this.customerContainer,
      x: 535,
      duration: 620,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.customerArt,
      y: -6,
      angle: 1,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const situationBlob = this.add.graphics();
    situationBlob.fillStyle(COLORS.ink, 0.18);
    situationBlob.fillCircle(4, 6, 52);
    situationBlob.fillStyle(COLORS.cream, 0.98);
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      situationBlob.fillCircle(
        Math.cos(angle) * 36,
        Math.sin(angle) * 36,
        19,
      );
    }
    situationBlob.fillStyle(COLORS.paper, 1);
    situationBlob.fillCircle(0, 0, 44);
    situationBlob.lineStyle(4, COLORS.ink, 1);
    situationBlob.strokeCircle(0, 0, 44);

    this.situationIcon = this.add
      .text(0, -2, question.problemIcon, { fontSize: "34px" })
      .setOrigin(0.5);
    this.situationCaption = this.add
      .text(0, 67, question.situation, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 180 },
        stroke: "#fff5dc",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.situationContainer = this.add
      .container(765, 350, [
        situationBlob,
        this.situationIcon,
        this.situationCaption,
      ])
      .setDepth(9)
      .setScale(0)
      .setAlpha(0);
    this.tweens.add({
      targets: this.situationContainer,
      scale: 1,
      alpha: 1,
      duration: 420,
      delay: 360,
      ease: "Back.easeOut",
    });
  }

  private createToolVisual(
    tool: AiTool,
    x: number,
    y: number,
    size = 70,
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
    if (this.textures.exists(`ai-tool-${tool.id}`)) {
      return this.add
        .image(x, y, `ai-tool-${tool.id}`)
        .setDisplaySize(size, size);
    }
    return this.add
      .text(x, y, tool.fallbackEmoji, { fontSize: `${size - 12}px` })
      .setOrigin(0.5);
  }

  private getToolsForRound(question: AiServiceQuestion) {
    const choiceCount = getServiceChoiceCount(this.roundIndex);
    const answer = AI_TOOLS.find((tool) => tool.id === question.answerId);
    const distractors = Phaser.Utils.Array.Shuffle(
      question.choiceIds
        .filter((id) => id !== question.answerId)
        .map((id) => AI_TOOLS.find((tool) => tool.id === id))
        .filter((tool): tool is AiTool => Boolean(tool)),
    ).slice(0, choiceCount - 1);

    return answer
      ? Phaser.Utils.Array.Shuffle([answer, ...distractors])
      : distractors;
  }

  private createChoices(question: AiServiceQuestion) {
    this.choices.forEach((choice) => choice.container.destroy(true));
    this.inactiveCovers.forEach((cover) => cover.destroy(true));
    this.choices = [];
    this.inactiveCovers = [];

    const tools = this.getToolsForRound(question);
    const padIndices = getServicePadIndices(tools.length);
    const usedPads = new Set(padIndices);

    AI_SERVICE_SHOP_LAYOUT.padXs.forEach((x, padIndex) => {
      if (usedPads.has(padIndex)) return;
      const shape = this.add.graphics();
      shape.fillStyle(COLORS.ink, 0.12);
      shape.fillCircle(4, 6, 38);
      shape.fillStyle(COLORS.cream, 0.78);
      shape.fillCircle(0, 0, 35);
      shape.lineStyle(4, COLORS.ink, 0.45);
      shape.strokeCircle(0, 0, 35);
      const icon = this.add
        .text(0, -2, padIndex % 2 === 0 ? "⚙" : "✿", {
          color: "#70a58d",
          fontFamily: FONT_FAMILY,
          fontSize: "32px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const cover = this.add
        .container(x, AI_SERVICE_SHOP_LAYOUT.padY, [shape, icon])
        .setDepth(14)
        .setAlpha(0.64);
      this.tweens.add({
        targets: cover,
        angle: padIndex % 2 === 0 ? 10 : -10,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.inactiveCovers.push(cover);
    });

    this.choices = tools.map((tool, index) => {
      const padIndex = padIndices[index];
      const homeX = AI_SERVICE_SHOP_LAYOUT.padXs[padIndex];
      const container = this.add
        .container(1340 + index * 90, AI_SERVICE_SHOP_LAYOUT.padY)
        .setDepth(15)
        .setSize(185, 150)
        .setInteractive({ useHandCursor: true });

      const ring = this.add.graphics();
      const content = this.createToolVisual(tool, 0, -7, 76);

      const name = this.add
        .text(0, 99, tool.label, {
          color: "#fff9e9",
          fontFamily: FONT_FAMILY,
          fontSize: "19px",
          fontStyle: "bold",
          stroke: "#173f43",
          strokeThickness: 7,
          align: "center",
          wordWrap: { width: 180 },
        })
        .setOrigin(0.5);

      const stampShape = this.add.graphics();
      stampShape.fillStyle(COLORS.mint, 1);
      stampShape.fillCircle(0, 0, 27);
      stampShape.lineStyle(4, COLORS.ink, 1);
      stampShape.strokeCircle(0, 0, 27);
      const stampText = this.add
        .text(0, -2, "✓", {
          color: "#173f43",
          fontFamily: FONT_FAMILY,
          fontSize: "28px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const stamp = this.add
        .container(54, -42, [stampShape, stampText])
        .setVisible(false);

      container.setAlpha(0.2).setScale(0.72);
      container.add([ring, content, name, stamp]);
      container.on("pointerdown", () => {
        if (this.finished) {
          this.returnToWorld();
          return;
        }
        if (this.inputLocked) return;
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.tweens.add({
        targets: container,
        x: homeX,
        alpha: 1,
        scale: 1,
        duration: 540,
        delay: 100 + index * 90,
        ease: "Back.easeOut",
      });

      return { tool, container, ring, content, stamp, homeX };
    });
  }

  private updateSelection() {
    this.choices.forEach((choice, index) => {
      choice.ring.clear();
      if (index === this.selectedIndex) {
        choice.ring.lineStyle(9, COLORS.yellow, 1);
        choice.ring.strokeEllipse(0, 2, 181, 111);
        choice.ring.fillStyle(COLORS.yellow, 1);
        choice.ring.fillTriangle(-16, -69, 16, -69, 0, -49);
        this.tweens.add({
          targets: choice.container,
          y: AI_SERVICE_SHOP_LAYOUT.padY - 10,
          duration: 130,
          ease: "Back.easeOut",
        });
        this.tweens.add({
          targets: choice.content,
          scale: 1.08,
          duration: 120,
          yoyo: true,
          ease: "Sine.easeOut",
        });
      } else {
        this.tweens.add({
          targets: choice.container,
          y: AI_SERVICE_SHOP_LAYOUT.padY,
          duration: 120,
        });
      }
    });
  }

  private showRound() {
    const question = this.rounds[this.roundIndex];
    if (!question) {
      this.finishGame();
      return;
    }

    this.inputLocked = false;
    this.selectedIndex = 0;
    this.missedCurrentRound = false;
    this.dialogueLabel?.setText(
      `${question.field} 속 AI 찾기  ·  ${question.customerRole}의 부탁`,
    );
    this.dialogueText?.setText(question.dialogue);
    this.helperText?.setText(
      "← → 로 도구를 고르고  SPACE 로 손님에게 건네주세요",
    );
    this.progressText?.setText(
      `손님 ${this.roundIndex + 1} / ${this.rounds.length}   ✓ ${this.correctCount}`,
    );
    this.updateCombo();
    this.createCustomer(question);
    this.createChoices(question);
    this.updateSelection();
  }

  private updateCombo() {
    if (!this.comboText) return;
    this.comboText.setText(
      this.combo >= 2 ? `✨ 연속 해결 ${this.combo}` : "도구를 골라 주세요!",
    );
    if (this.combo >= 2) {
      this.tweens.add({
        targets: this.comboText,
        scale: 1.18,
        duration: 120,
        yoyo: true,
        ease: "Back.easeOut",
      });
    }
  }

  private animateDelivery(
    choice: PlateChoice,
    isCorrect: boolean,
    onArrive: () => void,
  ) {
    const delivery = this.createToolVisual(
      choice.tool,
      choice.container.x,
      choice.container.y - 8,
      78,
    )
      .setDepth(42)
      .setScale(1);

    this.tweens.add({
      targets: delivery,
      x: 660,
      y: 350,
      scale: 0.78,
      angle: isCorrect ? 360 : 18,
      duration: 430,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        onArrive();
        if (isCorrect) {
          this.tweens.add({
            targets: delivery,
            alpha: 0,
            scale: 1.45,
            duration: 240,
            onComplete: () => delivery.destroy(),
          });
        } else {
          this.tweens.add({
            targets: delivery,
            x: choice.homeX,
            y: 650,
            angle: -160,
            alpha: 0,
            duration: 470,
            ease: "Quad.easeIn",
            onComplete: () => delivery.destroy(),
          });
        }
      },
    });
  }

  private serveSelected() {
    if (this.finished) {
      this.returnToWorld();
      return;
    }
    if (this.inputLocked) return;

    const choice = this.choices[this.selectedIndex];
    const question = this.rounds[this.roundIndex];
    if (!choice || !question) return;

    const isCorrect = isCorrectServiceChoice(
      choice.tool.id,
      question.answerId,
    );
    if (!isCorrect) {
      this.inputLocked = true;
      ({ mistakeCount: this.mistakeCount, combo: this.combo } =
        getServiceMistakeProgress(this.mistakeCount));
      this.missedCurrentRound = true;
      this.updateCombo();
      this.dialogueText?.setText(
        `앗, “${choice.tool.label}”은(는) 다른 일을 해요.\n${choice.tool.description}`,
      );
      this.helperText?.setText(
        "도구가 엉뚱하게 작동했어요! 설명을 보고 다시 골라 보세요",
      );
      choice.ring.clear();
      choice.ring.lineStyle(10, COLORS.coralDark, 1);
      choice.ring.strokeEllipse(0, 2, 181, 111);

      this.animateDelivery(choice, false, () => {
        vibrateDevice([35, 45, 35]);
        this.cameras.main.shake(150, 0.004);
        createShopPuff(this, 660, 350, COLORS.coral);
        if (this.customerContainer) {
          this.tweens.add({
            targets: this.customerContainer,
            angle: 4,
            x: 548,
            duration: 65,
            yoyo: true,
            repeat: 3,
          });
        }
      });

      this.time.delayedCall(1400, () => {
        this.dialogueText?.setText(question.dialogue);
        this.helperText?.setText(
          "괜찮아요! 다른 AI 도구를 골라 다시 건네주세요",
        );
        this.inputLocked = false;
        this.updateSelection();
      });
      return;
    }

    this.inputLocked = true;
    ({ correctCount: this.correctCount, combo: this.combo } =
      getServiceSuccessProgress(
        this.correctCount,
        this.combo,
        this.missedCurrentRound,
      ));
    this.updateCombo();
    choice.stamp.setVisible(true);
    this.dialogueLabel?.setText(`해결!  ·  ${choice.tool.label}`);
    this.dialogueText?.setText(question.solutionCaption);
    this.helperText?.setText(
      this.combo >= 2
        ? `연속 ${this.combo}번 해결! 가게가 반짝이고 있어요`
        : "딱 맞는 AI 도구예요! 손님의 문제가 해결됐어요",
    );
    this.progressText?.setText(
      `손님 ${this.roundIndex + 1} / ${this.rounds.length}   ✓ ${this.correctCount}`,
    );
    this.tweens.add({
      targets: choice.content,
      scale: 1.28,
      angle: 8,
      duration: 160,
      yoyo: true,
      ease: "Back.easeOut",
    });

    this.animateDelivery(choice, true, () => {
      vibrateDevice(28);
      this.situationIcon?.setText(question.solvedIcon);
      this.situationCaption?.setText(question.solutionCaption);
      createShopPuff(this, 765, 350, COLORS.mint);
      if (this.situationContainer) {
        this.tweens.add({
          targets: this.situationContainer,
          scale: 1.16,
          angle: 4,
          duration: 180,
          yoyo: true,
          ease: "Back.easeOut",
        });
      }
      if (this.customerArt) {
        this.tweens.add({
          targets: this.customerArt,
          y: -22,
          angle: -5,
          duration: 140,
          yoyo: true,
          repeat: 2,
          ease: "Back.easeOut",
        });
      }
      celebrateShop(this, false, this.combo);
    });

    this.time.delayedCall(2100, () => {
      if (this.roundIndex >= this.rounds.length - 1) {
        this.finishGame();
        return;
      }

      if (this.customerContainer) {
        this.tweens.add({
          targets: this.customerContainer,
          x: 1380,
          alpha: 0,
          duration: 420,
          ease: "Back.easeIn",
          onComplete: () => {
            this.roundIndex += 1;
            this.showRound();
          },
        });
      }
    });
  }

  private finishGame() {
    this.finished = true;
    this.inputLocked = true;
    const stars = getServiceStarCount(this.mistakeCount);
    const starLine = "★".repeat(stars) + "☆".repeat(3 - stars);

    this.choices.forEach((choice) => {
      this.tweens.add({
        targets: choice.container,
        alpha: 0.22,
        y: 580,
        duration: 320,
      });
    });
    this.dialogueLabel?.setText("AI 가게 영업 완료!");
    this.dialogueText?.setText(
      `손님 ${this.correctCount}명의 생활 속 문제를 모두 해결했어요!\nAI가 어떤 일을 하는지 아주 잘 찾아냈어요.`,
    );
    this.helperText?.setText(
      "SPACE를 누르거나 오른쪽 꽃 버튼을 눌러 마을로 돌아가요",
    );
    this.progressText?.setText(`완료   ✓ ${this.correctCount}`);
    this.comboText?.setText(`다시 고른 횟수 ${this.mistakeCount}`);
    this.serveText?.setText("마을");
    this.customerContainer?.setVisible(false);
    this.situationContainer?.setVisible(false);

    const badge = addFlowerBadge(this, 640, 365, starLine, COLORS.yellow)
      .setDepth(45)
      .setScale(0)
      .setAlpha(0);
    badge.getAll().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text) {
        child.setFontSize(18);
      }
    });
    this.tweens.add({
      targets: badge,
      scale: 1.65,
      alpha: 1,
      angle: 360,
      duration: 560,
      ease: "Back.easeOut",
    });
    celebrateShop(this, true, this.combo);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start(SCENE_KEYS.world));
  }

  update() {
    if (!this.keys) return;

    const canMoveSelection = !this.inputLocked && !this.finished;
    const pressedLeft =
      Phaser.Input.Keyboard.JustDown(this.keys.left) ||
      Boolean(
        this.cursors &&
          Phaser.Input.Keyboard.JustDown(this.cursors.left),
      );
    if (canMoveSelection && pressedLeft) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.choices.length) % this.choices.length;
      this.updateSelection();
    }
    const pressedRight =
      Phaser.Input.Keyboard.JustDown(this.keys.right) ||
      Boolean(
        this.cursors &&
          Phaser.Input.Keyboard.JustDown(this.cursors.right),
      );
    if (canMoveSelection && pressedRight) {
      this.selectedIndex = (this.selectedIndex + 1) % this.choices.length;
      this.updateSelection();
    }
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.action) ||
      Phaser.Input.Keyboard.JustDown(this.keys.enter)
    ) {
      this.serveSelected();
    }
  }
}
