import type Phaser from "phaser";
import {
  MIDI_FACE, MIDI_POSE, MIDI_SPEECH, MOOD_FACES,
  type MidiFace, type MidiMood, type MidiPose,
} from "../../../core/player/midiFrames";
import { applyPlayerTexture, PLAYER_TEXTURES } from "../../../core/player/playerSprite";

/**
 * The village Midi's face while she talks: when she stands facing front, her
 * picture switches to the textbook face frames (same body, drawn bigger), so
 * the mouth moves with the letters and the eyes follow the line's mood, just
 * like on the first screen. Walking (or the line closing) brings back her
 * normal village frame.
 */

// Village frames are 226 px tall with the body 220 px; face frames are 320 px with the body 311 px.
const VILLAGE_SOURCE = { height: 226, body: 220, feetBelowPivot: 33 } as const;
const FACE_SOURCE = { body: 311 } as const;

const FACE_KEYS = new Set<string>([...Object.values(MIDI_FACE), ...Object.values(MIDI_POSE)]);
const FRONT_KEYS = new Set<string>([PLAYER_TEXTURES.front, PLAYER_TEXTURES.blink]);

export type VillageMidiFace = ReturnType<typeof createVillageMidiFace>;

export function createVillageMidiFace(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image | undefined, displayHeight: number) {
  const faceScale = (displayHeight / VILLAGE_SOURCE.height) * (VILLAGE_SOURCE.body / FACE_SOURCE.body);
  const feetBelowPivot = VILLAGE_SOURCE.feetBelowPivot * (FACE_SOURCE.body / VILLAGE_SOURCE.body);
  let mood: MidiMood = "idle";
  let mouthOpen = false;
  let mouthElapsed = 0;
  let syllable = 0;

  const usable = () => Boolean(sprite?.active && scene.textures.exists(MIDI_FACE.idle));
  const inFaceMode = () => Boolean(sprite && FACE_KEYS.has(sprite.texture.key));
  const show = (key: MidiFace | MidiPose) => {
    if (!sprite || !inFaceMode()) return;
    if (sprite.texture.key !== key) sprite.setTexture(key);
    // Keep the feet on the same spot for frames of other heights (the wave pose).
    sprite.setScale(faceScale).setFlipX(false).setOrigin(0.5, 1 - feetBelowPivot / sprite.height);
  };

  return {
    /** Starts a line: only when Midi stands facing front (never while she walks or turns). */
    startLine: (talkMood: MidiMood) => {
      if (!sprite || !usable()) return;
      if (!inFaceMode() && !FRONT_KEYS.has(sprite.texture.key)) return;
      mood = talkMood;
      mouthOpen = false;
      mouthElapsed = 0;
      syllable = 0;
      if (!inFaceMode()) sprite.setTexture(MOOD_FACES[mood].rest);
      show(MOOD_FACES[mood].rest);
    },
    /** One letter typed: the mouth changes about every 0.1 s, wide and small in turn. */
    letter: (letter: string, letterMs: number) => {
      if (!inFaceMode()) return;
      const faces = MOOD_FACES[mood];
      if (letter === "\n") {
        // The mouth closes for the short pause between lines.
        show(faces.rest);
        return;
      }
      if (letter === " ") return;
      mouthElapsed += letterMs;
      if (syllable === 0 || mouthElapsed >= MIDI_SPEECH.mouthMs) {
        mouthElapsed = syllable === 0 ? 0 : mouthElapsed - MIDI_SPEECH.mouthMs;
        mouthOpen = !mouthOpen;
        show(mouthOpen ? (Math.random() < 0.15 ? faces.o : faces.big) : faces.small);
      }
      syllable += 1;
    },
    /** The line is out: rest on a mood face, or a whole-body pose (never the cheer). */
    rest: (after: MidiMood | "wave") => {
      if (!inFaceMode()) return;
      if (after === "wave") {
        show(MIDI_POSE.wave);
        return;
      }
      mood = after;
      show(MOOD_FACES[after].rest);
    },
    /** Back to the normal village frame (if the face frames are still showing). */
    end: () => {
      if (!sprite || !inFaceMode()) return;
      applyPlayerTexture(sprite, PLAYER_TEXTURES.front, displayHeight);
    },
  };
}
