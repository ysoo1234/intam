import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";

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
const MOOD_FACES: Readonly<Record<MidiMood, MoodFaces>> = {
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
  for (const [key, file] of Object.entries(files)) scene.load.image(key, file);
}

export type MidiTalker = ReturnType<typeof createMidiTalker>;

/**
 * Drives Midi's face and body: typing a line letter by letter with the mouth
 * moving on the same ticks (eyes follow the line's mood), resting on a mood
 * face or a pose between lines, and blinking every few seconds while calm.
 * The sprite must be sized with setScale so frames of other sizes keep scale.
 */
export function createMidiTalker(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Image,
  options: Readonly<{ instant?: boolean }> = {},
) {
  let talking = false;
  let mood: MidiMood = "idle";
  let pose: MidiPose | undefined;
  let speechTimer: Phaser.Time.TimerEvent | undefined;
  let finishLine: (() => void) | undefined;

  const show = (texture: MidiFace | MidiPose) => {
    if (sprite.active && sprite.texture.key !== texture) sprite.setTexture(texture);
  };
  const showRest = () => show(pose ?? MOOD_FACES[mood].rest);

  const stop = () => {
    talking = false;
    speechTimer?.remove(false);
    speechTimer = undefined;
    finishLine = undefined;
    showRest();
  };

  /**
   * Types `text` (use "\n" for a line break) in `talkMood`. `render` receives
   * the visible prefix each tick, so callers decide how the letters are laid out.
   */
  const say = (
    text: string,
    render: (visible: string) => void,
    onDone?: () => void,
    pace: MidiSpeechPace = MIDI_SPEECH,
    talkMood: MidiMood = mood,
  ) => {
    stop();
    pose = undefined;
    const faces = MOOD_FACES[talkMood];
    const complete = () => {
      render(text);
      stop();
      onDone?.();
    };
    if (options.instant) {
      complete();
      return;
    }
    render("");
    talking = true;
    finishLine = complete;
    show(faces.rest);
    let index = 0;
    let syllable = 0;
    let mouthOpen = false;
    let mouthElapsed = 0;
    const typeNext = () => {
      if (!talking) return;
      if (index >= text.length) {
        complete();
        return;
      }
      const letter = text[index];
      index += 1;
      render(text.slice(0, index));
      if (letter === "\n") {
        // Mouth closes for the short pause between lines.
        show(faces.rest);
        speechTimer = scene.time.delayedCall(pace.lineBreakMs, typeNext);
        return;
      }
      if (letter !== " ") {
        // The mouth changes about every 0.1 s, a little slower than the letters,
        // so it reads as speaking rather than flickering: wide and small
        // alternate, with an occasional round "o" so it doesn't feel mechanical.
        mouthElapsed += pace.letterMs;
        if (syllable === 0 || mouthElapsed >= pace.mouthMs) {
          mouthElapsed = syllable === 0 ? 0 : mouthElapsed - pace.mouthMs;
          mouthOpen = !mouthOpen;
          const open = Math.random() < 0.15 ? faces.o : faces.big;
          show(mouthOpen ? open : faces.small);
        }
        syllable += 1;
      }
      speechTimer = scene.time.delayedCall(letter === " " ? pace.spaceMs : pace.letterMs, typeNext);
    };
    typeNext();
  };

  // While calm (plain face, no pose) Midi blinks every few seconds, sometimes twice.
  const canBlink = () => !talking && mood === "idle" && !pose && sprite.active;
  const blinkOnce = (then?: () => void) => {
    if (!canBlink()) return;
    show(MIDI_FACE.blink);
    scene.time.delayedCall(115, () => {
      if (!canBlink()) return;
      show(MIDI_FACE.idle);
      then?.();
    });
  };
  const scheduleBlink = () => {
    scene.time.delayedCall(Phaser.Math.Between(2_200, 4_600), () => {
      if (!sprite.active) return;
      const twice = Math.random() < 0.25;
      blinkOnce(twice ? () => scene.time.delayedCall(140, () => blinkOnce()) : undefined);
      scheduleBlink();
    });
  };
  scheduleBlink();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);

  return {
    say,
    stop,
    /** Shows the whole line at once (a tap while Midi is still typing). */
    finish: () => finishLine?.(),
    isTalking: () => talking,
    /** The face Midi rests on between lines; clears any pose. */
    setMood: (next: MidiMood) => {
      mood = next;
      pose = undefined;
      if (!talking) showRest();
    },
    /** A whole-body pose (wave, cheer, fly) until the next line or mood. */
    setPose: (next: MidiPose | undefined) => {
      pose = next;
      if (!talking) showRest();
    },
  };
}
