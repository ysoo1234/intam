import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";

export class IntroScene extends Phaser.Scene {
  private board?: Phaser.GameObjects.Image;
  private enterButton?: Phaser.GameObjects.Container;
  private entering = false;

  constructor(
    private readonly onReady: () => void,
    private readonly renderScale: number,
  ) {
    super(SCENE_KEYS.intro);
  }

  preload() {
    this.load.image("gem-board", GAME_ASSETS.intro.board);
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
    this.time.delayedCall(910, () => this.scene.start(SCENE_KEYS.world));
  }
}
