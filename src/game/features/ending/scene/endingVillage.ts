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
/** The woken stars circle over Midi's head like a little crown. */
const HALO = { rx: 84, ry: 26 } as const;
/** Drawn roof-star slots (villageProgressPresentation): 38 px apart, middle one raised. */
const ROOF_SLOT_GAP = 38;
const ROOF_SLOT_YS = [5, -6, 5] as const;
/** In front of Midi on the lower half of the halo, behind her on the upper half. */
const HALO_FRONT_DEPTH = ENDING_DEPTH.narrator + 0.5;
const HALO_BACK_DEPTH = ENDING_DEPTH.narrator - 0.5;
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
  const painted = options.preview?.paint(scene, ENDING_VILLAGE_TEXTURES.live, options.renderScale) ?? false;
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
    const size = 0.82 + ((sin + 1) / 2) * 0.3;
    star.image.setScale(star.baseScale * size);
    star.glow.setScale(0.32 * size);
  };
  const placeStar = (star: (typeof stars)[number], point: Point) => {
    star.image.setPosition(point.x, point.y);
    star.glow.setPosition(point.x, point.y);
  };

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
    dimTo(alpha: number, duration: number) {
      scene.tweens.killTweensOf(veil);
      scene.tweens.add({ targets: veil, fillAlpha: alpha, duration: motion(duration) });
    },

    /** The stars pop out of the gate's counter one by one and fly to `around`. */
    wakeStars(around: Point) {
      return new Promise<void>((resolve) => {
        const list = WORLD_ACTIVITY_IDS.flatMap((activity) =>
          Array.from({ length: options.progress[activity] }, () => activity));
        if (list.length === 0) {
          resolve();
          return;
        }
        list.forEach((activity, index) => {
          const star = makeStar(activity, gate.counter);
          stars.push(star);
          star.image.setScale(0);
          star.glow.setAlpha(0);
          const delay = motion(120 * index);
          scene.tweens.add({
            targets: star.image, scale: STAR_SIZE / star.image.width, delay, duration: motion(220), ease: "Back.easeOut",
          });
          scene.tweens.add({ targets: star.glow, alpha: 0.85, delay, duration: motion(220) });
          scene.time.delayedCall(delay, () => burstLight(scene, gate.counter.x, gate.counter.y, {
            depth: ENDING_DEPTH.light, count: 8, calm: options.calm, tint: [0xffffff, ACTIVITY_TINT[activity]],
          }));
          const angle = (Math.PI * 2 * index) / list.length;
          const target = { x: around.x + Math.cos(angle) * HALO.rx, y: around.y + Math.sin(angle) * HALO.ry };
          const flight = { t: 0 };
          star.image.setDepth(ENDING_DEPTH.light);
          star.glow.setDepth(ENDING_DEPTH.light - 0.01);
          flights.push(scene.tweens.add({
            targets: flight, t: 1, delay: delay + motion(260), duration: motion(760), ease: "Sine.easeInOut",
            onUpdate: () => placeStar(star, arcPoint(gate.counter, target, 120, flight.t)),
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

    /** Each building's stars fly home and light it; the veil lifts a little each time. */
    lightBuildings() {
      orbitEvent?.remove(false);
      orbitEvent = undefined;
      return new Promise<void>((resolve) => {
        const order = WORLD_ACTIVITY_IDS.filter((activity) => options.progress[activity] > 0);
        if (order.length === 0) {
          resolve();
          return;
        }
        order.forEach((activity, buildingIndex) => {
          const group = stars.filter((star) => star.activity === activity);
          const home = activitySpot(activity).stars;
          const delay = motion(900 * buildingIndex);
          group.forEach((star, index) => {
            const from = { x: star.image.x, y: star.image.y };
            // Exactly onto the drawn roof-star slot it fills (left to right).
            const target = {
              x: home.x + (index - 1) * ROOF_SLOT_GAP,
              y: home.y + (ROOF_SLOT_YS[index] ?? 0),
            };
            const flight = { t: 0 };
            scene.tweens.killTweensOf(star.image);
            star.image.setDepth(ENDING_DEPTH.light).setScale(star.baseScale);
            star.glow.setDepth(ENDING_DEPTH.light - 0.01).setScale(0.32);
            flights.push(scene.tweens.add({
              targets: flight, t: 1, delay: delay + motion(index * 90), duration: motion(820), ease: "Sine.easeInOut",
              onUpdate: () => placeStar(star, arcPoint(from, target, 140, flight.t)),
              onComplete: () => {
                placeStar(star, target);
                scene.tweens.add({ targets: [star.image, star.glow], alpha: 0, duration: motion(260) });
              },
            }));
          });
          scene.time.delayedCall(delay + motion(820 + (group.length - 1) * 90), () => {
            if (settled) return;
            burstLight(scene, home.x, home.y, {
              depth: ENDING_DEPTH.light, count: 18, speed: 200, calm: options.calm, tint: [0xffffff, ACTIVITY_TINT[activity]],
            });
            lightBuilding(activity, false);
            const left = order.length - buildingIndex - 1;
            scene.tweens.killTweensOf(veil);
            scene.tweens.add({ targets: veil, fillAlpha: VILLAGE_DIM.alpha * (left / order.length) * 0.8, duration: motion(500) });
            if (buildingIndex === order.length - 1) scene.time.delayedCall(motion(400), resolve);
          });
        });
      });
    },

    /** Light rises from every building and gathers into a big star over the fountain. */
    gatherAtFountain(golden: boolean) {
      return new Promise<void>((resolve) => {
        const orbs = WORLD_ACTIVITY_IDS.filter((activity) => options.progress[activity] > 0);
        orbs.forEach((activity, index) => {
          const from = activitySpot(activity).stars;
          const orb = scene.add
            .image(from.x, from.y, ENDING_LIGHT.glow)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(ACTIVITY_TINT[activity])
            .setScale(0.4)
            .setDepth(ENDING_DEPTH.light);
          const flight = { t: 0 };
          flights.push(scene.tweens.add({
            targets: flight, t: 1, delay: motion(index * 120), duration: motion(900), ease: "Sine.easeIn",
            onUpdate: () => {
              const point = arcPoint(from, fountainTop, 90, flight.t);
              orb.setPosition(point.x, point.y);
            },
            onComplete: () => orb.destroy(),
          }));
        });
        scene.time.delayedCall(motion(900 + orbs.length * 120), () => {
          if (settled) return;
          bigStar = this.showBigStar(golden, false);
          scene.tweens.killTweensOf(veil);
          scene.tweens.add({ targets: veil, fillAlpha: 0, duration: motion(600) });
          burstLight(scene, fountainTop.x, fountainTop.y - 40, { depth: ENDING_DEPTH.light, count: 34, speed: 320, calm: options.calm });
          scene.time.delayedCall(motion(500), resolve);
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
