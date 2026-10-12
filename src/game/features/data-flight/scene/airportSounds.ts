import type Phaser from "phaser";
import { playSoftNotes, type SoftNote } from "../../../core/audio/softTones";

/**
 * The data airport's small sound cues: a light blip for each piece of data,
 * a chime when a question arrives, a fanfare for a right answer, a low note
 * for a wrong one and a thud when Midi bumps into something.
 */
const AIRPORT_SOUNDS = {
  collect: [[1_046, 1_318, 0, 0.055, 0.012, "sine"]],
  feverCollect: [[1_318, 1_760, 0, 0.05, 0.011, "sine"]],
  question: [
    [988, 988, 0, 0.14, 0.018, "sine"],
    [784, 784, 0.13, 0.22, 0.018, "sine"],
  ],
  correct: [
    [659, 659, 0, 0.1, 0.022, "sine"],
    [880, 880, 0.08, 0.1, 0.022, "sine"],
    [1_175, 1_175, 0.16, 0.12, 0.022, "sine"],
    [1_568, 1_568, 0.24, 0.32, 0.024, "sine"],
  ],
  wrong: [
    [233, 220, 0, 0.16, 0.035, "triangle"],
    [196, 175, 0.14, 0.26, 0.035, "triangle"],
  ],
  bump: [
    [150, 70, 0, 0.14, 0.07, "triangle"],
    [320, 140, 0, 0.06, 0.02, "sine"],
  ],
} as const satisfies Record<string, readonly SoftNote[]>;

export type AirportSound = keyof typeof AIRPORT_SOUNDS;

/** The data blip may sound at most this often (ms); a fever haul stays light. */
const COLLECT_GAP_MS = 70;
const lastCollectAt = new WeakMap<Phaser.Scene, number>();

export function playAirportSound(scene: Phaser.Scene, sound: AirportSound) {
  if (sound === "collect" || sound === "feverCollect") {
    const now = scene.time.now;
    if (now - (lastCollectAt.get(scene) ?? -Infinity) < COLLECT_GAP_MS) return;
    lastCollectAt.set(scene, now);
  }
  playSoftNotes(scene, AIRPORT_SOUNDS[sound]);
}
