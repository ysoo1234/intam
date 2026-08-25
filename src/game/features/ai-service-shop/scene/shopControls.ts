import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { addFlowerBadge } from "../../../core/visual/uiPrimitives";

export function createShopControls(
  scene: Phaser.Scene,
  onBack: () => void,
  onServe: () => void,
) {
  const helperText = scene.add
    .text(640, 685, "← → 로 고르고  SPACE 로 건네주세요", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(30);

  const back = addFlowerBadge(scene, 55, 108, "←", COLORS.blue)
    .setDepth(30)
    .setScale(0.88)
    .setInteractive(
      new Phaser.Geom.Circle(0, 0, 47),
      Phaser.Geom.Circle.Contains,
    );
  back.on("pointerdown", onBack);

  const serve = addFlowerBadge(scene, 1208, 652, "건네", COLORS.yellow)
    .setDepth(30)
    .setScale(1.08)
    .setInteractive(
      new Phaser.Geom.Circle(0, 0, 52),
      Phaser.Geom.Circle.Contains,
    );
  serve.on("pointerdown", onServe);
  const serveText = serve
    .getAll()
    .find(
      (child): child is Phaser.GameObjects.Text =>
        child instanceof Phaser.GameObjects.Text,
    );

  const progressText = scene.add
    .text(1210, 90, "", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 8,
    })
    .setOrigin(1, 0.5)
    .setDepth(30);

  const comboText = scene.add
    .text(1210, 126, "", {
      color: "#f5bd46",
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 7,
    })
    .setOrigin(1, 0.5)
    .setDepth(30);

  return { helperText, serveText, progressText, comboText };
}
