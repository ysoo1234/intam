import Phaser from "phaser";
import {
  createCoachCard, createCoachPointer, createCoachSpotlight, showCoachPraise,
  type CoachCard, type CoachPointer, type CoachSpotlight,
} from "../../../core/visual/coachGuide";
import { COLORS } from "../../../core/visual/theme";
import { FLIGHT_DATA_KINDS, FLIGHT_QUESTIONS, type FlightDataKind, type FlightQuestion } from "../../../content/dataFlight";
import { DATA_FLIGHT_CONFIG } from "../model";
import { showAirportNotice } from "./airportOverlays";

/**
 * First-play walkthrough for the airport, before the clock starts:
 *  0. fly around (touch anywhere, or the arrow keys),
 *  1. collect three data pieces (whatever else is flying then vanishes),
 *  2. let three untrustworthy data pieces go by (a bump does not count;
 *     no more are sent once three are on their way),
 *  3. read one quiz question, with more reading time than in the game,
 *  4. once the four answers are on screen everything pauses for a card,
 *     then an arrow points at the right one. A wrong or missed answer
 *     sends the four answers again (the question is not asked again).
 * Each step opens with a card (다음); nothing here costs a heart, and the
 * scene resets before the real flight.
 */

export type AirportTutorialEvent =
  | "collected"
  | "obstacle-hit"
  | "obstacle-passed"
  | "question-correct"
  | "question-wrong"
  | "question-missed";

/** One of the four answers flying in. */
export type AirportTutorialChoice = Readonly<{ kind: FlightDataKind; x: number; y: number }>;

/** What the tutorial needs from the scene. */
export type AirportTutorialHooks = Readonly<{
  getPlayer: () => Readonly<{ x: number; y: number }> | undefined;
  spawnData: (kind: FlightDataKind, x: number, y: number) => void;
  spawnObstacle: () => void;
  /** Shows the quiz card for `readingMs`, then sends the four answers. */
  startQuestion: (question: FlightQuestion, readingMs: number) => void;
  /** Sends the four answers of the current question again. */
  resendChoices: (question: FlightQuestion) => void;
  getChoices: () => readonly AirportTutorialChoice[];
  /** Removes whatever is still flying. */
  clearObjects: () => void;
}>;

export type AirportTutorial = ReturnType<typeof createAirportTutorial>;

const TOTAL_STEPS = 5;
const CARD_DEPTH = 1_100;
const POINTER_DEPTH = 1_040;
const SPOTLIGHT_DEPTH = 1_020;
// Cards and the "좋아요!" cheers share this spot, halfway between the old card and cheer spots.
const CARD_POSITION = { x: 640, y: 345 } as const;
/** How far Midi must fly, in any direction, before the first step counts. */
const PRACTICE_DISTANCE = 320;
const DATA_TARGET = 3;
const OBSTACLE_TARGET = 3;
const DATA_SPAWN_GAP_MS = 1_300;
const OBSTACLE_SPAWN_GAP_MS = 1_900;
/** The lesson's question stays up a little longer than in the game (the answer is shown anyway). */
const QUIZ_READING_MS = Math.round(DATA_FLIGHT_CONFIG.questionReadingMs * 1.1);
/** The answers pause once the last one is this far in from the right edge. */
const CHOICES_SETTLED_X = 1_150;
const QUIZ_QUESTION = FLIGHT_QUESTIONS[0];

type Phase = "intro" | "practice" | "collect" | "avoid" | "quiz" | "done";
/** Inside the quiz: waiting for the answers to arrive, then guided by the arrow. */
type QuizStage = "reading" | "arriving" | "guided" | "resolved";

export function createAirportTutorial(
  scene: Phaser.Scene,
  hooks: AirportTutorialHooks,
  onComplete: () => void,
) {
  const spotlight: CoachSpotlight = createCoachSpotlight(scene, { depth: SPOTLIGHT_DEPTH });
  let card: CoachCard | undefined;
  let pointer: CoachPointer | undefined;
  let phase: Phase = "intro";
  let quizStage: QuizStage = "reading";
  /** Whether the answer card has been shown (only before the first try). */
  let choicesExplained = false;
  /** True while the player is doing the step (no card open). */
  let active = false;
  let done = false;
  let travelled = 0;
  let last: { x: number; y: number } | undefined;
  let collected = 0;
  let obstaclesPassed = 0;
  let obstaclesInFlight = 0;
  let spawnTimerMs = 0;

  const clearPointer = () => {
    pointer?.destroy();
    pointer = undefined;
  };

  const showCard = (
    index: number,
    title: string,
    text: string,
    onNext: () => void,
    options: Readonly<{ buttonLabel?: string; keepObjects?: boolean }> = {},
  ) => {
    card?.dismiss();
    active = false;
    if (!options.keepObjects) hooks.clearObjects();
    card = createCoachCard(scene, {
      ...CARD_POSITION,
      title,
      text,
      buttonLabel: options.buttonLabel,
      step: index < TOTAL_STEPS ? { index, total: TOTAL_STEPS } : undefined,
      depth: CARD_DEPTH,
      onNext: () => {
        card = undefined;
        spotlight.hide();
        onNext();
      },
    });
  };

  const cheer = (text: string, then: () => void) => {
    active = false;
    clearPointer();
    // Whatever is still flying is no longer part of the lesson.
    hooks.clearObjects();
    // Same spot as the cards, so the eye stays in one place.
    showCoachPraise(scene, text, CARD_POSITION.x, CARD_POSITION.y, {
      holdMs: 900,
      onDone: () => {
        if (!done) then();
      },
    });
    scene.cameras.main.flash(160, 255, 244, 190);
  };

  const startPractice = () => {
    phase = "practice";
    travelled = 0;
    last = undefined;
    active = true;
  };

  const startCollecting = () => {
    phase = "collect";
    collected = 0;
    spawnTimerMs = 200;
    active = true;
  };

  const startAvoiding = () => {
    phase = "avoid";
    obstaclesPassed = 0;
    obstaclesInFlight = 0;
    spawnTimerMs = 300;
    active = true;
  };

  const startQuiz = () => {
    phase = "quiz";
    quizStage = "reading";
    active = true;
    hooks.startQuestion(QUIZ_QUESTION, QUIZ_READING_MS);
  };

  const showCollectCard = () =>
    showCard(1, "데이터를 모아요",
      "오른쪽에서 데이터가 날아와요.\n가까이 가면 모을 수 있어요. 3개를 모아 봐요!",
      startCollecting);

  const showAvoidCard = () =>
    showCard(2, "빨간 데이터는 피해요",
      "잘못된 데이터는 부딪히면 하트가 줄어요. \n3개를 피해 봐요!",
      startAvoiding);

  const showQuizCard = () =>
    showCard(3, "데이터 퀴즈",
      "비행 중에 데이터 퀴즈가 나와요.\n먼저 문제를 꼼꼼히 읽어요!",
      startQuiz);

  const correctChoice = () => hooks.getChoices().find((choice) => choice.kind === QUIZ_QUESTION.answer);

  /** The arrow rides beside the right answer, pointing in from the right. */
  const pointAtAnswer = () => {
    const choice = correctChoice();
    if (!choice) {
      clearPointer();
      return;
    }
    const x = choice.x + 62;
    if (pointer) pointer.moveTo(x, choice.y);
    else pointer = createCoachPointer(scene, x, choice.y, { depth: POINTER_DEPTH, from: "right", ring: false, size: 84 });
  };

  const guide = () => {
    quizStage = "guided";
    active = true;
    pointAtAnswer();
  };

  const onChoicesSettled = () => {
    if (choicesExplained) {
      guide();
      return;
    }
    choicesExplained = true;
    const choice = correctChoice();
    if (choice) spotlight.focus(choice.x, choice.y, 110, 90);
    // Everything stays where it is while the card is up (the scene pauses).
    showCard(4, "정답을 향해 날아가요!",
      "문제에 알맞은 데이터를 찾아 그쪽으로 날아가요.",
      guide,
      { keepObjects: true });
  };

  const resend = () => {
    if (done) return;
    clearPointer();
    quizStage = "arriving";
    active = true;
    hooks.resendChoices(QUIZ_QUESTION);
  };

  const showDoneCard = () => {
    phase = "done";
    spotlight.dimAll();
    showCard(TOTAL_STEPS, "이제 진짜 비행 시작!",
      "2분 30초 동안 데이터를 많이 모아요.",
      () => {
        done = true;
        spotlight.destroy();
        onComplete();
      },
      { buttonLabel: "시작하기" });
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    done = true;
    clearPointer();
  });

  // Opening card, with the spotlight on Midi.
  const player = hooks.getPlayer();
  if (player) spotlight.focus(player.x, player.y, 150, 130);
  else spotlight.dimAll();
  showCard(0, "자유롭게 날아요",
    "화면을 터치하여 미디를 움직여 봐요.",
    startPractice);

  return {
    /** Runs every frame of the tutorial, after Midi has moved. */
    update(deltaMs: number) {
      if (done || !active) return;
      switch (phase) {
        case "practice": {
          const now = hooks.getPlayer();
          if (!now) return;
          if (last) travelled += Math.hypot(now.x - last.x, now.y - last.y);
          last = { x: now.x, y: now.y };
          if (travelled >= PRACTICE_DISTANCE) cheer("좋아요!", showCollectCard);
          return;
        }
        case "collect": {
          spawnTimerMs -= deltaMs;
          if (spawnTimerMs > 0) return;
          spawnTimerMs = DATA_SPAWN_GAP_MS;
          // Each piece comes at Midi's current height, so the lesson is
          // "fly to it", not "chase it".
          const now = hooks.getPlayer();
          const kind = Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS);
          hooks.spawnData(kind, 1_350, Phaser.Math.Clamp(now?.y ?? 360, 150, 600));
          return;
        }
        case "avoid": {
          spawnTimerMs -= deltaMs;
          // Never more on the way than are still needed: no fourth after three.
          if (spawnTimerMs > 0 || obstaclesPassed + obstaclesInFlight >= OBSTACLE_TARGET) return;
          spawnTimerMs = OBSTACLE_SPAWN_GAP_MS;
          obstaclesInFlight += 1;
          hooks.spawnObstacle();
          return;
        }
        case "quiz": {
          if (quizStage === "reading" && hooks.getChoices().length > 0) quizStage = "arriving";
          if (quizStage === "arriving") {
            const choices = hooks.getChoices();
            if (choices.length > 0 && Math.max(...choices.map((choice) => choice.x)) <= CHOICES_SETTLED_X) {
              onChoicesSettled();
            }
            return;
          }
          if (quizStage === "guided") pointAtAnswer();
          return;
        }
        default:
          return;
      }
    },

    notify(event: AirportTutorialEvent) {
      if (done || !active) return;
      switch (event) {
        case "collected":
          if (phase !== "collect") return;
          collected += 1;
          if (collected >= DATA_TARGET) cheer("잘 모았어요!", showAvoidCard);
          return;
        case "obstacle-hit":
          // A bump does not count: another one comes until three have gone by.
          if (phase === "avoid") obstaclesInFlight = Math.max(0, obstaclesInFlight - 1);
          return;
        case "obstacle-passed":
          if (phase !== "avoid") return;
          obstaclesInFlight = Math.max(0, obstaclesInFlight - 1);
          obstaclesPassed += 1;
          if (obstaclesPassed >= OBSTACLE_TARGET) cheer("잘 피했어요!", showQuizCard);
          return;
        case "question-correct":
          if (phase !== "quiz") return;
          quizStage = "resolved";
          clearPointer();
          showAirportNotice(scene, "정답!", QUIZ_QUESTION.explanation, COLORS.mint);
          scene.time.delayedCall(1_500, () => {
            if (!done) cheer("대단해요!", showDoneCard);
          });
          return;
        case "question-wrong":
        case "question-missed":
          if (phase !== "quiz") return;
          quizStage = "resolved";
          clearPointer();
          showAirportNotice(
            scene,
            event === "question-wrong" ? "앗, 다른 데이터예요!" : "데이터를 놓쳤어요!",
            "한 번 더 해 봐요. 화살표를 따라가요!",
            event === "question-wrong" ? COLORS.danger : 0xf5bd46,
          );
          scene.time.delayedCall(1_600, resend);
          return;
        default:
          return;
      }
    },

    /** The tutorial is between steps (a card or cheer is up), so Midi waits. */
    isWaiting: () => !active,
  };
}
