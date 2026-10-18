import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { createAirportCardPanel, createAirportCapsulePanel } from "./airportPanels";
import type { FlightQuestion } from "../../../content/dataFlight";
import { DATA_FLIGHT_CONFIG } from "../model";

const QUIZ_PROMPT_WIDTH = 680;

/**
 * Splits a quiz question into at most two lines without leaving a lone word
 * ("데이터는?") on the second line. Most questions read "…하는 / AI에 필요한
 * 데이터는?", so the break goes before the last word starting with "AI" when
 * both halves fit; otherwise the most even split between words is used.
 * Quoted phrases ('오늘의 날씨'라고) are never split.
 */
function breakQuizPrompt(text: Phaser.GameObjects.Text, prompt: string, maxWidth: number): string {
  const measure = (value: string) => text.setText(value).width;
  if (measure(prompt) <= maxWidth) return prompt;
  const words = prompt.match(/'[^']*'\S*|\S+/g) ?? [prompt];
  const split = (index: number) => [words.slice(0, index).join(" "), words.slice(index).join(" ")] as const;
  const fits = (index: number) => split(index).every(line => measure(line) <= maxWidth);
  let aiIndex = -1;
  words.forEach((word, index) => { if (index > 0 && word.startsWith("AI")) aiIndex = index; });
  if (aiIndex > 0 && fits(aiIndex)) return split(aiIndex).join("\n");
  let best: { index: number; width: number } | undefined;
  for (let index = 1; index < words.length; index += 1) {
    const width = Math.max(...split(index).map(measure));
    if (width <= maxWidth && (!best || width < best.width)) best = { index, width };
  }
  if (best) return split(best.index).join("\n");
  // Too long for two lines: let Phaser wrap it.
  text.setWordWrapWidth(maxWidth);
  return prompt;
}

/** The quiz card shown while the question is read (a bar counts the reading time down). */
export function createAirportQuestionOverlay(
  scene: Phaser.Scene, question: FlightQuestion, readingMs: number = DATA_FLIGHT_CONFIG.questionReadingMs,
) {
  const overlay = scene.add.container(640, 360).setDepth(90);
  const shade = scene.add.rectangle(0, 0, 1280, 720, 0x112f43, 0.6);
  // The same cream card as the start screen, so the quiz feels part of the village.
  const panel = createAirportCardPanel(scene, 820, 380);
  const badge = scene.add
    .text(0, -128, "데이터 퀴즈", {
      color: "#2b6a80",
      fontFamily: FONT_FAMILY,
      fontSize: "26px",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const rule = scene.add.graphics();
  rule.lineStyle(2, 0x6fb0b2, 0.8).lineBetween(-60, -106, 60, -106);
  const prompt = scene.add
    .text(0, -4, "", {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "38px",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 8,
    })
    .setOrigin(0.5)
    .setResolution(3);
  prompt.setText(breakQuizPrompt(prompt, question.prompt, QUIZ_PROMPT_WIDTH));
  // A slim timer: the reading time left before the four choices fly in.
  const readingTrack = scene.add.graphics();
  readingTrack.fillStyle(0x2b6a80, 0.14).fillRoundedRect(-200, 116, 400, 12, 6);
  const readingFill = scene.add.graphics().fillStyle(0xf3b94d, 1);
  readingFill.fillRoundedRect(0, -6, 400, 12, 6).setPosition(-200, 122);
  overlay.add([shade, panel, badge, rule, prompt, readingTrack, readingFill]);
  overlay.setScale(0.82).setAlpha(0);
  scene.tweens.add({
    targets: overlay,
    scale: 1,
    alpha: 1,
    duration: 330,
    ease: "Back.easeOut",
  });
  scene.tweens.add({
    targets: readingFill,
    scaleX: 0,
    duration: readingMs,
    ease: "Linear",
  });
  return overlay;
}

/** The question, kept in view above the sky while the four choices fly in. */
export function createAirportMissionBanner(scene: Phaser.Scene, prompt: string) {
  const banner = scene.add.container(640, 115).setDepth(65);
  // The question stays in view in a cream capsule, like the status bar.
  const panel = createAirportCapsulePanel(scene, 820, 64);
  const text = scene.add
    .text(0, 0, prompt, {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: "23px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 740 },
    })
    .setOrigin(0.5)
    .setResolution(3);
  banner.add([panel, text]);
  banner.setScale(0);
  scene.tweens.add({
    targets: banner,
    scale: 1,
    duration: 280,
    ease: "Back.easeOut",
  });
  return { container: banner, text };
}
