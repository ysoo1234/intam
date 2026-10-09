import Phaser from "phaser";
import { ETHICS_DEPTH, ETHICS_TEXTURES, ethicsTextStyle } from "./ethicsReviewOffice";
import { ETHICS_STAMP_IMPACT_MS, ETHICS_STAMP_MOTION } from "./ethicsReviewEffects";
import { ETHICS_LAYOUT } from "./layout";

type Facing = "front" | "left" | "right" | "happy" | "worried";
const FACING_TEXTURES: Record<Facing, string> = {
  front: ETHICS_TEXTURES.midiFront,
  left: ETHICS_TEXTURES.midiLeft,
  right: ETHICS_TEXTURES.midiRight,
  // Reaction faces after a stamp: glad on a right verdict, troubled on a wrong one.
  happy: ETHICS_TEXTURES.midiHappy,
  worried: ETHICS_TEXTURES.midiWorried,
};

export type EthicsReviewPlayer = ReturnType<typeof createEthicsReviewPlayer>;

/** Midi, the clerk, stands in the aisle behind the desk and reacts to each stamp. */
export function createEthicsReviewPlayer(scene: Phaser.Scene) {
  const spot = ETHICS_LAYOUT.midi;
  const shadow = scene.add.ellipse(0, 4, 118, 18, 0x315567, 0.14);
  const sprite = scene.add.image(0, 0, FACING_TEXTURES.front).setOrigin(0.5, 0.985);
  const baseScale = spot.height / sprite.height;
  sprite.setScale(baseScale);
  const container = scene.add.container(spot.x, spot.feetY, [shadow, sprite]).setDepth(ETHICS_DEPTH.midi);
  let facing: Facing = "front";
  let reacting = false;
  let faceTimer: Phaser.Time.TimerEvent | undefined;
  const face = (next: Facing) => {
    if (next !== facing) {
      facing = next;
      sprite.setTexture(FACING_TEXTURES[next]).setScale(baseScale);
    }
  };
  const clearMotion = () => {
    scene.tweens.killTweensOf([container, sprite, shadow]);
    faceTimer?.remove(false);
    faceTimer = undefined;
    reacting = false;
    face("front");
    sprite.setScale(baseScale).setAngle(0).setY(0);
    shadow.setScale(1).setAlpha(1);
  };
  // Midi explains a mistake in a bubble above the shelves.
  const bubbleBox = scene.add.graphics();
  const bubbleText = scene.add.text(0, 0, "", { ...ethicsTextStyle(21, "#315567"), wordWrap: { width: 440, useAdvancedWrap: true } })
    .setOrigin(0.5).setResolution(3);
  const bubble = scene.add.container(spot.x, 128, [bubbleBox, bubbleText]).setDepth(ETHICS_DEPTH.bubble).setVisible(false);
  const hideBubble = () => {
    scene.tweens.killTweensOf(bubble);
    bubble.setVisible(false);
  };
  const say = (line: string) => {
    hideBubble();
    bubbleText.setText(line);
    const width = bubbleText.width + 44;
    const height = bubbleText.height + 24;
    bubbleBox.clear();
    bubbleBox.fillStyle(0x315567, 0.14).fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 20);
    bubbleBox.fillStyle(0xfff6dc, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 20);
    bubbleBox.lineStyle(2.5, 0xe0b35a, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 20);
    // Tail toward Midi's head below the bubble.
    bubbleBox.fillStyle(0xfff6dc, 1).fillTriangle(-12, height / 2 - 1, 12, height / 2 - 1, 0, height / 2 + 16);
    bubbleBox.lineStyle(2.5, 0xe0b35a, 1).lineBetween(-12, height / 2 - 1, 0, height / 2 + 16);
    bubbleBox.lineBetween(0, height / 2 + 16, 12, height / 2 - 1);
    bubble.setVisible(true).setAlpha(0).setScale(0.7);
    scene.tweens.add({ targets: bubble, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
  };
  container.once(Phaser.GameObjects.Events.DESTROY, () => {
    // Container children have already been removed when DESTROY is emitted.
    scene.tweens.killTweensOf([container, sprite, shadow]);
    faceTimer?.remove(false);
  });
  return {
    container, sprite, bubble, say, hideBubble,
    reset: () => { clearMotion(); hideBubble(); container.setPosition(spot.x, spot.feetY); },
    /** Glance toward the window as the next visitor steps up, then face the desk. */
    greet: () => {
      if (reacting) return;
      faceTimer?.remove(false);
      face("left");
      faceTimer = scene.time.delayedCall(520, () => { if (!reacting) face("front"); });
    },
    react: (correct: boolean) => {
      clearMotion();
      reacting = true;
      // The face changes as the stamp lands and stays until the next visitor.
      faceTimer = scene.time.delayedCall(ETHICS_STAMP_IMPACT_MS, () => {
        face(correct ? "happy" : "worried");
      });
      const { liftMs, travelMs, dropMs } = ETHICS_STAMP_MOTION;
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          { y: 6, scaleX: baseScale * 1.03, scaleY: baseScale * 0.97, angle: -2, duration: liftMs, ease: "Sine.easeOut" },
          { y: 2, scaleX: baseScale, scaleY: baseScale * 0.985, angle: 0, duration: travelMs, ease: "Sine.easeInOut" },
          { y: 8, scaleX: baseScale * 1.04, scaleY: baseScale * 0.95, duration: dropMs, ease: "Cubic.easeIn" },
          { y: correct ? -26 : -2, scaleX: baseScale * 0.98, scaleY: baseScale * 1.02,
            angle: correct ? -4 : 4, duration: 120, ease: "Cubic.easeOut" },
          { y: 2, scaleX: baseScale * 1.02, scaleY: baseScale * 0.98, angle: correct ? 0 : -3, duration: 150, ease: "Sine.easeIn" },
          { y: 0, scaleX: baseScale, scaleY: baseScale, angle: 0, duration: 110, ease: "Sine.easeOut" },
        ],
        onComplete: () => { reacting = false; },
      });
      scene.tweens.chain({
        targets: shadow,
        tweens: [
          { scaleX: 1.04, scaleY: 1, duration: liftMs + travelMs + dropMs },
          { scaleX: correct ? 0.78 : 0.94, alpha: correct ? 0.7 : 0.9, duration: 120, ease: "Sine.easeOut" },
          { scaleX: 1, alpha: 1, duration: 260, ease: "Sine.easeInOut" },
        ],
      });
    },
    update: () => {
      if (reacting) return;
      // A quiet breathing bob while Midi waits for the next verdict.
      const bob = Math.sin(scene.time.now / 460);
      sprite.y = -Math.abs(bob) * 2.5;
      sprite.setScale(baseScale * (1 + bob * 0.004), baseScale * (1 - bob * 0.004));
    },
  };
}
