import Phaser from "phaser";
import type { EthicsReviewDecision } from "../model";
import { ETHICS_DEPTH, ethicsTextStyle } from "./ethicsReviewOffice";
import { getEthicsStampLabel, type EthicsReviewStations, type EthicsReviewFormView } from "./ethicsReviewView";
import { ETHICS_LAYOUT } from "./layout";

// Midi's anticipation and the stamp sound share this impact timing.
export const ETHICS_STAMP_MOTION = { liftMs: 110, travelMs: 200, dropMs: 75 } as const;
export const ETHICS_STAMP_IMPACT_MS =
  ETHICS_STAMP_MOTION.liftMs + ETHICS_STAMP_MOTION.travelMs + ETHICS_STAMP_MOTION.dropMs;

/**
 * Lifts the chosen stamp off the desk, flies it over the form, and leaves an
 * ink mark on the paper. The mark lives inside the form so it travels back
 * to the visitor with the document.
 */
export function playEthicsVerdictStamp(
  scene: Phaser.Scene, decision: EthicsReviewDecision, stations: EthicsReviewStations,
  form: EthicsReviewFormView, onImpact: () => void, options: { combo?: number; celebrate?: boolean } = {},
) {
  const station = stations.find(item => item.verdict === decision.selected)!;
  const point = ETHICS_LAYOUT.stamps[decision.selected];
  const inkX = form.container.x + form.inkLayer.x;
  const inkY = form.container.y + form.inkLayer.y;
  const color = decision.correct ? decision.selected === "approve" ? 0x258575 : 0xb55846 : 0xb67c3d;
  const colorHex = `#${color.toString(16).padStart(6, "0")}`;
  const root = scene.add.container(0, 0).setDepth(ETHICS_DEPTH.effects);
  const ownedTweens: Phaser.Tweens.Tween[] = [];
  const animate = (config: Phaser.Types.Tweens.TweenBuilderConfig) => {
    const tween = scene.tweens.add(config);
    ownedTweens.push(tween);
    return tween;
  };
  let alive = true;
  const flight = scene.add.image(point.x, point.y, station.image.texture.key)
    .setOrigin(0.5, 1).setDepth(ETHICS_DEPTH.effects + 1);
  const startScale = station.image.displayWidth / flight.width;
  const contactScale = 104 / flight.width;
  flight.setScale(startScale);
  const flightShadow = scene.add.ellipse(point.x, point.y - 2, 120, 16, 0x34555a, 0.2).setDepth(ETHICS_DEPTH.effects);

  // Ink mark: a rounded stamp frame with the verdict, slightly rotated like a real stamp.
  const ink = scene.add.graphics();
  ink.lineStyle(3.5, color, 0.9).strokeRoundedRect(-92, -24, 184, 48, 8);
  ink.lineStyle(1.2, color, 0.45).strokeRoundedRect(-86, -18, 172, 36, 4);
  const markLabel = scene.add.text(0, 0, decision.correct ? `✓  ${getEthicsStampLabel(decision.selected)}` : "다시 생각!",
    ethicsTextStyle(25, colorHex)).setOrigin(0.5).setResolution(3);
  const mark = scene.add.container(0, 0, [ink, markLabel]).setAngle(-6).setAlpha(0).setScale(1.25);
  form.inkLayer.add(mark);

  const stationY = station.image.y;
  const { liftMs, travelMs, dropMs } = ETHICS_STAMP_MOTION;
  animate({ targets: station.image, alpha: 0.3, duration: liftMs, ease: "Sine.easeOut" });
  animate({ targets: flight, y: point.y - 34, angle: decision.selected === "approve" ? -8 : 8,
    scale: startScale * 0.96, duration: liftMs, ease: "Cubic.easeOut" });
  animate({ targets: flightShadow, scaleX: 0.7, alpha: 0.1, duration: liftMs });
  animate({
    targets: flight, x: inkX, y: inkY - 22, scale: contactScale, angle: 0,
    delay: liftMs, duration: travelMs, ease: "Cubic.easeOut",
  });
  animate({ targets: flightShadow, x: inkX, y: inkY + 4, scaleX: 0.55, alpha: 0.14, delay: liftMs, duration: travelMs, ease: "Cubic.easeOut" });
  animate({
    targets: flight, y: inkY + 2, delay: liftMs + travelMs, duration: dropMs, ease: "Cubic.easeIn",
    onComplete: () => {
      if (!alive) return;
      onImpact();
      animate({ targets: flight, y: inkY - 70, alpha: 0, scale: contactScale * 0.9, duration: 220, delay: 60, ease: "Cubic.easeOut" });
      animate({ targets: flightShadow, alpha: 0, duration: 120 });
      animate({ targets: mark, scale: 1, alpha: 1, duration: 120, ease: "Back.easeOut" });
      animate({ targets: form.container, scaleX: 1.008, scaleY: 0.982, duration: 70, yoyo: true, ease: "Sine.easeOut" });
      station.image.setY(stationY - 6).setAlpha(1);
      animate({ targets: station.image, y: stationY, duration: 120, ease: "Cubic.easeOut" });
      // Paper puff: a few dust specks at the impact point.
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + 0.3;
        const speck = scene.add.circle(inkX, inkY, 3, decision.correct ? 0xffffff : 0xf0d9a8, 0.9);
        root.add(speck);
        animate({ targets: speck, x: inkX + Math.cos(angle) * 54, y: inkY + Math.sin(angle) * 26, alpha: 0, scale: 0.4,
          duration: 300, ease: "Cubic.easeOut" });
      }
      if (decision.correct) {
        for (let i = 0; i < 6; i++) {
          const side = i < 3 ? -1 : 1;
          const spark = scene.add.star(inkX + side * 96, inkY + 4 - i % 3 * 8, 4, 2.5, 7, 0xf3c24d).setAlpha(0.9);
          root.add(spark);
          animate({ targets: spark, x: inkX + side * (126 + i % 3 * 16), y: inkY - 14 + i % 3 * 16, alpha: 0, scale: 0.3,
            angle: side * 80, duration: 420, delay: i % 3 * 30, ease: "Cubic.easeOut" });
        }
        if (decision.points > 0) {
          const points = scene.add.text(inkX + 158, inkY - 8, `+${decision.points}`, ethicsTextStyle(30, "#2c8a7c"))
            .setOrigin(0.5).setResolution(3).setAlpha(0).setStroke("#ffffff", 5).setScale(0.7);
          root.add(points);
          animate({ targets: points, y: inkY - 48, alpha: 1, scale: 1, duration: 260, ease: "Back.easeOut" });
          animate({ targets: points, y: inkY - 76, alpha: 0, delay: 620, duration: 240, ease: "Sine.easeIn" });
        }
        if (options.celebrate && options.combo) {
          // Celebrate beside Midi, on the quiet wall between the desk and the lamp.
          const cheerX = ETHICS_LAYOUT.midi.x + 190;
          const cheerY = ETHICS_LAYOUT.midi.feetY - 90;
          const cheer = scene.add.text(cheerX, cheerY, `${options.combo}연속 정확!`, ethicsTextStyle(30, "#d4792e"))
            .setOrigin(0.5).setResolution(3).setAlpha(0).setStroke("#fff6dc", 6).setScale(0.6).setAngle(-6);
          root.add(cheer);
          animate({ targets: cheer, scale: 1, alpha: 1, angle: -4, duration: 220, ease: "Back.easeOut" });
          animate({ targets: cheer, y: cheerY - 28, alpha: 0, delay: 720, duration: 260, ease: "Sine.easeIn" });
        }
      } else {
        // The whole form shivers once so the mistake is felt without a harsh effect.
        animate({ targets: form.container, x: form.container.x + 5, duration: 45, yoyo: true, repeat: 3, ease: "Sine.easeInOut" });
      }
    },
  });
  root.once(Phaser.GameObjects.Events.DESTROY, () => {
    alive = false;
    // Phaser has emptied root.list by this point; own the tweens explicitly.
    for (const tween of ownedTweens) if (!tween.isDestroyed()) tween.destroy();
    flight.destroy();
    flightShadow.destroy();
    if (station.image.scene) station.image.setY(stationY).setAlpha(1);
    if (form.container.scene) form.container.setScale(1);
  });
  return root;
}
