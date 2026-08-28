import Phaser from "phaser";

const MAX_DIALOGUE_LINES = 4;
const CANNOT_START_LINE = /^[,.;:!?%\])}\u3001\u3002\u3009\u300b\u300d\u300f\u2019\u201d]/;
const CANNOT_END_LINE = /[(\[{\u3008\u300a\u300c\u300e\u2018\u201c]$/;

type LineLayout = {
  lines: string[];
  score: number;
};

function measureDialogueLine(textObject: Phaser.GameObjects.Text, value: string) {
  return (
    textObject.context.measureText(value).width +
    value.length * textObject.letterSpacing
  );
}

/**
 * Finds visually balanced Korean line breaks before the typewriter starts.
 * Phaser's advanced wrapper is greedy and only breaks at spaces, which leaves
 * a large empty area whenever the next Korean word does not fit. This layout
 * may break at a grapheme boundary, but still prefers natural spaces and keeps
 * punctuation attached to the correct side of a line.
 */
export function balanceWorkshopDialogueLines(
  textObject: Phaser.GameObjects.Text,
  value: string,
) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const characters = Array.from(normalized);
  const maxWidth =
    (textObject.getData("dialogue-max-text-width") as number | undefined) ??
    textObject.style.wordWrapWidth;
  // The visible bubble may have been narrowed for the previous customer.
  // Always solve the next sentence against the authored maximum first; the
  // view will then shrink the bubble around the resulting lines.
  textObject.setWordWrapWidth(maxWidth, true);
  if (!maxWidth || measureDialogueLine(textObject, normalized) <= maxWidth) {
    return normalized;
  }

  // Greedy character wrapping gives the smallest feasible line count. The
  // dynamic-programming pass below then redistributes those same characters
  // so every row has a similar visual width.
  let minimumLineCount = 1;
  let greedyLine = "";
  for (const character of characters) {
    const candidate = `${greedyLine}${character}`.trimStart();
    if (greedyLine && measureDialogueLine(textObject, candidate) > maxWidth) {
      minimumLineCount += 1;
      greedyLine = character.trimStart();
    } else {
      greedyLine = candidate;
    }
  }
  const lineCount = Phaser.Math.Clamp(
    minimumLineCount,
    2,
    MAX_DIALOGUE_LINES,
  );
  const targetWidth = Math.min(
    maxWidth,
    measureDialogueLine(textObject, normalized) / lineCount,
  );

  const layouts: Array<Map<number, LineLayout>> = Array.from(
    { length: lineCount + 1 },
    () => new Map<number, LineLayout>(),
  );
  layouts[0]!.set(0, { lines: [], score: 0 });

  for (let usedLines = 0; usedLines < lineCount; usedLines += 1) {
    for (const [start, layout] of layouts[usedLines]!) {
      const remainingLines = lineCount - usedLines - 1;
      for (
        let end = start + 1;
        end <= characters.length - remainingLines;
        end += 1
      ) {
        const line = characters.slice(start, end).join("").trim();
        if (!line) continue;
        const lineWidth = measureDialogueLine(textObject, line);
        if (lineWidth > maxWidth) break;
        if (CANNOT_END_LINE.test(line)) continue;

        const nextCharacter = characters[end] ?? "";
        if (nextCharacter && CANNOT_START_LINE.test(nextCharacter)) continue;

        const breaksAtSpace =
          /\s/.test(characters[end - 1] ?? "") || /\s/.test(nextCharacter);
        const raggedness = (targetWidth - lineWidth) ** 2;
        // Korean should normally wrap between eojeol (space-delimited units).
        // A character break remains as an emergency escape hatch for a single
        // unusually long token, but must never win merely to make two rows a
        // few pixels more even (for example `챙` / `길지`).
        const characterBreakPenalty = breaksAtSpace ? 0 : maxWidth ** 2 * 4;
        const score = layout.score + raggedness + characterBreakPenalty;
        const existing = layouts[usedLines + 1]!.get(end);
        if (!existing || score < existing.score) {
          layouts[usedLines + 1]!.set(end, {
            lines: [...layout.lines, line],
            score,
          });
        }
      }
    }
  }

  const balanced = layouts[lineCount]!.get(characters.length);
  return balanced?.lines.join("\n") ?? textObject.getWrappedText(normalized).join("\n");
}

export function startWorkshopDialogue(
  scene: Phaser.Scene,
  dialogueText: Phaser.GameObjects.Text | undefined,
  previousTimer: Phaser.Time.TimerEvent | undefined,
  text: string,
  onComplete?: () => void,
  speed = 25,
) {
  previousTimer?.remove(false);
  const displayText = dialogueText
    ? balanceWorkshopDialogueLines(dialogueText, text)
    : text;
  const characters = Array.from(displayText);
  dialogueText
    ?.setData("dialogue-layout-text", displayText)
    .setText("");
  let index = 0;
  return scene.time.addEvent({
    delay: speed,
    repeat: Math.max(0, characters.length - 1),
    callback: () => {
      index += 1;
      dialogueText?.setText(characters.slice(0, index).join(""));
      if (index >= characters.length) onComplete?.();
    },
  });
}
