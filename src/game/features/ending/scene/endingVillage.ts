import Phaser from "phaser";
import {
  WORLD_ACTIVITY_IDS,
  type WorldActivityId,
  type WorldProgressSnapshot,
} from "../../../core/navigation/worldProgress";
import type { VillageLandmarks, VillagePreview } from "../../../core/scenes/villagePreview";
import { ENDING_DEPTH } from "./endingLayout";
import { arcPoint, burstLight, ENDING_LIGHT } from "./endingLights";

export const ENDING_VILLAGE_TEXTURES = {
  live: "ending-village-live",
  /** Saved village snapshot, when the live painting is not possible. */
  snapshot: "ending-village-snapshot",
  star: "ending-star",
} as const;

// Each building's light keeps a hint of its own colour.
const ACTIVITY_TINT: Readonly<Record<WorldActivityId, number>> = {
  "ai-workshop": 0xffc9a8,
  "data-flight": 0xbfe6ff,
  "ethics-review": 0xfff0a8,
};
const STAR_SIZE = 40;
/**
 * The gathered stars circle on a flat ring above the fountain (`dy` from the
 * top tier's landmark), clear of the fountain itself.
 */
const HALO = { rx: 118, ry: 26, dy: -104 } as const;
/** Where the stars are drawn into the fountain: the orb on its top. */
const FOUNTAIN_HEART_DY = -40;
/** Drawn roof-star slots (villageProgressPresentation): 38 px apart, middle one raised. */
const ROOF_SLOT_GAP = 38;
const ROOF_SLOT_YS = [5, -6, 5] as const;
/** The far half of the ring reads as "behind" by being smaller and a little faded. */
const HALO_FRONT_DEPTH = ENDING_DEPTH.stars + 0.3;
const HALO_BACK_DEPTH = ENDING_DEPTH.stars + 0.1;
/** The village waits a little dim until the stars bring its light back. */
const VILLAGE_DIM = { color: 0x1d2a5c, alpha: 0.34 } as const;

type Point = Readonly<{ x: number; y: number }>;

export type EndingVillage = ReturnType<typeof createEndingVillage>;

/**
 * The village behind the ending: the real village painted from its own
 * layout, a dimming veil, and the earned stars that wake up at the gate,
 * light their buildings and gather into one big star over the fountain.
 */
export function createEndingVillage(
  scene: Phaser.Scene,
  options: Readonly<{
    preview?: VillagePreview;
    renderScale: number;
    progress: WorldProgressSnapshot;
    calm: boolean;
  }>,
) {
  const motion = (ms: number) => (options.calm ? 0 : ms);
  const painted = options.preview?.paint(scene, ENDING_VILLAGE_TEXTURES.live, options.renderScale, true) ?? false;
  scene.add
    .image(640, 360, painted ? ENDING_VILLAGE_TEXTURES.live : ENDING_VILLAGE_TEXTURES.snapshot)
    .setDisplaySize(1280, 720)
    .setDepth(ENDING_DEPTH.village);
  // The gate's portal keeps turning in the ending too (the painted village is still).
  if (painted) options.preview?.addLivePortal?.(scene, ENDING_DEPTH.village + 0.1);
  const veil = scene.add
    .rectangle(640, 360, 1280, 720, VILLAGE_DIM.color, 0)
    .setDepth(ENDING_DEPTH.dim);
  const landmarks: VillageLandmarks | undefined = options.preview?.landmarks;
  const fallbackSpot = (index: number): Point => ({ x: 300 + index * 340, y: 260 });
  const activitySpot = (id: WorldActivityId) =>
    landmarks?.activities[id] ?? { center: fallbackSpot(WORLD_ACTIVITY_IDS.indexOf(id)), stars: fallbackSpot(WORLD_ACTIVITY_IDS.indexOf(id)) };
  const fountainTop = landmarks?.fountainTop ?? { x: 640, y: 250 };
  const gate = landmarks?.gate ?? { center: { x: 990, y: 180 }, screen: { x: 1_030, y: 180 }, counter: { x: 990, y: 300 } };

  const stars: {
    image: Phaser.GameObjects.Image;
    glow: Phaser.GameObjects.Image;
    activity: WorldActivityId;
    baseScale: number;
  }[] = [];
  let orbitEvent: Phaser.Time.TimerEvent | undefined;
  const buildingLights: Phaser.GameObjects.Image[] = [];
  let bigStar: Phaser.GameObjects.Container | undefined;
  /** Set when the story is skipped: late timers must not light anything again. */
  let settled = false;
  /** Star flights still in the air (stopped on a skip). */
  const flights: Phaser.Tweens.Tween[] = [];

  const makeStar = (activity: WorldActivityId, at: Point) => {
    const glow = scene.add
      .image(at.x, at.y, ENDING_LIGHT.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(ACTIVITY_TINT[activity])
      .setScale(0.32)
      .setAlpha(0.85)
      .setDepth(ENDING_DEPTH.stars);
    const image = scene.add
      .image(at.x, at.y, ENDING_VILLAGE_TEXTURES.star)
      .setDisplaySize(STAR_SIZE, STAR_SIZE)
      .setDepth(ENDING_DEPTH.stars + 0.1);
    return { image, glow, activity, baseScale: image.scaleX };
  };
  /** Halo spot for star `index` of `count` at phase `angle`, with its 3D depth and size. */
  const placeOnHalo = (star: (typeof stars)[number], around: Point, angle: number) => {
    const sin = Math.sin(angle);
    placeStar(star, { x: around.x + Math.cos(angle) * HALO.rx, y: around.y + sin * HALO.ry });
    const front = sin > 0;
    star.image.setDepth(front ? HALO_FRONT_DEPTH : HALO_BACK_DEPTH);
    star.glow.setDepth((front ? HALO_FRONT_DEPTH : HALO_BACK_DEPTH) - 0.01);
    const near = (sin + 1) / 2;
    const size = 0.72 + near * 0.42;
    star.image.setScale(star.baseScale * size).setAlpha(0.7 + near * 0.3);
    star.glow.setScale(0.32 * size);
  };
  const placeStar = (star: (typeof stars)[number], point: Point) => {
    star.image.setPosition(point.x, point.y);
    star.glow.setPosition(point.x, point.y);
  };

  // The earned stars sit on their roofs from the start (the painted roofs
  // underneath have no stars), ready to fly off to the fountain.
  for (const activity of WORLD_ACTIVITY_IDS) {
    const home = activitySpot(activity).stars;
    for (let slot = 0; slot < options.progress[activity]; slot += 1) {
      const star = makeStar(activity, { x: home.x + (slot - 1) * ROOF_SLOT_GAP, y: home.y + (ROOF_SLOT_YS[slot] ?? 0) });
      star.glow.setAlpha(0);
      stars.push(star);
    }
  }

  const lightBuilding = (activity: WorldActivityId, instant: boolean) => {
    const { center } = activitySpot(activity);
    const light = scene.add
      .image(center.x, center.y, ENDING_LIGHT.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(ACTIVITY_TINT[activity])
      .setScale(1.25)
      .setAlpha(0)
      .setDepth(ENDING_DEPTH.glow);
    buildingLights.push(light);
    scene.tweens.add({
      targets: light, alpha: 0.5, duration: instant ? 0 : motion(420), ease: "Sine.easeOut",
      onComplete: () => {
        if (options.calm || !light.active) return;
        scene.tweens.add({ targets: light, alpha: 0.36, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      },
    });
  };

  return {
    /** The middle of the ring the woken stars circle on, around the fountain. */
    fountainRing: { x: fountainTop.x, y: fountainTop.y + HALO.dy } as Point,

    dimTo(alpha: number, duration: number) {
      scene.tweens.killTweensOf(veil);
      scene.tweens.add({ targets: veil, fillAlpha: alpha, duration: motion(duration) });
    },

    /**
     * The stars already sit on their buildings' roofs (the painted roofs are
     * empty underneath). One by one they shine (each building glows with its
     * first), then they all rise and fly to the ring above the fountain.
     */
    wakeStars(around: Point) {
      return new Promise<void>((resolve) => {
        const list = [...stars];
        if (list.length === 0) {
          resolve();
          return;
        }
        const order = WORLD_ACTIVITY_IDS.filter((activity) => options.progress[activity] > 0);
        list.forEach((star, index) => {
          const { activity } = star;
          const slot = list.slice(0, index).filter((other) => other.activity === activity).length;
          const roof = { x: star.image.x, y: star.image.y };
          const delay = motion(170 * index);
          scene.tweens.add({
            targets: star.image, scale: star.baseScale * 1.35, delay, duration: motion(160), yoyo: true, ease: "Sine.easeOut",
          });
          scene.tweens.add({ targets: star.glow, alpha: 0.85, delay, duration: motion(260) });
          scene.time.delayedCall(delay, () => {
            if (settled) return;
            burstLight(scene, roof.x, roof.y, {
              depth: ENDING_DEPTH.light, count: 8, calm: options.calm, tint: [0xffffff, ACTIVITY_TINT[activity]],
            });
            // The building glows with its first star; the village brightens a little.
            if (slot === 0) {
              lightBuilding(activity, false);
              const lit = order.indexOf(activity) + 1;
              scene.tweens.killTweensOf(veil);
              scene.tweens.add({
                targets: veil, fillAlpha: VILLAGE_DIM.alpha * (1 - (lit / order.length) * 0.5), duration: motion(400),
              });
            }
          });
          // Then every star sets off together for the ring above the fountain.
          const angle = (Math.PI * 2 * index) / list.length;
          const target = { x: around.x + Math.cos(angle) * HALO.rx, y: around.y + Math.sin(angle) * HALO.ry };
          const flight = { t: 0 };
          flights.push(scene.tweens.add({
            targets: flight, t: 1, delay: motion(170 * list.length + 500 + index * 70), duration: motion(900), ease: "Sine.easeInOut",
            onStart: () => {
              star.image.setDepth(ENDING_DEPTH.light);
              star.glow.setDepth(ENDING_DEPTH.light - 0.01);
            },
            onUpdate: () => placeStar(star, arcPoint(roof, target, 110, flight.t)),
            onComplete: () => {
              placeOnHalo(star, around, angle);
              if (index === list.length - 1) resolve();
            },
          }));
        });
      });
    },

    /** The woken stars circle slowly around `around` until they set off. */
    orbit(around: Point) {
      orbitEvent?.remove(false);
      if (options.calm || stars.length === 0) return;
      let phase = 0;
      orbitEvent = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          phase += 0.012;
          stars.forEach((star, index) => {
            placeOnHalo(star, around, phase + (Math.PI * 2 * index) / stars.length);
          });
        },
      });
    },

    /**
     * The circling stars are drawn straight into the fountain's orb, all
     * together, and come back out as one big star over the fountain.
     */
    gatherAtFountain(golden: boolean) {
      orbitEvent?.remove(false);
      orbitEvent = undefined;
      return new Promise<void>((resolve) => {
        const heart = { x: fountainTop.x, y: fountainTop.y + FOUNTAIN_HEART_DY };
        const count = stars.length;
        const finish = () => {
          if (settled) return;
          bigStar = this.showBigStar(golden, false);
          scene.tweens.killTweensOf(veil);
          scene.tweens.add({ targets: veil, fillAlpha: 0, duration: motion(600) });
          burstLight(scene, heart.x, heart.y - 6, { depth: ENDING_DEPTH.light, count: 34, speed: 320, calm: options.calm });
          if (!options.calm) scene.cameras.main.shake(140, 0.003);
          scene.time.delayedCall(motion(500), resolve);
        };
        if (count === 0) {
          finish();
          return;
        }
        stars.forEach((star, index) => {
          // Straight in, all together: each star shrinks into a dot of light
          // as it is drawn into the orb.
          const from = { x: star.image.x, y: star.image.y };
          const fromScale = star.image.scaleX;
          const pull = { t: 0 };
          flights.push(scene.tweens.add({
            targets: pull, t: 1, delay: motion(index * 40), duration: motion(700), ease: "Cubic.easeIn",
            onUpdate: () => {
              const k = pull.t;
              placeStar(star, { x: from.x + (heart.x - from.x) * k, y: from.y + (heart.y - from.y) * k });
              star.image.setScale(fromScale * (1 - k * 0.85)).setAlpha(1 - k * 0.6);
              star.glow.setScale(0.32 * (1 + k * 0.4));
            },
            onComplete: () => {
              star.image.destroy();
              star.glow.destroy();
              burstLight(scene, heart.x, heart.y, {
                depth: ENDING_DEPTH.light, count: 5, speed: 120, calm: options.calm, tint: [0xffffff, ACTIVITY_TINT[star.activity]],
              });
              if (index === count - 1) {
                stars.length = 0;
                scene.time.delayedCall(motion(180), finish);
              }
            },
          }));
        });
      });
    },

    showBigStar(golden: boolean, instant: boolean) {
      bigStar?.destroy(true);
      const glow = scene.add
        .image(0, 0, ENDING_LIGHT.glow)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(golden ? 0xffd75e : 0xfff4c4)
        .setScale(golden ? 1.25 : 1);
      const star = scene.add.image(0, 0, ENDING_VILLAGE_TEXTURES.star).setDisplaySize(96, 96);
      const sparkle = scene.add
        .image(0, 0, ENDING_LIGHT.sparkle)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.6);
      const container = scene.add
        .container(fountainTop.x, fountainTop.y - 46, [glow, star, sparkle])
        .setDepth(ENDING_DEPTH.light)
        .setScale(instant ? 1 : 0);
      if (!instant) scene.tweens.add({ targets: container, scale: 1, duration: motion(420), ease: "Back.easeOut" });
      if (!options.calm) {
        scene.tweens.add({ targets: sparkle, angle: 90, duration: 2_600, repeat: -1 });
        scene.tweens.add({ targets: container, y: container.y - 8, duration: 1_200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      bigStar = container;
      return container;
    },

    /** The big star flies into the gate's screen (the door opens from there). */
    sendBigStarToGate() {
      return new Promise<Point>((resolve) => {
        const star = bigStar;
        if (!star) {
          resolve(gate.screen);
          return;
        }
        scene.tweens.killTweensOf(star);
        const from = { x: star.x, y: star.y };
        const flight = { t: 0 };
        scene.tweens.add({
          targets: flight, t: 1, duration: motion(800), ease: "Sine.easeIn",
          onUpdate: () => {
            const point = arcPoint(from, gate.screen, 80, flight.t);
            star.setPosition(point.x, point.y).setScale(1 - flight.t * 0.6);
          },
          onComplete: () => {
            star.destroy(true);
            bigStar = undefined;
            burstLight(scene, gate.screen.x, gate.screen.y, { depth: ENDING_DEPTH.light, count: 26, speed: 260, calm: options.calm });
            resolve(gate.screen);
          },
        });
      });
    },

    /** Skipping ahead: every building lit, no stars in the air. */
    settleLit() {
      settled = true;
      flights.forEach((tween) => tween.stop());
      flights.length = 0;
      orbitEvent?.remove(false);
      orbitEvent = undefined;
      for (const star of stars) {
        scene.tweens.killTweensOf([star.image, star.glow]);

        star.image.destroy();
        star.glow.destroy();
      }
      stars.length = 0;
      bigStar?.destroy(true);
      bigStar = undefined;
      if (buildingLights.length === 0) {
        WORLD_ACTIVITY_IDS.filter((activity) => options.progress[activity] > 0)
          .forEach((activity) => lightBuilding(activity, true));
      }
    },

    veil,
  };
}
