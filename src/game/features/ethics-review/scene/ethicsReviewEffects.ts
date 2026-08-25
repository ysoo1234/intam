import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { EthicsVerdict } from "../model";
import type { EthicsReviewStationView } from "./ethicsReviewView";

export function playEthicsCountdown(
  scene: Phaser.Scene,
  onComplete: () => void,
) {
  const countText = scene.add
    .text(640, 330, "3", {
      color: "#fff9e9",
      fontFamily: FONT_FAMILY,
      fontSize: "96px",
      fontStyle: "bold",
      stroke: "#173f43",
      strokeThickness: 14,
    })
    .setOrigin(0.5)
    .setDepth(88);
  const steps = ["3", "2", "1", "판정!"];
  let index = 0;
  const playStep = () => {
    countText.setText(steps[index]).setScale(0.45).setAlpha(0);
    scene.tweens.add({
      targets: countText,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 110,
      onComplete: () => {
        index += 1;
        if (index < steps.length) {
          playStep();
        } else {
          countText.destroy();
          onComplete();
        }
      },
    });
  };
  playStep();
}

export function playEthicsCaseScan(
  scene: Phaser.Scene,
  document: Phaser.GameObjects.Container,
) {
  const scan = scene.add
    .rectangle(0, -132, 650, 5, COLORS.blue, 0.88)
    .setBlendMode(Phaser.BlendModes.ADD);
  const glow = scene.add
    .rectangle(0, -132, 650, 30, COLORS.blue, 0.16)
    .setBlendMode(Phaser.BlendModes.ADD);
  document.add([glow, scan]);
  scene.tweens.add({
    targets: [scan, glow],
    y: 136,
    duration: 430,
    ease: "Sine.easeInOut",
    onComplete: () => {
      scan.destroy();
      glow.destroy();
    },
  });
}

export function setEthicsStationsReady(
  scene: Phaser.Scene,
  stations: readonly EthicsReviewStationView[],
  active: boolean,
) {
  stations.forEach((station) => {
    station.container.setAlpha(active ? 1 : 0.72);
    scene.tweens.killTweensOf(station.indicator);
    station.indicator.setVisible(active).setY(-78).setAlpha(active ? 1 : 0);
    if (active) {
      scene.tweens.add({
        targets: station.indicator,
        y: -89,
        duration: 430,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  });
}

export function playEthicsStationEffect(
  scene: Phaser.Scene,
  station: EthicsReviewStationView,
  correct: boolean,
  points: number,
) {
  const color = correct ? COLORS.mint : COLORS.coral;
  station.container.setAlpha(1);
  scene.cameras.main.shake(120, correct ? 0.0025 : 0.005);
  scene.tweens.add({
    targets: station.container,
    scale: correct ? 1.12 : 0.92,
    angle: correct ? 0 : 3,
    duration: 105,
    yoyo: true,
    repeat: correct ? 0 : 2,
    onComplete: () => station.container.setAngle(0),
  });

  const ring = scene.add
    .circle(station.container.x, station.container.y - 10, 40, color, 0)
    .setStrokeStyle(7, color, 0.95)
    .setDepth(89);
  scene.tweens.add({
    targets: ring,
    scale: 2.5,
    alpha: 0,
    duration: 420,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy(),
  });

  if (correct && points > 0) {
    const score = scene.add
      .text(station.container.x, station.container.y - 78, `+${points}`, {
        color: "#fff9e9",
        fontFamily: FONT_FAMILY,
        fontSize: "27px",
        fontStyle: "bold",
        stroke: "#173f43",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(90);
    scene.tweens.add({
      targets: score,
      y: score.y - 62,
      alpha: 0,
      scale: 1.2,
      duration: 850,
      ease: "Cubic.easeOut",
      onComplete: () => score.destroy(),
    });
  }

  for (let index = 0; index < (correct ? 9 : 5); index += 1) {
    const spark = scene.add
      .circle(
        station.container.x,
        station.container.y - 18,
        Phaser.Math.Between(3, 6),
        color,
      )
      .setDepth(88);
    scene.tweens.add({
      targets: spark,
      x: spark.x + Phaser.Math.Between(-95, 95),
      y: spark.y + Phaser.Math.Between(-90, -25),
      alpha: 0,
      duration: Phaser.Math.Between(380, 680),
      onComplete: () => spark.destroy(),
    });
  }
}

export function playEthicsVerdictStamp(
  scene: Phaser.Scene,
  document: Phaser.GameObjects.Container,
  verdict: EthicsVerdict,
  correct: boolean,
) {
  const color = verdict === "approve" ? COLORS.mint : COLORS.coral;
  const label = verdict === "approve" ? "승인" : "보완";
  const stamp = scene.add
    .container(205, 63)
    .setDepth(20)
    .setScale(2.4)
    .setAlpha(0)
    .setAngle(verdict === "approve" ? -11 : 11);
  const halo = scene.add
    .ellipse(0, 0, 178, 94, color, 0.14)
    .setStrokeStyle(7, color, 0.88);
  const inner = scene.add
    .ellipse(0, 0, 153, 70, COLORS.paper, 0.84)
    .setStrokeStyle(3, color, 0.9);
  const title = scene.add
    .text(0, -5, label, {
      color: verdict === "approve" ? "#236f67" : "#a65047",
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#fff9e9",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  const sub = scene.add
    .text(0, 25, correct ? "판정 완료" : "근거 재확인", {
      color: "#5f655e",
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  stamp.add([halo, inner, title, sub]);
  document.add(stamp);

  scene.tweens.add({
    targets: stamp,
    scale: 1,
    alpha: 1,
    duration: 155,
    ease: "Back.easeIn",
    onComplete: () => {
      scene.tweens.add({
        targets: halo,
        scaleX: 1.22,
        scaleY: 1.22,
        alpha: 0.42,
        duration: 240,
        yoyo: true,
        ease: "Sine.easeOut",
      });
      scene.time.delayedCall(900, () => {
        if (!stamp.active) return;
        scene.tweens.add({
          targets: stamp,
          alpha: 0,
          scale: 1.08,
          duration: 220,
          onComplete: () => stamp.destroy(true),
        });
      });
    },
  });
}

export function celebrateEthicsResult(scene: Phaser.Scene, stars: number) {
  for (let index = 0; index < 8 + stars * 3; index += 1) {
    const colors = [COLORS.yellow, COLORS.mint, COLORS.coral, COLORS.blue];
    const confetti = scene.add
      .circle(
        Phaser.Math.Between(390, 890),
        Phaser.Math.Between(230, 380),
        Phaser.Math.Between(5, 9),
        colors[index % colors.length],
      )
      .setDepth(94);
    scene.tweens.add({
      targets: confetti,
      x: confetti.x + Phaser.Math.Between(-160, 160),
      y: 750,
      angle: Phaser.Math.Between(-240, 240),
      alpha: 0,
      duration: Phaser.Math.Between(900, 1500),
      onComplete: () => confetti.destroy(),
    });
  }
}
