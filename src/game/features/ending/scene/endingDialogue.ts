import Phaser from "phaser";
import type { EndingLine } from "../../../content/endingStory";
import {
  MIDI_FACE,
  MIDI_FRAME_HEIGHT,
  type MidiMood,
  type MidiPose,
  type MidiSpeechPace,
} from "../../../core/player/midiFrames";
import { createMidiTalker } from "../../../core/player/midiTalker";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { ENDING_DEPTH, ENDING_NARRATOR, ENDING_PANEL, MIDI_FACE_BODY_RATIO } from "./endingLayout";

// The story reads a little quicker than Midi's usual pace (like the intro story).
const ENDING_PACE: MidiSpeechPace = { letterMs: 41, spaceMs: 32, lineBreakMs: 110, mouthMs: 95 };

export type EndingDialogue = ReturnType<typeof createEndingDialogue>;

type SayOptions = Readonly<{
  /** How Midi stays once the line is said: a resting face or a pose. */
  after?: MidiMood | MidiPose;
  /** Wait for a tap (Space / Enter) before going on. Default true. */
  waitForTap?: boolean;
}>;

const MOODS: readonly string[] = ["idle", "happy", "surprised", "worried"];

/**
 * Midi telling the ending at the bottom-left with her line in the story
 * panel beside her. `say` types a line letter by letter (a tap shows it all
 * at once) and resolves once the student taps on.
 */
export function createEndingDialogue(scene: Phaser.Scene, options: Readonly<{ calm: boolean }>) {
  const motion = (ms: number) => (options.calm ? 0 : ms);

  // --- Midi -------------------------------------------------------------------------
  const shadow = scene.add.ellipse(0, 4, 92, 16, 0x2b3f86, 0.22);
  const sprite = scene.add
    .image(0, 0, MIDI_FACE.idle)
    .setScale(ENDING_NARRATOR.height / MIDI_FRAME_HEIGHT)
    .setOrigin(0.5, 0.985);
  const body = scene.add.container(0, 0, [sprite]);
  const narrator = scene.add
    .container(ENDING_NARRATOR.x, ENDING_NARRATOR.y, [shadow, body])
    .setDepth(ENDING_DEPTH.narrator);
  const talker = createMidiTalker(scene, sprite, { instant: options.calm });
  if (!options.calm) {
    scene.tweens.add({ targets: body, y: -6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // --- Panel ------------------------------------------------------------------------
  const width = ENDING_PANEL.right - ENDING_PANEL.left;
  const half = ENDING_PANEL.height / 2;
  const plate = scene.add.graphics();
  plate.fillStyle(0x2b3f86, 0.18).fillRoundedRect(-width / 2 + 3, -half + 6, width, ENDING_PANEL.height, 24);
  plate.fillStyle(0xffffff, 0.97).fillRoundedRect(-width / 2, -half, width, ENDING_PANEL.height, 24);
  plate.lineStyle(3, 0xc9c2ec, 1).strokeRoundedRect(-width / 2, -half, width, ENDING_PANEL.height, 24);
  // Little tail toward Midi on the left.
  plate.fillStyle(0xffffff, 1).fillTriangle(-width / 2 + 1.5, -14, -width / 2 + 1.5, 10, -width / 2 - 16, 4);
  plate.lineStyle(3, 0xc9c2ec, 1).lineBetween(-width / 2, -14, -width / 2 - 16, 4);
  plate.lineBetween(-width / 2 - 16, 4, -width / 2, 10);
  const nameTag = scene.add.graphics();
  nameTag.fillStyle(0x4b8fe0, 1).fillRoundedRect(-width / 2 + 26, -half - 16, 82, 32, 16);
  const nameText = scene.add
    .text(-width / 2 + 67, -half, "미디", { fontFamily: DISPLAY_FONT_FAMILY, fontSize: "19px", color: "#ffffff" })
    .setOrigin(0.5)
    .setResolution(3);
  const lineText = scene.add
    .text(-width / 2 + 40, 0, "", {
      fontFamily: FONT_FAMILY, fontSize: "23px", fontStyle: "bold", color: "#2f3d68", lineSpacing: 8,
    })
    .setResolution(3);
  const lineWidth = width - 120;
  const nextArrow = scene.add.graphics();
  nextArrow.fillStyle(0x4b8fe0, 1).fillTriangle(-9, -5, 9, -5, 0, 6);
  nextArrow.setPosition(width / 2 - 30, half - 20).setVisible(false);
  const panel = scene.add
    .container(ENDING_PANEL.left + width / 2, ENDING_PANEL.y, [plate, nameTag, nameText, lineText, nextArrow])
    .setDepth(ENDING_DEPTH.panel)
    .setAlpha(0);
  if (!options.calm) {
    scene.tweens.add({ targets: nextArrow, y: nextArrow.y + 5, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  let panelShown = false;
  const showPanel = () => {
    if (panelShown) return;
    panelShown = true;
    scene.tweens.killTweensOf(panel);
    scene.tweens.add({
      targets: panel, alpha: 1, y: { from: ENDING_PANEL.y + 24, to: ENDING_PANEL.y },
      duration: motion(300), ease: "Cubic.easeOut",
    });
  };
  const hidePanel = () => {
    if (!panelShown) return;
    panelShown = false;
    nextArrow.setVisible(false);
    scene.tweens.killTweensOf(panel);
    scene.tweens.add({ targets: panel, alpha: 0, y: ENDING_PANEL.y + 24, duration: motion(220), ease: "Sine.easeIn" });
  };

  /** Breaks the line where it would wrap, so letters never jump lines while typing. */
  const layoutLine = (line: string) => {
    lineText.setWordWrapWidth(lineWidth, false);
    const wrapped = lineText.getWrappedText(line).join("\n");
    lineText.setWordWrapWidth(null);
    lineText.setText(wrapped);
    lineText.setY(2 - lineText.height / 2);
    lineText.setText("");
    return wrapped;
  };

  // --- Taps -------------------------------------------------------------------------
  let waiting: (() => void) | undefined;
  let enabled = true;
  const advance = () => {
    if (!enabled) return;
    if (talker.isTalking()) {
      talker.finish();
      return;
    }
    const resolve = waiting;
    if (!resolve) return;
    waiting = undefined;
    nextArrow.setVisible(false);
    resolve();
  };
  const onPointer = () => advance();
  const onKey = (event: KeyboardEvent) => {
    event.preventDefault();
    advance();
  };
  scene.input.on("pointerdown", onPointer);
  scene.input.keyboard?.on("keydown-SPACE", onKey);
  scene.input.keyboard?.on("keydown-ENTER", onKey);
  const removeInput = () => {
    scene.input.off("pointerdown", onPointer);
    scene.input.keyboard?.off("keydown-SPACE", onKey);
    scene.input.keyboard?.off("keydown-ENTER", onKey);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, removeInput);

  const settle = (after: MidiMood | MidiPose | undefined, mood: MidiMood) => {
    const rest = after ?? mood;
    if (MOODS.includes(rest)) talker.setMood(rest as MidiMood);
    else talker.setPose(rest as MidiPose);
  };

  return {
    narrator,
    talker,
    showPanel,
    hidePanel,
    /** Types the line, then (by default) waits for a tap. */
    say(line: EndingLine, sayOptions: SayOptions = {}) {
      showPanel();
      waiting = undefined;
      nextArrow.setVisible(false);
      return new Promise<void>((resolve) => {
        talker.say(layoutLine(line.text), (visible) => lineText.setText(visible), () => {
          settle(sayOptions.after, line.mood);
          if (sayOptions.waitForTap === false) {
            resolve();
            return;
          }
          nextArrow.setVisible(true);
          waiting = resolve;
        }, ENDING_PACE, line.mood);
      });
    },
    /** Taps go to buttons only (the line waits) while false. */
    setTapEnabled(next: boolean) {
      enabled = next;
    },
    /** Drops any line still typing or waiting (skipping ahead). */
    cancel() {
      waiting = undefined;
      talker.stop();
      nextArrow.setVisible(false);
    },
    /**
     * Midi starts as big as she stood in the village (feet at `from`) and
     * floats down to tell the story from the bottom-left.
     */
    arriveFrom(from: Readonly<{ x: number; y: number }>, villageBodyHeight: number) {
      const scale = villageBodyHeight / (ENDING_NARRATOR.height * MIDI_FACE_BODY_RATIO);
      shadow.setAlpha(0);
      narrator.setPosition(from.x, from.y).setScale(scale);
      scene.tweens.add({
        targets: narrator, x: ENDING_NARRATOR.x, y: ENDING_NARRATOR.y, scale: 1,
        duration: motion(760), ease: "Sine.easeInOut",
      });
      scene.tweens.add({ targets: shadow, alpha: 1, delay: motion(600), duration: motion(200) });
    },
    setNarratorVisible(visible: boolean, duration = 220) {
      scene.tweens.killTweensOf(narrator);
      scene.tweens.add({ targets: narrator, alpha: visible ? 1 : 0, duration: motion(duration) });
    },
  };
}
