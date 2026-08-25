import Phaser from "phaser";
import { createFloatingJoystick } from "../../../core/input/floatingJoystick";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { addFlowerBadge } from "../../../core/visual/uiPrimitives";

export function createCoreKitchenControls(
  scene: Phaser.Scene,
  onBack: () => void,
  onAction: () => void,
) {
  const back = addFlowerBadge(scene, 55, 108, "←", COLORS.blue)
    .setDepth(40)
    .setScale(0.88)
    .setInteractive(
      new Phaser.Geom.Circle(0, 0, 47),
      Phaser.Geom.Circle.Contains,
    );
  back.on("pointerdown", onBack);

  const progressText = scene.add
    .text(1210, 88, "", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 8,
    })
    .setOrigin(1, 0.5)
    .setDepth(40);
  const comboText = scene.add
    .text(1210, 124, "", {
      color: "#f5bd46",
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 7,
    })
    .setOrigin(1, 0.5)
    .setDepth(40);
  const helperText = scene.add
    .text(585, 697, "방향키 또는 화면 터치로 이동 · SPACE로 코어 집기/장착", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(40);

  const joystick = new Phaser.Math.Vector2();
  createFloatingJoystick(scene, {
    direction: joystick,
    radius: 44,
    depth: 45,
    canStart: (pointer) =>
      !(pointer.x > 1080 && pointer.y > 520) &&
      !(pointer.x < 120 && pointer.y < 180),
  });

  const action = scene.add.container(1190, 625).setDepth(45);
  const actionShape = scene.add.graphics();
  actionShape.fillStyle(COLORS.ink, 0.25);
  actionShape.fillCircle(5, 7, 53);
  actionShape.fillStyle(COLORS.coral, 1);
  actionShape.fillCircle(0, 0, 50);
  actionShape.lineStyle(5, COLORS.ink, 1);
  actionShape.strokeCircle(0, 0, 50);
  actionShape.fillStyle(COLORS.cream, 1);
  actionShape.fillCircle(0, 0, 34);
  const actionText = scene.add
    .text(0, -1, "집기", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const actionZone = scene.add
    .zone(0, 0, 108, 108)
    .setCircleDropZone(54)
    .setInteractive({ useHandCursor: true });
  actionZone.on("pointerdown", () => {
    onAction();
    scene.tweens.add({
      targets: action,
      scale: 0.9,
      duration: 70,
      yoyo: true,
    });
  });
  action.add([actionShape, actionText, actionZone]);
  return {
    progressText,
    comboText,
    helperText,
    joystick,
    actionText,
  };
}
