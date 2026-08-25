import Phaser from "phaser";
import {
  WORKSHOP_PRODUCTS,
  type WorkshopProduct,
} from "../../../content/aiWorkshop";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { WorkshopOrder } from "../model";

export type WorkshopProductChoice = {
  product: WorkshopProduct;
  container: Phaser.GameObjects.Container;
};

export type WorkshopItemPanelView = Phaser.GameObjects.Image;

type WorkshopItemPanelLayout = Readonly<{
  texture: "workshop-item-panel-4" | "workshop-item-panel-5";
  width: number;
  height: number;
  openX: number;
  peekX: number;
  y: number;
  slotXs: readonly number[];
}>;

const FOUR_SLOT_LAYOUT: WorkshopItemPanelLayout = {
  texture: "workshop-item-panel-4",
  width: 680,
  height: 188,
  openX: 885,
  peekX: 1_565,
  y: 198,
  slotXs: [710, 865, 1_020, 1_175],
};

const FIVE_SLOT_LAYOUT: WorkshopItemPanelLayout = {
  texture: "workshop-item-panel-5",
  width: 720,
  height: 165,
  openX: 865,
  peekX: 1_585,
  y: 198,
  slotXs: [650, 780, 910, 1_040, 1_170],
};

function getWorkshopItemPanelLayout(customerNumber: number) {
  return customerNumber >= 4 ? FIVE_SLOT_LAYOUT : FOUR_SLOT_LAYOUT;
}

export function createWorkshopItemPanel(
  scene: Phaser.Scene,
): WorkshopItemPanelView {
  return scene.add
    .image(
      FOUR_SLOT_LAYOUT.peekX,
      FOUR_SLOT_LAYOUT.y,
      FOUR_SLOT_LAYOUT.texture,
    )
    .setDisplaySize(FOUR_SLOT_LAYOUT.width, FOUR_SLOT_LAYOUT.height)
    .setDepth(18);
}

export function showWorkshopItemPanel(
  scene: Phaser.Scene,
  panel: WorkshopItemPanelView | undefined,
  customerNumber: number,
) {
  const layout = getWorkshopItemPanelLayout(customerNumber);
  if (!panel) return layout;
  scene.tweens.killTweensOf(panel);
  panel
    .setTexture(layout.texture)
    .setDisplaySize(layout.width, layout.height)
    .setPosition(layout.peekX, layout.y)
    .setVisible(true);
  scene.tweens.add({
    targets: panel,
    x: layout.openX,
    duration: 560,
    ease: "Cubic.easeOut",
  });
  return layout;
}

export function hideWorkshopItemPanel(
  scene: Phaser.Scene,
  panel: WorkshopItemPanelView | undefined,
) {
  if (!panel) return;
  const layout = panel.texture.key.endsWith("-5")
    ? FIVE_SLOT_LAYOUT
    : FOUR_SLOT_LAYOUT;
  scene.tweens.killTweensOf(panel);
  scene.tweens.add({
    targets: panel,
    x: layout.peekX,
    duration: 360,
    ease: "Cubic.easeIn",
  });
}

export function createWorkshopProductChoices(
  scene: Phaser.Scene,
  order: WorkshopOrder,
  customerNumber: number,
): WorkshopProductChoice[] {
  const choiceCount = customerNumber >= 4 ? 5 : 4;
  const answerIds = new Set(order.products.map((product) => product.id));
  const distractors = Phaser.Utils.Array.Shuffle(
    WORKSHOP_PRODUCTS.filter((product) => !answerIds.has(product.id)),
  ).slice(0, choiceCount - order.products.length);
  const choices = Phaser.Utils.Array.Shuffle([
    ...order.products,
    ...distractors,
  ]);
  const layout = getWorkshopItemPanelLayout(customerNumber);

  return choices.map((product, index) => {
    const targetX = layout.slotXs[index];
    const container = createWorkshopProductVisual(
      scene,
      product,
      targetX + 720,
      layout.y - 2,
      choiceCount === 5 ? 0.88 : 0.96,
    ).setDepth(20);
    scene.tweens.add({
      targets: container,
      x: targetX,
      duration: 560,
      delay: 45 + index * 35,
      ease: "Cubic.easeOut",
    });
    return { product, container };
  });
}

export function createWorkshopProductVisual(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  x: number,
  y: number,
  scale: number,
) {
  const container = scene.add.container(x, y).setScale(scale);
  const shadow = scene.add.ellipse(4, 5, 76, 70, COLORS.ink, 0.16);
  const badge = scene.add.circle(0, 0, 39, COLORS.paper, 0.98);
  badge.setStrokeStyle(4, COLORS.ink, 0.94);
  const accent = scene.add.circle(0, 0, 33, product.color, 0.2);
  accent.setStrokeStyle(4, product.color, 0.78);
  const emoji = scene.add
    .text(0, -2, product.emoji, { fontSize: "39px" })
    .setOrigin(0.5);
  const labelPlate = scene.add.graphics();
  labelPlate.fillStyle(COLORS.paper, 0.98);
  labelPlate.lineStyle(3, COLORS.ink, 0.9);
  labelPlate.fillRoundedRect(-64, 42, 128, 38, 12);
  labelPlate.strokeRoundedRect(-64, 42, 128, 38, 12);
  const label = scene.add
    .text(0, 61, product.label, {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 116 },
    })
    .setOrigin(0.5);
  container.add([shadow, badge, accent, emoji, labelPlate, label]);
  scene.tweens.add({
    targets: accent,
    alpha: { from: 0.7, to: 1 },
    scale: { from: 0.94, to: 1.04 },
    duration: 780 + Phaser.Math.Between(0, 180),
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return container;
}

export function returnWorkshopProductToPanel(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  x: number,
  y: number,
  scale: number,
): WorkshopProductChoice {
  const container = createWorkshopProductVisual(scene, product, x, y, scale)
    .setDepth(20)
    .setScale(scale * 0.72);
  scene.tweens.add({
    targets: container,
    scale,
    duration: 220,
    ease: "Back.easeOut",
  });
  return { product, container };
}
