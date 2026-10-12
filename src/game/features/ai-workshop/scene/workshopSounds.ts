import type Phaser from "phaser";
import { playSoftNotes, type SoftNote } from "../../../core/audio/softTones";

/**
 * The workshop's small sound cues. Kept few and quiet: picking a product,
 * each star-catch try, the finished product, coins, and a wrong pick.
 */
const WORKSHOP_SOUNDS = {
  /** A product lifted off the shelf: a soft pop. */
  pick: [[520, 780, 0, 0.07, 0.03, "sine"]],
  /** The star stopped outside the zone: a dull little bonk. */
  miss: [[240, 150, 0, 0.12, 0.045, "triangle"]],
  /** The finished product shows off: a quick rising sparkle. */
  reveal: [
    [784, 784, 0, 0.12, 0.02, "sine"],
    [988, 988, 0.07, 0.12, 0.02, "sine"],
    [1_319, 1_319, 0.14, 0.14, 0.021, "sine"],
    [1_568, 1_568, 0.21, 0.28, 0.022, "sine"],
  ],
  /** Coins handed over: two bright pings. */
  coins: [
    [1_568, 1_568, 0, 0.09, 0.02, "square"],
    [2_093, 2_093, 0.07, 0.2, 0.016, "square"],
  ],
  /** The wrong products at the workbench: two notes stepping down. */
  wrong: [
    [392, 370, 0, 0.13, 0.03, "triangle"],
    [311, 277, 0.12, 0.2, 0.03, "triangle"],
  ],
} as const satisfies Record<string, readonly SoftNote[]>;

export type WorkshopSound = keyof typeof WORKSHOP_SOUNDS;

export function playWorkshopSound(scene: Phaser.Scene, sound: WorkshopSound) {
  playSoftNotes(scene, WORKSHOP_SOUNDS[sound]);
}

/** A star caught in the zone: a ding that climbs with each success. */
export function playWorkshopStarHit(scene: Phaser.Scene, hit: number) {
  const base = [880, 988, 1_175, 1_319][Math.max(0, Math.min(3, hit - 1))] ?? 1_319;
  playSoftNotes(scene, [
    [base, base, 0, 0.16, 0.022, "sine"],
    [base * 1.5, base * 1.5, 0.03, 0.12, 0.009, "sine"],
  ]);
}
