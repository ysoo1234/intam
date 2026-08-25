import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { WorkshopOrder } from "../model";

export type WorkshopStarCatchView = {
  container: Phaser.GameObjects.Container;
  marker: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
};

export function randomizeWorkshopStarZone() {
  return Phaser.Math.Between(-205, 205);
}

export function createWorkshopStarCatchView(
  scene: Phaser.Scene,
  order: WorkshopOrder,
  starX: number,
  starZoneCenter: number,
  starZoneWidth: number,
): WorkshopStarCatchView {
  const container = scene.add.container(790, 390).setDepth(70);
  const shade = scene.add.rectangle(0, 0, 760, 320, 0x173f43, 0.18);
  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.paper, 0.98);
  panel.lineStyle(8, COLORS.ink, 1);
  panel.fillRoundedRect(-355, -145, 710, 290, 48);
  panel.strokeRoundedRect(-355, -145, 710, 290, 48);
  const title = scene.add
    .text(0, -103, "✨ 상품 제작 중", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "27px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const track = scene.add.graphics();
  track.fillStyle(COLORS.ink, 0.22);
  track.fillRoundedRect(-280, -28, 560, 60, 25);
  track.fillStyle(0x315e68, 1);
  track.fillRoundedRect(-270, -18, 540, 40, 18);
  const zone = scene.add.graphics().setName("star-zone");
  zone.fillStyle(COLORS.yellow, 0.92);
  zone.fillRoundedRect(
    starZoneCenter - starZoneWidth / 2,
    -18,
    starZoneWidth,
    40,
    18,
  );
  zone.lineStyle(4, 0xfff3a0, 1);
  zone.strokeRoundedRect(
    starZoneCenter - starZoneWidth / 2,
    -18,
    starZoneWidth,
    40,
    18,
  );
  const marker = scene.add
    .text(starX, 1, "★", {
      color: "#fff8c2",
      fontFamily: FONT_FAMILY,
      fontSize: "45px",
      fontStyle: "bold",
      stroke: "#d75550",
      strokeThickness: 8,
    })
    .setOrigin(0.5);
  const statusText = scene.add
    .text(0, 89, `성공 0 / ${order.requiredStarHits}`, {
      color: "#287b85",
      fontFamily: FONT_FAMILY,
      fontSize: "23px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  container.add([shade, panel, title, track, zone, marker, statusText]);
  container.setScale(0.78).setAlpha(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    alpha: 1,
    duration: 320,
    ease: "Back.easeOut",
  });
  return { container, marker, statusText };
}
