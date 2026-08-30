import Phaser from "phaser";
import { createGameResultOverlay } from "../../../core/visual/gameResultOverlay";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { EthicsReviewEndReason } from "../model";

function addPaperAction(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
) {
  const action = scene.add.container(x, y);
  const accent = scene.add
    .text(-2, 0, label, {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "23px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 1,
    })
    .setOrigin(0.5);
  const underline = scene.add
    .graphics()
    .lineStyle(3, COLORS.mint, 0.9)
    .lineBetween(-accent.width / 2, 20, accent.width / 2, 20);
  const hitArea = scene.add.zone(0, 4, Math.max(190, accent.width + 44), 58);
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerdown", onClick);
  hitArea.on("pointerover", () =>
    scene.tweens.add({ targets: action, scale: 1.06, duration: 100 }),
  );
  hitArea.on("pointerout", () =>
    scene.tweens.add({ targets: action, scale: 1, duration: 100 }),
  );
  action.add([accent, underline, hitArea]);
  return action;
}

function createDossierOverlay(scene: Phaser.Scene, shadeAlpha: number) {
  const overlay = scene.add.container(640, 360).setDepth(90);
  const shade = scene.add.rectangle(0, 0, 1280, 720, COLORS.ink, shadeAlpha);
  const dossier = scene.add
    .image(0, 0, "ethics-briefing-dossier")
    .setDisplaySize(1050, 590);
  overlay.add([shade, dossier]);
  return overlay;
}

export function createEthicsBriefingOverlay(
  scene: Phaser.Scene,
  onStart: () => void,
): Phaser.GameObjects.Container {
  const overlay = createDossierOverlay(scene, 0.52);
  const eyebrow = scene.add
    .text(0, -151, "AI 윤리 심사관 · 오늘의 임무", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      letterSpacing: 1,
    })
    .setOrigin(0.5);
  const title = scene.add
    .text(0, -104, "2분 30초, 30개 사건에 도전!", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "38px",
      fontStyle: "bold",
      stroke: "#fffaf0",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  const mission = scene.add
    .text(
      0,
      -32,
      "사건 파일을 읽고 승인 또는 보완을 선택해요.\n정답을 많이 맞히고 설명에서 안전한 방법을 확인해요!",
      {
        color: "#334d4c",
        fontFamily: FONT_FAMILY,
        fontSize: "21px",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 12,
      },
    )
    .setOrigin(0.5);
  const controls = scene.add
    .text(0, 72, "← 승인          → 보완 요청          화면의 판정 장치 터치", {
      color: "#526661",
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const hint = scene.add
    .text(0, 111, "생명은 3개예요 · 틀리면 생명이 1개 줄어요", {
      color: "#8b7049",
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
    })
    .setOrigin(0.5);
  const start = addPaperAction(scene, 0, 164, "심사 시작  ›", onStart);
  overlay.add([eyebrow, title, mission, controls, hint, start]);
  overlay.setScale(0.93).setAlpha(0);
  scene.tweens.add({
    targets: overlay,
    scale: 1,
    alpha: 1,
    duration: 340,
    ease: "Back.easeOut",
  });
  return overlay;
}

export function createEthicsResultOverlay(
  scene: Phaser.Scene,
  options: {
    stars: number;
    score: number;
    bestCombo: number;
    correctCount: number;
    reviewedCount: number;
    lives: number;
    endReason: EthicsReviewEndReason;
    onBack: () => void;
    onReplay: () => void;
  },
) {
  return createGameResultOverlay(scene, {
    title: "심사를 마쳤어요.",
    stars: options.stars,
    summary: `사건 ${options.reviewedCount}건을 심사하고 ${options.score.toLocaleString()}점을 얻었어요!\n${options.correctCount}건을 바르게 판단했어요.`,
    retryLabel: "다시 심사하기",
    onRetry: options.onReplay,
    onWorld: options.onBack,
  });
}
