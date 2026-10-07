import Phaser from "phaser";
import type {
  EthicsDeliveryAction, EthicsDeliveryState, EthicsReviewCase, EthicsVerdict, EthicsVisitor,
} from "../model";
import { ETHICS_CATEGORY_LABELS } from "../content";
import { ETHICS_DEPTH, ETHICS_TEXTURES, ethicsTextStyle, getEthicsTopicTexture } from "./ethicsReviewOffice";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_FORM_MOTION = { arriveMs: 340, leaveMs: 220 } as const;

// Positions inside the form container (origin at the paper's center).
const FORM_INNER = {
  icon: { x: -160, y: -28, size: 104, plate: 124 },
  iconLabel: { x: -160, y: 52 },
  divider: { x: -86, top: -86, bottom: 62 },
  prompt: { x: 84, y: -26, width: 330 },
  applicant: { x: -214, y: 106 },
  ink: { x: 118, y: 58 },
} as const;

export function getEthicsStampLabel(verdict: EthicsVerdict) { return verdict === "approve" ? "승인" : "거절"; }

export function createEthicsReviewStations(scene: Phaser.Scene, onAction: (action: EthicsDeliveryAction) => void) {
  const size = ETHICS_LAYOUT.stampSize;
  return (["approve", "reject"] as const).map(verdict => {
    const point = ETHICS_LAYOUT.stamps[verdict];
    const shadow = scene.add.ellipse(0, -4, size.width - 6, 16, 0x34555a, 0.14);
    const glow = scene.add.ellipse(0, -3, size.width + 26, 24, verdict === "approve" ? 0x5ab5a4 : 0xe99974, 0.26).setVisible(false);
    const image = scene.add.image(0, 0, verdict === "approve" ? ETHICS_TEXTURES.stampApprove : ETHICS_TEXTURES.stampReject)
      .setOrigin(0.5, 1);
    image.setScale(Math.min(size.width / image.width, size.height / image.height));
    const plateWidth = 118;
    const plate = scene.add.graphics();
    plate.fillStyle(verdict === "approve" ? 0x2f8d82 : 0xc8574a, 1).fillRoundedRect(-plateWidth / 2, 8, plateWidth, 36, 13);
    plate.fillStyle(0xffffff, 0.22).fillRoundedRect(-plateWidth / 2 + 4, 11, plateWidth - 8, 12, 7);
    const label = scene.add.text(0, 26, getEthicsStampLabel(verdict), ethicsTextStyle(22, "#ffffff")).setOrigin(0.5).setResolution(3);
    const button = scene.add.container(point.x, point.y, [shadow, glow, image, plate, label])
      .setDepth(ETHICS_DEPTH.stamps).setSize(size.width + 30, size.height + 80).setInteractive({
        // Phaser adds the container's half-size before testing this rectangle.
        hitArea: new Phaser.Geom.Rectangle(0, -34, size.width + 30, size.height + 80),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true,
      });
    button.on("pointerover", () => { if (button.input?.enabled) { button.setScale(1.04); glow.setVisible(true); } });
    button.on("pointerout", () => { button.setScale(1); glow.setVisible(false); });
    button.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); onAction(verdict);
    });
    return { verdict, button, image, label, glow };
  });
}
export type EthicsReviewStations = ReturnType<typeof createEthicsReviewStations>;

export function setEthicsStationState(stations: EthicsReviewStations, available: boolean, selected?: EthicsDeliveryAction) {
  for (const station of stations) {
    const enabled = available && !selected;
    if (station.button.input) station.button.input.enabled = enabled;
    station.button.setScale(1);
    station.glow.setVisible(selected === station.verdict);
    station.button.setAlpha(enabled || selected === station.verdict ? 1 : 0.82);
  }
}

export function createEthicsReviewForm(scene: Phaser.Scene, onContinue: () => void) {
  const layout = ETHICS_LAYOUT.form;
  const shadow = scene.add.ellipse(6, layout.height / 2 - 6, layout.width - 40, 30, 0x5a4420, 0.16);
  const paper = scene.add.image(0, 0, ETHICS_TEXTURES.form).setDisplaySize(layout.width, layout.height);
  const iconPlate = scene.add.graphics();
  const plate = FORM_INNER.icon.plate;
  iconPlate.fillStyle(0xf3ecdb, 1).fillRoundedRect(FORM_INNER.icon.x - plate / 2, FORM_INNER.icon.y - plate / 2, plate, plate, 18);
  iconPlate.lineStyle(1.5, 0xe2d4b8, 1).strokeRoundedRect(FORM_INNER.icon.x - plate / 2, FORM_INNER.icon.y - plate / 2, plate, plate, 18);
  iconPlate.lineStyle(1.5, 0xe2d4b8, 1).lineBetween(FORM_INNER.divider.x, FORM_INNER.divider.top, FORM_INNER.divider.x, FORM_INNER.divider.bottom);
  const topic = scene.add.image(FORM_INNER.icon.x, FORM_INNER.icon.y, getEthicsTopicTexture("checking"));
  const topicLabel = scene.add.text(FORM_INNER.iconLabel.x, FORM_INNER.iconLabel.y, "", ethicsTextStyle(16, "#7c8271"))
    .setOrigin(0.5).setResolution(3);
  const prompt = scene.add.text(FORM_INNER.prompt.x, FORM_INNER.prompt.y, "", {
    ...ethicsTextStyle(29), lineSpacing: 10, wordWrap: { width: FORM_INNER.prompt.width, useAdvancedWrap: true },
  }).setOrigin(0.5).setResolution(3);
  const applicant = scene.add.text(FORM_INNER.applicant.x, FORM_INNER.applicant.y, "", ethicsTextStyle(15, "#8a7b62"))
    .setOrigin(0, 0.5).setResolution(3);
  const inkLayer = scene.add.container(FORM_INNER.ink.x, FORM_INNER.ink.y);
  const container = scene.add.container(layout.x, layout.y, [
    shadow, paper, iconPlate, topic, topicLabel, prompt, applicant, inkLayer,
  ]).setDepth(ETHICS_DEPTH.form).setAlpha(0);

  const hint = scene.add.text(ETHICS_LAYOUT.hint.x, ETHICS_LAYOUT.hint.y, "", ethicsTextStyle(20, "#fffaf0"))
    .setStroke("#4a6a74", 5)
    .setOrigin(0.5).setResolution(3).setDepth(ETHICS_DEPTH.hint);
  const continuePlate = scene.add.graphics();
  continuePlate.fillStyle(0x1f6f66, 1).fillRoundedRect(-150, -22, 300, 54, 18);
  continuePlate.fillStyle(0x2a8b7e, 1).fillRoundedRect(-150, -27, 300, 54, 18);
  continuePlate.fillStyle(0xffffff, 0.18).fillRoundedRect(-144, -23, 288, 18, 9);
  const continueLabel = scene.add.text(0, -1, "", ethicsTextStyle(23, "#ffffff")).setOrigin(0.5).setResolution(3);
  const continueButton = scene.add.container(ETHICS_LAYOUT.hint.x, ETHICS_LAYOUT.hint.y, [continuePlate, continueLabel])
    .setDepth(ETHICS_DEPTH.hint).setSize(300, 54).setInteractive({ useHandCursor: true }).setVisible(false);
  continueButton.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); onContinue();
  });
  continueButton.on("pointerover", () => continueButton.setScale(1.03));
  continueButton.on("pointerout", () => continueButton.setScale(1));

  const view = {
    container, paper, prompt, topic, topicLabel, applicant, inkLayer,
    hint, continueButton, continueLabel, casePrompt: "",
  };
  return view;
}
export type EthicsReviewFormView = ReturnType<typeof createEthicsReviewForm>;

function fitFormPrompt(view: EthicsReviewFormView) {
  // Keep the authored two lines intact, including the longest sixth-grade cases.
  let size = 29;
  view.prompt.setFontSize(size);
  while (view.prompt.getWrappedText().length > view.casePrompt.split("\n").length && size > 24) {
    view.prompt.setFontSize(--size);
  }
}

export function setEthicsReviewFormCase(view: EthicsReviewFormView, item: EthicsReviewCase, visitor: EthicsVisitor) {
  view.casePrompt = item.prompt;
  view.prompt.setText(item.prompt).setColor("#315567");
  fitFormPrompt(view);
  view.topic.setTexture(getEthicsTopicTexture(item.category));
  view.topic.setScale(Math.min(FORM_INNER.icon.size / view.topic.width, FORM_INNER.icon.size / view.topic.height));
  view.topicLabel.setText(ETHICS_CATEGORY_LABELS[item.category]);
  view.applicant.setText(`신청인  ${visitor.name}   ·   AI 사용 확인서`);
  view.inkLayer.removeAll(true);
}

/** Slides the form from the window sill onto the desk. */
export function playEthicsFormArrival(scene: Phaser.Scene, view: EthicsReviewFormView, animate: boolean) {
  const layout = ETHICS_LAYOUT.form;
  scene.tweens.killTweensOf(view.container);
  view.container.setScale(1).setAngle(0).setAlpha(1).setPosition(layout.x, layout.y);
  if (!animate) return;
  view.container.setPosition(ETHICS_LAYOUT.sill.x + 40, ETHICS_LAYOUT.sill.y - 10).setScale(0.55).setAngle(-9).setAlpha(0.6);
  scene.tweens.add({
    targets: view.container, x: layout.x, y: layout.y, scale: 1, angle: 0, alpha: 1,
    duration: ETHICS_FORM_MOTION.arriveMs, ease: "Cubic.easeOut",
  });
}

/** Returns the stamped form to the visitor at the window. */
export function playEthicsFormDeparture(scene: Phaser.Scene, view: EthicsReviewFormView, onComplete?: () => void) {
  scene.tweens.killTweensOf(view.container);
  scene.tweens.add({
    targets: view.container, x: ETHICS_LAYOUT.sill.x + 30, y: ETHICS_LAYOUT.sill.y - 20, scale: 0.5, angle: -7, alpha: 0,
    duration: ETHICS_FORM_MOTION.leaveMs, ease: "Cubic.easeIn", onComplete,
  });
}

export function showEthicsFormState(view: EthicsReviewFormView, state: EthicsDeliveryState, ready: boolean) {
  const feedback = state.phase === "feedback";
  view.hint.setText(state.practice && !feedback ? "도장을 누르거나  ←  → 키로 확인서에 도장을 찍어요" : "");
  view.continueButton.setVisible(state.practice && feedback && ready);
  if (!feedback) view.continueButton.setScale(1);
  view.continueLabel.setText(state.decision?.correct ? "2분 심사 시작  →" : "한 번 더  →");
}
