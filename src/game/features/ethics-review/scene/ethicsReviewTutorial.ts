import Phaser from "phaser";
import {
  createCoachCard, createCoachPointer, createCoachSpotlight,
  type CoachCard, type CoachPointer, type CoachSpotlight,
} from "../../../core/visual/coachGuide";
import { ETHICS_REVIEW_CONFIG } from "../model";
import type { EthicsReviewStations } from "./ethicsReviewView";
import { ETHICS_LAYOUT } from "./layout";

/**
 * The practice case's lesson: one card from Midi about the two stamps and
 * the arrow keys, then a bouncing arrow over each stamp until the first one
 * is pressed. The practice case itself (with its 한 번 더 / 2분 심사 시작
 * button) does the rest.
 */

const CARD_DEPTH = 1_100;
const POINTER_DEPTH = 1_040;
const SPOTLIGHT_DEPTH = 1_020;
// In the middle of the booth panel, clear of the lit form and stamps on the desk.
const CARD_POSITION = { x: 290, y: 400 } as const;
/** The "이제 진짜 심사 시작!" card sits in the middle of the screen. */
const FINISH_CARD_POSITION = { x: 640, y: 360 } as const;

export type EthicsReviewTutorial = ReturnType<typeof createEthicsReviewTutorial>;

export function createEthicsReviewTutorial(scene: Phaser.Scene, stations: EthicsReviewStations) {
  const spotlight: CoachSpotlight = createCoachSpotlight(scene, { depth: SPOTLIGHT_DEPTH });
  let card: CoachCard | undefined;
  let pointers: CoachPointer[] = [];
  let done = false;

  const clearPointers = () => {
    pointers.forEach((pointer) => pointer.destroy());
    pointers = [];
  };

  const destroy = () => {
    done = true;
    card?.dismiss();
    card = undefined;
    clearPointers();
    spotlight.destroy();
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return {
    /** Shows the card; `onReady` runs when it closes and the stamps light up. */
    start(onReady: () => void) {
      if (done) return;
      // Both stamps and the form stay lit; the rest of the office dims.
      const form = ETHICS_LAYOUT.form;
      const size = ETHICS_LAYOUT.stampSize;
      spotlight.focusAreas([
        { x: form.x, y: form.y, width: form.width + 40, height: form.height + 40, shape: "rect" },
        ...(["approve", "reject"] as const).map((verdict) => ({
          x: ETHICS_LAYOUT.stamps[verdict].x,
          y: ETHICS_LAYOUT.stamps[verdict].y - size.height / 2,
          width: size.width + 70,
          height: size.height + 90,
        })),
      ]);
      card = createCoachCard(scene, {
        ...CARD_POSITION,
        title: "도장으로 심사해요",
        text: "AI 사용 확인서를 읽고 알맞은 도장을 찍어요",
        depth: CARD_DEPTH,
        onNext: () => {
          card = undefined;
          if (done) return;
          spotlight.hide();
          pointers = stations.map((station) =>
            createCoachPointer(scene, station.button.x, station.button.y - size.height - 24, {
              depth: POINTER_DEPTH, ring: false, size: 84,
            }),
          );
          onReady();
        },
      });
    },

    /** After the practice stamp: "이제 진짜 심사 시작!", then `onStart`. */
    finish(onStart: () => void) {
      if (done) return;
      clearPointers();
      spotlight.dimAll();
      card = createCoachCard(scene, {
        ...FINISH_CARD_POSITION,
        title: "이제 진짜 심사 시작!",
        text: `${ETHICS_REVIEW_CONFIG.durationMs / 60_000}분 동안 AI 사용 확인서를 많이 심사해요.`,
        buttonLabel: "시작하기",
        depth: CARD_DEPTH,
        onNext: () => {
          card = undefined;
          done = true;
          spotlight.destroy();
          onStart();
        },
      });
    },

    notify(event: "stamped") {
      if (done || event !== "stamped") return;
      clearPointers();
    },

    destroy,
  };
}
