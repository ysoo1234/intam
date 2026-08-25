import Phaser from "phaser";
import {
  COLORS,
  FONT_FAMILY,
  getTextStyle,
  TEXT_COLORS,
  UI_RADII,
} from "../../../core/visual/theme";
import {
  addUiButton,
  addUiSurface,
} from "../../../core/visual/uiPrimitives";
import { DATA_FLIGHT_CONFIG } from "../model";

export const AIRPORT_FEVER_COLORS = [
  COLORS.blue,
  COLORS.yellow,
  COLORS.mint,
] as const;

function formatAirportTimer(remainingMs: number) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

export type AirportHudState = {
  score: number;
  hearts: number;
  remainingMs: number;
  elapsedMs: number;
  feverUntilMs: number;
  difficultyTier: number;
};

export class AirportHud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly heartText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly feverText: Phaser.GameObjects.Text;
  private readonly feverBar: Phaser.GameObjects.Graphics;
  private readonly feverOverlay: Phaser.GameObjects.Rectangle;
  private readonly feverFrame: Phaser.GameObjects.Graphics;
  private readonly countdownText: Phaser.GameObjects.Text;
  private feverFrameColor?: number;

  constructor(
    private readonly scene: Phaser.Scene,
    onBack: () => void,
  ) {
    addUiButton(scene, {
      x: 58,
      y: 52,
      width: 68,
      height: 68,
      radius: 34,
      label: "←",
      fontSize: "30px",
      depth: 60,
      onPress: onBack,
    });

    addUiSurface(
      scene,
      { x: 105, y: 21, width: 256, height: 62 },
      "dark",
      {
        radius: UI_RADII.panel,
        borderColor: COLORS.cream,
        borderAlpha: 0.88,
        shadow: "small",
        depth: 50,
      },
    );
    scene.add
      .text(
        233,
        52,
        "데이터 비행 공항",
        getTextStyle("heading", {
          color: TEXT_COLORS.onDark,
          fontSize: "25px",
        }),
      )
      .setOrigin(0.5)
      .setDepth(51);

    const scorePanel = addUiSurface(
      scene,
      { x: 784, y: 21, width: 464, height: 62 },
      "raised",
      {
        radius: UI_RADII.panel,
        fillAlpha: 0.94,
        shadow: "small",
        depth: 50,
      },
    );
    scorePanel.lineStyle(2, COLORS.ink, 0.18);
    scorePanel.lineBetween(900, 33, 900, 71);
    scorePanel.lineBetween(1016, 33, 1016, 71);
    scorePanel.lineBetween(1132, 33, 1132, 71);
    this.scoreText = scene.add
      .text(842, 52, "0점", {
        color: TEXT_COLORS.primary,
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.stageText = scene.add
      .text(958, 52, "비행 1단계", {
        color: TEXT_COLORS.accent,
        fontFamily: FONT_FAMILY,
        fontSize: "17px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.heartText = scene.add
      .text(1074, 52, "♥ ♥ ♥", {
        color: "#ef665f",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.timerText = scene.add
      .text(1190, 52, formatAirportTimer(DATA_FLIGHT_CONFIG.gameDurationMs), {
        color: TEXT_COLORS.primary,
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(51);

    this.feverOverlay = scene.add
      .rectangle(640, 360, 1280, 720, 0x55dff5, 0)
      .setDepth(41)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.feverFrame = scene.add.graphics().setDepth(59).setVisible(false);
    this.feverText = scene.add
      .text(640, 102, "⚡ 공공데이터 피버!", {
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
    this.feverBar = scene.add.graphics().setDepth(54).setVisible(false);

    this.countdownText = scene.add
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
    scene.add
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

  setCountdown(count: number) {
    this.countdownText.setText(`${count}`);
  }

  completeCountdown() {
    this.countdownText.setText("출발!");
    this.scene.tweens.add({
      targets: [
        this.countdownText,
        this.scene.children.getByName("airport-start-hint"),
      ],
      alpha: 0,
      scale: 1.35,
      duration: 420,
      onComplete: () => {
        this.countdownText.destroy();
        this.scene.children.getByName("airport-start-hint")?.destroy();
      },
    });
  }

  hideFever() {
    this.feverText.setVisible(false);
    this.feverBar.setVisible(false);
    this.feverOverlay.setVisible(false);
    this.feverFrame.setVisible(false);
    this.feverFrame.clear();
    this.feverFrameColor = undefined;
  }

  render(state: AirportHudState) {
    this.scoreText.setText(
      `${state.score.toLocaleString()}점`,
    );
    this.stageText.setText(`비행 ${state.difficultyTier + 1}단계`);
    this.heartText.setText(
      `${"♥ ".repeat(state.hearts)}${"♡ ".repeat(
        DATA_FLIGHT_CONFIG.initialHearts - state.hearts,
      )}`.trim(),
    );
    this.timerText.setText(formatAirportTimer(state.remainingMs));

    const feverRemaining = Math.max(0, state.feverUntilMs - state.elapsedMs);
    const fever = feverRemaining > 0;
    this.feverText.setVisible(fever);
    this.feverBar.setVisible(fever);
    this.feverOverlay.setVisible(fever);
    this.feverFrame.setVisible(fever);
    const rainbowIndex =
      Math.floor(state.elapsedMs / 520) % AIRPORT_FEVER_COLORS.length;
    const rainbowColor = AIRPORT_FEVER_COLORS[rainbowIndex];
    if (fever) {
      this.feverOverlay.setFillStyle(
        rainbowColor,
        0.065 + Math.sin(state.elapsedMs / 700) * 0.012,
      );
      if (this.feverFrameColor !== rainbowColor) {
        this.feverFrame.clear();
        this.feverFrame.lineStyle(10, rainbowColor, 0.66);
        this.feverFrame.strokeRoundedRect(15, 15, 1250, 690, 34);
        this.feverFrame.lineStyle(
          4,
          AIRPORT_FEVER_COLORS[
            (rainbowIndex + 1) % AIRPORT_FEVER_COLORS.length
          ],
          0.72,
        );
        this.feverFrame.strokeRoundedRect(29, 29, 1222, 662, 28);
        this.feverFrameColor = rainbowColor;
      }
      this.feverText
        .setColor(Phaser.Display.Color.IntegerToColor(rainbowColor).rgba)
        .setScale(1 + Math.sin(state.elapsedMs / 520) * 0.035)
        .setAngle(Math.sin(state.elapsedMs / 700) * 0.6);
    } else if (this.feverFrameColor !== undefined) {
      this.feverFrame.clear();
      this.feverFrameColor = undefined;
      this.feverText.setScale(1).setAngle(0);
    }
    this.feverBar.clear();
    if (fever) {
      this.feverBar.fillStyle(COLORS.ink, 0.5);
      this.feverBar.fillRoundedRect(445, 126, 390, 18, 9);
      this.feverBar.fillStyle(COLORS.yellow, 1);
      this.feverBar.fillRoundedRect(
        449,
        130,
        382 * (feverRemaining / DATA_FLIGHT_CONFIG.feverDurationMs),
        10,
        5,
      );
    }
  }

}
