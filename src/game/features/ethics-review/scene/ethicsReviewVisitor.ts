import Phaser from "phaser";
import type { EthicsVisitor } from "../model";
import { drawEthicsBubble } from "./ethicsBubbleShape";
import { ETHICS_DEPTH, ethicsTextStyle, getEthicsVisitorTexture } from "./ethicsReviewOffice";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_VISITOR_MOTION = { enterMs: 300, leaveMs: 240 } as const;

export type EthicsReviewVisitorView = ReturnType<typeof createEthicsReviewVisitor>;

/**
 * The student seen through the service window. They stand in the hallway behind
 * the counter (the booth's front layer covers their lower body), walk in from
 * the left and leave to the right when approved, back to the left when returned.
 */
export function createEthicsReviewVisitor(scene: Phaser.Scene) {
  const spot = ETHICS_LAYOUT.visitor;
  // Origin sits on the character's feet so every cutout shares one floor line.
  // The booth's front layer (frame, sill, counter) hides everything below the
  // window, so the student simply stands behind the counter.
  const footOrigin = spot.canvasFootY / spot.canvasHeight;
  const image = scene.add.image(spot.x, spot.feetY, "__DEFAULT")
    .setOrigin(0.5, footOrigin).setDepth(ETHICS_DEPTH.visitor).setAlpha(0);
  // Kept for the view contract; the counter hides the student's feet.
  const shadow = scene.add.ellipse(spot.x, spot.feetY, 1, 1, 0x000000, 0).setVisible(false);
  const glass = scene.add.graphics().setVisible(false);
  const fit = (textureKey: string) => {
    image.setTexture(textureKey);
    image.setScale(spot.height / spot.canvasHeight);
  };

  const bubbleBox = scene.add.graphics();
  const bubbleText = scene.add.text(0, 0, "", { ...ethicsTextStyle(20, "#315567"), wordWrap: { width: ETHICS_LAYOUT.visitorBubble.maxWidth } })
    .setOrigin(0, 0.5).setResolution(3);
  const bubble = scene.add.container(ETHICS_LAYOUT.visitorBubble.left, ETHICS_LAYOUT.visitorBubble.y, [bubbleBox, bubbleText])
    .setDepth(ETHICS_DEPTH.bubble).setVisible(false);
  let bubbleTimer: Phaser.Time.TimerEvent | undefined;
  let current: EthicsVisitor | undefined;

  const hideBubble = () => {
    bubbleTimer?.remove(false);
    bubbleTimer = undefined;
    scene.tweens.killTweensOf(bubble);
    bubble.setVisible(false);
  };
  const say = (line: string, holdMs = 1_100) => {
    hideBubble();
    bubbleText.setText(line);
    const width = bubbleText.width + 36;
    const height = Math.max(46, bubbleText.height + 18);
    bubbleText.setPosition(18 - width / 2, 0);
    // Grows to the right from a fixed left edge, so short lines stay close to the student.
    bubble.setX(ETHICS_LAYOUT.visitorBubble.left + width / 2);
    // Tail points back toward the window on the left, drawn as one outline with the bubble.
    drawEthicsBubble(bubbleBox, {
      width, height, radius: 15,
      tail: { side: "left", from: -6, to: 8, tip: { x: -width / 2 - 16, y: 6 } },
    }, { fill: 0xffffff, line: 0x6fb0b2 });
    bubble.setVisible(true).setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: bubble, scale: 1, alpha: 1, duration: 170, ease: "Back.easeOut" });
    bubbleTimer = scene.time.delayedCall(holdMs, () => {
      scene.tweens.add({ targets: bubble, alpha: 0, scale: 0.85, duration: 140, ease: "Sine.easeIn",
        onComplete: () => bubble.setVisible(false) });
    });
  };
  const stopMotion = () => scene.tweens.killTweensOf([image, shadow]);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    hideBubble();
    stopMotion();
  });

  return {
    image, shadow, glass, bubble,
    get current() { return current; },
    /** The next student walks in from the hallway and stops at the sill. */
    enter: (visitor: EthicsVisitor) => {
      hideBubble();
      current = visitor;
      stopMotion();
      fit(getEthicsVisitorTexture(visitor.id, "waiting"));
      image.setPosition(spot.x - 110, spot.feetY + 10).setAlpha(0).setAngle(0);
      shadow.setPosition(spot.x - 110, shadow.y).setAlpha(0);
      scene.tweens.add({ targets: [image, shadow], x: spot.x, alpha: 1,
        duration: ETHICS_VISITOR_MOTION.enterMs, ease: "Cubic.easeOut" });
      // A couple of small steps while walking in.
      scene.tweens.add({ targets: image, y: spot.feetY, duration: ETHICS_VISITOR_MOTION.enterMs / 3,
        yoyo: true, repeat: 1, ease: "Sine.easeInOut",
        onComplete: () => image.setY(spot.feetY) });
    },
    /**
     * The student walks on: an approved one passes through to the right, a
     * returned one goes back the way they came, to the left.
     */
    leave: (direction: "left" | "right" = "left") => {
      hideBubble();
      stopMotion();
      const step = direction === "right" ? 120 : -120;
      scene.tweens.add({ targets: [image, shadow], x: spot.x + step, alpha: 0,
        duration: ETHICS_VISITOR_MOTION.leaveMs, ease: "Cubic.easeIn" });
      scene.tweens.add({ targets: image, y: spot.feetY + 8, duration: ETHICS_VISITOR_MOTION.leaveMs / 2,
        yoyo: true, ease: "Sine.easeInOut" });
    },
    /** A happy hop for a correct stamp; a small flinch otherwise. */
    react: (correct: boolean) => {
      stopMotion();
      image.setPosition(spot.x, spot.feetY).setAlpha(1);
      shadow.setPosition(spot.x, shadow.y).setAlpha(1);
      if (current) fit(getEthicsVisitorTexture(current.id, correct ? "happy" : "waiting"));
      scene.tweens.add({
        targets: image, y: correct ? spot.feetY - 18 : spot.feetY + 5, duration: correct ? 130 : 90,
        yoyo: true, repeat: correct ? 1 : 0, ease: correct ? "Sine.easeOut" : "Sine.easeInOut",
        onComplete: () => image.setY(spot.feetY),
      });
      if (!correct) {
        scene.tweens.add({ targets: image, angle: -3, duration: 70, yoyo: true, repeat: 1, ease: "Sine.easeInOut",
          onComplete: () => image.setAngle(0) });
      }
    },
    say,
    hideBubble,
    reset: () => {
      hideBubble();
      current = undefined;
      stopMotion();
      image.setPosition(spot.x, spot.feetY).setAlpha(0).setAngle(0);
      shadow.setAlpha(0);
    },
  };
}
