import Phaser from "phaser";
import {
  createCoachCard, createCoachPointer, createCoachSpotlight,
  type CoachCard, type CoachPointer, type CoachSpotlight,
} from "../../../core/visual/coachGuide";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { AI_WORKSHOP_CONFIG, type WorkshopOrder } from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import type { WorkshopProductChoice } from "./workshopProducts";

/**
 * First-play walkthrough for the workshop: the first customer is served step
 * by step (read, pick, craft, deliver), each step opened by a card with a
 * 다음 button and then pointed at by an arrow while Midi does it.
 */

export type WorkshopTutorialEvent =
  /** The customer has finished talking; the shelf is still closed. */
  | "request-read"
  /** Products are on the shelf (also after a wrong pick sends them back). */
  | "choosing"
  /** Midi picked something up (acts once she carries all that is needed). */
  | "picked"
  | "crafting"
  | "delivery"
  /** The customer has left happy. */
  | "served";

export type WorkshopTutorialTarget = "product" | "workbench" | "customer";

/** What the tutorial reads from the scene to know where to point. */
export type WorkshopTutorialState = Readonly<{
  order: WorkshopOrder | undefined;
  carried: readonly Readonly<{ id: string }>[];
  hanging: readonly WorkshopProductChoice[];
}>;

function getTargetPosition(target: WorkshopTutorialTarget, state: WorkshopTutorialState) {
  switch (target) {
    case "product": {
      // The next product the customer still needs, under its name label.
      const needed = [...(state.order?.products ?? [])];
      state.carried.forEach((carried) => {
        const index = needed.findIndex((product) => product.id === carried.id);
        if (index >= 0) needed.splice(index, 1);
      });
      const choice = state.hanging.find(({ product }) => needed.some((entry) => entry.id === product.id));
      return choice ? { x: choice.container.x, y: choice.container.y + 84 } : undefined;
    }
    case "workbench":
      return { x: AI_WORKSHOP_LAYOUT.workbench.x, y: AI_WORKSHOP_LAYOUT.workbench.interactionY + 40 };
    case "customer":
      // The floor spot beside the customer where Midi hands it over.
      return { x: AI_WORKSHOP_LAYOUT.customerStage.x + 190, y: AI_WORKSHOP_LAYOUT.playerBounds.bottom };
  }
}

const TOTAL_STEPS = 5;
const CARD_DEPTH = 1_100;
const HINT_DEPTH = 1_040;
const SPOTLIGHT_DEPTH = 1_020;
const HINT_X = 500;
/** Where the spotlight falls for each card (1280 x 720 coordinates). */
const SPOTS = {
  customer: { x: 190, y: 400, width: 380, height: 560 },
  shelf: { x: 905, y: 205, width: 720, height: 230 },
  workbench: { x: 855, y: 600, width: 820, height: 210 },
  // The crafting panel's track and counter (the panel sits at 640, 360).
  craft: { x: 640, y: 470, width: 800, height: 230 },
} as const;

export type WorkshopTutorial = ReturnType<typeof createWorkshopTutorial>;

/**
 * `getState` reads the scene; `onComplete` runs once the tutorial customer is
 * done and the player pressed 시작하기.
 */
export function createWorkshopTutorial(
  scene: Phaser.Scene,
  getState: () => WorkshopTutorialState,
  /** Opens the product shelf (the tutorial asks for it after the first card). */
  openShelf: () => void,
  onComplete: () => void,
) {
  const spotlight: CoachSpotlight = createCoachSpotlight(scene, { depth: SPOTLIGHT_DEPTH });
  let card: CoachCard | undefined;
  let pointer: CoachPointer | undefined;
  let target: WorkshopTutorialTarget | undefined;
  let hint: Phaser.GameObjects.Container | undefined;
  let introduced = false;
  let done = false;

  const showCard = (
    index: number,
    title: string,
    text: string,
    onNext: () => void,
    position: Readonly<{ x: number; y: number }> = { x: 640, y: 380 },
    buttonLabel?: string,
  ) => {
    card?.dismiss();
    setTarget(undefined);
    setHint(undefined);
    card = createCoachCard(scene, {
      ...position,
      title,
      text,
      buttonLabel,
      step: index < TOTAL_STEPS ? { index, total: TOTAL_STEPS } : undefined,
      depth: CARD_DEPTH,
      onNext: () => {
        card = undefined;
        onNext();
      },
    });
  };

  function setTarget(next: WorkshopTutorialTarget | undefined) {
    if (next !== target) {
      pointer?.destroy();
      pointer = undefined;
    }
    target = next;
    if (next) placePointer(next);
  }

  function placePointer(next: WorkshopTutorialTarget) {
    const position = getTargetPosition(next, getState());
    if (!position) return;
    if (pointer) {
      pointer.moveTo(position.x, position.y);
      return;
    }
    pointer = createCoachPointer(scene, position.x, position.y, {
      depth: HINT_DEPTH,
      // Products hang high on the shelf: point up at them from Midi's floor.
      from: next === "product" ? "below" : "above",
      ring: next !== "product",
      ringWidth: next === "workbench" ? 220 : 150,
      ringHeight: next === "workbench" ? 60 : 50,
    });
  }

  /** A small reminder of the current task at the top of the screen. */
  function setHint(text: string | undefined) {
    hint?.destroy(true);
    hint = undefined;
    if (!text) return;
    const label = scene.add
      .text(0, 0, text, { color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "21px", fontStyle: "bold" })
      .setOrigin(0.5)
      .setResolution(3);
    const width = label.width + 56;
    const back = scene.add.graphics();
    back.fillStyle(0x163f4a, 0.3).fillRoundedRect(-width / 2 + 2, -22, width, 48, 24);
    back.fillStyle(0x2a8b7e, 1).fillRoundedRect(-width / 2, -25, width, 48, 24);
    // Between the home button and the status bar.
    hint = scene.add.container(HINT_X, 42, [back, label]).setDepth(HINT_DEPTH).setAlpha(0);
    scene.tweens.add({ targets: hint, alpha: 1, y: 48, duration: 220, ease: "Cubic.easeOut" });
  }

  const startPicking = () => {
    spotlight.hide();
    setTarget("product");
    setHint("손님에게 맞는 상품을 집어요");
  };
  const light = (spot: keyof typeof SPOTS) => {
    const { x, y, width, height } = SPOTS[spot];
    spotlight.focusRect(x, y, width, height);
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    done = true;
    pointer?.destroy();
    hint?.destroy(true);
  });
  // The pointer at the shelf comes from below: Midi stands under the shelf.

  return {
    notify(event: WorkshopTutorialEvent) {
      if (done) return;
      switch (event) {
        case "request-read":
          if (introduced) return;
          introduced = true;
          light("customer");
          showCard(0, "손님의 이야기를 들어요",
            "말풍선을 읽고 손님에게 어떤 도움이\n필요한지 알아봐요.",
            () => {
              // The shelf opens only now, after the first card.
              light("shelf");
              openShelf();
              showCard(1, "알맞은 상품을 집어요",
                "선반에 AI 상품이 나왔어요. 손님에게 맞는\n상품 앞으로 가서 Space 키나 집기 버튼을 눌러요.",
                startPicking,
                { x: 640, y: 470 });
            },
            { x: 700, y: 380 });
          return;
        case "choosing":
          if (!introduced) return;
          // A wrong product went back to the shelf: point again, no cards.
          startPicking();
          setHint("다시 골라 봐요! 손님의 말을 잘 읽어요");
          return;
        case "picked": {
          const { order, carried } = getState();
          if (target !== "product" || !order || carried.length < order.products.length) return;
          light("workbench");
          showCard(2, "작업대로 가져가요",
            "상품을 들고 아래 작업대 앞으로 가서\nSpace 키를 누르면 만들기 시작해요.",
            () => {
              spotlight.hide();
              setTarget("workbench");
              setHint("작업대 앞에서 Space!");
            },
            { x: 640, y: 300 });
          return;
        }
        case "crafting":
          light("craft");
          showCard(3, "타이밍을 맞춰 만들어요",
            `움직이는 막대가 색이 칠해진 칸 안에 들어왔을 때\nSpace 키나 멈춤 버튼을 눌러요. ${getState().order?.requiredStarHits ?? AI_WORKSHOP_CONFIG.requiredStarHits}번 맞히면 완성!`,
            () => {
              spotlight.hide();
              setHint("색 칸 안에서 멈춰요!");
            },
            { x: 640, y: 118 });
          return;
        case "delivery":
          light("customer");
          showCard(4, "손님에게 전해요",
            "완성된 상품을 들고 손님 앞으로 가서\nSpace 키를 눌러 전해 줘요.",
            () => {
              spotlight.hide();
              setTarget("customer");
              setHint("손님 앞에서 Space!");
            },
            { x: 700, y: 380 });
          return;
        case "served":
          spotlight.dimAll();
          showCard(TOTAL_STEPS, "잘했어요! 이제 진짜 영업 시작!",
            `${AI_WORKSHOP_CONFIG.gameDurationMs / 60_000}분 동안 손님을 최대한 많이 도와줘요.\n` +
              `상품을 ${AI_WORKSHOP_CONFIG.maxWrongDeliveries}번 잘못 고르면 영업이 끝나요.`,
            () => {
              done = true;
              spotlight.destroy();
              onComplete();
            },
            undefined,
            "시작하기");
          return;
      }
    },
    /** Keeps the arrow on its target (products slide in, Midi carries them). */
    update() {
      if (target) placePointer(target);
    },
  };
}
