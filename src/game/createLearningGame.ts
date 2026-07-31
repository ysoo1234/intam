import Phaser from "phaser";
import { GAME_ASSETS, GAME_SIZE } from "./assets";
import {
  AI_SERVICE_QUESTIONS,
  AI_SERVICE_ROUND_COUNT,
  AI_TOOLS,
  type AiServiceQuestion,
  type AiTool,
} from "./content/questions";
import {
  AI_CORES,
  CORE_KIND_META,
  KITCHEN_ORDERS,
  KITCHEN_ROUND_COUNT,
  type AiCore,
  type CoreKind,
  type KitchenOrder,
} from "./content/coreKitchen";
import {
  FLIGHT_DATA_KINDS,
  FLIGHT_DATA_META,
  FLIGHT_QUESTIONS,
  type FlightDataKind,
  type FlightQuestion,
} from "./content/dataFlight";
import {
  WORKSHOP_PRODUCT_BY_ID,
  WORKSHOP_PRODUCTS,
  WORKSHOP_REQUESTS,
  type WorkshopProduct,
  type WorkshopRequest,
} from "./content/aiWorkshop";

const COLORS = {
  ink: 0x173f43,
  cream: 0xfff5dc,
  paper: 0xfffbeb,
  coral: 0xf87962,
  coralDark: 0xd8564f,
  mint: 0x70cfaa,
  yellow: 0xf5bd46,
  blue: 0x70c6d5,
} as const;

const FONT_FAMILY =
  '"Arial Rounded MT Bold", "NanumSquareRound", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function configureSceneCamera(scene: Phaser.Scene, renderScale: number) {
  scene.cameras.main
    .setZoom(renderScale)
    .centerOn(GAME_SIZE.width / 2, GAME_SIZE.height / 2);
}

type ControlKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  action: Phaser.Input.Keyboard.Key;
  enter: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
};

type PlayerFacing = "front" | "back" | "left" | "right";

type Building = {
  id: "shop" | "workshop" | "library";
  x: number;
  y: number;
  label: string;
  available: boolean;
};

const BUILDINGS: Building[] = [
  {
    id: "shop",
    x: 286,
    y: 224,
    label: "생활 속 AI 가게",
    available: true,
  },
  {
    id: "workshop",
    x: 262,
    y: 545,
    label: "윤리 심사국",
    available: false,
  },
  {
    id: "library",
    x: 946,
    y: 220,
    label: "데이터 비행 공항",
    available: true,
  },
];

const WORLD_BLOCKED_POLYGONS = [
  new Phaser.Geom.Polygon([
    0, 0, 460, 0, 478, 72, 458, 160, 410, 228, 338, 250, 335, 265, 250,
    265, 250, 305, 120, 312, 0, 282,
  ]),
  new Phaser.Geom.Polygon([
    850, 0, 1280, 0, 1280, 292, 1170, 292, 1120, 270, 1080, 302, 1010,
    302, 960, 282, 900, 282, 870, 220,
  ]),
  new Phaser.Geom.Polygon([
    0, 390, 250, 390, 330, 420, 392, 500, 392, 565, 315, 565, 300, 590,
    220, 590, 208, 565, 120, 565, 80, 600, 0, 600,
  ]),
];

function makeControlKeys(scene: Phaser.Scene): ControlKeys | undefined {
  if (!scene.input.keyboard) return undefined;

  return scene.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    action: Phaser.Input.Keyboard.KeyCodes.SPACE,
    enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  }) as ControlKeys;
}

function generatePlayerTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("player-fallback")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(COLORS.ink, 1);
  g.fillEllipse(48, 111, 63, 18);
  g.fillStyle(COLORS.coralDark, 1);
  g.fillRoundedRect(22, 62, 52, 44, 20);
  g.fillStyle(COLORS.coral, 1);
  g.fillRoundedRect(25, 58, 46, 41, 18);
  g.fillStyle(0xf2aa72, 1);
  g.fillCircle(48, 43, 28);
  g.fillStyle(COLORS.ink, 1);
  g.fillEllipse(49, 31, 53, 32);
  g.fillCircle(30, 40, 8);
  g.fillCircle(67, 40, 8);
  g.fillStyle(0xf2aa72, 1);
  g.fillCircle(34, 42, 5);
  g.fillCircle(63, 42, 5);
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(40, 47, 4);
  g.fillCircle(57, 47, 4);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(41, 48, 2);
  g.fillCircle(58, 48, 2);
  g.lineStyle(3, COLORS.ink, 1);
  g.beginPath();
  g.arc(49, 54, 7, 0.15, Math.PI - 0.15);
  g.strokePath();
  g.fillStyle(COLORS.yellow, 1);
  g.fillTriangle(48, 65, 37, 78, 59, 78);
  g.fillStyle(COLORS.ink, 1);
  g.fillRoundedRect(24, 99, 19, 9, 4);
  g.fillRoundedRect(54, 99, 19, 9, 4);
  g.generateTexture("player-fallback", 96, 124);
  g.destroy();
}

function generateCustomerTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("customer-fallback")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(COLORS.ink, 0.18);
  g.fillEllipse(78, 142, 105, 22);
  g.fillStyle(0x9e6145, 1);
  g.fillCircle(44, 47, 23);
  g.fillCircle(112, 47, 23);
  g.fillEllipse(78, 85, 120, 112);
  g.fillStyle(0xd9935f, 1);
  g.fillEllipse(78, 80, 104, 99);
  g.fillStyle(COLORS.cream, 1);
  g.fillCircle(56, 72, 17);
  g.fillCircle(99, 72, 17);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(60, 75, 6);
  g.fillCircle(95, 75, 6);
  g.fillEllipse(78, 98, 38, 29);
  g.fillStyle(0xf6c99e, 1);
  g.fillEllipse(78, 97, 31, 22);
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(78, 91, 5);
  g.lineStyle(4, COLORS.ink, 1);
  g.beginPath();
  g.arc(78, 99, 9, 0.1, Math.PI - 0.1);
  g.strokePath();
  g.generateTexture("customer-fallback", 156, 154);
  g.destroy();
}

function generateAiToolTextures(scene: Phaser.Scene) {
  const badgeColors = [
    COLORS.coral,
    COLORS.blue,
    COLORS.yellow,
    0xb69be7,
    COLORS.coral,
    COLORS.blue,
    COLORS.mint,
    0xf0a4b7,
    COLORS.yellow,
    COLORS.mint,
  ];

  AI_TOOLS.forEach((tool, index) => {
    const textureKey = `ai-tool-${tool.id}`;
    if (scene.textures.exists(textureKey)) return;

    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.ink, 0.2);
    g.fillCircle(67, 68, 52);
    g.fillStyle(badgeColors[index], 1);
    g.fillCircle(64, 63, 51);
    g.lineStyle(6, COLORS.ink, 1);
    g.strokeCircle(64, 63, 51);
    g.fillStyle(COLORS.cream, 1);
    g.fillCircle(64, 63, 38);

    switch (tool.id) {
      case "voice-recognition":
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(54, 31, 20, 43, 10);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(54, 31, 20, 43, 10);
        g.beginPath();
        g.arc(64, 62, 23, 0, Math.PI);
        g.strokePath();
        g.lineBetween(64, 85, 64, 96);
        g.lineBetween(51, 96, 77, 96);
        break;
      case "image-recognition":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(35, 43, 58, 42, 8);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(35, 43, 58, 42, 8);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(64, 64, 14);
        g.strokeCircle(64, 64, 14);
        g.fillStyle(COLORS.yellow, 1);
        g.fillCircle(84, 52, 5);
        break;
      case "translation":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(29, 37, 42, 32, 12);
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(57, 61, 42, 32, 12);
        g.lineStyle(4, COLORS.ink, 1);
        g.strokeRoundedRect(29, 37, 42, 32, 12);
        g.strokeRoundedRect(57, 61, 42, 32, 12);
        g.lineBetween(45, 79, 82, 48);
        g.fillStyle(COLORS.ink, 1);
        g.fillTriangle(80, 43, 91, 46, 84, 55);
        break;
      case "recommendation": {
        const points: Phaser.Math.Vector2[] = [];
        for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
          const angle = -Math.PI / 2 + (Math.PI * pointIndex) / 5;
          const radius = pointIndex % 2 === 0 ? 28 : 13;
          points.push(
            new Phaser.Math.Vector2(
              64 + Math.cos(angle) * radius,
              64 + Math.sin(angle) * radius,
            ),
          );
        }
        g.fillStyle(COLORS.yellow, 1);
        g.fillPoints(points, true);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokePoints(points, true);
        g.fillStyle(COLORS.coral, 1);
        g.fillCircle(91, 38, 6);
        g.fillCircle(36, 88, 5);
        break;
      }
      case "self-driving":
        g.fillStyle(COLORS.coral, 1);
        g.fillRoundedRect(31, 55, 66, 30, 10);
        g.fillRoundedRect(45, 42, 38, 24, 10);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(31, 55, 66, 30, 10);
        g.strokeRoundedRect(45, 42, 38, 24, 10);
        g.fillStyle(COLORS.ink, 1);
        g.fillCircle(45, 86, 9);
        g.fillCircle(84, 86, 9);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(45, 86, 4);
        g.fillCircle(84, 86, 4);
        break;
      case "ai-speaker":
        g.fillStyle(COLORS.blue, 1);
        g.fillRoundedRect(44, 34, 40, 58, 19);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(44, 34, 40, 58, 19);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(64, 70, 10);
        g.strokeCircle(64, 70, 10);
        g.lineStyle(4, COLORS.coral, 1);
        g.beginPath();
        g.arc(64, 70, 20, -0.7, 0.7);
        g.strokePath();
        break;
      case "chatbot":
        g.fillStyle(COLORS.mint, 1);
        g.fillRoundedRect(29, 38, 70, 48, 18);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(29, 38, 70, 48, 18);
        g.fillStyle(COLORS.mint, 1);
        g.fillTriangle(43, 83, 52, 83, 43, 95);
        g.fillStyle(COLORS.ink, 1);
        g.fillCircle(48, 62, 5);
        g.fillCircle(64, 62, 5);
        g.fillCircle(80, 62, 5);
        break;
      case "medical-analysis":
        g.fillStyle(0xf4a0b2, 1);
        g.fillRoundedRect(52, 34, 24, 59, 6);
        g.fillRoundedRect(34, 52, 60, 24, 6);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeRoundedRect(52, 34, 24, 59, 6);
        g.strokeRoundedRect(34, 52, 60, 24, 6);
        g.fillStyle(COLORS.cream, 1);
        g.fillCircle(86, 84, 10);
        g.strokeCircle(86, 84, 10);
        break;
      case "robot-vacuum":
        g.fillStyle(COLORS.yellow, 1);
        g.fillEllipse(64, 67, 68, 48);
        g.lineStyle(5, COLORS.ink, 1);
        g.strokeEllipse(64, 67, 68, 48);
        g.fillStyle(COLORS.ink, 1);
        g.fillRoundedRect(54, 46, 20, 8, 4);
        g.fillCircle(48, 68, 5);
        g.fillCircle(80, 68, 5);
        g.lineBetween(43, 91, 34, 98);
        g.lineBetween(85, 91, 94, 98);
        break;
      case "smart-farm":
        g.lineStyle(6, COLORS.ink, 1);
        g.lineBetween(64, 92, 64, 52);
        g.fillStyle(COLORS.mint, 1);
        g.fillEllipse(48, 54, 31, 20);
        g.fillEllipse(80, 45, 31, 20);
        g.lineStyle(4, COLORS.ink, 1);
        g.strokeEllipse(48, 54, 31, 20);
        g.strokeEllipse(80, 45, 31, 20);
        g.fillStyle(COLORS.blue, 1);
        g.fillCircle(41, 86, 7);
        g.fillCircle(88, 78, 6);
        break;
    }

    g.generateTexture(textureKey, 128, 128);
    g.destroy();
  });
}

function addSpeechBubble(
  scene: Phaser.Scene,
  width: number,
  height: number,
) {
  const g = scene.add.graphics();
  const radius = 30;
  g.fillStyle(COLORS.ink, 0.22);
  g.fillRoundedRect(7, 8, width, height, radius);
  g.fillStyle(COLORS.paper, 1);
  g.lineStyle(6, COLORS.ink, 1);
  g.fillRoundedRect(0, 0, width, height, radius);
  g.strokeRoundedRect(0, 0, width, height, radius);
  return g;
}

function addFlowerBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color: number = COLORS.coral,
) {
  const container = scene.add.container(x, y);
  const petals = scene.add.graphics();
  petals.fillStyle(COLORS.ink, 0.24);
  petals.fillCircle(4, 7, 35);
  petals.fillStyle(color, 1);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    petals.fillCircle(Math.cos(angle) * 25, Math.sin(angle) * 25, 16);
  }
  petals.fillStyle(COLORS.cream, 1);
  petals.fillCircle(0, 0, 25);
  petals.lineStyle(5, COLORS.ink, 1);
  petals.strokeCircle(0, 0, 25);
  const text = scene.add
    .text(0, 0, label, {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  container.add([petals, text]);
  return container;
}

class IntroScene extends Phaser.Scene {
  private board?: Phaser.GameObjects.Image;
  private enterButton?: Phaser.GameObjects.Container;
  private entering = false;

  constructor(
    private readonly onReady: () => void,
    private readonly renderScale: number,
  ) {
    super("intro");
  }

  preload() {
    this.load.image("gem-board", GAME_ASSETS.intro.board);
    this.load.image("world-map", GAME_ASSETS.world.map);
    this.load.image("player-front", GAME_ASSETS.characters.player.front);
    this.load.image("player-back", GAME_ASSETS.characters.player.back);
    this.load.image("player-left", GAME_ASSETS.characters.player.left);
    this.load.image("player-right", GAME_ASSETS.characters.player.right);
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.add.rectangle(640, 360, 1280, 720, 0x06181d).setDepth(0);

    const halo = this.add
      .circle(640, 350, 315, 0x37d8ff, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1);
    this.tweens.add({
      targets: halo,
      scale: 1.12,
      alpha: 0.04,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.board = this.add
      .image(640, 360, "gem-board")
      .setDisplaySize(1280, 720)
      .setDepth(2);

    const sparklePoints = [
      [395, 294],
      [480, 220],
      [564, 146],
      [650, 128],
      [742, 218],
      [835, 302],
      [515, 430],
      [650, 535],
      [780, 432],
    ];
    sparklePoints.forEach(([x, y], index) => {
      const sparkle = this.add
        .text(x, y, "✦", {
          color: index % 2 === 0 ? "#fff2aa" : "#d8fbff",
          fontFamily: FONT_FAMILY,
          fontSize: `${14 + (index % 3) * 4}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.2, to: 1 },
        scale: { from: 0.55, to: 1.25 },
        angle: 45,
        duration: 900 + index * 70,
        delay: index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.createEnterButton();
    this.input.keyboard?.on("keydown-SPACE", () => this.startEntrance());
    this.input.keyboard?.on("keydown-ENTER", () => this.startEntrance());
    this.cameras.main.fadeIn(420, 3, 20, 25);
    this.onReady();
  }

  private createEnterButton() {
    const glow = this.add
      .ellipse(0, 6, 370, 90, 0x53dff5, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.ink, 0.65);
    shadow.fillPoints(
      [
        new Phaser.Math.Vector2(-184, -30),
        new Phaser.Math.Vector2(159, -30),
        new Phaser.Math.Vector2(190, 5),
        new Phaser.Math.Vector2(159, 40),
        new Phaser.Math.Vector2(-184, 40),
        new Phaser.Math.Vector2(-215, 5),
      ],
      true,
    );
    const plate = this.add.graphics();
    const shape = [
      new Phaser.Math.Vector2(-184, -36),
      new Phaser.Math.Vector2(160, -36),
      new Phaser.Math.Vector2(194, 0),
      new Phaser.Math.Vector2(160, 36),
      new Phaser.Math.Vector2(-184, 36),
      new Phaser.Math.Vector2(-218, 0),
    ];
    plate.fillStyle(0xe7b95c, 1);
    plate.fillPoints(shape, true);
    plate.lineStyle(5, 0xffe7a0, 1);
    plate.strokePoints(shape, true);
    plate.fillStyle(0x0c343b, 1);
    plate.fillPoints(
      shape.map(
        (point) =>
          new Phaser.Math.Vector2(point.x * 0.94, point.y * 0.76),
      ),
      true,
    );
    plate.lineStyle(3, 0x6de8f2, 0.85);
    plate.strokePoints(
      shape.map(
        (point) =>
          new Phaser.Math.Vector2(point.x * 0.94, point.y * 0.76),
      ),
      true,
    );
    const label = this.add
      .text(-8, -1, "배움마을 입장", {
        color: "#fff3ba",
        fontFamily: FONT_FAMILY,
        fontSize: "25px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    const gem = this.add
      .text(-157, -1, "◆", {
        color: "#7bf2ff",
        fontFamily: FONT_FAMILY,
        fontSize: "25px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.enterButton = this.add
      .container(652, 652, [glow, shadow, plate, label, gem])
      .setDepth(15)
      .setSize(420, 84)
      .setInteractive({ useHandCursor: true });
    this.enterButton.on("pointerdown", () => this.startEntrance());
    this.enterButton.on("pointerover", () => {
      if (!this.entering) this.enterButton?.setScale(1.04);
    });
    this.enterButton.on("pointerout", () => {
      if (!this.entering) this.enterButton?.setScale(1);
    });
    this.tweens.add({
      targets: [glow, gem],
      alpha: { from: 0.35, to: 1 },
      scale: { from: 0.86, to: 1.12 },
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private startEntrance() {
    if (this.entering || !this.enterButton || !this.board) return;
    this.entering = true;
    const enterButton = this.enterButton;
    const board = this.board;
    enterButton.disableInteractive();
    this.tweens.killTweensOf(enterButton);
    this.tweens.add({
      targets: enterButton,
      scale: 0.82,
      alpha: 0,
      y: 670,
      duration: 230,
      ease: "Back.easeIn",
    });
    this.tweens.add({
      targets: board,
      scale: 1.055,
      alpha: 0.72,
      duration: 760,
      ease: "Sine.easeIn",
    });

    this.cameras.main.shake(280, 0.0035);
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      const ray = this.add
        .rectangle(
          640,
          350,
          i % 2 === 0 ? 13 : 7,
          250 + (i % 3) * 45,
          i % 3 === 0 ? 0xffe58a : 0x82edff,
          0.5,
        )
        .setOrigin(0.5, 1)
        .setRotation(angle + Math.PI / 2)
        .setScale(0.15, 0.08)
        .setDepth(20)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ray,
        scaleX: 1.2,
        scaleY: 2.4,
        alpha: 0,
        duration: 820,
        delay: i * 13,
        ease: "Cubic.easeOut",
      });
    }

    for (let i = 0; i < 30; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(190, 520);
      const spark = this.add
        .circle(
          640,
          350,
          Phaser.Math.Between(2, 7),
          i % 3 === 0 ? 0xffdc75 : 0x91efff,
          0.95,
        )
        .setDepth(23)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: 640 + Math.cos(angle) * distance,
        y: 350 + Math.sin(angle) * distance,
        scale: { from: 0.3, to: 1.7 },
        alpha: 0,
        duration: Phaser.Math.Between(560, 900),
        delay: Phaser.Math.Between(40, 220),
        ease: "Cubic.easeOut",
      });
    }

    [1, 2.2, 4].forEach((targetScale, index) => {
      const ring = this.add
        .circle(640, 350, 62)
        .setStrokeStyle(8 - index * 2, index === 1 ? 0xffdf7d : 0xa2f6ff, 0.9)
        .setDepth(22)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.25);
      this.tweens.add({
        targets: ring,
        scale: targetScale,
        alpha: 0,
        duration: 620 + index * 130,
        delay: index * 90,
        ease: "Cubic.easeOut",
      });
    });

    const portal = this.add
      .circle(640, 350, 36, 0xeaffff, 0.96)
      .setDepth(24)
      .setBlendMode(Phaser.BlendModes.ADD);
    const floodLight = this.add
      .rectangle(640, 360, 1280, 720, 0xfffbe8, 0)
      .setDepth(25)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: portal,
      scale: 25,
      alpha: 1,
      duration: 760,
      ease: "Expo.easeIn",
    });
    this.tweens.add({
      targets: floodLight,
      alpha: 1,
      duration: 700,
      delay: 170,
      ease: "Cubic.easeIn",
    });
    this.time.delayedCall(620, () => {
      this.cameras.main.flash(360, 255, 252, 220);
    });
    this.time.delayedCall(910, () => this.scene.start("world"));
  }
}

class WorldScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private playerFacing: PlayerFacing = "front";
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: ControlKeys;
  private nearestBuilding?: Building;
  private prompt?: Phaser.GameObjects.Container;
  private promptText?: Phaser.GameObjects.Text;
  private onboarding?: Phaser.GameObjects.Container;
  private joystick = new Phaser.Math.Vector2();
  private joystickPointerId = -1;
  private joystickKnob?: Phaser.GameObjects.Arc;
  private actionQueued = false;
  private hasMoved = false;

  constructor(private readonly renderScale: number) {
    super("world");
  }

  preload() {
    if (!this.textures.exists("world-map")) {
      this.load.image("world-map", GAME_ASSETS.world.map);
    }
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

    this.add
      .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "world-map")
      .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);

    const shade = this.add.graphics().setDepth(1);
    shade.fillStyle(0x173f43, 0.1);
    shade.fillRect(0, 0, GAME_SIZE.width, 52);
    shade.fillStyle(0xfff5dc, 0.13);
    shade.fillCircle(627, 351, 92);
    this.createFountainShimmer();

    this.add
      .text(38, 22, "배움마을", {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setDepth(4);

    addFlowerBadge(this, 1220, 64, "★", COLORS.yellow).setDepth(4);

    this.playerShadow = this.add.ellipse(0, 38, 72, 19, COLORS.ink, 0.22);
    const textureKey = this.textures.exists("player-front")
      ? "player-front"
      : "player-fallback";
    this.playerSprite = this.add
      .image(0, 0, textureKey)
      .setDisplaySize(88, 113)
      .setOrigin(0.5, 0.84);
    this.player = this.add.container(627, 500, [
      this.playerShadow,
      this.playerSprite,
    ]);
    this.player.setDepth(10);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = makeControlKeys(this);
    this.createInteractionPrompt();
    this.createOnboarding();
    this.createTouchControls();

    this.cameras.main.fadeIn(350, 255, 245, 220);
  }

  private createFountainShimmer() {
    for (let i = 0; i < 4; i += 1) {
      const ripple = this.add
        .ellipse(627, 351, 48 + i * 14, 17 + i * 5)
        .setStrokeStyle(3, 0xffffff, 0.58)
        .setDepth(2)
        .setAlpha(0);
      this.tweens.add({
        targets: ripple,
        scaleX: 1.75,
        scaleY: 1.45,
        alpha: { from: 0.62, to: 0 },
        duration: 1800,
        delay: i * 420,
        repeat: -1,
        ease: "Sine.easeOut",
      });
    }
  }

  private createInteractionPrompt() {
    const bubble = addSpeechBubble(this, 330, 66);
    this.promptText = this.add
      .text(165, 32, "", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);
    this.prompt = this.add
      .container(0, 0, [bubble, this.promptText])
      .setDepth(30)
      .setVisible(false);
  }

  private createOnboarding() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.cream, 0.96);
    g.lineStyle(5, COLORS.ink, 1);
    g.fillRoundedRect(-245, -35, 490, 70, 28);
    g.strokeRoundedRect(-245, -35, 490, 70, 28);
    g.fillStyle(COLORS.yellow, 1);
    g.fillCircle(-205, 0, 23);
    g.lineStyle(4, COLORS.ink, 1);
    g.strokeCircle(-205, 0, 23);

    const keyIcon = this.add
      .text(-205, -1, "↕", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "26px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const text = this.add
      .text(34, 0, "방향키를 눌러 이동해 보세요!", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.onboarding = this.add
      .container(640, 655, [g, keyIcon, text])
      .setDepth(40);
  }

  private createTouchControls() {
    const joystickBase = this.add
      .circle(106, 610, 64, COLORS.cream, 0.72)
      .setStrokeStyle(6, COLORS.ink, 0.68)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    this.joystickKnob = this.add
      .circle(106, 610, 29, COLORS.mint, 0.92)
      .setStrokeStyle(5, COLORS.ink, 0.82)
      .setDepth(51);

    joystickBase.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.joystickPointerId = pointer.id;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.updateJoystick(worldPoint.x, worldPoint.y);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.updateJoystick(worldPoint.x, worldPoint.y);
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId) this.resetJoystick();
    });
    this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId) this.resetJoystick();
    });

    const action = this.add
      .container(1173, 610)
      .setDepth(50)
      .setSize(116, 116)
      .setInteractive({ useHandCursor: true });
    const actionShape = this.add.graphics();
    actionShape.fillStyle(COLORS.ink, 0.24);
    actionShape.fillCircle(4, 7, 58);
    actionShape.fillStyle(COLORS.coral, 0.96);
    actionShape.fillCircle(0, 0, 55);
    actionShape.lineStyle(6, COLORS.ink, 0.88);
    actionShape.strokeCircle(0, 0, 55);
    actionShape.fillStyle(COLORS.cream, 1);
    actionShape.fillCircle(0, 0, 37);
    const actionText = this.add
      .text(0, -1, "톡!", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    action.on("pointerdown", () => {
      this.actionQueued = true;
      this.tweens.add({
        targets: action,
        scale: 0.9,
        duration: 80,
        yoyo: true,
      });
    });
    action.add([actionShape, actionText]);

  }

  private updateJoystick(x: number, y: number) {
    const dx = x - 106;
    const dy = y - 610;
    const length = Math.max(1, Math.hypot(dx, dy));
    const distance = Math.min(39, length);
    this.joystick.set(dx / length, dy / length);
    this.joystickKnob?.setPosition(
      106 + this.joystick.x * distance,
      610 + this.joystick.y * distance,
    );
  }

  private resetJoystick() {
    this.joystickPointerId = -1;
    this.joystick.set(0, 0);
    this.joystickKnob?.setPosition(106, 610);
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
    const destination =
      this.nearestBuilding.id === "library" ? "airport" : "shop-workshop";
    this.time.delayedCall(230, () => this.scene.start(destination));
  }

  update(_time: number, delta: number) {
    if (!this.player) return;

    const direction = new Phaser.Math.Vector2(this.joystick.x, this.joystick.y);
    if (this.cursors?.left.isDown || this.keys?.left.isDown) direction.x -= 1;
    if (this.cursors?.right.isDown || this.keys?.right.isDown) direction.x += 1;
    if (this.cursors?.up.isDown || this.keys?.up.isDown) direction.y -= 1;
    if (this.cursors?.down.isDown || this.keys?.down.isDown) direction.y += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.setPlayerFacing(direction);
      this.animatePlayer(true);
      const sprintMultiplier = this.keys?.sprint.isDown ? 1.5 : 1;
      const speed = 230 * sprintMultiplier * (delta / 1000);
      const previousX = this.player.x;
      const previousY = this.player.y;
      this.player.x = Phaser.Math.Clamp(
        this.player.x + direction.x * speed,
        80,
        1200,
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + direction.y * speed,
        100,
        660,
      );
      this.resolveWorldObstacles(previousX, previousY);
      this.player.setDepth(10 + Math.round(this.player.y));
      this.player.rotation = Math.sin(this.time.now / 75) * 0.025;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.time.delayedCall(2800, () => {
          this.tweens.add({
            targets: this.onboarding,
            alpha: 0,
            y: 680,
            duration: 400,
            onComplete: () => this.onboarding?.setVisible(false),
          });
        });
      }
    } else {
      this.animatePlayer(false);
      this.player.rotation *= 0.8;
    }

    this.nearestBuilding = BUILDINGS.find(
      (building) =>
        Phaser.Math.Distance.Between(
          this.player!.x,
          this.player!.y,
          building.x,
          building.y,
        ) < 105,
    );

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

  private resolveWorldObstacles(previousX: number, previousY: number) {
    if (!this.player) return;

    const targetX = this.player.x;
    const targetY = this.player.y;
    if (!this.isWorldPositionBlocked(targetX, targetY)) return;

    if (!this.isWorldPositionBlocked(targetX, previousY)) {
      this.player.setPosition(targetX, previousY);
    } else if (!this.isWorldPositionBlocked(previousX, targetY)) {
      this.player.setPosition(previousX, targetY);
    } else {
      this.player.setPosition(previousX, previousY);
    }
  }

  private isWorldPositionBlocked(x: number, y: number) {
    if (x < 48 || x > 1232 || y < 45 || y > 690) return true;

    const blockedByStructure = WORLD_BLOCKED_POLYGONS.some((polygon) =>
      Phaser.Geom.Polygon.Contains(polygon, x, y),
    );
    if (blockedByStructure) return true;

    const fountainDistance =
      ((x - 625) * (x - 625)) / (150 * 150) +
      ((y - 350) * (y - 350)) / (116 * 116);
    if (fountainDistance < 1) return true;

    const frame = this.textures.getFrame("world-map");
    if (!frame) return false;

    const footSamples = [
      [0, 6],
      [-15, 4],
      [15, 4],
      [-10, 12],
      [10, 12],
    ];

    return footSamples.some(([offsetX, offsetY]) => {
      const sourceX = Phaser.Math.Clamp(
        Math.round(((x + offsetX) / GAME_SIZE.width) * frame.width),
        0,
        frame.width - 1,
      );
      const sourceY = Phaser.Math.Clamp(
        Math.round(((y + offsetY) / GAME_SIZE.height) * frame.height),
        0,
        frame.height - 1,
      );
      const color = this.textures.getPixel(
        sourceX,
        sourceY,
        "world-map",
      );
      if (!color) return false;

      const vegetation =
        color.green > color.red + 4 && color.green > color.blue + 20;
      const blueSurface =
        color.blue > color.red + 8 && color.green > color.red - 20;
      const redRoof =
        color.red > color.green + 72 &&
        color.green < 185 &&
        color.blue < 155;
      return vegetation || blueSurface || redRoof;
    });
  }
}

type FlightObjectKind = "data" | "obstacle" | "question";

type FlightObject = {
  kind: FlightObjectKind;
  container: Phaser.GameObjects.Container;
  radius: number;
  dataKind?: FlightDataKind;
  spin: number;
  baseY?: number;
  bobAmplitude?: number;
  bobSpeed?: number;
  bobPhase?: number;
};

type ActiveFlightQuestion = {
  question: FlightQuestion;
  phase: "reading" | "choices";
  readingUntilMs: number;
};

class AirportScene extends Phaser.Scene {
  private static readonly GAME_DURATION_MS = 120_000;
  private static readonly QUESTION_INTERVAL_MS = 22_000;
  private static readonly FEVER_DURATION_MS = 7_000;
  private static readonly PLAYER_SPEED = 425;
  private static readonly FEVER_COLORS = [
    0xff6b6b, 0xffc857, 0x71e07b, 0x55dff5, 0x6f8cff, 0xb77bff, 0xff77c8,
  ];

  private sky?: Phaser.GameObjects.TileSprite;
  private city?: Phaser.GameObjects.TileSprite;
  private ground?: Phaser.GameObjects.TileSprite;
  private player?: Phaser.GameObjects.Container;
  private playerArt?: Phaser.GameObjects.Image;
  private playerAura?: Phaser.GameObjects.Ellipse;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: ControlKeys;
  private objects: FlightObject[] = [];
  private elapsedMs = 0;
  private remainingMs = AirportScene.GAME_DURATION_MS;
  private countdownMs = 3_000;
  private nextDataAtMs = 650;
  private nextObstacleAtMs = 5_500;
  private nextQuestionAtMs = AirportScene.QUESTION_INTERVAL_MS;
  private feverUntilMs = 0;
  private invulnerableUntilMs = 0;
  private score = 0;
  private hearts = 3;
  private collected = 0;
  private correctAnswers = 0;
  private questionIndex = 0;
  private questions: FlightQuestion[] = [];
  private activeQuestion?: ActiveFlightQuestion;
  private questionOverlay?: Phaser.GameObjects.Container;
  private missionBanner?: Phaser.GameObjects.Container;
  private missionText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private heartText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private feverText?: Phaser.GameObjects.Text;
  private feverBar?: Phaser.GameObjects.Graphics;
  private feverOverlay?: Phaser.GameObjects.Rectangle;
  private feverFrame?: Phaser.GameObjects.Graphics;
  private nextFeverSparkAtMs = 0;
  private countdownText?: Phaser.GameObjects.Text;
  private pointerActive = false;
  private pointerId = -1;
  private pointerTargetX = 220;
  private pointerTargetY = 360;
  private finished = false;

  constructor(private readonly renderScale: number) {
    super("airport");
  }

  preload() {
    this.load.image("airport-sky", GAME_ASSETS.airport.sky);
    this.load.image("airport-city", GAME_ASSETS.airport.city);
    this.load.image("airport-ground", GAME_ASSETS.airport.ground);
    this.load.image("airport-midi", GAME_ASSETS.characters.player.fly);
    this.load.image("airport-data-doc", GAME_ASSETS.airport.data.doc);
    this.load.image("airport-data-image", GAME_ASSETS.airport.data.image);
    this.load.image("airport-data-sound", GAME_ASSETS.airport.data.sound);
    this.load.image("airport-data-video", GAME_ASSETS.airport.data.video);
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.resetState();
    this.generateObstacleTextures();
    this.createBackground();
    this.createPlayer();
    this.createHud();
    this.createControls();
    this.cameras.main.fadeIn(350, 220, 250, 255);
  }

  private resetState() {
    this.objects = [];
    this.elapsedMs = 0;
    this.remainingMs = AirportScene.GAME_DURATION_MS;
    this.countdownMs = 3_000;
    this.nextDataAtMs = 650;
    this.nextObstacleAtMs = 5_500;
    this.nextQuestionAtMs = AirportScene.QUESTION_INTERVAL_MS;
    this.feverUntilMs = 0;
    this.invulnerableUntilMs = 0;
    this.score = 0;
    this.hearts = 3;
    this.collected = 0;
    this.correctAnswers = 0;
    this.questionIndex = 0;
    this.questions = Phaser.Utils.Array.Shuffle([...FLIGHT_QUESTIONS]);
    this.activeQuestion = undefined;
    this.questionOverlay = undefined;
    this.missionBanner = undefined;
    this.missionText = undefined;
    this.pointerActive = false;
    this.pointerId = -1;
    this.pointerTargetX = 220;
    this.pointerTargetY = 360;
    this.nextFeverSparkAtMs = 0;
    this.finished = false;
  }

  private createBackground() {
    this.sky = this.add
      .tileSprite(640, 360, 1280, 720, "airport-sky")
      .setTileScale(0.766)
      .setDepth(0);
    this.city = this.add
      .tileSprite(640, 360, 1280, 720, "airport-city")
      .setTileScale(0.703)
      .setDepth(1);
    this.city.tilePositionY = -190;
    this.ground = this.add
      .tileSprite(640, 360, 1280, 720, "airport-ground")
      .setTileScale(0.262)
      .setDepth(2);
  }

  private createPlayer() {
    const shadow = this.add
      .ellipse(18, 39, 92, 22, COLORS.ink, 0.14)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.playerAura = this.add
      .ellipse(18, 0, 160, 104, 0x77edff, 0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.playerArt = this.add
      .image(0, 0, "airport-midi")
      .setOrigin(0.72, 0.5)
      .setDisplaySize(188, 87);
    this.player = this.add
      .container(220, 360, [shadow, this.playerAura, this.playerArt])
      .setDepth(20);

    this.tweens.add({
      targets: this.playerArt,
      y: { from: -3, to: 3 },
      angle: { from: -1.2, to: 1.2 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createHud() {
    const backButton = this.createHudButton(58, 52, "←", () =>
      this.returnToWorld(),
    );
    backButton.setDepth(60);

    const titlePanel = this.add.graphics().setDepth(50);
    titlePanel.fillStyle(COLORS.ink, 0.88);
    titlePanel.fillRoundedRect(105, 21, 256, 62, 25);
    titlePanel.lineStyle(4, 0xdafaff, 0.9);
    titlePanel.strokeRoundedRect(105, 21, 256, 62, 25);
    this.add
      .text(233, 52, "데이터 비행 공항", {
        color: "#fff7df",
        fontFamily: FONT_FAMILY,
        fontSize: "25px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);

    const scorePanel = this.add.graphics().setDepth(50);
    scorePanel.fillStyle(0xffffff, 0.9);
    scorePanel.lineStyle(4, COLORS.ink, 0.95);
    scorePanel.fillRoundedRect(810, 21, 438, 62, 25);
    scorePanel.strokeRoundedRect(810, 21, 438, 62, 25);
    this.scoreText = this.add
      .text(838, 52, "데이터 0점", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(51);
    this.heartText = this.add
      .text(1030, 52, "♥ ♥ ♥", {
        color: "#ef665f",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.timerText = this.add
      .text(1215, 52, "02:00", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setDepth(51);

    this.feverOverlay = this.add
      .rectangle(640, 360, 1280, 720, 0x55dff5, 0)
      .setDepth(41)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.feverFrame = this.add.graphics().setDepth(59).setVisible(false);
    this.feverText = this.add
      .text(640, 102, "⚡ DATA FEVER!", {
        color: "#fff6ad",
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#184d59",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(55)
      .setVisible(false);
    this.feverBar = this.add.graphics().setDepth(54).setVisible(false);

    this.countdownText = this.add
      .text(640, 300, "3", {
        color: "#fff7df",
        fontFamily: FONT_FAMILY,
        fontSize: "118px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 14,
      })
      .setOrigin(0.5)
      .setDepth(70);
    this.add
      .text(640, 405, "방향키 또는 화면 드래그로 자유롭게 비행하세요!", {
        color: "#173f43",
        backgroundColor: "#fff7dfe8",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(69)
      .setName("airport-start-hint");
  }

  private createHudButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ) {
    const button = this.add.container(x, y);
    const shadow = this.add.circle(3, 5, 34, COLORS.ink, 0.22);
    const ring = this.add.circle(0, 0, 34, COLORS.paper, 1);
    ring.setStrokeStyle(6, COLORS.ink, 1);
    const text = this.add
      .text(0, -1, label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "30px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    button.add([shadow, ring, text]);
    button.setSize(78, 78).setInteractive({ useHandCursor: true });
    button.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    button.on("pointerover", () => button.setScale(1.07));
    button.on("pointerout", () => button.setScale(1));
    return button;
  }

  private createControls() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = makeControlKeys(this);
    this.input.keyboard?.on("keydown-ESC", () => this.returnToWorld());
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.finished) this.scene.restart();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this.finished) this.scene.restart();
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.finished || pointer.y < 95 || pointer.x > 1210) return;
      this.pointerActive = true;
      this.pointerId = pointer.id;
      this.pointerTargetX = Phaser.Math.Clamp(pointer.x, 125, 1135);
      this.pointerTargetY = Phaser.Math.Clamp(pointer.y, 125, 635);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerActive || pointer.id !== this.pointerId) return;
      this.pointerTargetX = Phaser.Math.Clamp(pointer.x, 125, 1135);
      this.pointerTargetY = Phaser.Math.Clamp(pointer.y, 125, 635);
    });
    const releasePointer = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.pointerActive = false;
      this.pointerId = -1;
    };
    this.input.on("pointerup", releasePointer);
    this.input.on("pointerupoutside", releasePointer);
  }

  private generateObstacleTextures() {
    if (!this.textures.exists("airport-obstacle-drone")) {
      const drone = this.make.graphics({ x: 0, y: 0 });
      drone.fillStyle(COLORS.ink, 0.18);
      drone.fillEllipse(70, 69, 88, 16);
      drone.fillStyle(0xf5bd46, 1);
      drone.fillRoundedRect(35, 28, 70, 42, 19);
      drone.lineStyle(6, COLORS.ink, 1);
      drone.strokeRoundedRect(35, 28, 70, 42, 19);
      drone.fillStyle(0x70c6d5, 1);
      drone.fillCircle(54, 48, 8);
      drone.fillCircle(86, 48, 8);
      drone.lineStyle(6, COLORS.ink, 1);
      drone.lineBetween(37, 32, 20, 18);
      drone.lineBetween(103, 32, 120, 18);
      drone.lineBetween(8, 18, 32, 18);
      drone.lineBetween(108, 18, 132, 18);
      drone.generateTexture("airport-obstacle-drone", 140, 90);
      drone.destroy();
    }

    if (!this.textures.exists("airport-obstacle-satellite")) {
      const satellite = this.make.graphics({ x: 0, y: 0 });
      satellite.fillStyle(0xb493e5, 1);
      satellite.fillRoundedRect(40, 31, 42, 42, 12);
      satellite.lineStyle(6, COLORS.ink, 1);
      satellite.strokeRoundedRect(40, 31, 42, 42, 12);
      satellite.fillStyle(0x70c6d5, 1);
      satellite.fillRoundedRect(7, 24, 30, 56, 4);
      satellite.fillRoundedRect(85, 24, 30, 56, 4);
      satellite.strokeRoundedRect(7, 24, 30, 56, 4);
      satellite.strokeRoundedRect(85, 24, 30, 56, 4);
      satellite.lineBetween(61, 31, 61, 12);
      satellite.fillCircle(61, 10, 7);
      satellite.generateTexture("airport-obstacle-satellite", 122, 96);
      satellite.destroy();
    }

    if (!this.textures.exists("airport-obstacle-storm")) {
      const storm = this.make.graphics({ x: 0, y: 0 });
      storm.fillStyle(COLORS.ink, 0.18);
      storm.fillEllipse(69, 77, 98, 18);
      storm.fillStyle(0x718ca2, 1);
      storm.fillCircle(43, 44, 25);
      storm.fillCircle(70, 34, 32);
      storm.fillCircle(96, 47, 24);
      storm.fillRoundedRect(27, 44, 86, 31, 15);
      storm.lineStyle(6, COLORS.ink, 1);
      storm.strokeCircle(43, 44, 25);
      storm.strokeCircle(70, 34, 32);
      storm.strokeCircle(96, 47, 24);
      storm.fillStyle(0xffdc59, 1);
      storm.fillTriangle(66, 57, 52, 88, 70, 82);
      storm.fillTriangle(70, 82, 58, 106, 89, 73);
      storm.generateTexture("airport-obstacle-storm", 140, 112);
      storm.destroy();
    }
  }

  private spawnData(
    dataKind = Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS),
    x = 1350,
    y = Phaser.Math.Between(135, 615),
    questionChoice = false,
  ) {
    const container = this.add.container(x, y).setDepth(15);
    const meta = FLIGHT_DATA_META[dataKind];
    const glow = this.add
      .circle(0, 0, questionChoice ? 47 : 39, meta.color, 0.28)
      .setBlendMode(Phaser.BlendModes.ADD);
    const image = this.add
      .image(0, -3, `airport-data-${dataKind}`)
      .setDisplaySize(questionChoice ? 102 : 78, questionChoice ? 58 : 44);
    const label = this.add
      .text(0, questionChoice ? 42 : 31, meta.label, {
        color: "#173f43",
        backgroundColor: "#fff9e8e8",
        fontFamily: FONT_FAMILY,
        fontSize: questionChoice ? "17px" : "13px",
        fontStyle: "bold",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    container.add([glow, image, label]);
    this.tweens.add({
      targets: glow,
      scale: { from: 0.86, to: 1.13 },
      alpha: { from: 0.18, to: 0.46 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.objects.push({
      kind: questionChoice ? "question" : "data",
      container,
      radius: questionChoice ? 43 : 34,
      dataKind,
      spin: Phaser.Math.FloatBetween(-10, 10),
    });
  }

  private spawnObstacle() {
    const texture = Phaser.Utils.Array.GetRandom([
      "airport-obstacle-drone",
      "airport-obstacle-satellite",
      "airport-obstacle-storm",
    ]);
    const difficulty = Phaser.Math.Clamp(
      this.elapsedMs / AirportScene.GAME_DURATION_MS,
      0,
      1,
    );
    const y = Phaser.Math.Between(220, 520);
    const bobAmplitude = Phaser.Math.Between(
      62,
      Math.round(105 + difficulty * 20),
    );
    const container = this.add.container(1360, y).setDepth(16);
    const warning = this.add
      .circle(0, 0, 54, 0xff725f, 0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    const image = this.add.image(0, 0, texture);
    container.add([warning, image]);
    this.tweens.add({
      targets: warning,
      alpha: { from: 0.08, to: 0.4 },
      scale: { from: 0.9, to: 1.15 },
      duration: 460,
      yoyo: true,
      repeat: -1,
    });
    this.objects.push({
      kind: "obstacle",
      container,
      radius: texture === "airport-obstacle-storm" ? 47 : 42,
      spin: Phaser.Math.FloatBetween(-8, 8),
      baseY: y,
      bobAmplitude,
      bobSpeed: Phaser.Math.FloatBetween(
        0.0032,
        0.0052 + difficulty * 0.001,
      ),
      bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
    });
  }

  private startQuestion() {
    const question =
      this.questions[this.questionIndex % this.questions.length] ??
      FLIGHT_QUESTIONS[0];
    this.questionIndex += 1;
    this.nextQuestionAtMs += AirportScene.QUESTION_INTERVAL_MS;
    this.clearObjects();
    this.activeQuestion = {
      question,
      phase: "reading",
      readingUntilMs: this.elapsedMs + 3_800,
    };

    const overlay = this.add.container(640, 360).setDepth(90);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x112f43, 0.82);
    const rays = this.add.graphics();
    rays.lineStyle(5, 0x71e8ff, 0.28);
    for (let index = 0; index < 18; index += 1) {
      const angle = (Math.PI * 2 * index) / 18;
      rays.lineBetween(
        Math.cos(angle) * 175,
        Math.sin(angle) * 175,
        Math.cos(angle) * 620,
        Math.sin(angle) * 620,
      );
    }
    const panel = this.add.graphics();
    panel.fillStyle(0xfff8e5, 1);
    panel.lineStyle(9, COLORS.ink, 1);
    panel.fillRoundedRect(-455, -185, 910, 370, 62);
    panel.strokeRoundedRect(-455, -185, 910, 370, 62);
    const badge = this.add
      .text(0, -122, `DATA QUIZ · ${question.category}`, {
        color: "#ffffff",
        backgroundColor: "#ef7663",
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "bold",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(0, -22, question.prompt, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "38px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 780 },
      })
      .setOrigin(0.5);
    const instruction = this.add
      .text(0, 105, "곧 데이터 4개가 날아옵니다. 정답을 향해 비행하세요!", {
        color: "#287b85",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    overlay.add([shade, rays, panel, badge, prompt, instruction]);
    overlay.setScale(0.82).setAlpha(0);
    this.tweens.add({
      targets: overlay,
      scale: 1,
      alpha: 1,
      duration: 330,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: rays,
      angle: 18,
      duration: 2_800,
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
      this.showFlightNotice("데이터를 놓쳤어요!", "다음 문제에 다시 도전해요.", 0xf5bd46);
      this.nextDataAtMs = this.elapsedMs + 450;
      this.nextObstacleAtMs = this.elapsedMs + 1_600;
      return;
    }

    if (!correct) {
      this.hearts = Math.max(0, this.hearts - 1);
      this.invulnerableUntilMs = this.elapsedMs + 1_500;
      this.updateHud();
      this.cameras.main.shake(180, 0.006);
      this.vibrate([35, 45, 35]);
      this.showFlightNotice(
        "앗, 다른 데이터예요!",
        active.question.explanation,
        COLORS.coral,
      );
      if (this.hearts <= 0) {
        this.time.delayedCall(900, () => this.finishGame(false));
        return;
      }
      this.nextDataAtMs = this.elapsedMs + 500;
      this.nextObstacleAtMs = this.elapsedMs + 1_800;
      return;
    }

    this.correctAnswers += 1;
    this.score += 150;
    this.feverUntilMs = this.elapsedMs + AirportScene.FEVER_DURATION_MS;
    this.invulnerableUntilMs = this.feverUntilMs;
    this.nextDataAtMs = this.elapsedMs;
    this.nextObstacleAtMs = this.feverUntilMs + 1_200;
    this.showFlightNotice(
      "정답! DATA FEVER!",
      active.question.explanation,
      COLORS.mint,
    );
    this.cameras.main.flash(260, 180, 255, 245);
    this.createBurst(this.player?.x ?? 220, this.player?.y ?? 360, COLORS.yellow);
    this.vibrate(35);
    this.updateHud();
  }

  private showFlightNotice(title: string, detail: string, color: number) {
    const notice = this.add.container(640, 330).setDepth(95).setScale(0);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 0.98);
    panel.lineStyle(8, COLORS.ink, 1);
    panel.fillRoundedRect(-355, -96, 710, 192, 46);
    panel.strokeRoundedRect(-355, -96, 710, 192, 46);
    const titleText = this.add
      .text(0, -40, title, {
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        fontFamily: FONT_FAMILY,
        fontSize: "34px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const detailText = this.add
      .text(0, 34, detail, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);
    notice.add([panel, titleText, detailText]);
    this.tweens.add({
      targets: notice,
      scale: 1,
      duration: 260,
      ease: "Back.easeOut",
    });
    this.time.delayedCall(1_350, () => {
      this.tweens.add({
        targets: notice,
        alpha: 0,
        y: 295,
        duration: 260,
        onComplete: () => notice.destroy(true),
      });
    });
  }

  private updateFlightObjects(deltaMs: number) {
    if (!this.player) return;
    const fever = this.feverUntilMs > this.elapsedMs;
    const deltaSeconds = deltaMs / 1000;
    const playerX = this.player.x + 20;
    const playerY = this.player.y;
    const survivors: FlightObject[] = [];

    const difficulty = Phaser.Math.Clamp(
      this.elapsedMs / AirportScene.GAME_DURATION_MS,
      0,
      1,
    );
    this.objects.forEach((object) => {
      const baseSpeed =
        object.kind === "question"
          ? 390
          : object.kind === "obstacle"
            ? 330 + difficulty * 55
            : 355;
      object.container.x -= baseSpeed * (fever ? 1.22 : 1) * deltaSeconds;
      object.container.angle += object.spin * deltaSeconds;

      if (
        object.kind === "obstacle" &&
        object.baseY !== undefined &&
        object.bobAmplitude !== undefined &&
        object.bobSpeed !== undefined
      ) {
        object.container.y =
          object.baseY +
          Math.sin(
            this.elapsedMs * object.bobSpeed + (object.bobPhase ?? 0),
          ) *
            object.bobAmplitude;
      }

      if (fever && object.kind === "data") {
        const distance = Phaser.Math.Distance.Between(
          object.container.x,
          object.container.y,
          playerX,
          playerY,
        );
        if (distance < 350) {
          const pull = Phaser.Math.Clamp((350 - distance) / 190, 0.08, 0.72);
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
      if (distance < object.radius + 35) {
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

      if (object.container.x < -150) {
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
    this.score += this.feverUntilMs > this.elapsedMs ? 20 : 10;
    this.collected += 1;
    this.createBurst(
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
    this.updateHud();
  }

  private hitObstacle(object: FlightObject) {
    this.hearts = Math.max(0, this.hearts - 1);
    this.invulnerableUntilMs = this.elapsedMs + 1_500;
    this.cameras.main.shake(170, 0.006);
    this.vibrate([35, 45, 35]);
    this.createBurst(object.container.x, object.container.y, COLORS.coral);
    object.container.destroy(true);
    this.updateHud();

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

  private createBurst(x: number, y: number, color: number) {
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const particle = this.add
        .circle(x, y, Phaser.Math.Between(4, 9), color, 0.95)
        .setDepth(45)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * Phaser.Math.Between(35, 75),
        y: y + Math.sin(angle) * Phaser.Math.Between(30, 65),
        alpha: 0,
        scale: 0.25,
        duration: 430,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createFeverSpark() {
    if (!this.player) return;
    const color =
      AirportScene.FEVER_COLORS[
        Math.floor(this.elapsedMs / 70) %
          AirportScene.FEVER_COLORS.length
      ];
    const trail = this.add
      .rectangle(
        this.player.x - Phaser.Math.Between(55, 95),
        this.player.y + Phaser.Math.Between(-42, 42),
        Phaser.Math.Between(28, 62),
        Phaser.Math.Between(4, 10),
        color,
        0.9,
      )
      .setDepth(18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: trail,
      x: trail.x - Phaser.Math.Between(100, 190),
      scaleX: 1.8,
      alpha: 0,
      duration: Phaser.Math.Between(280, 480),
      ease: "Quad.easeOut",
      onComplete: () => trail.destroy(),
    });

    if (Math.floor(this.elapsedMs / 70) % 3 === 0) {
      const sparkle = this.add
        .text(
          this.player.x + Phaser.Math.Between(-70, 70),
          this.player.y + Phaser.Math.Between(-55, 55),
          "✦",
          {
            color: Phaser.Display.Color.IntegerToColor(color).rgba,
            fontFamily: FONT_FAMILY,
            fontSize: `${Phaser.Math.Between(18, 31)}px`,
            fontStyle: "bold",
          },
        )
        .setOrigin(0.5)
        .setDepth(43)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(25, 55),
        angle: 120,
        scale: 1.5,
        alpha: 0,
        duration: 520,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private clearObjects() {
    this.objects.forEach((object) => object.container.destroy(true));
    this.objects = [];
  }

  private updateHud() {
    this.scoreText?.setText(`데이터 ${this.score.toLocaleString()}점`);
    this.heartText?.setText(
      `${"♥ ".repeat(this.hearts)}${"♡ ".repeat(3 - this.hearts)}`.trim(),
    );
    const seconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    this.timerText?.setText(
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
        seconds % 60,
      ).padStart(2, "0")}`,
    );

    const feverRemaining = Math.max(0, this.feverUntilMs - this.elapsedMs);
    const fever = feverRemaining > 0;
    this.feverText?.setVisible(fever);
    this.feverBar?.setVisible(fever);
    this.feverOverlay?.setVisible(fever);
    this.feverFrame?.setVisible(fever);
    const rainbowIndex =
      Math.floor(this.elapsedMs / 115) %
      AirportScene.FEVER_COLORS.length;
    const rainbowColor = AirportScene.FEVER_COLORS[rainbowIndex];
    if (fever) {
      this.feverOverlay?.setFillStyle(
        rainbowColor,
        0.08 + Math.sin(this.elapsedMs / 95) * 0.025,
      );
      this.feverFrame?.clear();
      this.feverFrame?.lineStyle(13, rainbowColor, 0.72);
      this.feverFrame?.strokeRoundedRect(15, 15, 1250, 690, 34);
      this.feverFrame?.lineStyle(
        5,
        AirportScene.FEVER_COLORS[
          (rainbowIndex + 3) % AirportScene.FEVER_COLORS.length
        ],
        0.8,
      );
      this.feverFrame?.strokeRoundedRect(29, 29, 1222, 662, 28);
      this.feverText
        ?.setColor(Phaser.Display.Color.IntegerToColor(rainbowColor).rgba)
        .setScale(1 + Math.sin(this.elapsedMs / 90) * 0.1)
        .setAngle(Math.sin(this.elapsedMs / 140) * 2);
    } else {
      this.feverFrame?.clear();
      this.feverText?.setScale(1).setAngle(0);
    }
    if (this.feverBar) {
      this.feverBar.clear();
      if (fever) {
        this.feverBar.fillStyle(COLORS.ink, 0.5);
        this.feverBar.fillRoundedRect(445, 126, 390, 18, 9);
        this.feverBar.fillStyle(COLORS.yellow, 1);
        this.feverBar.fillRoundedRect(
          449,
          130,
          382 * (feverRemaining / AirportScene.FEVER_DURATION_MS),
          10,
          5,
        );
      }
    }
  }

  private finishGame(completed: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.pointerActive = false;
    this.clearObjects();
    this.activeQuestion = undefined;
    this.questionOverlay?.destroy(true);
    this.missionBanner?.destroy(true);
    this.feverText?.setVisible(false);
    this.feverBar?.setVisible(false);
    this.feverOverlay?.setVisible(false);
    this.feverFrame?.setVisible(false);
    this.cameras.main.setZoom(this.renderScale);

    const overlay = this.add.container(640, 360).setDepth(110);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x123842, 0.82);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 1);
    panel.lineStyle(9, COLORS.ink, 1);
    panel.fillRoundedRect(-370, -250, 740, 500, 64);
    panel.strokeRoundedRect(-370, -250, 740, 500, 64);
    const icon = this.add
      .text(0, -180, completed ? "🏆" : "💛", { fontSize: "70px" })
      .setOrigin(0.5);
    const title = this.add
      .text(0, -92, completed ? "데이터 비행 완료!" : "비행을 마쳤어요", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "39px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const stats = this.add
      .text(
        0,
        8,
        `최종 점수  ${this.score.toLocaleString()}점\n수집한 데이터  ${this.collected}개   ·   맞힌 문제  ${this.correctAnswers}개`,
        {
          color: "#287b85",
          fontFamily: FONT_FAMILY,
          fontSize: "25px",
          fontStyle: "bold",
          align: "center",
          lineSpacing: 13,
        },
      )
      .setOrigin(0.5);
    const retry = this.createResultButton(0, 122, "다시 비행", COLORS.coral, () =>
      this.scene.restart(),
    );
    const world = this.createResultButton(0, 198, "마을로 돌아가기", COLORS.mint, () =>
      this.returnToWorld(),
    );
    overlay.add([shade, panel, icon, title, stats, retry, world]);
    overlay.setScale(0.9).setAlpha(0);
    this.tweens.add({
      targets: overlay,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: "Back.easeOut",
    });
    if (completed) this.cameras.main.flash(250, 255, 248, 205);
  }

  private createResultButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ) {
    const button = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.ink, 0.22);
    shadow.fillRoundedRect(-150, -25, 300, 58, 24);
    const plate = this.add.graphics();
    plate.fillStyle(color, 1);
    plate.lineStyle(5, COLORS.ink, 1);
    plate.fillRoundedRect(-150, -30, 300, 58, 24);
    plate.strokeRoundedRect(-150, -30, 300, 58, 24);
    const text = this.add
      .text(0, -1, label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    button.add([shadow, plate, text]);
    button.setSize(320, 70).setInteractive({ useHandCursor: true });
    button.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    return button;
  }

  private returnToWorld() {
    if (!this.scene.isActive()) return;
    this.cameras.main.fadeOut(220, 230, 250, 255);
    this.time.delayedCall(220, () => this.scene.start("world"));
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  private updatePlayer(deltaMs: number) {
    if (!this.player || this.finished) return;
    const direction = new Phaser.Math.Vector2(
      (this.cursors?.right.isDown || this.keys?.right.isDown ? 1 : 0) -
        (this.cursors?.left.isDown || this.keys?.left.isDown ? 1 : 0),
      (this.cursors?.down.isDown || this.keys?.down.isDown ? 1 : 0) -
        (this.cursors?.up.isDown || this.keys?.up.isDown ? 1 : 0),
    );
    if (direction.lengthSq() > 0) direction.normalize();
    const oldX = this.player.x;
    const oldY = this.player.y;
    if (this.pointerActive) {
      const pointerDirection = new Phaser.Math.Vector2(
        this.pointerTargetX - this.player.x,
        this.pointerTargetY - this.player.y,
      );
      const remainingDistance = pointerDirection.length();
      if (remainingDistance > 0) {
        const distance = Math.min(
          remainingDistance,
          AirportScene.PLAYER_SPEED * (deltaMs / 1000),
        );
        pointerDirection.normalize();
        this.player.x += pointerDirection.x * distance;
        this.player.y += pointerDirection.y * distance;
      }
    } else if (direction.lengthSq() > 0) {
      const distance = AirportScene.PLAYER_SPEED * (deltaMs / 1000);
      this.player.x += direction.x * distance;
      this.player.y += direction.y * distance;
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 125, 1135);
    this.player.y = Phaser.Math.Clamp(this.player.y, 125, 635);
    const horizontalMovement = this.player.x - oldX;
    const movement = this.player.y - oldY;
    this.player.rotation = Phaser.Math.Linear(
      this.player.rotation,
      Phaser.Math.Clamp(
        movement * 0.018 + horizontalMovement * 0.002,
        -0.19,
        0.19,
      ),
      0.18,
    );
  }

  update(_time: number, delta: number) {
    const safeDelta = Math.min(delta, 50);
    const speedMultiplier =
      this.feverUntilMs > this.elapsedMs && !this.finished ? 1.55 : 1;
    if (this.sky) this.sky.tilePositionX += 21 * speedMultiplier * (safeDelta / 1000);
    if (this.city) this.city.tilePositionX += 92 * speedMultiplier * (safeDelta / 1000);
    if (this.ground) this.ground.tilePositionX += 855 * speedMultiplier * (safeDelta / 1000);

    if (this.finished) return;
    if (this.countdownMs > 0) {
      this.countdownMs -= safeDelta;
      const count = Math.max(1, Math.ceil(this.countdownMs / 1000));
      this.countdownText?.setText(`${count}`);
      if (this.countdownMs <= 0) {
        this.countdownText?.setText("출발!");
        this.tweens.add({
          targets: [
            this.countdownText,
            this.children.getByName("airport-start-hint"),
          ],
          alpha: 0,
          scale: 1.35,
          duration: 420,
          onComplete: () => {
            this.countdownText?.destroy();
            this.children.getByName("airport-start-hint")?.destroy();
          },
        });
      }
      this.updatePlayer(safeDelta);
      return;
    }

    this.elapsedMs += safeDelta;
    this.remainingMs = Math.max(0, this.remainingMs - safeDelta);
    this.updatePlayer(safeDelta);

    const fever = this.feverUntilMs > this.elapsedMs;
    this.cameras.main.setZoom(
      this.renderScale * (fever ? 1 + Math.sin(this.elapsedMs / 95) * 0.008 : 1),
    );
    if (fever && this.elapsedMs >= this.nextFeverSparkAtMs) {
      this.createFeverSpark();
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

    if (
      !this.activeQuestion &&
      !fever &&
      this.elapsedMs >= this.nextQuestionAtMs
    ) {
      this.startQuestion();
    }
    if (
      this.activeQuestion?.phase === "reading" &&
      this.elapsedMs >= this.activeQuestion.readingUntilMs
    ) {
      this.releaseQuestionChoices();
    }

    if (!this.activeQuestion) {
      const dataInterval = fever ? 180 : 900;
      if (this.elapsedMs >= this.nextDataAtMs) {
        this.spawnData();
        this.nextDataAtMs = this.elapsedMs + dataInterval;
      }
      if (!fever && this.elapsedMs >= this.nextObstacleAtMs) {
        this.spawnObstacle();
        const difficulty = Phaser.Math.Clamp(
          this.elapsedMs / AirportScene.GAME_DURATION_MS,
          0,
          1,
        );
        this.nextObstacleAtMs =
          this.elapsedMs +
          Phaser.Math.Between(
            Math.round(1_450 - difficulty * 220),
            Math.round(2_150 - difficulty * 300),
          );
      }
    }

    this.updateFlightObjects(safeDelta);
    this.updateHud();
    if (this.remainingMs <= 0) this.finishGame(true);
  }
}

type WorkshopPhase =
  | "request"
  | "choosing"
  | "crafting"
  | "delivery"
  | "transition"
  | "finished";

type WorkshopOrder = {
  requests: WorkshopRequest[];
  products: WorkshopProduct[];
  isDouble: boolean;
  requiredStarHits: number;
};

type HangingWorkshopProduct = {
  product: WorkshopProduct;
  container: Phaser.GameObjects.Container;
};

class AiWorkshopScene extends Phaser.Scene {
  private static readonly GAME_DURATION_MS = 120_000;
  private static readonly WORKBENCH = {
    x: 940,
    y: 714,
    interactionY: 585,
    depth: 33,
  };
  private static readonly PLAYER_BOUNDS = {
    left: 305,
    right: 1180,
    top: 400,
    bottom: 520,
  };

  private keys?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private playerFacing: PlayerFacing = "front";
  private customerContainer?: Phaser.GameObjects.Container;
  private customerArt?: Phaser.GameObjects.Image;
  private customerEmoji?: Phaser.GameObjects.Text;
  private customerRoleText?: Phaser.GameObjects.Text;
  private dialogueText?: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private hangingProducts: HangingWorkshopProduct[] = [];
  private carriedProducts: WorkshopProduct[] = [];
  private carriedVisuals: Phaser.GameObjects.Container[] = [];
  private currentOrder?: WorkshopOrder;
  private previousRequestId?: string;
  private phase: WorkshopPhase = "request";
  private customerNumber = 0;
  private completedCustomers = 0;
  private coins = 0;
  private wrongDeliveries = 0;
  private remainingMs = AiWorkshopScene.GAME_DURATION_MS;
  private timerText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private mistakeText?: Phaser.GameObjects.Text;
  private customerCountText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private actionText?: Phaser.GameObjects.Text;
  private workbenchGlow?: Phaser.GameObjects.Rectangle;
  private workbenchSprite?: Phaser.GameObjects.Image;
  private joystick = new Phaser.Math.Vector2();
  private joystickPointerId = -1;
  private joystickKnob?: Phaser.GameObjects.Arc;
  private actionQueued = false;
  private starCatchContainer?: Phaser.GameObjects.Container;
  private starMarker?: Phaser.GameObjects.Text;
  private starStatusText?: Phaser.GameObjects.Text;
  private starZoneCenter = 0;
  private starZoneWidth = 120;
  private starX = -255;
  private starDirection: 1 | -1 = 1;
  private starHits = 0;
  private starMisses = 0;
  private starCatchLocked = false;
  private finished = false;

  constructor(private readonly renderScale: number) {
    super("shop-workshop");
  }

  preload() {
    this.load.image("ai-workshop-interior", GAME_ASSETS.shop.workshop);
    this.load.image("ai-workbench-foreground", GAME_ASSETS.shop.workbench);
    this.load.image("workshop-hanger", GAME_ASSETS.shop.hanger);
    WORKSHOP_REQUESTS.forEach((request) => {
      this.load.image(`workshop-customer-${request.id}`, request.customerImage);
    });
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
    generateCustomerTexture(this);
    this.resetState();
    this.drawWorkshop();
    this.createHud();
    this.createCustomer();
    this.createPlayer();
    this.createControls();
    this.createNextOrder();
    this.cameras.main.fadeIn(320, 255, 244, 210);
  }

  private resetState() {
    this.hangingProducts = [];
    this.carriedProducts = [];
    this.carriedVisuals = [];
    this.currentOrder = undefined;
    this.previousRequestId = undefined;
    this.phase = "request";
    this.customerNumber = 0;
    this.completedCustomers = 0;
    this.coins = 0;
    this.wrongDeliveries = 0;
    this.remainingMs = AiWorkshopScene.GAME_DURATION_MS;
    this.starHits = 0;
    this.starMisses = 0;
    this.starCatchLocked = false;
    this.joystick.set(0, 0);
    this.joystickPointerId = -1;
    this.actionQueued = false;
    this.finished = false;
  }

  private drawWorkshop() {
    this.add
      .image(640, 360, "ai-workshop-interior")
      .setDisplaySize(1280, 720)
      .setDepth(0);
    this.add
      .rectangle(640, 360, 1270, 710, 0xffffff, 0)
      .setStrokeStyle(8, COLORS.ink, 0.95)
      .setDepth(45);

    this.workbenchGlow = this.add
      .rectangle(
        AiWorkshopScene.WORKBENCH.x,
        AiWorkshopScene.WORKBENCH.interactionY,
        570,
        34,
        0x76edf1,
        0.12,
      )
      .setDepth(31)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.workbenchGlow,
      alpha: { from: 0.08, to: 0.3 },
      scale: { from: 0.94, to: 1.05 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.workbenchSprite = this.add
      .image(
        AiWorkshopScene.WORKBENCH.x,
        AiWorkshopScene.WORKBENCH.y,
        "ai-workbench-foreground",
      )
      .setDisplaySize(650, 185)
      .setOrigin(0.5, 1)
      .setDepth(AiWorkshopScene.WORKBENCH.depth);
  }

  private createHud() {
    const back = this.createRoundButton(55, 52, "←", () =>
      this.returnToWorld(),
    );
    back.setDepth(60);

    const titlePlate = this.add.graphics().setDepth(50);
    titlePlate.fillStyle(COLORS.ink, 0.9);
    titlePlate.fillRoundedRect(102, 20, 250, 64, 26);
    titlePlate.lineStyle(4, 0xfcecc4, 0.95);
    titlePlate.strokeRoundedRect(102, 20, 250, 64, 26);
    this.add
      .text(227, 52, "생활 속 AI 제작소", {
        color: "#fff7df",
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);

    const statusPlate = this.add.graphics().setDepth(50);
    statusPlate.fillStyle(0xfffbef, 0.94);
    statusPlate.lineStyle(4, COLORS.ink, 0.96);
    statusPlate.fillRoundedRect(730, 20, 520, 64, 26);
    statusPlate.strokeRoundedRect(730, 20, 520, 64, 26);
    this.customerCountText = this.add
      .text(760, 52, "손님 1", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(51);
    this.coinText = this.add
      .text(920, 52, "💰 0", {
        color: "#a06024",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.mistakeText = this.add
      .text(1068, 52, "실수 ♡ ♡ ♡", {
        color: "#d85b55",
        fontFamily: FONT_FAMILY,
        fontSize: "19px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.timerText = this.add
      .text(1220, 52, "02:00", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5)
      .setDepth(51);

    const bubble = this.add.graphics().setDepth(24);
    bubble.fillStyle(COLORS.ink, 0.2);
    bubble.fillRoundedRect(30, 116, 330, 186, 34);
    bubble.fillStyle(COLORS.paper, 0.98);
    bubble.lineStyle(6, COLORS.ink, 1);
    bubble.fillRoundedRect(23, 108, 330, 186, 34);
    bubble.strokeRoundedRect(23, 108, 330, 186, 34);
    this.dialogueText = this.add
      .text(49, 134, "", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        lineSpacing: 8,
        wordWrap: { width: 278 },
      })
      .setDepth(25);

    this.promptText = this.add
      .text(690, 680, "손님의 부탁을 들어 보세요", {
        color: "#173f43",
        backgroundColor: "#fff9e9e8",
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "bold",
        padding: { x: 17, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(40);
  }

  private createRoundButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ) {
    const button = this.add.container(x, y);
    const shadow = this.add.circle(3, 5, 33, COLORS.ink, 0.2);
    const body = this.add.circle(0, 0, 33, COLORS.paper, 1);
    body.setStrokeStyle(6, COLORS.ink, 1);
    const text = this.add
      .text(0, -1, label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "29px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    button.add([shadow, body, text]);
    button.setSize(76, 76).setInteractive({ useHandCursor: true });
    button.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    button.on("pointerover", () => button.setScale(1.06));
    button.on("pointerout", () => button.setScale(1));
    return button;
  }

  private createCustomer() {
    const pedestal = this.add.ellipse(0, 68, 175, 45, COLORS.ink, 0.12);
    this.customerArt = this.add
      .image(0, 0, "customer-fallback")
      .setDisplaySize(205, 230)
      .setPosition(0, -30);
    this.customerEmoji = this.add
      .text(-54, -55, "🛍️", {
        fontSize: "37px",
      })
      .setOrigin(0.5);
    const rolePlate = this.add.graphics();
    rolePlate.fillStyle(COLORS.paper, 0.96);
    rolePlate.lineStyle(4, COLORS.ink, 1);
    rolePlate.fillRoundedRect(-120, 88, 240, 46, 18);
    rolePlate.strokeRoundedRect(-120, 88, 240, 46, 18);
    this.customerRoleText = this.add
      .text(0, 111, "오늘의 손님", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.customerContainer = this.add
      .container(-170, 478, [
        pedestal,
        this.customerArt,
        this.customerEmoji,
        rolePlate,
        this.customerRoleText,
      ])
      .setDepth(16);
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(0, 57, 80, 23, COLORS.ink, 0.17);
    this.playerSprite = this.add
      .image(0, 0, "player-front")
      .setDisplaySize(110, 125);
    this.player = this.add
      .container(730, 500, [this.playerShadow, this.playerSprite])
      .setDepth(30);
    this.updatePlayerPerspective();
  }

  private createControls() {
    this.keys = makeControlKeys(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on("keydown-ESC", () => this.returnToWorld());

    const joystickBase = this.add
      .circle(510, 620, 62, COLORS.paper, 0.52)
      .setStrokeStyle(6, COLORS.ink, 0.55)
      .setDepth(55)
      .setInteractive();
    this.joystickKnob = this.add
      .circle(510, 620, 28, COLORS.mint, 0.84)
      .setStrokeStyle(5, COLORS.ink, 0.8)
      .setDepth(56);

    const moveJoystick = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;
      const vector = new Phaser.Math.Vector2(pointer.x - 510, pointer.y - 620);
      if (vector.length() > 48) vector.setLength(48);
      this.joystick.set(vector.x / 48, vector.y / 48);
      this.joystickKnob?.setPosition(510 + vector.x, 620 + vector.y);
    };
    joystickBase.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.joystickPointerId = pointer.id;
      moveJoystick(pointer);
    });
    this.input.on("pointermove", moveJoystick);
    const releaseJoystick = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;
      this.joystickPointerId = -1;
      this.joystick.set(0, 0);
      this.joystickKnob?.setPosition(510, 620);
    };
    this.input.on("pointerup", releaseJoystick);
    this.input.on("pointerupoutside", releaseJoystick);

    const action = this.add.container(1190, 630).setDepth(57);
    const actionShadow = this.add.circle(4, 7, 48, COLORS.ink, 0.22);
    const actionBody = this.add.circle(0, 0, 48, COLORS.coral, 0.94);
    actionBody.setStrokeStyle(7, COLORS.ink, 0.9);
    this.actionText = this.add
      .text(0, 0, "톡!", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    action.add([actionShadow, actionBody, this.actionText]);
    action.setSize(108, 108).setInteractive({ useHandCursor: true });
    action.on("pointerdown", () => {
      this.actionQueued = true;
      this.tweens.add({
        targets: action,
        scale: 0.88,
        duration: 80,
        yoyo: true,
      });
    });
  }

  private createNextOrder() {
    if (this.finished) return;
    this.customerNumber += 1;
    const isDouble =
      this.customerNumber >= 7 && (this.customerNumber - 7) % 3 === 0;
    const availableRequests = WORKSHOP_REQUESTS.filter(
      (request) => request.id !== this.previousRequestId,
    );
    const first = Phaser.Utils.Array.GetRandom(availableRequests);
    const requests = [first];
    if (isDouble) {
      requests.push(
        Phaser.Utils.Array.GetRandom(
          WORKSHOP_REQUESTS.filter(
            (request) =>
              request.id !== first.id &&
              request.productId !== first.productId,
          ),
        ),
      );
    }
    this.previousRequestId = first.id;
    const products = requests
      .map((request) => WORKSHOP_PRODUCT_BY_ID.get(request.productId))
      .filter((product): product is WorkshopProduct => Boolean(product));
    this.currentOrder = {
      requests,
      products,
      isDouble,
      requiredStarHits: isDouble ? 5 : 3,
    };
    this.phase = "request";
    this.starHits = 0;
    this.starMisses = 0;
    this.clearCarriedProducts();
    this.clearHangingProducts();
    this.customerCountText?.setText(`손님 ${this.customerNumber}`);
    const customerTexture = `workshop-customer-${first.id}`;
    const hasCustomerTexture = this.textures.exists(customerTexture);
    this.customerArt
      ?.setTexture(hasCustomerTexture ? customerTexture : "customer-fallback")
      .setDisplaySize(hasCustomerTexture ? 205 : 150, hasCustomerTexture ? 230 : 148)
      .setPosition(0, hasCustomerTexture ? -30 : 0);
    this.customerEmoji
      ?.setText(isDouble ? "🛍️" : first.customerEmoji)
      .setVisible(!hasCustomerTexture);
    this.customerRoleText?.setText(
      isDouble ? "AI 쇼핑 큰손 손님" : first.customerRole,
    );
    this.customerContainer?.setPosition(-170, 478).setAlpha(1);
    if (this.customerContainer) {
      this.tweens.add({
        targets: this.customerContainer,
        x: 183,
        duration: 520,
        ease: "Back.easeOut",
      });
    }

    const dialogue = isDouble
      ? `${products[0].label}랑 ${products[1].label} 주세요! 오늘은 미래 생활을 두 배로 시작해 보려고요.`
      : first.dialogue;
    this.typeDialogue(dialogue, () => {
      if (!this.finished && this.phase === "request") {
        this.phase = "choosing";
        this.spawnProductChoices();
      }
    });
  }

  private typeDialogue(
    text: string,
    onComplete?: () => void,
    speed = 25,
  ) {
    this.typingTimer?.remove(false);
    this.dialogueText?.setText("");
    let index = 0;
    this.typingTimer = this.time.addEvent({
      delay: speed,
      repeat: Math.max(0, text.length - 1),
      callback: () => {
        index += 1;
        this.dialogueText?.setText(text.slice(0, index));
        if (index >= text.length) onComplete?.();
      },
    });
  }

  private spawnProductChoices() {
    const order = this.currentOrder;
    if (!order) return;
    this.clearHangingProducts();
    const choiceCount = this.customerNumber >= 4 ? 5 : 4;
    const answerIds = new Set(order.products.map((product) => product.id));
    const distractors = Phaser.Utils.Array.Shuffle(
      WORKSHOP_PRODUCTS.filter((product) => !answerIds.has(product.id)),
    ).slice(0, choiceCount - order.products.length);
    const choices = Phaser.Utils.Array.Shuffle([
      ...order.products,
      ...distractors,
    ]);
    const startX = choices.length === 5 ? 475 : 535;
    const gap = choices.length === 5 ? 165 : 190;

    choices.forEach((product, index) => {
      const x = startX + gap * index;
      const container = this.createProductVisual(product, x, -90, 1);
      container.setDepth(20);
      this.hangingProducts.push({ product, container });
      this.tweens.add({
        targets: container,
        y: 215 + (index % 2) * 18,
        duration: 470 + index * 60,
        delay: index * 70,
        ease: "Bounce.easeOut",
      });
      this.tweens.add({
        targets: container,
        angle: { from: -1.25, to: 1.25 },
        duration: 1150 + index * 80,
        delay: 600 + index * 70,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    this.promptText?.setText(
      order.isDouble
        ? "필요한 상품 두 개를 차례로 집어 작업대로 가져가세요"
        : "손님에게 필요한 상품을 집어 작업대로 가져가세요",
    );
    this.actionText?.setText("집기");
  }

  private createProductVisual(
    product: WorkshopProduct,
    x: number,
    y: number,
    scale: number,
  ) {
    const container = this.add.container(x, y).setScale(scale);
    const hanger = this.add
      .image(0, -50, "workshop-hanger")
      .setDisplaySize(31, 135)
      .setOrigin(0.5, 1);
    const shadow = this.add.circle(5, 6, 46, COLORS.ink, 0.2);
    const petals = this.add.graphics();
    petals.fillStyle(product.color, 1);
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      petals.fillCircle(Math.cos(angle) * 35, Math.sin(angle) * 35, 18);
    }
    petals.fillStyle(COLORS.paper, 1);
    petals.lineStyle(6, COLORS.ink, 1);
    petals.fillCircle(0, 0, 39);
    petals.strokeCircle(0, 0, 39);
    const emoji = this.add
      .text(0, -3, product.emoji, { fontSize: "39px" })
      .setOrigin(0.5);
    const ribbon = this.add.graphics();
    ribbon.fillStyle(COLORS.paper, 0.98);
    ribbon.lineStyle(4, COLORS.ink, 1);
    ribbon.fillRoundedRect(-68, 47, 136, 39, 13);
    ribbon.strokeRoundedRect(-68, 47, 136, 39, 13);
    const label = this.add
      .text(0, 66, product.label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 124 },
      })
      .setOrigin(0.5);
    container.add([hanger, shadow, petals, emoji, ribbon, label]);
    this.tweens.add({
      targets: petals,
      angle: 7,
      duration: 700 + Phaser.Math.Between(0, 300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return container;
  }

  private clearHangingProducts() {
    this.hangingProducts.forEach(({ container }) => container.destroy(true));
    this.hangingProducts = [];
  }

  private clearCarriedProducts() {
    this.carriedProducts = [];
    this.carriedVisuals.forEach((visual) => visual.destroy(true));
    this.carriedVisuals = [];
  }

  private updateCarriedVisuals() {
    this.carriedVisuals.forEach((visual) => visual.destroy(true));
    this.carriedVisuals = [];
    if (!this.player) return;
    this.carriedProducts.forEach((product, index) => {
      const visual = this.createProductVisual(
        product,
        this.player!.x + (index - (this.carriedProducts.length - 1) / 2) * 72,
        this.player!.y - 92,
        0.52,
      )
        .setDepth(34)
        .setData("carried", true);
      const cord = visual.getAt(0);
      if (
        cord instanceof Phaser.GameObjects.Graphics ||
        cord instanceof Phaser.GameObjects.Image
      ) {
        cord.setVisible(false);
      }
      this.carriedVisuals.push(visual);
    });
    this.updatePlayerPerspective();
    this.updateWorkshopDepth();
  }

  private nearestHangingProduct() {
    if (!this.player) return undefined;
    return this.hangingProducts.find(
      ({ container }) =>
        Phaser.Math.Distance.Between(
          this.player!.x,
          this.player!.y,
          container.x,
          container.y,
        ) < 220,
    );
  }

  private interact() {
    if (this.finished) return;
    if (this.phase === "crafting") {
      this.tryStarCatch();
      return;
    }
    if (!this.player || !this.currentOrder) return;

    if (this.phase === "choosing") {
      const nearbyProduct = this.nearestHangingProduct();
      if (nearbyProduct) {
        if (
          this.carriedProducts.length >= this.currentOrder.products.length
        ) {
          this.promptText?.setText("손이 가득 찼어요. 작업대로 가져가세요!");
          return;
        }
        this.carriedProducts.push(nearbyProduct.product);
        nearbyProduct.container.destroy(true);
        this.hangingProducts = this.hangingProducts.filter(
          (entry) => entry !== nearbyProduct,
        );
        this.updateCarriedVisuals();
        this.createSparkBurst(this.player.x, this.player.y - 65, nearbyProduct.product.color);
        this.promptText?.setText(
          this.carriedProducts.length < this.currentOrder.products.length
            ? "상품을 하나 더 골라 주세요"
            : "작업대로 가져가 제작을 시작하세요",
        );
        return;
      }

      const atWorkbench =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          AiWorkshopScene.WORKBENCH.x,
          AiWorkshopScene.WORKBENCH.interactionY,
        ) < 150;
      if (
        atWorkbench &&
        this.carriedProducts.length < this.currentOrder.products.length
      ) {
        this.promptText?.setText(
          this.currentOrder.isDouble
            ? "손님이 부탁한 상품 두 개가 모두 필요해요"
            : "먼저 상품을 골라서 가져와 주세요",
        );
        return;
      }
      if (atWorkbench) this.checkProductsAtWorkbench();
      return;
    }

    if (
      this.phase === "delivery" &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        245,
        500,
      ) < 175
    ) {
      this.completeCustomer();
    }
  }

  private checkProductsAtWorkbench() {
    const order = this.currentOrder;
    if (!order) return;
    const expected = [...order.products.map((product) => product.id)].sort();
    const carried = [...this.carriedProducts.map((product) => product.id)].sort();
    const correct =
      expected.length === carried.length &&
      expected.every((productId, index) => productId === carried[index]);
    if (correct) {
      this.clearHangingProducts();
      this.clearCarriedProducts();
      this.startStarCatch();
      return;
    }

    this.wrongDeliveries += 1;
    this.updateHud();
    this.phase = "transition";
    this.cameras.main.shake(160, 0.005);
    this.vibrate([35, 40, 35]);
    const firstRequest = order.requests[0];
    const reply = Phaser.Utils.Array.GetRandom(firstRequest.wrongReplies);
    this.typeDialogue(reply);
    if (this.customerContainer) {
      this.tweens.add({
        targets: this.customerContainer,
        x: 170,
        angle: 3,
        duration: 70,
        yoyo: true,
        repeat: 3,
      });
    }
    this.clearCarriedProducts();
    this.clearHangingProducts();
    if (this.wrongDeliveries >= 3) {
      this.time.delayedCall(1_150, () => this.finishGame(false));
      return;
    }
    this.time.delayedCall(1_550, () => {
      if (this.finished) return;
      this.phase = "choosing";
      this.spawnProductChoices();
    });
  }

  private startStarCatch() {
    const order = this.currentOrder;
    if (!order) return;
    this.phase = "crafting";
    this.starHits = 0;
    this.starMisses = 0;
    this.starCatchLocked = false;
    this.starDirection = 1;
    this.starX = -255;
    this.typeDialogue(
      order.isDouble
        ? "네, 두 가지 모두 맞아요! 튼튼하게 완성해 주세요!"
        : "맞아요, 바로 그거예요! 멋지게 만들어 주세요!",
    );
    this.promptText?.setText(
      `빛나는 구역에서 멈추세요 · 성공 0 / ${order.requiredStarHits}`,
    );
    this.actionText?.setText("멈춤!");
    this.createStarCatchPanel();
  }

  private createStarCatchPanel() {
    const order = this.currentOrder;
    if (!order) return;
    this.starCatchContainer?.destroy(true);
    const container = this.add.container(790, 390).setDepth(70);
    const shade = this.add.rectangle(0, 0, 760, 320, 0x173f43, 0.18);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 0.98);
    panel.lineStyle(8, COLORS.ink, 1);
    panel.fillRoundedRect(-355, -145, 710, 290, 48);
    panel.strokeRoundedRect(-355, -145, 710, 290, 48);
    const title = this.add
      .text(0, -103, "✨ STAR CATCH · AI 제작 중", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "27px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const track = this.add.graphics();
    track.fillStyle(COLORS.ink, 0.22);
    track.fillRoundedRect(-280, -28, 560, 60, 25);
    track.fillStyle(0x315e68, 1);
    track.fillRoundedRect(-270, -18, 540, 40, 18);
    const harder = this.customerNumber >= 4;
    this.starZoneWidth = order.isDouble ? 78 : harder ? 92 : 125;
    this.randomizeStarZone();
    const zone = this.add.graphics().setName("star-zone");
    zone.fillStyle(COLORS.yellow, 0.92);
    zone.fillRoundedRect(
      this.starZoneCenter - this.starZoneWidth / 2,
      -18,
      this.starZoneWidth,
      40,
      18,
    );
    zone.lineStyle(4, 0xfff3a0, 1);
    zone.strokeRoundedRect(
      this.starZoneCenter - this.starZoneWidth / 2,
      -18,
      this.starZoneWidth,
      40,
      18,
    );
    this.starMarker = this.add
      .text(this.starX, 1, "★", {
        color: "#fff8c2",
        fontFamily: FONT_FAMILY,
        fontSize: "45px",
        fontStyle: "bold",
        stroke: "#d75550",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.starStatusText = this.add
      .text(0, 89, `성공 0 / ${order.requiredStarHits}`, {
        color: "#287b85",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    container.add([
      shade,
      panel,
      title,
      track,
      zone,
      this.starMarker,
      this.starStatusText,
    ]);
    container.setScale(0.78).setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
    this.starCatchContainer = container;
  }

  private randomizeStarZone() {
    this.starZoneCenter = Phaser.Math.Between(-205, 205);
  }

  private resetStarCatchRound() {
    if (!this.starCatchContainer || !this.currentOrder) return;
    this.starCatchLocked = false;
    this.starX = this.starDirection === 1 ? -255 : 255;
    this.randomizeStarZone();
    const zone = this.starCatchContainer.getByName(
      "star-zone",
    ) as Phaser.GameObjects.Graphics | null;
    zone?.clear();
    zone?.fillStyle(COLORS.yellow, 0.92);
    zone?.fillRoundedRect(
      this.starZoneCenter - this.starZoneWidth / 2,
      -18,
      this.starZoneWidth,
      40,
      18,
    );
    zone?.lineStyle(4, 0xfff3a0, 1);
    zone?.strokeRoundedRect(
      this.starZoneCenter - this.starZoneWidth / 2,
      -18,
      this.starZoneWidth,
      40,
      18,
    );
    this.starMarker?.setPosition(this.starX, 1).setAlpha(1).setScale(1);
  }

  private tryStarCatch() {
    const order = this.currentOrder;
    if (
      !order ||
      this.phase !== "crafting" ||
      this.starCatchLocked
    ) {
      return;
    }
    this.starCatchLocked = true;
    const success =
      Math.abs(this.starX - this.starZoneCenter) <= this.starZoneWidth / 2;
    if (success) {
      this.starHits += 1;
      this.starStatusText?.setText(
        `성공 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.promptText?.setText(
        `좋아요! 성공 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.cameras.main.flash(120, 255, 232, 120);
      this.createSparkBurst(790 + this.starX, 390, COLORS.yellow);
      this.tweens.add({
        targets: this.starMarker,
        scale: 1.7,
        angle: 180,
        duration: 180,
        yoyo: true,
      });
      if (this.starHits >= order.requiredStarHits) {
        this.time.delayedCall(420, () => this.completeCrafting());
        return;
      }
    } else {
      this.starMisses += 1;
      this.starStatusText?.setText(
        `아깝다! · 성공 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.promptText?.setText("괜찮아요! 성공 횟수는 그대로예요. 다시 도전!");
      this.cameras.main.shake(90, 0.003);
      this.tweens.add({
        targets: this.starMarker,
        y: 28,
        alpha: 0.25,
        angle: 45,
        duration: 180,
      });
    }
    this.time.delayedCall(430, () => this.resetStarCatchRound());
  }

  private completeCrafting() {
    const order = this.currentOrder;
    if (!order || this.finished) return;
    this.phase = "delivery";
    this.starCatchContainer?.destroy(true);
    this.starCatchContainer = undefined;
    this.carriedProducts = [...order.products];
    this.updateCarriedVisuals();
    this.actionText?.setText("전달");
    this.promptText?.setText("완성됐어요! 손님에게 가져다주세요");
    this.typeDialogue(
      order.isDouble
        ? "우와, 두 개가 동시에 반짝여요! 얼른 보고 싶어요!"
        : "기계에서 반짝이는 빛이 나요! 완성된 건가요?",
    );
    this.createSparkBurst(
      AiWorkshopScene.WORKBENCH.x,
      AiWorkshopScene.WORKBENCH.interactionY,
      COLORS.mint,
    );
    this.workbenchGlow?.setFillStyle(COLORS.yellow, 0.42);
    this.time.delayedCall(500, () =>
      this.workbenchGlow?.setFillStyle(0xffd978, 0.08),
    );
  }

  private completeCustomer() {
    const order = this.currentOrder;
    if (!order || this.phase !== "delivery") return;
    this.phase = "transition";
    const baseReward = order.isDouble
      ? 220
      : this.customerNumber >= 4
        ? 130
        : 100;
    const perfectBonus = this.starMisses === 0 ? 50 : 0;
    const reward = baseReward + perfectBonus;
    this.coins += reward;
    this.completedCustomers += 1;
    this.clearCarriedProducts();
    this.updateHud();
    const thanks = order.isDouble
      ? `두 가지 모두 딱 맞아요! ${reward}코인 받아 주세요. 오늘 쇼핑은 대성공이에요!`
      : `${order.requests[0].thanks} ${reward}코인 받아 주세요!`;
    this.typeDialogue(thanks);
    this.promptText?.setText(
      perfectBonus > 0
        ? `완벽 제작 보너스! +${reward}코인`
        : `손님 해결! +${reward}코인`,
    );
    this.createCoinBurst(185, 475);
    if (this.customerArt) {
      this.tweens.add({
        targets: this.customerArt,
        y: -16,
        angle: -5,
        duration: 150,
        yoyo: true,
        repeat: 2,
      });
    }
    this.time.delayedCall(1_900, () => {
      if (!this.customerContainer || this.finished) return;
      this.tweens.add({
        targets: this.customerContainer,
        x: -180,
        alpha: 0,
        duration: 470,
        ease: "Back.easeIn",
        onComplete: () => this.createNextOrder(),
      });
    });
  }

  private createSparkBurst(x: number, y: number, color: number) {
    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      const sparkle = this.add
        .text(x, y, index % 3 === 0 ? "★" : "✦", {
          color: Phaser.Display.Color.IntegerToColor(color).rgba,
          fontFamily: FONT_FAMILY,
          fontSize: `${Phaser.Math.Between(13, 25)}px`,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(80)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * Phaser.Math.Between(45, 100),
        y: y + Math.sin(angle) * Phaser.Math.Between(35, 85),
        angle: 180,
        alpha: 0,
        scale: 0.3,
        duration: 620,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private createCoinBurst(x: number, y: number) {
    for (let index = 0; index < 12; index += 1) {
      const coin = this.add
        .text(x, y, "●", {
          color: "#ffd45f",
          fontFamily: FONT_FAMILY,
          fontSize: "24px",
          stroke: "#a65c28",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(75);
      this.tweens.add({
        targets: coin,
        x: 920 + Phaser.Math.Between(-35, 35),
        y: 52 + Phaser.Math.Between(-12, 12),
        scale: 0.45,
        angle: 360,
        duration: 650 + index * 40,
        delay: index * 35,
        ease: "Cubic.easeIn",
        onComplete: () => coin.destroy(),
      });
    }
  }

  private updateHud() {
    this.coinText?.setText(`💰 ${this.coins}`);
    const remainingLives = Math.max(0, 3 - this.wrongDeliveries);
    this.mistakeText?.setText(
      `실수 ${"♥ ".repeat(remainingLives)}${"♡ ".repeat(
        3 - remainingLives,
      )}`.trim(),
    );
    const seconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    this.timerText?.setText(
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
        seconds % 60,
      ).padStart(2, "0")}`,
    );
  }

  private finishGame(timeCompleted: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.phase = "finished";
    this.typingTimer?.remove(false);
    this.clearHangingProducts();
    this.clearCarriedProducts();
    this.starCatchContainer?.destroy(true);
    this.starCatchContainer = undefined;
    this.customerContainer?.setVisible(false);
    this.player?.setVisible(false);

    const overlay = this.add.container(640, 360).setDepth(110);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x173f43, 0.8);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 1);
    panel.lineStyle(9, COLORS.ink, 1);
    panel.fillRoundedRect(-385, -250, 770, 500, 62);
    panel.strokeRoundedRect(-385, -250, 770, 500, 62);
    const icon = this.add
      .text(0, -180, timeCompleted ? "🏆" : "🛠️", {
        fontSize: "68px",
      })
      .setOrigin(0.5);
    const title = this.add
      .text(
        0,
        -95,
        timeCompleted ? "2분 영업 완료!" : "제작소 문을 잠시 닫아요",
        {
          color: "#173f43",
          fontFamily: FONT_FAMILY,
          fontSize: "38px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0.5);
    const description = this.add
      .text(
        0,
        -12,
        timeCompleted
          ? `손님 ${this.completedCustomers}명의 부탁을 해결하고\n${this.coins}코인을 벌었어요!`
          : `잘못된 상품을 세 번 전달했어요.\n손님 ${this.completedCustomers}명 · ${this.coins}코인`,
        {
          color: "#287b85",
          fontFamily: FONT_FAMILY,
          fontSize: "25px",
          fontStyle: "bold",
          align: "center",
          lineSpacing: 12,
        },
      )
      .setOrigin(0.5);
    const retry = this.createResultButton(0, 112, "다시 영업", COLORS.coral, () =>
      this.scene.restart(),
    );
    const world = this.createResultButton(0, 192, "마을로 돌아가기", COLORS.mint, () =>
      this.returnToWorld(),
    );
    overlay.add([shade, panel, icon, title, description, retry, world]);
    overlay.setScale(0.88).setAlpha(0);
    this.tweens.add({
      targets: overlay,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: "Back.easeOut",
    });
  }

  private createResultButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ) {
    const button = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.ink, 0.22);
    shadow.fillRoundedRect(-155, -25, 310, 60, 24);
    const body = this.add.graphics();
    body.fillStyle(color, 1);
    body.lineStyle(5, COLORS.ink, 1);
    body.fillRoundedRect(-155, -30, 310, 60, 24);
    body.strokeRoundedRect(-155, -30, 310, 60, 24);
    const text = this.add
      .text(0, 0, label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    button.add([shadow, body, text]);
    button.setSize(330, 72).setInteractive({ useHandCursor: true });
    button.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    return button;
  }

  private setPlayerFacing(direction: Phaser.Math.Vector2) {
    if (!this.playerSprite || direction.lengthSq() === 0) return;
    let next: PlayerFacing;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      next = direction.x < 0 ? "left" : "right";
    } else {
      next = direction.y < 0 ? "back" : "front";
    }
    if (next === this.playerFacing) return;
    this.playerFacing = next;
    const textureKey = `player-${next}`;
    if (this.textures.exists(textureKey)) this.playerSprite.setTexture(textureKey);
  }

  private updatePlayer(delta: number) {
    if (
      !this.player ||
      this.finished ||
      this.phase === "crafting" ||
      this.phase === "transition"
    ) {
      return;
    }
    const direction = new Phaser.Math.Vector2(
      this.joystick.x +
        (this.cursors?.right.isDown || this.keys?.right.isDown ? 1 : 0) -
        (this.cursors?.left.isDown || this.keys?.left.isDown ? 1 : 0),
      this.joystick.y +
        (this.cursors?.down.isDown || this.keys?.down.isDown ? 1 : 0) -
        (this.cursors?.up.isDown || this.keys?.up.isDown ? 1 : 0),
    );
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.setPlayerFacing(direction);
      this.player.x += direction.x * 285 * (delta / 1000);
      this.player.y += direction.y * 285 * (delta / 1000);
      this.player.x = Phaser.Math.Clamp(
        this.player.x,
        AiWorkshopScene.PLAYER_BOUNDS.left,
        AiWorkshopScene.PLAYER_BOUNDS.right,
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y,
        AiWorkshopScene.PLAYER_BOUNDS.top,
        AiWorkshopScene.PLAYER_BOUNDS.bottom,
      );
      this.player.rotation = Phaser.Math.Linear(
        this.player.rotation,
        direction.x * 0.035,
        0.2,
      );
      this.playerSprite?.setY(Math.sin(this.time.now / 65) * 2);
    } else {
      this.player.rotation *= 0.82;
      this.playerSprite?.setY(0);
    }
    this.carriedVisuals.forEach((visual, index) => {
      visual.setPosition(
        this.player!.x +
          (index - (this.carriedVisuals.length - 1) / 2) * 72,
        this.player!.y - 92,
      );
    });
    this.updatePlayerPerspective();
    this.updateWorkshopDepth();
  }

  private updatePlayerPerspective() {
    if (!this.player) return;
    const perspective = Phaser.Math.Clamp(
      Phaser.Math.Percent(
        this.player.y,
        AiWorkshopScene.PLAYER_BOUNDS.top,
        AiWorkshopScene.PLAYER_BOUNDS.bottom,
      ),
      0,
      1,
    );
    const scale = Phaser.Math.Linear(0.9, 1.2, perspective);
    this.player.setScale(scale);
    this.carriedVisuals.forEach((visual) =>
      visual.setScale(0.52 * scale),
    );
  }

  private updateWorkshopDepth() {
    if (!this.player) return;
    const playerDepth = AiWorkshopScene.WORKBENCH.depth - 3;
    this.player.setDepth(playerDepth);
    this.carriedVisuals.forEach((visual) => visual.setDepth(playerDepth + 1));
  }

  private updateInteractionPrompt() {
    if (!this.player || this.finished || this.phase === "crafting") return;
    if (this.phase === "choosing") {
      if (this.nearestHangingProduct()) {
        this.actionText?.setText("집기");
        return;
      }
      const atWorkbench =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          AiWorkshopScene.WORKBENCH.x,
          AiWorkshopScene.WORKBENCH.interactionY,
        ) < 150;
      this.actionText?.setText(atWorkbench ? "놓기" : "톡!");
      return;
    }
    if (this.phase === "delivery") {
      const nearCustomer =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          245,
          500,
        ) < 175;
      this.actionText?.setText(nearCustomer ? "전달" : "톡!");
    }
  }

  private updateStarCatch(delta: number) {
    if (
      this.phase !== "crafting" ||
      this.starCatchLocked ||
      !this.starMarker ||
      !this.currentOrder
    ) {
      return;
    }
    const speed =
      this.currentOrder.isDouble
        ? 665
        : this.customerNumber >= 4
          ? 590
          : 500;
    this.starX += this.starDirection * speed * (delta / 1000);
    if (this.starX >= 255) {
      this.starX = 255;
      this.starDirection = -1;
    } else if (this.starX <= -255) {
      this.starX = -255;
      this.starDirection = 1;
    }
    this.starMarker.setX(this.starX);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start("world"));
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return;
    const safeDelta = Math.min(delta, 50);
    this.remainingMs = Math.max(0, this.remainingMs - safeDelta);
    this.updateHud();
    this.updatePlayer(safeDelta);
    this.updateStarCatch(safeDelta);
    this.updateInteractionPrompt();

    if (
      this.keys &&
      (Phaser.Input.Keyboard.JustDown(this.keys.action) ||
        Phaser.Input.Keyboard.JustDown(this.keys.enter))
    ) {
      this.interact();
    }
    if (this.actionQueued) {
      this.actionQueued = false;
      this.interact();
    }
    if (this.remainingMs <= 0) this.finishGame(true);
  }
}

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

class CoreKitchenScene extends Phaser.Scene {
  private static readonly CORE_KINDS: CoreKind[] = [
    "input",
    "process",
    "output",
  ];

  private static readonly LANE_Y: Record<CoreKind, number> = {
    input: 455,
    process: 535,
    output: 615,
  };

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
  private joystickPointerId = -1;
  private joystickKnob?: Phaser.GameObjects.Arc;
  private actionQueued = false;

  constructor(private readonly renderScale: number) {
    super("shop");
  }

  preload() {
    if (!this.textures.exists("ai-shop-interior")) {
      this.load.image("ai-shop-interior", GAME_ASSETS.shop.interior);
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

    this.drawWorkshop();
    this.createDialogue();
    this.createMachine();
    this.createPlayer();
    this.createControls();

    this.keys = makeControlKeys(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.showRound();
    this.cameras.main.fadeIn(300, 255, 245, 220);
  }

  private drawWorkshop() {
    this.add
      .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "ai-shop-interior")
      .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);

    this.add
      .rectangle(640, 553, 980, 296, 0x102f33, 0.84)
      .setStrokeStyle(7, COLORS.ink, 0.95)
      .setDepth(5);
    this.add
      .text(26, 28, "미디의 AI 미래 해결상점", {
        color: "#fff7e5",
        fontFamily: FONT_FAMILY,
        fontSize: "27px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setDepth(30);

    CoreKitchenScene.CORE_KINDS.forEach((kind, laneIndex) => {
      const y = CoreKitchenScene.LANE_Y[kind];
      const meta = CORE_KIND_META[kind];
      const belt = this.add.graphics().setDepth(7);
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

      const tag = this.add.graphics().setDepth(10);
      tag.fillStyle(meta.color, 1);
      tag.fillCircle(128, y, 35);
      tag.lineStyle(5, COLORS.ink, 1);
      tag.strokeCircle(128, y, 35);
      this.add
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

  private createDialogue() {
    this.dialogueLabel = this.add
      .text(478, 100, "", {
        color: "#2a877f",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setDepth(32);
    this.dialogueText = this.add
      .text(478, 130, "", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        lineSpacing: 8,
        wordWrap: { width: 335 },
      })
      .setDepth(32);
  }

  private createMachine() {
    const x = 1006;
    const y = 548;
    this.machineGlow = this.add
      .ellipse(x, y, 210, 270, COLORS.blue, 0.12)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    const machine = this.add.graphics().setDepth(8);
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

    this.add
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

    CoreKitchenScene.CORE_KINDS.forEach((kind) => {
      const slotY = CoreKitchenScene.LANE_Y[kind];
      const meta = CORE_KIND_META[kind];
      const slot = this.add.graphics().setDepth(10);
      slot.fillStyle(COLORS.ink, 0.62);
      slot.fillRoundedRect(x - 72, slotY - 24, 136, 48, 18);
      slot.lineStyle(4, meta.color, 0.8);
      slot.strokeRoundedRect(x - 72, slotY - 24, 136, 48, 18);
      this.add
        .text(x - 4, slotY, `${meta.shortLabel} 코어`, {
          color: "#8db4b0",
          fontFamily: FONT_FAMILY,
          fontSize: "14px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(11);
    });

    this.machineStatus = this.add
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

    this.add
      .zone(x, y, 235, 305)
      .setInteractive({ useHandCursor: true })
      .setDepth(14)
      .on("pointerdown", () => this.movePlayerToMachine());
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(0, 29, 55, 14, COLORS.ink, 0.25);
    this.playerSprite = this.add
      .image(0, 0, "player-front")
      .setDisplaySize(58, 75)
      .setOrigin(0.5, 0.84);
    this.player = this.add
      .container(620, 670, [this.playerShadow, this.playerSprite])
      .setDepth(24);
  }

  private createControls() {
    const back = addFlowerBadge(this, 55, 108, "←", COLORS.blue)
      .setDepth(40)
      .setScale(0.88)
      .setInteractive(
        new Phaser.Geom.Circle(0, 0, 47),
        Phaser.Geom.Circle.Contains,
      );
    back.on("pointerdown", () => this.returnToWorld());

    this.progressText = this.add
      .text(1210, 88, "", {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setOrigin(1, 0.5)
      .setDepth(40);
    this.comboText = this.add
      .text(1210, 124, "", {
        color: "#f5bd46",
        fontFamily: FONT_FAMILY,
        fontSize: "17px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 7,
      })
      .setOrigin(1, 0.5)
      .setDepth(40);
    this.helperText = this.add
      .text(585, 697, "방향키로 이동 · SPACE로 코어 집기/장착", {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(40);

    const joystickBase = this.add
      .circle(80, 625, 51, COLORS.cream, 0.68)
      .setStrokeStyle(5, COLORS.ink, 0.78)
      .setDepth(45);
    this.joystickKnob = this.add
      .circle(80, 625, 23, COLORS.mint, 0.92)
      .setStrokeStyle(4, COLORS.ink, 0.85)
      .setDepth(46);
    const joystickZone = this.add
      .zone(80, 625, 122, 122)
      .setCircleDropZone(61)
      .setInteractive()
      .setDepth(47);
    joystickZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.joystickPointerId = pointer.id;
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.updateJoystick(point.x, point.y);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId && pointer.isDown) {
        const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.updateJoystick(point.x, point.y);
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId) this.resetJoystick();
    });

    const action = this.add.container(1190, 625).setDepth(45);
    const actionShape = this.add.graphics();
    actionShape.fillStyle(COLORS.ink, 0.25);
    actionShape.fillCircle(5, 7, 53);
    actionShape.fillStyle(COLORS.coral, 1);
    actionShape.fillCircle(0, 0, 50);
    actionShape.lineStyle(5, COLORS.ink, 1);
    actionShape.strokeCircle(0, 0, 50);
    actionShape.fillStyle(COLORS.cream, 1);
    actionShape.fillCircle(0, 0, 34);
    this.actionText = this.add
      .text(0, -1, "집기", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const actionZone = this.add
      .zone(0, 0, 108, 108)
      .setCircleDropZone(54)
      .setInteractive({ useHandCursor: true });
    actionZone.on("pointerdown", () => {
      this.actionQueued = true;
      this.tweens.add({
        targets: action,
        scale: 0.9,
        duration: 70,
        yoyo: true,
      });
    });
    action.add([actionShape, this.actionText, actionZone]);
    joystickBase.setDepth(45);
  }

  private updateJoystick(x: number, y: number) {
    const dx = x - 80;
    const dy = y - 625;
    const length = Math.max(1, Math.hypot(dx, dy));
    const distance = Math.min(31, length);
    this.joystick.set(dx / length, dy / length);
    this.joystickKnob?.setPosition(
      80 + this.joystick.x * distance,
      625 + this.joystick.y * distance,
    );
  }

  private resetJoystick() {
    this.joystickPointerId = -1;
    this.joystick.set(0, 0);
    this.joystickKnob?.setPosition(80, 625);
  }

  private createCustomer(order: KitchenOrder) {
    this.customerContainer?.destroy(true);
    this.situationContainer?.destroy(true);

    const shadow = this.add.ellipse(0, 59, 120, 23, COLORS.ink, 0.18);
    this.customerArt = this.add
      .image(0, 0, "customer-fallback")
      .setDisplaySize(138, 136);
    const badge = this.add
      .circle(55, -42, 27, order.customerTone)
      .setStrokeStyle(4, COLORS.ink, 1);
    const emoji = this.add
      .text(55, -42, order.customerEmoji, { fontSize: "25px" })
      .setOrigin(0.5);
    const ribbon = this.add.graphics();
    ribbon.fillStyle(COLORS.paper, 1);
    ribbon.lineStyle(4, COLORS.ink, 1);
    ribbon.fillRoundedRect(-116, 75, 232, 48, 22);
    ribbon.strokeRoundedRect(-116, 75, 232, 48, 22);
    const role = this.add
      .text(0, 87, order.customerRole, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.customerContainer = this.add
      .container(-160, 335, [
        shadow,
        this.customerArt,
        badge,
        emoji,
        ribbon,
        role,
      ])
      .setDepth(20);
    this.tweens.add({
      targets: this.customerContainer,
      x: 360,
      duration: 540,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.customerArt,
      y: -5,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const situationShape = this.add.graphics();
    situationShape.fillStyle(COLORS.paper, 0.98);
    situationShape.fillCircle(0, 0, 45);
    situationShape.lineStyle(4, COLORS.ink, 1);
    situationShape.strokeCircle(0, 0, 45);
    this.situationIcon = this.add
      .text(0, -2, order.problemIcon, { fontSize: "34px" })
      .setOrigin(0.5);
    this.situationContainer = this.add
      .container(840, 335, [situationShape, this.situationIcon])
      .setDepth(20)
      .setScale(0);
    this.tweens.add({
      targets: this.situationContainer,
      scale: 1,
      duration: 360,
      delay: 250,
      ease: "Back.easeOut",
    });
  }

  private createCoreChip(core: AiCore, compact = false) {
    const meta = CORE_KIND_META[core.kind];
    const chip = this.add.container(0, 0);
    const shadow = this.add.graphics();
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
    const shape = this.add.graphics();
    shape.fillStyle(meta.color, 1);
    shape.fillPoints(points, true);
    shape.lineStyle(compact ? 3 : 4, COLORS.ink, 1);
    shape.strokePoints(points, true);
    shape.fillStyle(COLORS.cream, 0.94);
    shape.fillCircle(-width / 2 + 25, 0, compact ? 14 : 19);
    const icon = this.add
      .text(-width / 2 + 25, -1, core.emoji, {
        fontSize: compact ? "17px" : "23px",
      })
      .setOrigin(0.5);
    const label = this.add
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

  private spawnConveyors(order: KitchenOrder) {
    this.clearRoundCores();
    CoreKitchenScene.CORE_KINDS.forEach((kind, laneIndex) => {
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
        const chip = this.createCoreChip(core)
          .setPosition(300 + index * 235, CoreKitchenScene.LANE_Y[kind])
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
    CoreKitchenScene.CORE_KINDS.forEach((kind) => {
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
    this.carriedVisual = this.createCoreChip(moving.core, true)
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
    this.createPuff(this.player?.x ?? 600, this.player?.y ?? 600, CORE_KIND_META[moving.core.kind].color);
  }

  private dropCarriedCore() {
    if (!this.carried) return;
    this.carried.container
      .setPosition(
        Phaser.Math.Clamp(this.player?.x ?? 500, 230, 850),
        CoreKitchenScene.LANE_Y[this.carried.core.kind],
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

    const visual = this.createCoreChip(moving.core, true)
      .setPosition(1002, CoreKitchenScene.LANE_Y[kind])
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
    this.createPuff(1002, CoreKitchenScene.LANE_Y[kind], CORE_KIND_META[kind].color);

    const installedCount = CoreKitchenScene.CORE_KINDS.filter(
      (coreKind) => this.installed[coreKind],
    ).length;
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
      if (distanceToMachine < 155) {
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
    if (nearest && nearest.distance < 82) {
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
    const wrongKinds = CoreKitchenScene.CORE_KINDS.filter(
      (kind) => this.installed[kind]?.core.id !== order.recipe[kind],
    );
    if (wrongKinds.length === 0) {
      this.completeOrder(order);
      return;
    }

    this.mistakeCount += 1;
    this.combo = 0;
    this.updateCombo();
    this.cameras.main.shake(190, 0.006);
    this.vibrate([35, 45, 35]);
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
    this.createPuff(1002, 545, COLORS.coral);

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
    this.correctCount += 1;
    this.combo += 1;
    this.updateCombo();
    this.machineStatus?.setText(`완성 · ${order.solutionLabel}`);
    this.dialogueLabel?.setText(`제작 성공! · ${order.solutionLabel}`);
    this.dialogueText?.setText(order.explanation);
    this.helperText?.setText("손님의 문제를 해결하는 AI 장치가 완성됐어요!");
    this.progressText?.setText(
      `주문 ${this.roundIndex + 1} / ${this.rounds.length}   ✓ ${this.correctCount}`,
    );
    this.situationIcon?.setText(order.solvedIcon);
    this.vibrate(30);

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
    CoreKitchenScene.CORE_KINDS.forEach((kind, index) => {
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
    this.createPuff(1000, 545, COLORS.mint);
    this.celebrate(false);

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
    this.createCustomer(order);
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

    const stars =
      this.mistakeCount <= 1 ? "★★★" : this.mistakeCount <= 3 ? "★★☆" : "★☆☆";
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
    this.celebrate(true);
  }

  private setPlayerFacing(direction: Phaser.Math.Vector2) {
    let next: PlayerFacing;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      next = direction.x < 0 ? "left" : "right";
    } else {
      next = direction.y < 0 ? "back" : "front";
    }
    if (next === this.playerFacing) return;
    this.playerFacing = next;
    const texture = `player-${next}`;
    if (this.textures.exists(texture)) {
      this.playerSprite?.setTexture(texture).setDisplaySize(58, 75);
    }
  }

  private animatePlayer(isMoving: boolean) {
    if (!this.playerSprite || !this.playerShadow) return;
    const wave = Math.sin(this.time.now / (isMoving ? 82 : 330));
    this.playerSprite.y = -2 - Math.abs(wave) * (isMoving ? 3.5 : 1.4);
    this.playerSprite.angle = isMoving ? wave * 2 : wave * 0.4;
    this.playerShadow.setScale(1 - Math.abs(wave) * 0.08, 1);
  }

  private createPuff(x: number, y: number, color: number) {
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      const puff = this.add
        .circle(x, y, Phaser.Math.Between(5, 11), color, 0.82)
        .setDepth(42);
      this.tweens.add({
        targets: puff,
        x: x + Math.cos(angle) * Phaser.Math.Between(25, 65),
        y: y + Math.sin(angle) * Phaser.Math.Between(20, 50),
        alpha: 0,
        scale: 0.3,
        duration: 480,
        onComplete: () => puff.destroy(),
      });
    }
  }

  private celebrate(full: boolean) {
    const amount = full ? 38 : this.combo >= 2 ? 20 : 12;
    const colors = [COLORS.yellow, COLORS.mint, COLORS.coral, COLORS.blue];
    for (let i = 0; i < amount; i += 1) {
      const confetti = this.add
        .circle(
          Phaser.Math.Between(300, 980),
          Phaser.Math.Between(270, 390),
          Phaser.Math.Between(4, 9),
          colors[i % colors.length],
        )
        .setDepth(43);
      this.tweens.add({
        targets: confetti,
        x: confetti.x + Phaser.Math.Between(-170, 170),
        y: 760,
        alpha: 0,
        angle: Phaser.Math.Between(-280, 280),
        duration: Phaser.Math.Between(900, 1700),
        ease: "Quad.easeIn",
        onComplete: () => confetti.destroy(),
      });
    }
    if (full) this.cameras.main.flash(250, 255, 245, 210);
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start("world"));
  }

  update(_time: number, delta: number) {
    this.movingCores.forEach((moving) => {
      moving.container.x +=
        moving.direction * moving.speed * (delta / 1000);
      if (moving.direction > 0 && moving.container.x > 850) {
        moving.container.x = 235;
      } else if (moving.direction < 0 && moving.container.x < 235) {
        moving.container.x = 850;
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
      this.setPlayerFacing(direction);
      this.animatePlayer(true);
      const speed = 205 * (delta / 1000);
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
      this.animatePlayer(false);
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

type PlateChoice = {
  tool: AiTool;
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  content: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  stamp: Phaser.GameObjects.Container;
  homeX: number;
};

class ShopScene extends Phaser.Scene {
  private static readonly PAD_XS = [175, 410, 640, 870, 1105];
  private static readonly PAD_Y = 535;

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
    super("shop");
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

    this.drawInterior();
    this.createDialogue();
    this.createShopControls();

    this.keys = makeControlKeys(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.showRound();
    this.cameras.main.fadeIn(300, 255, 245, 220);
  }

  private drawInterior() {
    this.add
      .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "ai-shop-interior")
      .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);

    this.add
      .text(26, 28, "생활 속 AI 가게", {
        color: "#fff7e5",
        fontFamily: FONT_FAMILY,
        fontSize: "27px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setDepth(20);

    [
      { x: 321, y: 137 },
      { x: 1068, y: 137 },
    ].forEach((position, index) => {
      const glow = this.add
        .ellipse(position.x, position.y, 128, 90, COLORS.yellow, 0.14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(2);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.22 },
        scaleX: 1.12,
        scaleY: 1.08,
        duration: 1300 + index * 220,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    [
      { x: 358, y: 280 },
      { x: 875, y: 163 },
      { x: 1010, y: 305 },
      { x: 245, y: 360 },
      { x: 1170, y: 240 },
    ].forEach((position, index) => {
      const sparkle = this.add
        .star(position.x, position.y, 4, 3, 8, COLORS.yellow, 0.58)
        .setDepth(3);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.15, to: 0.8 },
        angle: 180,
        scale: { from: 0.7, to: 1.25 },
        duration: 900 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  private createDialogue() {
    this.dialogueLabel = this.add
      .text(478, 100, "", {
        color: "#2a877f",
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setDepth(12);
    this.dialogueText = this.add
      .text(478, 130, "", {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        lineSpacing: 8,
        wordWrap: { width: 330 },
      })
      .setDepth(12);
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
    const choiceCount = Math.min(5, 3 + Math.floor(this.roundIndex / 2));
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

  private getPadIndices(choiceCount: number) {
    if (choiceCount === 3) return [1, 2, 3];
    if (choiceCount === 4) return [0, 1, 3, 4];
    return [0, 1, 2, 3, 4];
  }

  private createChoices(question: AiServiceQuestion) {
    this.choices.forEach((choice) => choice.container.destroy(true));
    this.inactiveCovers.forEach((cover) => cover.destroy(true));
    this.choices = [];
    this.inactiveCovers = [];

    const tools = this.getToolsForRound(question);
    const padIndices = this.getPadIndices(tools.length);
    const usedPads = new Set(padIndices);

    ShopScene.PAD_XS.forEach((x, padIndex) => {
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
        .container(x, ShopScene.PAD_Y, [shape, icon])
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
      const homeX = ShopScene.PAD_XS[padIndex];
      const container = this.add
        .container(1340 + index * 90, ShopScene.PAD_Y)
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

  private createShopControls() {
    this.helperText = this.add
      .text(640, 685, "← → 로 고르고  SPACE 로 건네주세요", {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "17px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(30);

    const back = addFlowerBadge(this, 55, 108, "←", COLORS.blue)
      .setDepth(30)
      .setScale(0.88)
      .setInteractive(
        new Phaser.Geom.Circle(0, 0, 47),
        Phaser.Geom.Circle.Contains,
      );
    back.on("pointerdown", () => this.returnToWorld());

    const serve = addFlowerBadge(this, 1208, 652, "건네", COLORS.yellow)
      .setDepth(30)
      .setScale(1.08)
      .setInteractive(
        new Phaser.Geom.Circle(0, 0, 52),
        Phaser.Geom.Circle.Contains,
      );
    serve.on("pointerdown", () => this.serveSelected());
    this.serveText = serve
      .getAll()
      .find(
        (child): child is Phaser.GameObjects.Text =>
          child instanceof Phaser.GameObjects.Text,
      );

    this.progressText = this.add
      .text(1210, 90, "", {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 8,
      })
      .setOrigin(1, 0.5)
      .setDepth(30);

    this.comboText = this.add
      .text(1210, 126, "", {
        color: "#f5bd46",
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 7,
      })
      .setOrigin(1, 0.5)
      .setDepth(30);
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
          y: ShopScene.PAD_Y - 10,
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
          y: ShopScene.PAD_Y,
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

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
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

  private createPuff(x: number, y: number, color: number) {
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      const puff = this.add
        .circle(x, y, Phaser.Math.Between(6, 13), color, 0.85)
        .setDepth(41);
      this.tweens.add({
        targets: puff,
        x: x + Math.cos(angle) * Phaser.Math.Between(35, 75),
        y: y + Math.sin(angle) * Phaser.Math.Between(25, 60),
        alpha: 0,
        scale: 0.35,
        duration: 520,
        ease: "Quad.easeOut",
        onComplete: () => puff.destroy(),
      });
    }
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

    const isCorrect = choice.tool.id === question.answerId;
    if (!isCorrect) {
      this.inputLocked = true;
      this.mistakeCount += 1;
      this.combo = 0;
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
        this.vibrate([35, 45, 35]);
        this.cameras.main.shake(150, 0.004);
        this.createPuff(660, 350, COLORS.coral);
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
    this.correctCount += 1;
    this.combo = this.missedCurrentRound ? 0 : this.combo + 1;
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
      this.vibrate(28);
      this.situationIcon?.setText(question.solvedIcon);
      this.situationCaption?.setText(question.solutionCaption);
      this.createPuff(765, 350, COLORS.mint);
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
      this.celebrate(false);
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
    const stars =
      this.mistakeCount <= 1 ? 3 : this.mistakeCount <= 3 ? 2 : 1;
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
    this.celebrate(true);
  }

  private celebrate(full: boolean) {
    const amount = full ? 42 : this.combo >= 2 ? 20 : 12;
    for (let i = 0; i < amount; i += 1) {
      const colors = [
        COLORS.yellow,
        COLORS.mint,
        COLORS.coral,
        COLORS.blue,
      ];
      const confetti = this.add
        .circle(
          Phaser.Math.Between(300, 980),
          Phaser.Math.Between(250, 390),
          Phaser.Math.Between(5, 10),
          colors[i % colors.length],
        )
        .setDepth(40);
      this.tweens.add({
        targets: confetti,
        x: confetti.x + Phaser.Math.Between(-180, 180),
        y: 760,
        angle: Phaser.Math.Between(-300, 300),
        alpha: 0,
        duration: Phaser.Math.Between(1000, 1900),
        ease: "Quad.easeIn",
        onComplete: () => confetti.destroy(),
      });
    }
    if (full) this.cameras.main.flash(260, 255, 245, 210);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () => this.scene.start("world"));
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

export function createLearningGame(
  parent: HTMLElement,
  onReady: () => void,
) {
  const deviceScale =
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2);
  const pixelDemand =
    Math.max(
      parent.clientWidth / GAME_SIZE.width,
      parent.clientHeight / GAME_SIZE.height,
    ) * deviceScale;
  const renderScale = pixelDemand > 1.25 ? 1.5 : pixelDemand > 1 ? 1.25 : 1;
  const renderWidth = GAME_SIZE.width * renderScale;
  const renderHeight = GAME_SIZE.height * renderScale;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: renderWidth,
    height: renderHeight,
    backgroundColor: "#f8d792",
    render: {
      antialias: true,
      antialiasGL: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: renderWidth,
      height: renderHeight,
    },
    input: {
      activePointers: 3,
    },
    scene: [
      new IntroScene(onReady, renderScale),
      new WorldScene(renderScale),
      new AiWorkshopScene(renderScale),
      new AirportScene(renderScale),
    ],
  });
}
