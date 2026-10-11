// The talker lives in core so the intro and the ending share one Midi voice.
export { createMidiTalker, type MidiTalker } from "../../../core/player/midiTalker";
export {
  MIDI_FACE, MIDI_FRAME_HEIGHT, MIDI_POSE, MIDI_SPEECH, preloadMidiFaces,
  type MidiFace, type MidiMood, type MidiPose, type MidiSpeechPace,
} from "../../../core/player/midiFrames";
