import Phaser from "phaser";
import {
  MIDI_FACE, MIDI_SPEECH, MOOD_FACES,
  type MidiFace, type MidiMood, type MidiPose, type MidiSpeechPace,
} from "./midiFrames";

export type MidiTalker = ReturnType<typeof createMidiTalker>;

/**
 * Drives Midi's face and body: typing a line letter by letter with the mouth
 * moving on the same ticks (eyes follow the line's mood), resting on a mood
 * face or a pose between lines, and blinking every few seconds while calm.
 * The sprite must be sized with setScale so frames of other sizes keep scale.
 * Shared by the intro story and the ending.
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
