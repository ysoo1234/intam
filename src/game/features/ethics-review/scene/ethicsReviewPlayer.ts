import Phaser from "phaser";
import { drawEthicsBubble } from "./ethicsBubbleShape";
import { ETHICS_DEPTH, ETHICS_TEXTURES, ethicsTextStyle } from "./ethicsReviewOffice";
import { ETHICS_STAMP_IMPACT_MS, ETHICS_STAMP_MOTION } from "./ethicsReviewEffects";
import { ETHICS_LAYOUT } from "./layout";

type Facing = "front" | "left" | "right" | "happy" | "worried";
// Midi faces the window with its back to us, so every mood uses the back view;
// reactions show through body motion and a small symbol above its head.
const FACING_TEXTURES: Record<Facing, string> = {
  front: ETHICS_TEXTURES.midiBack,
  left: ETHICS_TEXTURES.midiBack,
  right: ETHICS_TEXTURES.midiBack,
  happy: ETHICS_TEXTURES.midiBack,
  worried: ETHICS_TEXTURES.midiBack,
};

export type EthicsReviewPlayer = ReturnType<typeof createEthicsReviewPlayer>;

/** Midi, the clerk, stands at the counter facing the student and reacts to each stamp. */
export function createEthicsReviewPlayer(scene: Phaser.Scene) {
  const spot = ETHICS_LAYOUT.midi;
  const shadow = scene.add.ellipse(0, 4, 118, 18, 0x315567, 0.14);
  const sprite = scene.add.image(0, 0, FACING_TEXTURES.front).setOrigin(0.5, 0.985);
  const baseScale = spot.height / sprite.height;
  sprite.setScale(baseScale);
  shadow.setVisible(false); // The screen edge crops Midi's lower body.
  const container = scene.add.container(spot.x, spot.feetY, [shadow, sprite]).setDepth(ETHICS_DEPTH.midi);
  /**
   * After a stamp: yellow sparkle stars twinkle around Midi's head when the
   * verdict is right, two light-blue sweat drops fly off when it is wrong.
   */
  const head = { x: spot.x, y: spot.feetY - spot.height * 0.78 };
  const emotes = scene.add.container(0, 0).setDepth(ETHICS_DEPTH.bubble);
  const effect = (texture: string, x: number, y: number, size: number) => {
    const image = scene.add.image(x, y, texture);
    image.setScale(size / Math.max(image.width, image.height));
    emotes.add(image);
    return image;
  };
  const popEmote = (correct: boolean) => {
    scene.tweens.killTweensOf(emotes.list);
    emotes.removeAll(true);
    if (correct) {
      const sparkles: [string, number, number, number][] = [
        [ETHICS_TEXTURES.sparkle, -118, 6, 44], [ETHICS_TEXTURES.sparkle, 4, -92, 52], [ETHICS_TEXTURES.sparkleSmall, 112, -30, 34],
      ];
      sparkles.forEach(([texture, dx, dy, size], index) => {
        const star = effect(texture, head.x + dx, head.y + dy, size);
        const full = star.scale;
        star.setScale(0).setAngle(-20);
        scene.tweens.add({ targets: star, scale: full, angle: 0, duration: 240, delay: index * 70, ease: "Back.easeOut" });
        scene.tweens.add({ targets: star, scale: full * 0.8, duration: 260, delay: 320 + index * 70, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
        scene.tweens.add({ targets: star, alpha: 0, duration: 260, delay: 1_250 + index * 70, ease: "Sine.easeIn" });
      });
      return;
    }
    const drops: [string, number, number, number, number][] = [
      [ETHICS_TEXTURES.sweat, 108, -24, 40, 18], [ETHICS_TEXTURES.sweatSmall, 132, 16, 30, 32],
    ];
    drops.forEach(([texture, dx, dy, size, angle], index) => {
      const drop = effect(texture, head.x + dx - 24, head.y + dy + 10, size).setAngle(angle).setAlpha(0);
      const full = drop.scale;
      drop.setScale(full * 0.4);
      scene.tweens.add({ targets: drop, x: head.x + dx, y: head.y + dy, scale: full, alpha: 1,
        duration: 220, delay: index * 90, ease: "Back.easeOut" });
      scene.tweens.add({ targets: drop, y: head.y + dy + 26, alpha: 0, duration: 420, delay: 1_000 + index * 90, ease: "Sine.easeIn" });
    });
  };
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
  const bubble = scene.add.container(ETHICS_LAYOUT.midiBubble.x, ETHICS_LAYOUT.midiBubble.y, [bubbleBox, bubbleText]).setDepth(ETHICS_DEPTH.bubble).setVisible(false);
  const hideBubble = () => {
    scene.tweens.killTweensOf(bubble);
    bubble.setVisible(false);
  };
  const say = (line: string) => {
    hideBubble();
    bubbleText.setText(line);
    const width = bubbleText.width + 44;
    const height = bubbleText.height + 24;
    // Tail down toward Midi's head, which is below and to the left; one outline with the bubble.
    const tailX = Phaser.Math.Clamp(spot.x - ETHICS_LAYOUT.midiBubble.x, -width / 2 + 30, width / 2 - 30);
    drawEthicsBubble(bubbleBox, {
      width, height, radius: 20,
      tail: { side: "bottom", from: tailX - 12, to: tailX + 12, tip: { x: tailX - 6, y: height / 2 + 18 } },
    }, { fill: 0xfff6dc, line: 0xe0b35a });
    bubble.setVisible(true).setAlpha(0).setScale(0.7);
    scene.tweens.add({ targets: bubble, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
  };
  container.once(Phaser.GameObjects.Events.DESTROY, () => {
    // Container children have already been removed when DESTROY is emitted.
    scene.tweens.killTweensOf([container, sprite, shadow, ...emotes.list]);
    emotes.destroy(true);
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
        popEmote(correct);
      });
      const { liftMs, travelMs, dropMs } = ETHICS_STAMP_MOTION;
      scene.tweens.chain({
        targets: sprite,
        tweens: [
          { y: 6, scaleX: baseScale * 1.03, scaleY: baseScale * 0.97, angle: -2, duration: liftMs, ease: "Sine.easeOut" },
          { y: 2, scaleX: baseScale, scaleY: baseScale * 0.985, angle: 0, duration: travelMs, ease: "Sine.easeInOut" },
          // Midi presses down with the stamp: a clear squash as it lands.
          { y: 12, scaleX: baseScale * 1.06, scaleY: baseScale * 0.92, duration: dropMs, ease: "Cubic.easeIn" },
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
