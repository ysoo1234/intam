import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { WorkshopOrder } from "../model";
import { createWorkshopProductArt } from "./workshopProducts";

/**
 * User-tunable layout values for the full-screen product crafting panel.
 * Coordinates are relative to the panel container at (centerX, centerY).
 */
export const WORKSHOP_STAR_CATCH_TUNING = {
  centerX: 640,
  centerY: 360,
  panelX: 0,
  panelY: 0,
  panelWidth: 860,
  panelHeight: 434,
  titleX: 0,
  titleY: -180,
  titleFontSize: 27,
  productX: 0,
  productY: -55,
  productSize: 104,
  trackX: 0,
  trackY: 75,
  trackHalfWidth: 275,
  targetHeight: 40,
  targetRadius: 14,
  markerWidth: 14,
  markerHeight: 58,
  statusX: 0,
  statusY: 171,
  statusFontSize: 22,
} as const;

export const WORKSHOP_STAR_CATCH_TRACK_Y = WORKSHOP_STAR_CATCH_TUNING.trackY;
export const WORKSHOP_STAR_CATCH_HALF_WIDTH =
  WORKSHOP_STAR_CATCH_TUNING.trackHalfWidth;

export type WorkshopStarCatchView = {
  container: Phaser.GameObjects.Container;
  marker: Phaser.GameObjects.Rectangle;
  statusText: Phaser.GameObjects.Text;
};

export function randomizeWorkshopStarZone() {
  return Phaser.Math.Between(
    -WORKSHOP_STAR_CATCH_HALF_WIDTH + 70,
    WORKSHOP_STAR_CATCH_HALF_WIDTH - 70,
  );
}

export function drawWorkshopStarZone(
  zone: Phaser.GameObjects.Graphics,
  center: number,
  width: number,
) {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const top = tuning.trackY - tuning.targetHeight / 2;
  zone.clear();
  zone.fillStyle(COLORS.yellow, 0.96);
  zone.fillRoundedRect(
    tuning.trackX + center - width / 2,
    top,
    width,
    tuning.targetHeight,
    tuning.targetRadius,
  );
  zone.lineStyle(3, 0xfff1a6, 1);
  zone.strokeRoundedRect(
    tuning.trackX + center - width / 2,
    top,
    width,
    tuning.targetHeight,
    tuning.targetRadius,
  );
}

export function createWorkshopStarCatchView(
  scene: Phaser.Scene,
  order: WorkshopOrder,
  starX: number,
  starZoneCenter: number,
  starZoneWidth: number,
): WorkshopStarCatchView {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const container = scene.add
    .container(tuning.centerX, tuning.centerY)
    .setDepth(70);
  const shade = scene.add.rectangle(0, 0, 1_280, 720, 0x173f43, 0.42);
  const panel = scene.add
    .image(tuning.panelX, tuning.panelY, "workshop-crafting-panel")
    .setDisplaySize(tuning.panelWidth, tuning.panelHeight);
  const title = scene.add
    .text(tuning.titleX, tuning.titleY, "상품 제작 중", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: `${tuning.titleFontSize}px`,
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const product = order.products[0];
  const productArt = product
    ? createWorkshopProductArt(scene, product, tuning.productSize).setPosition(
        tuning.productX,
        tuning.productY,
      )
    : scene.add
        .image(tuning.productX, tuning.productY, "workshop-crafting-panel")
        .setVisible(false);
  const productGlow = scene.add
    .ellipse(
      tuning.productX,
      tuning.productY + 6,
      158,
      104,
      0x8cf6ff,
      0.12,
    )
    .setBlendMode(Phaser.BlendModes.ADD);
  const zone = scene.add.graphics().setName("star-zone");
  drawWorkshopStarZone(zone, starZoneCenter, starZoneWidth);
  const marker = scene.add
    .rectangle(
      tuning.trackX + starX,
      tuning.trackY,
      tuning.markerWidth,
      tuning.markerHeight,
      0xfff6d2,
      1,
    )
    .setStrokeStyle(3, 0xd79032, 1);
  const statusText = scene.add
    .text(
      tuning.statusX,
      tuning.statusY,
      `성공 횟수 0 / ${order.requiredStarHits}`,
      {
        color: "#1f5962",
        fontFamily: FONT_FAMILY,
        fontSize: `${tuning.statusFontSize}px`,
        fontStyle: "bold",
      },
    )
    .setOrigin(0.5)
    .setResolution(3);
  container.add([
    shade,
    panel,
    productGlow,
    productArt,
    title,
    zone,
    marker,
    statusText,
  ]);
  scene.tweens.add({
    targets: productArt,
    y: { from: tuning.productY - 3, to: tuning.productY + 3 },
    angle: { from: -1, to: 1 },
    duration: 420,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: productGlow,
    alpha: { from: 0.08, to: 0.32 },
    scale: { from: 0.88, to: 1.08 },
    duration: 520,
    yoyo: true,
    repeat: -1,
    ease: "Quad.easeInOut",
  });
  container.setScale(0.9).setAlpha(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    alpha: 1,
    duration: 300,
    ease: "Back.easeOut",
  });
  return { container, marker, statusText };
}
