import Phaser from "phaser";

// Brief, quiet tones use Phaser's master output so live mute/volume still apply.
export function createEthicsStampAudio(scene: Phaser.Scene) {
  const manager = "context" in scene.sound ? scene.sound as Phaser.Sound.WebAudioSoundManager : undefined;
  const context = manager?.context;
  const voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  let disposed = false;
  const tone = (frequency: number, endFrequency: number, at: number, duration: number, volume: number, type: OscillatorType) => {
    if (!context || !manager || disposed) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const voice = { oscillator, gain };
    voices.add(voice);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(manager.destination);
    oscillator.onended = () => {
      oscillator.disconnect(); gain.disconnect(); voices.delete(voice);
    };
    oscillator.start(at);
    oscillator.stop(at + duration);
  };
  const ready = () => !disposed && !!context && context.state === "running" && !scene.sound.mute;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    disposed = true;
    for (const { oscillator, gain } of voices) {
      oscillator.stop(); oscillator.disconnect(); gain.disconnect();
    }
    voices.clear();
  });
  return {
    unlock: () => { if (!disposed && context?.state === "suspended") void context.resume().catch(() => {}); },
    /** The stamp hits the paper; a rising chime follows a correct verdict. */
    play: (correct: boolean) => {
      if (!ready() || !context) return;
      const now = context.currentTime;
      tone(145, 78, now, 0.09, 0.065, "triangle");
      tone(340, 155, now, 0.045, 0.018, "sine");
      if (correct) {
        tone(659, 659, now + 0.045, 0.14, 0.025, "sine");
        tone(880, 880, now + 0.12, 0.2, 0.021, "sine");
      } else tone(330, 280, now + 0.05, 0.18, 0.02, "sine");
    },
    /** The desk bell rings once as the next student steps up to the window. */
    bell: () => {
      if (!ready() || !context) return;
      const now = context.currentTime;
      tone(1_760, 1_740, now, 0.26, 0.016, "sine");
      tone(2_640, 2_600, now, 0.12, 0.007, "sine");
    },
    /** A combo milestone gets a short three-note flourish. */
    cheer: () => {
      if (!ready() || !context) return;
      const now = context.currentTime;
      tone(784, 784, now, 0.09, 0.02, "sine");
      tone(988, 988, now + 0.08, 0.09, 0.02, "sine");
      tone(1_319, 1_319, now + 0.16, 0.22, 0.022, "sine");
    },
  };
}
