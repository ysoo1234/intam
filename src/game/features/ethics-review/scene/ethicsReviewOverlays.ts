import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import {
  ETHICS_REVIEW_CONFIG,
  type EthicsReviewEndReason,
} from "../model";

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
  const overlay = createDossierOverlay(scene, 0.54).setDepth(95);
  const eyebrow = scene.add
    .text(
      0,
      -151,
      `2분 30초 · ${ETHICS_REVIEW_CONFIG.roundCount}개 사건 · 생명 ${ETHICS_REVIEW_CONFIG.startingLives}개`,
      {
        color: "#247a76",
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
        letterSpacing: 2,
      },
    )
    .setOrigin(0.5);
  const title = scene.add
    .text(0, -108, "윤리 심사 도전 완료!", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "37px",
      fontStyle: "bold",
      stroke: "#fffaf0",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  const starLine = scene.add
    .text(0, -42, "★".repeat(options.stars) + "☆".repeat(3 - options.stars), {
      color: "#e4a92f",
      fontFamily: FONT_FAMILY,
      fontSize: "48px",
      fontStyle: "bold",
      stroke: "#815d20",
      strokeThickness: 2,
    })
    .setOrigin(0.5);
  const summary = scene.add
    .text(
      0,
      44,
      [
        `정답 ${options.correctCount}개 · 심사 ${options.reviewedCount}개 / ${ETHICS_REVIEW_CONFIG.roundCount}개`,
        `점수 ${options.score}점 · 남은 생명 ${options.lives}개 · 최고 콤보 ${options.bestCombo}연속`,
        getEndMessage(options.endReason),
      ].join("\n"),
      {
        color: "#334d4c",
        fontFamily: FONT_FAMILY,
        fontSize: "19px",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 10,
      },
    )
    .setOrigin(0.5);
  overlay.add([
    eyebrow,
    title,
    starLine,
    summary,
    addPaperAction(scene, -138, 157, "↻ 다시 심사", options.onReplay),
    addPaperAction(scene, 138, 157, "마을로  ›", options.onBack),
  ]);
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

function getEndMessage(reason: EthicsReviewEndReason) {
  if (reason === "time") return "시간이 다 되었어요. 배운 원칙으로 다시 도전해요!";
  if (reason === "lives") return "생명을 모두 사용했어요. 설명을 떠올려 다시 도전해요!";
  return "준비된 30개 사건을 모두 심사했어요!";
}
