import Phaser from "phaser";
import { createGamePauseMenu } from "../../../core/visual/gamePauseMenu";
import {
  createGameStatusHud,
  type GameStatusHud,
} from "../../../core/visual/gameChrome";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
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
  private readonly statusHud: GameStatusHud;
  private readonly feverText: Phaser.GameObjects.Text;
  private readonly feverBar: Phaser.GameObjects.Graphics;
  private readonly feverOverlay: Phaser.GameObjects.Rectangle;
  private readonly feverFrame: Phaser.GameObjects.Graphics;
  private readonly countdownText: Phaser.GameObjects.Text;
  private feverFrameColor?: number;

  constructor(
    private readonly scene: Phaser.Scene,
    pause: Parameters<typeof createGamePauseMenu>[1],
  ) {
    createGamePauseMenu(scene, pause);
    this.statusHud = createGameStatusHud(scene, [
      "비행 1단계",
      "0점",
      "♥ ♥ ♥",
      formatAirportTimer(DATA_FLIGHT_CONFIG.gameDurationMs),
    ]);

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
  }

  setCountdown(count: number) {
    this.countdownText.setText(`${count}`);
  }

  /** The tutorial counts down on its own, after the lesson. */
  hideCountdown() {
    this.countdownText.setVisible(false);
  }

  completeCountdown() {
    this.countdownText.setText("출발!");
    this.scene.tweens.add({
      targets: this.countdownText,
      alpha: 0,
      scale: 1.35,
      duration: 420,
      onComplete: () => {
        this.countdownText.destroy();
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
    const hearts = Array.from(
      { length: DATA_FLIGHT_CONFIG.initialHearts },
      (_, index) => (index < state.hearts ? "♥" : "♡"),
    ).join(" ");
    this.statusHud.setValues([
      `비행 ${state.difficultyTier + 1}단계`,
      `${state.score.toLocaleString()}점`,
      hearts,
      formatAirportTimer(state.remainingMs),
    ]);

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
