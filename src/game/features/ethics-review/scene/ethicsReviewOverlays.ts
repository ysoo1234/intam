import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";

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
    .text(0, -104, "6개의 사건을 판정해 주세요", {
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
      "사건 파일을 읽고  →  승인 또는 보완을 선택하고\n왜 그런지 근거를 확인하면 끝!",
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
    .text(0, 111, "시간 제한 없이 천천히 읽어도 괜찮아요", {
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
    mistakes: number;
    stars: number;
    score: number;
    bestCombo: number;
    onBack: () => void;
    onReplay: () => void;
  },
) {
  const overlay = createDossierOverlay(scene, 0.54).setDepth(95);
  const eyebrow = scene.add
    .text(0, -151, "RESPONSIBILITY CLEARANCE", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "bold",
      letterSpacing: 2,
    })
    .setOrigin(0.5);
  const title = scene.add
    .text(0, -108, "오늘의 윤리 심사 완료!", {
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
      `신뢰 점수  ${options.score}점\n최고 콤보  ${options.bestCombo}연속   ·   놓친 판정  ${options.mistakes}회`,
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
