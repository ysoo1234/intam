import Phaser from "phaser";
import { GAME_ASSETS, GAME_SIZE } from "../../../assets";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import {
  ETHICS_PRINCIPLE_LABELS,
  type EthicsReviewCase,
  type EthicsReviewDecision,
  type EthicsPrinciple,
  type EthicsVerdict,
} from "../model";

const PRINCIPLE_PRESENTATION: Record<
  EthicsPrinciple,
  Readonly<{ icon: string; color: number }>
> = {
  "age-consent": { icon: "보호", color: 0xe7ad42 },
  "ai-disclosure": { icon: "표시", color: 0x70c6d5 },
  privacy: { icon: "잠금", color: 0x6c9bd2 },
  respect: { icon: "예절", color: 0xc38bc8 },
  "account-safety": { icon: "계정", color: 0x70cfaa },
};

export type EthicsReviewDocumentView = Readonly<{
  container: Phaser.GameObjects.Container;
  caseNumberText: Phaser.GameObjects.Text;
  avatarText: Phaser.GameObjects.Text;
  ageText: Phaser.GameObjects.Text;
  subjectText: Phaser.GameObjects.Text;
  metaText: Phaser.GameObjects.Text;
  principleText: Phaser.GameObjects.Text;
  factBackgrounds: readonly Phaser.GameObjects.Rectangle[];
  factNumberTexts: readonly Phaser.GameObjects.Text[];
  factTexts: readonly Phaser.GameObjects.Text[];
  questionText: Phaser.GameObjects.Text;
  evidenceHighlight: Phaser.GameObjects.Rectangle;
  scanLine: Phaser.GameObjects.Rectangle;
  displayedFactIndexes: number[];
}>;

export type EthicsReviewStationView = Readonly<{
  verdict: EthicsVerdict;
  container: Phaser.GameObjects.Container;
  indicator: Phaser.GameObjects.Triangle;
}>;

export type EthicsReviewHud = Readonly<{
  progressText: Phaser.GameObjects.Text;
  mistakeText: Phaser.GameObjects.Text;
  scoreText: Phaser.GameObjects.Text;
  comboText: Phaser.GameObjects.Text;
  promptText: Phaser.GameObjects.Text;
  progressFill: Phaser.GameObjects.Rectangle;
}>;

export type EthicsReviewFeedbackView = Readonly<{
  container: Phaser.GameObjects.Container;
  titleText: Phaser.GameObjects.Text;
  explanationText: Phaser.GameObjects.Text;
  actionText: Phaser.GameObjects.Text;
}>;

export function createEthicsOffice(scene: Phaser.Scene, onBack: () => void) {
  scene.add
    .image(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "ethics-office")
    .setDisplaySize(GAME_SIZE.width, GAME_SIZE.height);
  scene.add.rectangle(640, 360, 1280, 720, 0x173f43, 0.035).setDepth(1);
  const back = scene.add
    .text(1218, 36, "← 마을", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(72)
    .setInteractive({ useHandCursor: true });
  back.on("pointerdown", onBack);
  back.on("pointerover", () => back.setScale(1.06));
  back.on("pointerout", () => back.setScale(1));
}

export function createEthicsReviewHud(scene: Phaser.Scene): EthicsReviewHud {
  const panel = scene.add
    .graphics()
    .fillStyle(COLORS.paper, 0.93)
    .lineStyle(2, COLORS.ink, 0.18)
    .fillRoundedRect(1070, 72, 180, 142, 18)
    .strokeRoundedRect(1070, 72, 180, 142, 18)
    .setDepth(70);
  const progressTrack = scene.add
    .rectangle(1160, 196, 142, 7, COLORS.ink, 0.12)
    .setDepth(71);
  const progressFill = scene.add
    .rectangle(1089, 196, 0, 7, COLORS.mint, 1)
    .setOrigin(0, 0.5)
    .setDepth(72);
  const progressText = scene.add
    .text(1090, 86, "심사 준비", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
    })
    .setDepth(72);
  const mistakeText = scene.add
    .text(1090, 148, "놓친 판정 0", {
      color: "#b85c52",
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      fontStyle: "bold",
    })
    .setDepth(72);
  const scoreText = scene.add
    .text(1090, 118, "신뢰 점수 0", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
    })
    .setDepth(72);
  const comboText = scene.add
    .text(1090, 174, "", {
      color: "#9b6d18",
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      fontStyle: "bold",
    })
    .setDepth(72);
  const promptText = scene.add
    .text(640, 683, "사건 파일을 읽어 주세요", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 7,
    })
    .setOrigin(0.5)
    .setDepth(73);
  void panel;
  void progressTrack;
  return {
    progressText,
    mistakeText,
    scoreText,
    comboText,
    promptText,
    progressFill,
  };
}

export function createEthicsReviewStations(
  scene: Phaser.Scene,
  onJudge: (verdict: EthicsVerdict) => void,
): readonly EthicsReviewStationView[] {
  const definitions = [
    {
      verdict: "approve" as const,
      x: 175,
      color: COLORS.mint,
      label: "✓  승인",
      key: "← 방향키",
      caption: "안전 기준 통과",
    },
    {
      verdict: "reject" as const,
      x: 1105,
      color: COLORS.coral,
      label: "↻  보완 요청",
      key: "→ 방향키",
      caption: "고칠 점이 있어요",
    },
  ];
  return definitions.map((definition) => {
    const container = scene.add.container(definition.x, 566).setDepth(65);
    const label = scene.add
      .text(0, -12, definition.label, {
        color: "#173f43",
        fontFamily: FONT_FAMILY,
        fontSize: "23px",
        fontStyle: "bold",
        stroke: "#fff9e9",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const caption = scene.add
      .text(0, 18, definition.caption, {
        color: "#405957",
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
        stroke: "#fff9e9",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const key = scene.add
      .text(0, 47, definition.key, {
        color: "#526661",
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
        stroke: "#fff9e9",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const indicator = scene.add
      .triangle(0, -78, -11, 0, 11, 0, 0, 16, COLORS.yellow, 1)
      .setStrokeStyle(3, COLORS.ink, 0.8)
      .setVisible(false);
    container.add([label, caption, key, indicator]);
    container.setSize(270, 170).setInteractive({ useHandCursor: true });
    container.on("pointerover", () => {
      scene.tweens.add({ targets: container, scale: 1.04, duration: 90 });
    });
    container.on("pointerout", () => {
      scene.tweens.add({ targets: container, scale: 1, duration: 90 });
    });
    container.on("pointerdown", () => {
      onJudge(definition.verdict);
      scene.tweens.add({ targets: container, scale: 0.92, duration: 70, yoyo: true });
    });
    return { verdict: definition.verdict, container, indicator };
  });
}

export function createEthicsReviewDocument(
  scene: Phaser.Scene,
): EthicsReviewDocumentView {
  const container = scene.add.container(1380, 270).setDepth(45).setAlpha(0);
  const dossier = scene.add
    .image(0, 0, "ethics-case-dossier")
    .setDisplaySize(820, 462);
  const header = scene.add
    .text(-255, 132, "AI 사용 사건 기록", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const caseNumberText = scene.add
    .text(-255, 157, "CASE 01", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      letterSpacing: 1,
    })
    .setOrigin(0.5);
  const principleText = scene.add
    .text(-255, 38, "", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 180 },
    })
    .setOrigin(0.5);
  const avatarText = scene.add
    .text(-255, -94, "", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const ageText = scene.add
    .text(-255, 0, "", {
      color: "#8b7049",
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const subjectText = scene.add.text(-255, 0, "", {
    color: "#173f43",
    fontFamily: FONT_FAMILY,
    fontSize: "17px",
    fontStyle: "bold",
  }).setOrigin(0.5);
  const metaText = scene.add.text(-255, 80, "", {
    color: "#6d6254",
    fontFamily: FONT_FAMILY,
    fontSize: "13px",
    align: "center",
    lineSpacing: 9,
    wordWrap: { width: 180 },
  }).setOrigin(0.5);
  const evidenceHighlight = scene.add
    .rectangle(110, -118, 470, 96, COLORS.blue, 0.2)
    .setVisible(false);
  const factYPositions = [-118, -2];
  const factBackgrounds = factYPositions.map((y) => {
    const background = scene.add
      .rectangle(110, y, 470, 96, COLORS.cream, 0.03)
      .setStrokeStyle(2, COLORS.ink, 0);
    return background;
  });
  const factNumberTexts = factYPositions.map((y) =>
    scene.add
      .text(-108, y, "◆", {
        color: "#3f8582",
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setOrigin(0.5),
  );
  const factTexts = factYPositions.map((y) =>
    scene.add.text(-88, y, "", {
      color: "#2c3534",
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      wordWrap: { width: 420 },
      lineSpacing: 4,
    }).setOrigin(0, 0.5),
  );
  const scanLine = scene.add
    .rectangle(-126, -118, 5, 86, COLORS.mint, 0.9)
    .setVisible(false);
  const questionText = scene.add
    .text(110, 140, "승인할까요, 보완이 필요할까요?", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 440 },
    })
    .setOrigin(0.5);
  container.add([
    dossier,
    header,
    caseNumberText,
    principleText,
    avatarText,
    ageText,
    subjectText,
    metaText,
    ...factBackgrounds,
    evidenceHighlight,
    ...factNumberTexts,
    ...factTexts,
    scanLine,
    questionText,
  ]);
  return {
    container,
    caseNumberText,
    avatarText,
    ageText,
    subjectText,
    metaText,
    principleText,
    factBackgrounds,
    factNumberTexts,
    factTexts,
    questionText,
    evidenceHighlight,
    scanLine,
    displayedFactIndexes: [],
  };
}

export function setEthicsReviewDocumentCase(
  view: EthicsReviewDocumentView,
  reviewCase: EthicsReviewCase,
  caseNumber = 1,
) {
  view.caseNumberText.setText(`CASE ${String(caseNumber).padStart(2, "0")}`);
  const principle = PRINCIPLE_PRESENTATION[reviewCase.principle];
  view.avatarText.setText("");
  view.ageText.setText("");
  view.subjectText.setText(
    `${reviewCase.subject.name} · ${reviewCase.subject.age}세`,
  );
  view.metaText.setText(
    `${reviewCase.subject.tool}\n${reviewCase.subject.location}`,
  );
  view.principleText.setColor(
    principle.color === 0xe7ad42 ? "#9b6d18" : "#247a76",
  );
  view.principleText.setText(
    ETHICS_PRINCIPLE_LABELS[reviewCase.principle],
  );
  const displayedFactIndexes = [
    reviewCase.evidenceFactIndex,
    ...reviewCase.facts.map((_, index) => index).filter(
      (index) => index !== reviewCase.evidenceFactIndex,
    ),
  ]
    .slice(0, 2)
    .sort((left, right) => left - right);
  view.displayedFactIndexes.splice(0, view.displayedFactIndexes.length, ...displayedFactIndexes);
  view.factTexts.forEach((text, index) => {
    const factIndex = displayedFactIndexes[index];
    text.setText(factIndex === undefined ? "" : reviewCase.facts[factIndex]);
    text.setColor("#2c3534");
    view.factBackgrounds[index]
      ?.setVisible(factIndex !== undefined)
      .setFillStyle(COLORS.cream, 0.66)
      .setStrokeStyle(2, COLORS.ink, 0.14);
    view.factNumberTexts[index]?.setVisible(factIndex !== undefined);
  });
  view.questionText.setText(reviewCase.reviewQuestion);
  view.questionText.setVisible(true);
  view.evidenceHighlight.setVisible(false);
  view.scanLine.setVisible(false);
}

export function showDocumentEvidence(
  view: EthicsReviewDocumentView,
  reviewCase: EthicsReviewCase,
) {
  const yPositions = [-118, -2];
  const displayedIndex = view.displayedFactIndexes.indexOf(
    reviewCase.evidenceFactIndex,
  );
  const selectedY = yPositions[displayedIndex] ?? -12;
  view.evidenceHighlight
    .setY(selectedY)
    .setFillStyle(COLORS.mint, 0.34)
    .setVisible(true);
  view.factBackgrounds[displayedIndex]?.setStrokeStyle(
    4,
    COLORS.mint,
    1,
  );
  view.factTexts[displayedIndex]?.setColor("#397044");
  view.scanLine.setPosition(-126, selectedY).setVisible(true).setAlpha(1);
  view.container.scene.tweens.add({
    targets: view.scanLine,
    x: 348,
    alpha: 0,
    duration: 360,
    ease: "Cubic.easeOut",
    onComplete: () => view.scanLine.setVisible(false),
  });
}

export function createEthicsReviewFeedback(
  scene: Phaser.Scene,
  document: Phaser.GameObjects.Container,
): EthicsReviewFeedbackView {
  const container = scene.add.container(0, 0).setVisible(false);
  const titleText = scene.add
    .text(-105, 100, "", {
      color: "#247a76",
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "bold",
    });
  const explanationText = scene.add.text(-105, 123, "", {
    color: "#334d4c",
    fontFamily: FONT_FAMILY,
    fontSize: "10px",
    fontStyle: "bold",
    lineSpacing: 3,
    wordWrap: { width: 430 },
  });
  const actionText = scene.add.text(-105, 157, "", {
    color: "#9b6d18",
    fontFamily: FONT_FAMILY,
    fontSize: "10px",
    fontStyle: "bold",
    wordWrap: { width: 430 },
  });
  container.add([titleText, explanationText, actionText]);
  document.add(container);
  return { container, titleText, explanationText, actionText };
}

export function showEthicsReviewFeedback(
  view: EthicsReviewFeedbackView,
  decision: EthicsReviewDecision,
  points: number,
  combo: number,
) {
  const label = ETHICS_PRINCIPLE_LABELS[decision.principle];
  const title = decision.correct
    ? `좋은 판정이에요  +${points}${combo > 1 ? `  ·  ${combo}연속!` : ""}`
    : `다시 확인해요  ·  ${label}`;
  view.titleText
    .setText(title)
    .setColor(decision.correct ? "#247a76" : "#b65349");
  view.explanationText.setText(decision.explanation);
  view.actionText.setText(`안전한 방법 · ${decision.betterAction}`);
  view.container.setVisible(true).setAlpha(0).setScale(0.94);
  view.container.scene.tweens.add({
    targets: view.container,
    alpha: 1,
    scale: 1,
    duration: 220,
    ease: "Back.easeOut",
  });
}

export function preloadEthicsReviewAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists("ethics-office")) {
    scene.load.image("ethics-office", GAME_ASSETS.ethicsReview.office);
  }
  if (!scene.textures.exists("player-front")) {
    scene.load.image("player-front", GAME_ASSETS.characters.player.front);
    scene.load.image("player-left", GAME_ASSETS.characters.player.left);
    scene.load.image("player-right", GAME_ASSETS.characters.player.right);
  }
  if (!scene.textures.exists("ethics-briefing-dossier")) {
    scene.load.image(
      "ethics-briefing-dossier",
      GAME_ASSETS.ethicsReview.briefingDossier,
    );
    scene.load.image(
      "ethics-case-dossier",
      GAME_ASSETS.ethicsReview.caseDossier,
    );
  }
}
