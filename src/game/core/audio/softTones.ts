import Phaser from "phaser";

/**
 * One short synthesized note: start and end pitch (Hz), when it starts after
 * the call (s), how long it rings (s), its loudness (0..1, keep it small) and
 * its wave shape.
 */
export type SoftNote = readonly [
  frequency: number,
  endFrequency: number,
  delay: number,
  duration: number,
  volume: number,
  type?: OscillatorType,
];

type Voice = { oscillator: OscillatorNode; gain: GainNode };
const sceneVoices = new WeakMap<Phaser.Scene, Set<Voice>>();
/** Never let quick repeats pile up into noise. */
const MAX_VOICES = 24;

function voicesFor(scene: Phaser.Scene) {
  const voices = sceneVoices.get(scene);
  if (voices) return voices;
  const created = new Set<Voice>();
  sceneVoices.set(scene, created);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const { oscillator, gain } of created) {
      try { oscillator.stop(); } catch { /* already stopped */ }
      oscillator.disconnect();
      gain.disconnect();
    }
    created.clear();
    sceneVoices.delete(scene);
  });
  return created;
}

/**
 * Plays a few soft notes through Phaser's master output, so the game's mute
 * and volume still apply. Quiet by design: small cues, not music.
 */
export function playSoftNotes(scene: Phaser.Scene, notes: readonly SoftNote[]) {
  const manager = "context" in scene.sound ? scene.sound as Phaser.Sound.WebAudioSoundManager : undefined;
  const context = manager?.context;
  if (!context || !manager || scene.sound.mute) return;
  if (context.state === "suspended") {
    void context.resume().catch(() => {});
    return;
  }
  if (context.state !== "running") return;
  const voices = voicesFor(scene);
  if (voices.size >= MAX_VOICES) return;
  const now = context.currentTime;
  for (const [frequency, endFrequency, delay, duration, volume, type = "sine"] of notes) {
    const at = now + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const voice = { oscillator, gain };
    voices.add(voice);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    }
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(manager.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      voices.delete(voice);
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }
}
