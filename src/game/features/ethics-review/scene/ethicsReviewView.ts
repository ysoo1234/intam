import Phaser from "phaser";
import { drawOutlinedPill, outlinedButtonTextStyle } from "../../../core/visual/outlinedButton";
import type {
  EthicsDeliveryAction, EthicsDeliveryState, EthicsReviewCase, EthicsVerdict,
} from "../model";
import { ETHICS_DEPTH, ETHICS_TEXTURES, ethicsTextStyle } from "./ethicsReviewOffice";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_FORM_MOTION = { arriveMs: 340, leaveMs: 220 } as const;

// Positions inside the form container (origin at the paper's center).
const FORM_INNER = {
  // The sentence alone, large, in the middle of the paper.
  // Centered in the plain teal header band.
  title: { y: -82 },
  // The two printed guide lines of the form art (at 41.6% and 60% of its
  // height); each authored line of the sentence sits on one of them.
  rules: [-18, 22] as readonly number[],
  // Left-aligned a little inside where the printed rules start (x -207).
  prompt: { x: -196, width: 396, maxFont: 25, minFont: 18 },
  // The printed stamp circle in the lower-right corner of the form art, fitted
  // on the art: centre (189.3, 58.9), ring radius 27.1 on screen.
  ink: { x: 189.3, y: 58.9, scale: 1, radius: 27 },
} as const;

/** Where the stamp's seal lands inside the form (the printed circle). */
export const ETHICS_FORM_INK = FORM_INNER.ink;

export function getEthicsStampLabel(verdict: EthicsVerdict) { return verdict === "approve" ? "승인" : "거절"; }

export function createEthicsReviewStations(scene: Phaser.Scene, onAction: (action: EthicsDeliveryAction) => void) {
  const size = ETHICS_LAYOUT.stampSize;
  return (["approve", "reject"] as const).map(verdict => {
    const point = ETHICS_LAYOUT.stamps[verdict];
    const shadow = scene.add.ellipse(0, -4, size.width - 6, 16, 0x34555a, 0.14);
    const image = scene.add.image(0, 0, verdict === "approve" ? ETHICS_TEXTURES.stampApprove : ETHICS_TEXTURES.stampReject)
      .setOrigin(0.5, 1);
    image.setScale(Math.min(size.width / image.width, size.height / image.height));
    const plateWidth = 118;
    const plate = scene.add.graphics();
    plate.fillStyle(verdict === "approve" ? 0x2f8d82 : 0xc8574a, 1).fillRoundedRect(-plateWidth / 2, 8, plateWidth, 36, 13);
    plate.fillStyle(0xffffff, 0.22).fillRoundedRect(-plateWidth / 2 + 4, 11, plateWidth - 8, 12, 7);
    const label = scene.add.text(0, 26, getEthicsStampLabel(verdict), ethicsTextStyle(22, "#ffffff")).setOrigin(0.5).setResolution(3);
    const button = scene.add.container(point.x, point.y, [shadow, image, plate, label])
      .setDepth(ETHICS_DEPTH.stamps).setSize(size.width + 30, size.height + 80).setInteractive({
        // Phaser adds the container's half-size before testing this rectangle.
        hitArea: new Phaser.Geom.Rectangle(0, -34, size.width + 30, size.height + 80),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true,
      });
    // Hover only lifts the stamp a little; no glow under it.
    button.on("pointerover", () => { if (button.input?.enabled) button.setScale(1.04); });
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); onAction(verdict);
    });
    return { verdict, button, image, label };
  });
}
export type EthicsReviewStations = ReturnType<typeof createEthicsReviewStations>;

export function setEthicsStationState(stations: EthicsReviewStations, available: boolean, selected?: EthicsDeliveryAction) {
  for (const station of stations) {
    const enabled = available && !selected;
    if (station.button.input) station.button.input.enabled = enabled;
    station.button.setScale(1);
    // Both stamps stay fully visible; only the one being used fades briefly while it stamps.
    station.button.setAlpha(1);
  }
}

export function createEthicsReviewForm(scene: Phaser.Scene, onContinue: () => void) {
  const layout = ETHICS_LAYOUT.form;
  const shadow = scene.add.ellipse(6, layout.height / 2 - 6, layout.width - 40, 30, 0x5a4420, 0.16);
  const paper = scene.add.image(0, 0, ETHICS_TEXTURES.form).setDisplaySize(layout.width, layout.height);
  // One text per guide line; its bottom sits a few px above the printed rule.
  const promptLines = FORM_INNER.rules.map(ruleY =>
    scene.add.text(FORM_INNER.prompt.x, ruleY - 4, "", { ...ethicsTextStyle(FORM_INNER.prompt.maxFont), align: "left" })
      .setOrigin(0, 1).setResolution(3));
  const title = scene.add.text(0, FORM_INNER.title.y, "AI 사용 확인서", ethicsTextStyle(19, "#2b6a80"))
    .setOrigin(0.5).setResolution(3);
  const inkLayer = scene.add.container(FORM_INNER.ink.x, FORM_INNER.ink.y).setScale(FORM_INNER.ink.scale);
  const container = scene.add.container(layout.x, layout.y, [shadow, paper, title, ...promptLines, inkLayer])
    .setDepth(ETHICS_DEPTH.form).setAlpha(0);

  const continuePlate = drawOutlinedPill(scene.add.graphics(), 300, 56, "teal");
  const continueLabel = scene.add.text(0, -1, "", { ...ethicsTextStyle(23), ...outlinedButtonTextStyle("teal") })
    .setOrigin(0.5).setResolution(3);
  const continueButton = scene.add.container(ETHICS_LAYOUT.hint.x, ETHICS_LAYOUT.hint.y, [continuePlate, continueLabel])
    .setDepth(ETHICS_DEPTH.hint).setSize(300, 54).setInteractive({ useHandCursor: true }).setVisible(false);
  continueButton.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation(); onContinue();
  });
  continueButton.on("pointerover", () => continueButton.setScale(1.03));
  continueButton.on("pointerout", () => continueButton.setScale(1));

  const counterCopy = createCounterFormCopy(scene);
  const view = { container, paper, promptLines, inkLayer, continueButton, continueLabel, counterCopy, casePrompt: "" };
  return view;
}
export type EthicsReviewFormView = ReturnType<typeof createEthicsReviewForm>;

/**
 * The same form seen from the booth: a small sheet on the counter mat, drawn
 * in perspective, so the right panel reads as a close-up of it.
 */
function createCounterFormCopy(scene: Phaser.Scene) {
  const { x, y, topWidth, bottomWidth, height } = ETHICS_LAYOUT.counterForm;
  const g = scene.add.graphics();
  const top = -height / 2;
  const bottom = height / 2;
  const sheet = [
    new Phaser.Math.Vector2(-topWidth / 2, top), new Phaser.Math.Vector2(topWidth / 2, top),
    new Phaser.Math.Vector2(bottomWidth / 2, bottom), new Phaser.Math.Vector2(-bottomWidth / 2, bottom),
  ];
  const across = (t: number, inset: number) => {
    const half = (topWidth + (bottomWidth - topWidth) * t) / 2 - inset;
    return [-half, top + height * t, half] as const;
  };
  g.fillStyle(0x0d3a3c, 0.22).fillPoints(sheet.map(v => new Phaser.Math.Vector2(v.x + 2, v.y + 3)), true);
  g.fillStyle(0xfbf6e8, 1).fillPoints(sheet, true);
  g.lineStyle(1.5, 0xc7b083, 1).strokePoints(sheet, true);
  const [hl, hy, hr] = across(0.2, 10);
  g.lineStyle(3, 0x5f9ea0, 0.9).lineBetween(hl + 22, hy, hr - 22, hy);
  for (const t of [0.44, 0.63]) {
    const [l, ly, r] = across(t, 9);
    g.lineStyle(1.2, 0x9fb5b4, 1).lineBetween(l, ly, r, ly);
  }
  // The stamp circle sits in the corner below the two lines, like on the big form.
  const [, sy, sr] = across(0.83, 10);
  g.lineStyle(1.4, 0xb8c6c4, 1).strokeEllipse(sr - 9, sy, 12, 8);
  return g.setPosition(x, y).setDepth(ETHICS_DEPTH.boothFront + 1).setAlpha(0);
}

/**
 * Lays the sentence onto the two printed rules: words fill the first rule as
 * far as they fit, the rest go on the second. The authored line break is only
 * a fallback. Tries the largest font first and shrinks until both lines fit.
 */
function fitFormPrompt(view: EthicsReviewFormView) {
  const { maxFont, minFont, width } = FORM_INNER.prompt;
  const [top, bottom] = view.promptLines;
  const words = view.casePrompt.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
  const measure = (text: string) => top.setText(text).width;
  for (let size = maxFont; size >= minFont; size -= 1) {
    top.setFontSize(size);
    bottom.setFontSize(size);
    let count = 0;
    while (count < words.length && measure(words.slice(0, count + 1).join(" ")) <= width) count += 1;
    const first = words.slice(0, count).join(" ");
    const second = words.slice(count).join(" ");
    if (count > 0 && measure(second) <= width) {
      top.setText(first);
      bottom.setText(second);
      return;
    }
  }
  // Nothing fit: fall back to the authored two lines at the smallest size.
  const [first = "", ...rest] = view.casePrompt.split("\n");
  top.setText(first);
  bottom.setText(rest.join(" "));
}

export function setEthicsReviewFormCase(view: EthicsReviewFormView, item: EthicsReviewCase) {
  view.casePrompt = item.prompt;
  view.promptLines.forEach(line => line.setColor("#315567"));
  fitFormPrompt(view);
  view.inkLayer.removeAll(true);
}

/** Slides the form from the window sill onto the desk. */
export function playEthicsFormArrival(scene: Phaser.Scene, view: EthicsReviewFormView, animate: boolean) {
  const layout = ETHICS_LAYOUT.form;
  scene.tweens.killTweensOf(view.container);
  scene.tweens.killTweensOf(view.counterCopy);
  view.container.setScale(1).setAngle(0).setAlpha(1).setPosition(layout.x, layout.y);
  view.counterCopy.setAlpha(animate ? 0 : 1);
  if (!animate) return;
  scene.tweens.add({
    targets: view.counterCopy, alpha: 1, delay: ETHICS_FORM_MOTION.arriveMs * 0.35,
    duration: ETHICS_FORM_MOTION.arriveMs * 0.5, ease: "Sine.easeOut",
  });
  view.container.setPosition(ETHICS_LAYOUT.sill.x + 40, ETHICS_LAYOUT.sill.y - 10).setScale(0.55).setAngle(-9).setAlpha(0.6);
  scene.tweens.add({
    targets: view.container, x: layout.x, y: layout.y, scale: 1, angle: 0, alpha: 1,
    duration: ETHICS_FORM_MOTION.arriveMs, ease: "Cubic.easeOut",
  });
}

/** Returns the stamped form to the visitor at the window. */
export function playEthicsFormDeparture(scene: Phaser.Scene, view: EthicsReviewFormView, onComplete?: () => void) {
  scene.tweens.killTweensOf(view.container);
  scene.tweens.killTweensOf(view.counterCopy);
  scene.tweens.add({ targets: view.counterCopy, alpha: 0, duration: ETHICS_FORM_MOTION.leaveMs * 0.6, ease: "Sine.easeIn" });
  scene.tweens.add({
    targets: view.container, x: ETHICS_LAYOUT.sill.x + 30, y: ETHICS_LAYOUT.sill.y - 20, scale: 0.5, angle: -7, alpha: 0,
    duration: ETHICS_FORM_MOTION.leaveMs, ease: "Cubic.easeIn", onComplete,
  });
}

export function showEthicsFormState(view: EthicsReviewFormView, state: EthicsDeliveryState, ready: boolean) {
  const feedback = state.phase === "feedback";
  // Only a wrong practice stamp offers "한 번 더"; a right one goes on to the real shift.
  view.continueButton.setVisible(state.practice && feedback && ready && !state.decision?.correct);
  if (!feedback) view.continueButton.setScale(1);
  view.continueLabel.setText("한 번 더  →");
}
