import Phaser from "phaser";
import type { EthicsVisitor } from "../model";
import { ETHICS_DEPTH, ethicsTextStyle, getEthicsVisitorTexture } from "./ethicsReviewOffice";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_VISITOR_MOTION = { enterMs: 300, leaveMs: 240 } as const;

export type EthicsReviewVisitorView = ReturnType<typeof createEthicsReviewVisitor>;

/**
 * The student seen through the service window. Workshop customer cutouts stand
 * full-body in the painted corridor; the arched mask crops them at the sill, so
 * they can walk in from the hallway on the left and leave the same way.
 */
export function createEthicsReviewVisitor(scene: Phaser.Scene) {
  const window = ETHICS_LAYOUT.window;
  const spot = ETHICS_LAYOUT.visitor;
  // Phaser 4 WebGL clips through a mask filter; Canvas keeps the geometry mask.
  const shape = scene.make.graphics({ x: 0, y: 0 });
  shape.fillStyle(0xffffff, 1);
  shape.fillRoundedRect(window.x, window.y, window.width, window.height, {
    tl: window.archRadius, tr: window.archRadius, bl: 6, br: 6,
  });
  const clipToWindow = (target: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | Phaser.GameObjects.Ellipse) => {
    if (scene.game.renderer.type === Phaser.CANVAS) {
      target.setMask(shape.createGeometryMask());
      return;
    }
    target.enableFilters();
    target.filters?.external.addMask(shape, false, scene.cameras.main, "world");
  };
  // Origin sits on the character's feet so every cutout shares one floor line.
  const footOrigin = spot.canvasFootY / spot.canvasHeight;
  const image = scene.add.image(spot.x, spot.feetY, "__DEFAULT")
    .setOrigin(0.5, footOrigin).setDepth(ETHICS_DEPTH.visitor).setAlpha(0);
  const shadow = scene.add.ellipse(spot.x, window.y + window.height - 6, 150, 18, 0x2f4f55, 0.16)
    .setDepth(ETHICS_DEPTH.visitor - 1).setAlpha(0);
  clipToWindow(image);
  clipToWindow(shadow);
  const fit = (textureKey: string) => {
    image.setTexture(textureKey);
    image.setScale(spot.height / spot.canvasHeight);
  };
  // A faint glass highlight keeps the student reading as "behind the window".
  const glass = scene.add.graphics().setDepth(ETHICS_DEPTH.visitor + 1);
  clipToWindow(glass);
  glass.fillStyle(0xffffff, 0.14);
  glass.fillTriangle(window.x + 20, window.y, window.x + 150, window.y, window.x + 40, window.y + window.height);

  const bubbleBox = scene.add.graphics();
  const bubbleText = scene.add.text(0, 0, "", { ...ethicsTextStyle(20, "#315567"), wordWrap: { width: ETHICS_LAYOUT.visitorBubble.maxWidth } })
    .setOrigin(0, 0.5).setResolution(3);
  const bubble = scene.add.container(ETHICS_LAYOUT.visitorBubble.x, ETHICS_LAYOUT.visitorBubble.y, [bubbleBox, bubbleText])
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
    bubbleBox.clear();
    bubbleBox.fillStyle(0x315567, 0.14).fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 18);
    bubbleBox.fillStyle(0xffffff, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bubbleBox.lineStyle(2.5, 0x6fb0b2, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    // Tail points back toward the window on the left.
    bubbleBox.fillStyle(0xffffff, 1).fillTriangle(-width / 2 + 1, -8, -width / 2 + 1, 12, -width / 2 - 16, 6);
    bubbleBox.lineStyle(2.5, 0x6fb0b2, 1).lineBetween(-width / 2 + 1, -8, -width / 2 - 16, 6);
    bubbleBox.lineBetween(-width / 2 - 16, 6, -width / 2 + 1, 12);
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
    shape.destroy();
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
    /** The student leaves toward the hallway on the left. */
    leave: () => {
      hideBubble();
      stopMotion();
      scene.tweens.add({ targets: [image, shadow], x: spot.x - 120, alpha: 0,
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
