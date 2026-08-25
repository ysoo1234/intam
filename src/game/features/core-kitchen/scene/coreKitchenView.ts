import Phaser from "phaser";
import { GAME_SIZE } from "../../../assets";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import {
  CORE_KIND_META,
  type AiCore,
  type KitchenOrder,
} from "../../../content/coreKitchen";
import { CORE_KINDS, CORE_LANE_Y } from "../model";

export function drawCoreKitchenWorkshop(scene: Phaser.Scene) {
    scene.add
      .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "ai-shop-interior")
      .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);

    scene.add
      .rectangle(640, 553, 980, 296, 0x102f33, 0.84)
      .setStrokeStyle(7, COLORS.ink, 0.95)
      .setDepth(5);
    scene.add
      .text(26, 28, "미디의 AI 미래 해결상점", {
        color: "#fff7e5",
        fontFamily: FONT_FAMILY,
        fontSize: "27px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setDepth(30);

    CORE_KINDS.forEach((kind, laneIndex) => {
      const y = CORE_LANE_Y[kind];
      const meta = CORE_KIND_META[kind];
      const belt = scene.add.graphics().setDepth(7);
      belt.fillStyle(COLORS.ink, 0.34);
      belt.fillRoundedRect(176, y - 33, 700, 66, 25);
      belt.lineStyle(5, COLORS.ink, 0.9);
      belt.strokeRoundedRect(176, y - 33, 700, 66, 25);
      belt.lineStyle(3, meta.color, 0.7);
      for (let x = 205; x < 860; x += 48) {
        belt.lineBetween(
          x,
          y + 24,
          x + (laneIndex % 2 === 0 ? 18 : -18),
          y - 24,
        );
      }

      const tag = scene.add.graphics().setDepth(10);
      tag.fillStyle(meta.color, 1);
      tag.fillCircle(128, y, 35);
      tag.lineStyle(5, COLORS.ink, 1);
      tag.strokeCircle(128, y, 35);
      scene.add
        .text(128, y - 3, meta.shortLabel, {
          color: "#173f43",
          fontFamily: FONT_FAMILY,
          fontSize: "17px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(11);
    });
  
}

export function createCoreKitchenDialogue(scene: Phaser.Scene) {
    const dialogueLabel = scene.add
      .text(478, 100, "", {
        color: "#2a877f",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setDepth(32);
    const dialogueText = scene.add
      .text(478, 130, "", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        lineSpacing: 8,
        wordWrap: { width: 335 },
      })
      .setDepth(32);
  
  return { dialogueLabel, dialogueText };
}

export function createCoreKitchenMachine(
  scene: Phaser.Scene,
  onActivate: () => void,
) {
    const x = 1006;
    const y = 548;
    const machineGlow = scene.add
      .ellipse(x, y, 210, 270, COLORS.blue, 0.12)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const machine = scene.add.graphics().setDepth(8);
    const body = [
      new Phaser.Math.Vector2(x - 90, y - 130),
      new Phaser.Math.Vector2(x + 65, y - 130),
      new Phaser.Math.Vector2(x + 105, y - 88),
      new Phaser.Math.Vector2(x + 105, y + 105),
      new Phaser.Math.Vector2(x + 65, y + 140),
      new Phaser.Math.Vector2(x - 90, y + 140),
      new Phaser.Math.Vector2(x - 116, y + 105),
      new Phaser.Math.Vector2(x - 116, y - 88),
    ];
    machine.fillStyle(COLORS.ink, 0.28);
    machine.fillPoints(
      body.map((point) => new Phaser.Math.Vector2(point.x + 8, point.y + 9)),
      true,
    );
    machine.fillStyle(0xf1c06b, 1);
    machine.fillPoints(body, true);
    machine.lineStyle(6, COLORS.ink, 1);
    machine.strokePoints(body, true);
    machine.fillStyle(0x164b52, 1);
    machine.fillRoundedRect(x - 95, y - 105, 180, 218, 26);
    machine.lineStyle(4, 0x86edf1, 0.8);
    machine.strokeRoundedRect(x - 95, y - 105, 180, 218, 26);

    scene.add
      .text(x - 5, y - 151, "AI 제작기", {
        color: "#fff3bd",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(12);

    CORE_KINDS.forEach((kind) => {
      const slotY = CORE_LANE_Y[kind];
      const meta = CORE_KIND_META[kind];
      const slot = scene.add.graphics().setDepth(10);
      slot.fillStyle(COLORS.ink, 0.62);
      slot.fillRoundedRect(x - 72, slotY - 24, 136, 48, 18);
      slot.lineStyle(4, meta.color, 0.8);
      slot.strokeRoundedRect(x - 72, slotY - 24, 136, 48, 18);
      scene.add
        .text(x - 4, slotY, `${meta.shortLabel} 코어`, {
          color: "#8db4b0",
          fontFamily: FONT_FAMILY,
          fontSize: "14px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(11);
    });

    const machineStatus = scene.add
      .text(x - 5, 680, "코어 3개를 모아 주세요", {
        color: "#fff5cd",
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 220 },
      })
      .setOrigin(0.5)
      .setDepth(12);

    scene.add
      .zone(x, y, 235, 305)
      .setInteractive({ useHandCursor: true })
      .setDepth(14)
      .on("pointerdown", () => onActivate());
  
  return { machineGlow, machineStatus };
}

export function createCoreKitchenPlayer(scene: Phaser.Scene) {
    const playerShadow = scene.add.ellipse(0, 29, 55, 14, COLORS.ink, 0.25);
    const playerSprite = scene.add
      .image(0, 0, "player-front")
      .setDisplaySize(58, 75)
      .setOrigin(0.5, 0.84);
    const player = scene.add
      .container(620, 670, [playerShadow, playerSprite])
      .setDepth(24);
  
  return { player, playerSprite, playerShadow };
}

export function createCoreKitchenCustomer(
  scene: Phaser.Scene,
  order: KitchenOrder,
  currentCustomerContainer?: Phaser.GameObjects.Container,
  currentSituationContainer?: Phaser.GameObjects.Container,
) {
    currentCustomerContainer?.destroy(true);
    currentSituationContainer?.destroy(true);

    const shadow = scene.add.ellipse(0, 59, 120, 23, COLORS.ink, 0.18);
    const customerArt = scene.add
      .image(0, 0, "customer-fallback")
      .setDisplaySize(138, 136);
    const badge = scene.add
      .circle(55, -42, 27, order.customerTone)
      .setStrokeStyle(4, COLORS.ink, 1);
    const emoji = scene.add
      .text(55, -42, order.customerEmoji, { fontSize: "25px" })
      .setOrigin(0.5);
    const ribbon = scene.add.graphics();
    ribbon.fillStyle(COLORS.paper, 1);
    ribbon.lineStyle(4, COLORS.ink, 1);
    ribbon.fillRoundedRect(-116, 75, 232, 48, 22);
    ribbon.strokeRoundedRect(-116, 75, 232, 48, 22);
    const role = scene.add
      .text(0, 87, order.customerRole, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const customerContainer = scene.add
      .container(-160, 335, [
        shadow,
        customerArt,
        badge,
        emoji,
        ribbon,
        role,
      ])
      .setDepth(20);
    scene.tweens.add({
      targets: customerContainer,
      x: 360,
      duration: 540,
      ease: "Back.easeOut",
    });
    scene.tweens.add({
      targets: customerArt,
      y: -5,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const situationShape = scene.add.graphics();
    situationShape.fillStyle(COLORS.paper, 0.98);
    situationShape.fillCircle(0, 0, 45);
    situationShape.lineStyle(4, COLORS.ink, 1);
    situationShape.strokeCircle(0, 0, 45);
    const situationIcon = scene.add
      .text(0, -2, order.problemIcon, { fontSize: "34px" })
      .setOrigin(0.5);
    const situationContainer = scene.add
      .container(840, 335, [situationShape, situationIcon])
      .setDepth(20)
      .setScale(0);
    scene.tweens.add({
      targets: situationContainer,
      scale: 1,
      duration: 360,
      delay: 250,
      ease: "Back.easeOut",
    });
  
  return {
    customerContainer,
    customerArt,
    situationContainer,
    situationIcon,
  };
}

export function createCoreKitchenChip(
  scene: Phaser.Scene,
  core: AiCore,
  compact = false,
) {
    const meta = CORE_KIND_META[core.kind];
    const chip = scene.add.container(0, 0);
    const shadow = scene.add.graphics();
    const width = compact ? 112 : 145;
    const height = compact ? 42 : 58;
    const points = [
      new Phaser.Math.Vector2(-width / 2 + 16, -height / 2),
      new Phaser.Math.Vector2(width / 2 - 16, -height / 2),
      new Phaser.Math.Vector2(width / 2, 0),
      new Phaser.Math.Vector2(width / 2 - 16, height / 2),
      new Phaser.Math.Vector2(-width / 2 + 16, height / 2),
      new Phaser.Math.Vector2(-width / 2, 0),
    ];
    shadow.fillStyle(COLORS.ink, 0.28);
    shadow.fillPoints(
      points.map((point) => new Phaser.Math.Vector2(point.x + 4, point.y + 5)),
      true,
    );
    const shape = scene.add.graphics();
    shape.fillStyle(meta.color, 1);
    shape.fillPoints(points, true);
    shape.lineStyle(compact ? 3 : 4, COLORS.ink, 1);
    shape.strokePoints(points, true);
    shape.fillStyle(COLORS.cream, 0.94);
    shape.fillCircle(-width / 2 + 25, 0, compact ? 14 : 19);
    const icon = scene.add
      .text(-width / 2 + 25, -1, core.emoji, {
        fontSize: compact ? "17px" : "23px",
      })
      .setOrigin(0.5);
    const label = scene.add
      .text(compact ? 15 : 18, 0, core.label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: compact ? "13px" : "15px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: compact ? 74 : 92 },
      })
      .setOrigin(0.5);
    chip.add([shadow, shape, icon, label]);
    return chip;
  
}
