import Phaser from "phaser";
import {
  WORKSHOP_PRODUCTS,
  type WorkshopProduct,
} from "../../../content/aiWorkshop";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { WorkshopOrder } from "../model";
import {
  syncWorkshopCarriedVisualPositions,
  updateWorkshopPlayerDepth,
  updateWorkshopPlayerPerspective,
} from "./workshopPlayer";

export type WorkshopProductChoice = {
  product: WorkshopProduct;
  container: Phaser.GameObjects.Container;
  origin: WorkshopProductOrigin;
};

export type WorkshopProductOrigin = Readonly<{
  x: number;
  y: number;
  scale: number;
  artSize: number;
  labelOffsetY: number;
  labelWidth: number;
}>;

export type WorkshopItemPanelView = Phaser.GameObjects.Image;

export function getWorkshopProductTextureKey(productId: string) {
  return `workshop-product-${productId}`;
}

export function createWorkshopProductArt(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  size: number,
) {
  const textureKey = getWorkshopProductTextureKey(product.id);
  if (scene.textures.exists(textureKey)) {
    return scene.add.image(0, -2, textureKey).setDisplaySize(size, size);
  }
  return scene.add
    .text(0, -2, product.emoji, {
      fontSize: `${Math.round(size * 0.54)}px`,
    })
    .setOrigin(0.5);
}

type WorkshopItemPanelArtworkContract = Readonly<{
  texture: "workshop-item-panel-4" | "workshop-item-panel-5";
  /** Pixel dimensions after removing the transparent PNG margin. */
  trimmedWidth: number;
  trimmedHeight: number;
  /** Pixel coordinates inside the trimmed artwork. */
  slotCenterXs: readonly number[];
  slotY: number;
  labelY: number;
  labelWidth: number;
  /** Final display measurements in the 1280 x 720 game coordinate space. */
  displayHeight: number;
  artSize: number;
  panelY: number;
}>;

type WorkshopItemPanelLayout = Readonly<{
  texture: WorkshopItemPanelArtworkContract["texture"];
  width: number;
  height: number;
  openX: number;
  peekX: number;
  y: number;
  slotXs: readonly number[];
  slotY: number;
  labelY: number;
  labelWidth: number;
  artSize: number;
}>;

// Simple visual knobs for the item panel. These values use the 1280 x 720
// game coordinate space, so they can be adjusted without re-measuring the PNG.
export const WORKSHOP_ITEM_PANEL_TUNING = {
  rightMargin: 18,
  itemSize: 80,
  itemOffsetY: 0,
  labelOffsetY: 0,
} as const;

const PANEL_OPEN_RIGHT_EDGE = 1_280 - WORKSHOP_ITEM_PANEL_TUNING.rightMargin;

function createWorkshopItemPanelLayout(
  artwork: WorkshopItemPanelArtworkContract,
): WorkshopItemPanelLayout {
  const displayScale = artwork.displayHeight / artwork.trimmedHeight;
  const width = artwork.trimmedWidth * displayScale;
  const openX = PANEL_OPEN_RIGHT_EDGE - width / 2;
  const artworkCenterX = artwork.trimmedWidth / 2;
  const artworkCenterY = artwork.trimmedHeight / 2;

  return {
    texture: artwork.texture,
    width,
    height: artwork.displayHeight,
    openX,
    peekX: openX + width,
    y: artwork.panelY,
    slotXs: artwork.slotCenterXs.map(
      (slotX) => openX + (slotX - artworkCenterX) * displayScale,
    ),
    slotY:
      artwork.panelY +
      (artwork.slotY - artworkCenterY) * displayScale +
      WORKSHOP_ITEM_PANEL_TUNING.itemOffsetY,
    labelY:
      artwork.panelY +
      (artwork.labelY - artworkCenterY) * displayScale +
      WORKSHOP_ITEM_PANEL_TUNING.labelOffsetY,
    labelWidth: artwork.labelWidth * displayScale,
    artSize: artwork.artSize,
  };
}

// itembox4.png is 1560 x 584. Its non-transparent artwork begins at
// (26, 47), measures 1499 x 470, and the white card centres in source pixels
// are x=[367, 675, 984, 1293], icon y=250, label y=400.
const FOUR_SLOT_LAYOUT = createWorkshopItemPanelLayout({
  texture: "workshop-item-panel-4",
  trimmedWidth: 1_499,
  trimmedHeight: 470,
  slotCenterXs: [341, 649, 958, 1_267],
  slotY: 203,
  labelY: 353,
  labelWidth: 218,
  displayHeight: 224,
  artSize: WORKSHOP_ITEM_PANEL_TUNING.itemSize,
  panelY: 205,
});

// itembox5.png uses the same card geometry. Its trimmed artwork is wider, so
// it deliberately has an independent contract instead of inheriting the
// four-slot coordinates.
const FIVE_SLOT_LAYOUT = createWorkshopItemPanelLayout({
  texture: "workshop-item-panel-5",
  trimmedWidth: 1_807,
  trimmedHeight: 470,
  slotCenterXs: [341, 649, 958, 1_267, 1_575],
  slotY: 203,
  labelY: 353,
  labelWidth: 218,
  displayHeight: 224,
  artSize: WORKSHOP_ITEM_PANEL_TUNING.itemSize,
  panelY: 205,
});

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
    const scale = 1;
    const origin = {
      x: targetX,
      y: layout.slotY,
      scale,
      artSize: layout.artSize,
      labelOffsetY: layout.labelY - layout.slotY,
      labelWidth: layout.labelWidth,
    };
    const panelTravelX = layout.peekX - layout.openX;
    const container = createWorkshopProductVisual(
      scene,
      product,
      targetX + panelTravelX,
      origin.y,
      scale,
      {
        artSize: origin.artSize,
        labelOffsetY: origin.labelOffsetY,
        labelWidth: origin.labelWidth,
      },
    ).setDepth(20);
    scene.tweens.add({
      targets: container,
      x: targetX,
      duration: 560,
      ease: "Cubic.easeOut",
    });
    return { product, container, origin };
  });
}

export function createWorkshopProductVisual(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  x: number,
  y: number,
  scale: number,
  options: Readonly<{
    showLabel?: boolean;
    artSize?: number;
    labelOffsetY?: number;
    labelWidth?: number;
  }> = {},
) {
  const container = scene.add.container(x, y).setScale(scale);
  const hasProductArt = scene.textures.exists(
    getWorkshopProductTextureKey(product.id),
  );
  const artSize = options.artSize ?? 74;
  const showLabel = options.showLabel ?? true;
  const labelWidth = options.labelWidth ?? 112;
  const productArt = createWorkshopProductArt(scene, product, artSize).setY(0);
  const labelFontSize = 13;
  const label = scene.add
    .text(0, options.labelOffsetY ?? 76, product.label, {
      color: "#111111",
      fontFamily: FONT_FAMILY,
      fontSize: `${labelFontSize}px`,
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const availableLabelWidth = labelWidth - 12;
  let fittedFontSize = labelFontSize;
  while (label.width > availableLabelWidth && fittedFontSize > 9) {
    fittedFontSize -= 0.5;
    label.setFontSize(fittedFontSize);
  }
  if (showLabel && scale !== 0) {
    label
      .setY((options.labelOffsetY ?? 76) / scale)
      .setScale(1 / scale);
  }
  label.setVisible(showLabel);
  if (hasProductArt) {
    container.add(showLabel ? [productArt, label] : [productArt]);
  } else {
    const badgeRadius = Math.max(39, Math.round(artSize * 0.49));
    const shadow = scene.add.ellipse(
      4,
      5,
      badgeRadius * 2,
      badgeRadius * 1.8,
      COLORS.ink,
      0.16,
    );
    const badge = scene.add.circle(0, 0, badgeRadius, COLORS.paper, 0.98);
    badge.setStrokeStyle(4, COLORS.ink, 0.94);
    const accent = scene.add.circle(0, 0, badgeRadius - 6, product.color, 0.2);
    accent.setStrokeStyle(4, product.color, 0.78);
    container.add(
      showLabel
        ? [shadow, badge, accent, productArt, label]
        : [shadow, badge, accent, productArt],
    );
  }
  return container;
}

function createWorkshopCarriedIcon(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  x: number,
  y: number,
) {
  const container = scene.add.container(x, y);
  container.add(createWorkshopProductArt(scene, product, 110));
  return container;
}

export function rebuildWorkshopCarriedVisuals(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Container | undefined,
  products: readonly WorkshopProduct[],
  previousVisuals: readonly Phaser.GameObjects.Container[],
) {
  previousVisuals.forEach((visual) => visual.destroy(true));
  if (!player) return [];
  const visuals = products.map((product, index) =>
    createWorkshopCarriedIcon(
      scene,
      product,
      player.x + (index - (products.length - 1) / 2) * 72,
      player.y - 92,
    )
      .setDepth(34)
      .setData("carried", true),
  );
  updateWorkshopPlayerPerspective(player, visuals);
  syncWorkshopCarriedVisualPositions(player, visuals);
  updateWorkshopPlayerDepth(player, visuals);
  return visuals;
}

export function returnWorkshopProductToPanel(
  scene: Phaser.Scene,
  product: WorkshopProduct,
  origin: WorkshopProductOrigin,
): WorkshopProductChoice {
  const container = createWorkshopProductVisual(
    scene,
    product,
    origin.x,
    origin.y,
    origin.scale,
    {
      artSize: origin.artSize,
      labelOffsetY: origin.labelOffsetY,
      labelWidth: origin.labelWidth,
    },
  )
    .setDepth(20)
    .setScale(origin.scale * 0.72);
  scene.tweens.add({
    targets: container,
    scale: origin.scale,
    duration: 220,
    ease: "Back.easeOut",
  });
  return { product, container, origin };
}
