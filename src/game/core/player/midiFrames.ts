/**
 * Textbook Midi's front face frames and whole-body poses (one shared body,
 * only the face screen changes), shared by the intro story and the village.
 */
import type Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";

/** Texture keys for Midi's front face frames (all share one body). */
export const MIDI_FACE = {
  idle: "intro-midi-idle",
  blink: "intro-midi-blink",
  talkSmall: "intro-midi-talk-small",
  talkBig: "intro-midi-talk-big",
  talkO: "intro-midi-talk-o",
  happy: "intro-midi-happy",
  happyRest: "intro-midi-happy-rest",
  happyTalkSmall: "intro-midi-happy-talk-small",
  happyTalkO: "intro-midi-happy-talk-o",
  surprised: "intro-midi-surprised",
  surprisedTalkSmall: "intro-midi-surprised-talk-small",
  surprisedTalkBig: "intro-midi-surprised-talk-big",
  worried: "intro-midi-worried",
  worriedTalkO: "intro-midi-worried-talk-o",
} as const;

/** Whole-body poses, drawn at the same scale as the face frames. */
export const MIDI_POSE = {
  wave: "intro-midi-pose-wave",
  cheer: "intro-midi-pose-cheer",
  fly: "intro-midi-pose-fly",
} as const;

export type MidiFace = (typeof MIDI_FACE)[keyof typeof MIDI_FACE];
export type MidiPose = (typeof MIDI_POSE)[keyof typeof MIDI_POSE];
/** How Midi feels: sets the eyes while talking and the face at rest. */
export type MidiMood = "idle" | "happy" | "surprised" | "worried";

type MoodFaces = Readonly<{ rest: MidiFace; small: MidiFace; big: MidiFace; o: MidiFace }>;
// Each mood keeps its own eyes; the mouth opens small, wide or round while talking.
export const MOOD_FACES: Readonly<Record<MidiMood, MoodFaces>> = {
  idle: { rest: MIDI_FACE.idle, small: MIDI_FACE.talkSmall, big: MIDI_FACE.talkBig, o: MIDI_FACE.talkO },
  happy: { rest: MIDI_FACE.happyRest, small: MIDI_FACE.happyTalkSmall, big: MIDI_FACE.happy, o: MIDI_FACE.happyTalkO },
  surprised: {
    rest: MIDI_FACE.surprised, small: MIDI_FACE.surprisedTalkSmall, big: MIDI_FACE.surprisedTalkBig, o: MIDI_FACE.surprised,
  },
  worried: { rest: MIDI_FACE.worried, small: MIDI_FACE.worried, big: MIDI_FACE.worriedTalkO, o: MIDI_FACE.worriedTalkO },
};

// Speech pacing: one letter at a time, like Midi is actually saying it.
export const MIDI_SPEECH = {
  letterMs: 70,
  spaceMs: 60,
  lineBreakMs: 320,
  // How long one mouth shape is held; counted in letter time, so the mouth
  // can only move while letters are still appearing.
  mouthMs: 105,
} as const;
export type MidiSpeechPace = Readonly<{ [Key in keyof typeof MIDI_SPEECH]: number }>;

/** Face frames are 320 px tall at runtime (2x for a ~160 px Midi). */
export const MIDI_FRAME_HEIGHT = 320;

export function preloadMidiFaces(scene: Phaser.Scene) {
  const front = GAME_ASSETS.characters.midi.front;
  const pose = GAME_ASSETS.characters.midi.pose;
  const files: Record<MidiFace | MidiPose, string> = {
    [MIDI_FACE.idle]: front.idle,
    [MIDI_FACE.blink]: front.blink,
    [MIDI_FACE.talkSmall]: front.talkSmall,
    [MIDI_FACE.talkBig]: front.talkBig,
    [MIDI_FACE.talkO]: front.talkO,
    [MIDI_FACE.happy]: front.happy,
    [MIDI_FACE.happyRest]: front.happyRest,
    [MIDI_FACE.happyTalkSmall]: front.happyTalkSmall,
    [MIDI_FACE.happyTalkO]: front.happyTalkO,
    [MIDI_FACE.surprised]: front.surprised,
    [MIDI_FACE.surprisedTalkSmall]: front.surprisedTalkSmall,
    [MIDI_FACE.surprisedTalkBig]: front.surprisedTalkBig,
    [MIDI_FACE.worried]: front.worried,
    [MIDI_FACE.worriedTalkO]: front.worriedTalkO,
    [MIDI_POSE.wave]: pose.wave,
    [MIDI_POSE.cheer]: pose.cheer,
    [MIDI_POSE.fly]: pose.flyRight,
  };
  for (const [key, file] of Object.entries(files)) {
    if (!scene.textures.exists(key)) scene.load.image(key, file);
  }
}

