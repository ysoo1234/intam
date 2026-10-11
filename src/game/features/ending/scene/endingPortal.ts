import Phaser from "phaser";
import {
  ENDING_CUSTOMER_FEET,
  ENDING_CUSTOMER_SPOTS,
  ENDING_DEPTH,
  ENDING_LIBRARY_VIEW,
  ENDING_PORTAL,
  ENDING_PORTAL_FRAME,
} from "./endingLayout";
import { burstLight, ENDING_LIGHT } from "./endingLights";

export const ENDING_PORTAL_TEXTURES = {
  library: "ending-library",
  frame: "ending-portal-frame",
} as const;
export const endingCustomerTexture = (index: number) => `ending-customer-${index}`;

export type EndingPortal = ReturnType<typeof createEndingPortal>;

/**
 * The door home: the intro's glowing ring opening over the village onto the
 * school library where the adventure began (textbook prologue), the workshop
 * customers who come to wave goodbye, and the final rush through the door.
 */
export function createEndingPortal(scene: Phaser.Scene, options: Readonly<{ calm: boolean; customers: number }>) {
  const motion = (ms: number) => (options.calm ? 0 : ms);
  const maskShape = scene.make.graphics({ x: ENDING_PORTAL.x, y: ENDING_PORTAL.y });
  maskShape.fillStyle(0xffffff, 1).fillEllipse(0, 0, ENDING_PORTAL.width, ENDING_PORTAL.height);
  maskShape.setScale(0);
  const library = scene.add
    .image(ENDING_PORTAL.x, ENDING_PORTAL.y, ENDING_PORTAL_TEXTURES.library)
    .setDisplaySize(ENDING_LIBRARY_VIEW.width, ENDING_LIBRARY_VIEW.height)
    .setDepth(ENDING_DEPTH.portal)
    .setVisible(false);
  const libraryScale = library.scaleX;
  if (scene.game.renderer.type === Phaser.CANVAS) {
    library.setMask(maskShape.createGeometryMask());
  } else {
    library.enableFilters();
    library.filters?.external.addMask(maskShape, false, scene.cameras.main, "world");
  }
  const ring = scene.add
    .image(ENDING_PORTAL.x, ENDING_PORTAL.y, ENDING_PORTAL_TEXTURES.frame)
    .setOrigin(ENDING_PORTAL_FRAME.originX, ENDING_PORTAL_FRAME.originY)
    .setDepth(ENDING_DEPTH.ring)
    .setVisible(false);
  const ringScale = ENDING_PORTAL.width / ENDING_PORTAL_FRAME.ringWidth;
  ring.setScale(0);
  const rimMotes = scene.add.particles(ENDING_PORTAL.x, ENDING_PORTAL.y, ENDING_LIGHT.dot, {
    emitting: false,
    blendMode: Phaser.BlendModes.ADD,
    lifespan: { min: 700, max: 1_300 },
    speed: { min: 4, max: 18 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.95, end: 0 },
    tint: [0xffffff, 0xbdeeff, 0xd9ccff],
    frequency: 60,
    quantity: 1,
    emitZone: {
      type: "edge",
      source: new Phaser.Geom.Ellipse(0, 0, ENDING_PORTAL.width, ENDING_PORTAL.height),
      quantity: 90,
    },
  }).setDepth(ENDING_DEPTH.light);

  const customers = ENDING_CUSTOMER_SPOTS.slice(0, options.customers).map((spot, index) => {
    const image = scene.add
      .image(0, 0, endingCustomerTexture(index))
      .setOrigin(ENDING_CUSTOMER_FEET.x, ENDING_CUSTOMER_FEET.y);
    // `height` is feet-to-head, which is the canvas's feet fraction of its height.
    image.setScale(spot.height / (image.height * ENDING_CUSTOMER_FEET.y));
    // The two on the right face the door too.
    if (spot.x > ENDING_PORTAL.x) image.setFlipX(true);
    const shadow = scene.add.ellipse(0, 2, spot.height * 0.42, 14, 0x2b3f86, 0.2);
    const offscreen = spot.x < ENDING_PORTAL.x ? -160 : 1_440;
    const container = scene.add
      .container(offscreen, spot.y, [shadow, image])
      .setDepth(ENDING_DEPTH.customers + spot.y / 1_000)
      .setVisible(false);
    return { container, image, spot };
  });

  let opened = false;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => maskShape.destroy());

  return {
    /** The door grows open over the village (from the gate's screen when given). */
    open(instant = false) {
      if (opened) return Promise.resolve();
      opened = true;
      const ms = instant ? 0 : motion(820);
      library.setVisible(true).setScale(libraryScale * 1.15);
      ring.setVisible(true);
      scene.tweens.add({ targets: maskShape, scale: 1, duration: ms, ease: "Cubic.easeOut" });
      scene.tweens.add({ targets: ring, scale: ringScale, duration: ms, ease: "Cubic.easeOut" });
      scene.tweens.add({ targets: library, scale: libraryScale, duration: instant ? 0 : motion(1_500), ease: "Sine.easeOut" });
      if (!options.calm) {
        scene.time.delayedCall(ms, () => rimMotes.start());
        scene.tweens.add({ targets: ring, alpha: { from: 1, to: 0.86 }, delay: ms, duration: 1_100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      if (!instant) {
        const flash = scene.add.rectangle(640, 360, 1280, 720, 0xffffff, 0).setDepth(ENDING_DEPTH.flash);
        scene.tweens.add({
          targets: flash, fillAlpha: 0.85, duration: motion(140), yoyo: true, hold: motion(80),
          onComplete: () => flash.destroy(),
        });
        burstLight(scene, ENDING_PORTAL.x, ENDING_PORTAL.y, {
          depth: ENDING_DEPTH.light, count: 46, speed: 520, calm: options.calm, tint: [0xffffff, 0xbdeeff, 0xfff2a8],
        });
      }
      return new Promise<void>((resolve) => scene.time.delayedCall(ms, resolve));
    },

    /** Customers walk in from both sides and wave. */
    welcomeCustomers(instant = false) {
      customers.forEach(({ container, image, spot }, index) => {
        container.setVisible(true);
        scene.tweens.killTweensOf(container);
        if (instant || options.calm) {
          container.setX(spot.x);
        } else {
          scene.tweens.add({
            targets: container, x: spot.x, delay: index * 120, duration: 900, ease: "Sine.easeOut",
          });
          // A little hop in their step while walking.
          scene.tweens.add({ targets: image, y: -8, delay: index * 120, duration: 150, yoyo: true, repeat: 2, ease: "Sine.easeOut" });
        }
        if (!options.calm) {
          scene.tweens.add({
            targets: image, angle: { from: -4, to: 4 }, delay: index * 120 + 1_000,
            duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
          });
        }
      });
    },

    /** Everyone jumps for joy (after the promise). */
    cheer() {
      if (options.calm) return;
      customers.forEach(({ container, spot }, index) => {
        scene.tweens.add({
          targets: container, y: spot.y - 26, delay: index * 70, duration: 180, yoyo: true, repeat: 1, ease: "Sine.easeOut",
        });
      });
      burstLight(scene, ENDING_PORTAL.x, ENDING_PORTAL.y + 120, {
        depth: ENDING_DEPTH.light, count: 40, speed: 420, calm: options.calm, tint: [0xffd36b, 0x8ad7ff, 0xff9ad6, 0x8af0c4],
      });
    },

    /** The rush through the door: the library fills the screen, then white. */
    rushThrough() {
      return new Promise<Phaser.GameObjects.Rectangle>((resolve) => {
        rimMotes.stop();
        scene.tweens.killTweensOf(ring);
        const duration = motion(1_100);
        const grow = 4.2;
        scene.tweens.add({ targets: maskShape, scale: grow * 1.3, duration, ease: "Cubic.easeIn" });
        scene.tweens.add({ targets: ring, scale: ringScale * grow * 1.3, alpha: 0, duration, ease: "Cubic.easeIn" });
        scene.tweens.add({ targets: library, scale: libraryScale * grow, duration, ease: "Cubic.easeIn" });
        for (const { container } of customers) {
          scene.tweens.killTweensOf(container);
          scene.tweens.add({ targets: container, alpha: 0, duration: motion(400) });
        }
        if (!options.calm) {
          const streaks = scene.add.particles(640, 300, ENDING_LIGHT.dot, {
            blendMode: Phaser.BlendModes.ADD,
            lifespan: 700,
            speed: { min: 380, max: 900 },
            scale: { start: 0.2, end: 0.9 },
            alpha: { start: 0.9, end: 0 },
            frequency: 12,
            quantity: 3,
          }).setDepth(ENDING_DEPTH.flash - 1);
          scene.time.delayedCall(duration, () => streaks.destroy());
        }
        const white = scene.add.rectangle(640, 360, 1280, 720, 0xffffff, 0).setDepth(ENDING_DEPTH.flash);
        scene.tweens.add({
          targets: white, fillAlpha: 1, delay: duration * 0.55, duration: motion(500), ease: "Sine.easeIn",
          onComplete: () => resolve(white),
        });
      });
    },
  };
}
