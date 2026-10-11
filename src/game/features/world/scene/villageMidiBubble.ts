import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";
import type { Point } from "../model/mapDefinition";

/** Same look as Midi's speech bubble on the first screen. */
const BUBBLE_STYLE = {
  fill: 0xffffff, stroke: 0xc9c2ec, shadow: 0x2b3f86, text: "#315567",
  fontSize: "19px", lineSpacing: 6, maxTextWidth: 620, padX: 20, padY: 14, radius: 16, tail: 14,
} as const;
/** Gap between the tail tip and the top of Midi's head (or of the entry button). */
const HEAD_ABOVE_FEET = 108;
const BUTTON_TOP_ABOVE_FEET = 166;
const SCREEN = { width: 1280, height: 720, margin: 12 } as const;
export const VILLAGE_BUBBLE_LETTER_MS = 42;
const LETTER_MS = VILLAGE_BUBBLE_LETTER_MS;
/** Room kept right of the last line for the ▼ (it sits on that line, no extra row). */
const ARROW_SPACE = 26;
/** A line wider than this is split in two, with the lower line the longer one. */
const ONE_LINE_MAX = 600;
/** When slid to one side, the tail sits this far in from the bubble's near edge. */
const SIDE_TAIL_INSET = 44;

/**
 * Midi's own speech bubble in the village. It follows her every frame, sits
 * above the entry button when that is showing, and flips below her or slides
 * sideways so it never leaves the screen. Lines type out letter by letter.
 */
export function createVillageMidiBubble(scene: Phaser.Scene, depth: number, reducedMotion: boolean) {
  const graphics = scene.add.graphics();
  const text = scene.add
    .text(0, 0, "", {
      fontFamily: FONT_FAMILY, fontSize: BUBBLE_STYLE.fontSize, fontStyle: "bold",
      color: BUBBLE_STYLE.text, align: "center", lineSpacing: BUBBLE_STYLE.lineSpacing,
    })
    .setOrigin(0.5)
    .setResolution(3)
    .setVisible(false);
  // `text` only measures. What shows is one text per line, each already at
  // its final (centred) spot with its left edge fixed, so letters appear from
  // the left of where the line will sit and nothing shifts while typing.
  const lineTexts: Phaser.GameObjects.Text[] = [];
  let lineStarts: number[] = [];
  const renderShown = (count: number) => {
    lineTexts.forEach((lineText, index) => {
      const start = lineStarts[index];
      const end = index + 1 < lineStarts.length ? lineStarts[index + 1] - 1 : fullText.length;
      lineText.setText(fullText.slice(start, Math.max(start, Math.min(end, count))));
    });
  };
  // "Tap to go on" arrow (the first screen already taught 화면 터치 또는 Space),
  // shown once a line that waits for the player is fully out.
  const hint = scene.add
    .text(0, 0, "▼", {
      fontFamily: FONT_FAMILY, fontSize: "15px", fontStyle: "bold", color: "#7a86b8",
    })
    .setOrigin(1, 0.5)
    .setResolution(3)
    .setVisible(false);
  const container = scene.add
    .container(0, 0, [graphics, text, hint])
    .setDepth(depth)
    .setVisible(false)
    .setAlpha(0);
  let waitsForTap = false;
  let letterHook: ((letter: string, shownCount: number) => void) | undefined;
  let arrowY = 0;
  const showHint = () => {
    if (!waitsForTap) return;
    hint.setVisible(true).setAlpha(0);
    const baseY = arrowY;
    hint.setPosition(size.width / 2 - BUBBLE_STYLE.padX + 6, baseY);
    scene.tweens.add({ targets: hint, alpha: 1, duration: 200 });
    if (!reducedMotion) {
      scene.tweens.add({ targets: hint, y: baseY + 3, duration: 420, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  };
  const clearHint = () => {
    scene.tweens.killTweensOf(hint);
    hint.setVisible(false);
  };

  let fullText = "";
  let shown = 0;
  let typing: Phaser.Time.TimerEvent | undefined;
  let size = { width: 0, height: 0 };
  let tailBelow = true;
  let tailX = 0;
  let drawnKey = "";

  const draw = () => {
    const key = `${size.width},${size.height},${tailBelow},${Math.round(tailX)}`;
    if (key === drawnKey) return;
    drawnKey = key;
    const { width, height } = size;
    const { radius, tail } = BUBBLE_STYLE;
    const left = -width / 2;
    const top = -height / 2;
    graphics.clear();
    graphics.fillStyle(BUBBLE_STYLE.shadow, 0.14).fillRoundedRect(left + 3, top + 4, width, height, radius);
    graphics.fillStyle(BUBBLE_STYLE.fill, 1).fillRoundedRect(left, top, width, height, radius);
    graphics.lineStyle(2, BUBBLE_STYLE.stroke, 1).strokeRoundedRect(left, top, width, height, radius);
    // Tail toward Midi: from the bottom edge when the bubble is above her, the top edge when below.
    const edge = tailBelow ? height / 2 - 1 : -height / 2 + 1;
    const tip = tailBelow ? edge + tail : edge - tail;
    const x = Phaser.Math.Clamp(tailX, left + radius + 10, -left - radius - 10);
    graphics.fillStyle(BUBBLE_STYLE.fill, 1).fillTriangle(x - 9, edge, x + 9, edge, x, tip);
    graphics.lineStyle(2, BUBBLE_STYLE.stroke, 1).lineBetween(x - 9, edge, x, tip).lineBetween(x, tip, x + 9, edge);
  };

  /** Lays the whole line out first so the bubble never grows while letters appear. */
  const measure = (value: string) => text.setText(value).width;
  /**
   * One line when it fits; otherwise two, split at a space so the lower line
   * is the longer one (as even as possible), which reads steadier.
   * Lines with their own "\n" keep it.
   */
  const breakLine = (line: string) => {
    if (line.includes("\n") || measure(line) <= ONE_LINE_MAX) return line;
    let best: { at: number; diff: number } | undefined;
    for (let at = line.indexOf(" "); at > 0; at = line.indexOf(" ", at + 1)) {
      const top = measure(line.slice(0, at));
      const bottom = measure(line.slice(at + 1));
      if (bottom < top || bottom > BUBBLE_STYLE.maxTextWidth) continue;
      const diff = bottom - top;
      if (!best || diff < best.diff) best = { at, diff };
    }
    if (!best) return line;
    return `${line.slice(0, best.at)}\n${line.slice(best.at + 1)}`;
  };
  const layout = (line: string) => {
    const broken = breakLine(line);
    text.setWordWrapWidth(BUBBLE_STYLE.maxTextWidth, true).setText(broken);
    const wrapped = text.getWrappedText(broken).join("\n");
    text.setWordWrapWidth(null).setText(wrapped);
    const arrowRoom = waitsForTap ? ARROW_SPACE : 0;
    size = {
      width: Math.ceil(text.width) + arrowRoom + BUBBLE_STYLE.padX * 2,
      height: Math.ceil(text.height) + BUBBLE_STYLE.padY * 2,
    };
    // The text sits left of the ▼, which stays on the last line.
    text.setPosition(-arrowRoom / 2, 0);
    const lineList = wrapped.split("\n");
    const lines = lineList.length;
    const lineHeight = (text.height + BUBBLE_STYLE.lineSpacing) / lines;
    const blockHeight = text.height;
    const widths = lineList.map((value) => measure(value));
    text.setText(wrapped);
    for (const old of lineTexts.splice(0)) old.destroy();
    lineStarts = [];
    let start = 0;
    lineList.forEach((value, index) => {
      lineStarts.push(start);
      start += value.length + 1;
      const lineText = scene.add
        .text(-arrowRoom / 2 - widths[index] / 2, -blockHeight / 2 + index * lineHeight, "", {
          fontFamily: FONT_FAMILY, fontSize: BUBBLE_STYLE.fontSize, fontStyle: "bold",
          color: BUBBLE_STYLE.text,
        })
        .setResolution(3);
      lineTexts.push(lineText);
      container.add(lineText);
    });
    arrowY = text.height / 2 - (lineHeight - BUBBLE_STYLE.lineSpacing) / 2;
    return wrapped;
  };

  const stopTyping = () => {
    typing?.remove(false);
    typing = undefined;
  };
  // Called once the whole line is out (or the bubble closed before that).
  let onLineDone: (() => void) | undefined;
  const flushDone = () => {
    const done = onLineDone;
    onLineDone = undefined;
    done?.();
  };
  /** The line is fully out: show the tap hint (if any) and report it. */
  const lineDone = () => {
    showHint();
    flushDone();
  };

  return {
    /**
     * Types out a new line; `onDone` runs when it is fully shown (or the bubble
     * closes first). `waitForTap` adds the "화면 터치 또는 Space ▼" hint once the
     * line is out (the caller decides what a tap does).
     */
    say: (
      line: string,
      onDone?: () => void,
      waitForTap = false,
      /** Each typed letter and how many are showing (for the mouth and timed effects). */
      onLetter?: (letter: string, shownCount: number) => void,
    ) => {
      clearHint();
      waitsForTap = waitForTap;
      const wrapped = layout(line);
      if (wrapped === fullText && container.visible) {
        renderShown(shown);
        return;
      }
      stopTyping();
      flushDone();
      onLineDone = onDone;
      fullText = wrapped;
      letterHook = onLetter;
      shown = reducedMotion ? fullText.length : 0;
      renderShown(shown);
      scene.tweens.killTweensOf(container);
      container.setVisible(true).setScale(0.9);
      scene.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
      if (reducedMotion) {
        letterHook?.("", shown);
        lineDone();
        return;
      }
      typing = scene.time.addEvent({
        delay: LETTER_MS,
        repeat: fullText.length - 1,
        callback: () => {
          shown += 1;
          renderShown(shown);
          letterHook?.(fullText[shown - 1] ?? "", shown);
          if (shown >= fullText.length) {
            stopTyping();
            lineDone();
          }
        },
      });
    },
    /** True while letters are still appearing. */
    isTyping: () => typing !== undefined,
    /** Shows the rest of the line at once (a tap while Midi is still talking). */
    finish: () => {
      if (!typing) return;
      stopTyping();
      shown = fullText.length;
      renderShown(fullText.length);
      letterHook?.("", shown);
      lineDone();
    },
    hide: () => {
      stopTyping();
      clearHint();
      flushDone();
      fullText = "";
      scene.tweens.killTweensOf(container);
      scene.tweens.add({
        targets: container, alpha: 0, scale: 0.92, duration: 200, ease: "Sine.easeIn",
        onComplete: () => container.setVisible(false),
      });
    },
    /**
     * Call every frame with Midi's feet and whether the entry button is above
     * her. `side` (-1 left, 1 right) slides the bubble that way, tail still on
     * Midi, so it keeps clear of a building's name tag.
     */
    follow: (feet: Point, buttonShowing: boolean, side: -1 | 0 | 1 = 0) => {
      if (!container.visible) return;
      const { width, height } = size;
      const { tail } = BUBBLE_STYLE;
      const anchorAbove = feet.y - (buttonShowing ? BUTTON_TOP_ABOVE_FEET : HEAD_ABOVE_FEET);
      let centerY = anchorAbove - tail - height / 2;
      tailBelow = true;
      if (centerY - height / 2 < SCREEN.margin) {
        // Not enough room above (top row of buildings): speak from under her feet.
        tailBelow = false;
        centerY = feet.y + 18 + tail + height / 2;
      }
      const centerX = Phaser.Math.Clamp(
        feet.x + side * (width / 2 - SIDE_TAIL_INSET), SCREEN.margin + width / 2, SCREEN.width - SCREEN.margin - width / 2,
      );
      tailX = feet.x - centerX;
      container.setPosition(Math.round(centerX), Math.round(centerY));
      draw();
    },
    destroy: () => {
      stopTyping();
      onLineDone = undefined;
      container.destroy(true);
    },
  };
}
