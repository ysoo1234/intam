import Phaser from "phaser";
import {
  getWorldExitState,
  getWorldTotalStars,
  WORLD_EXIT_REQUIRED_STARS,
  type WorldActivityId,
  type WorldActivityResult,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import { COLORS, FONT_FAMILY, getTextStyle, UI_RADII } from "../../../core/visual/theme";
import { addUiSurface } from "../../../core/visual/uiPrimitives";
import type { MapDefinition, Point } from "../model/mapDefinition";
import { VILLAGE_UI_DEPTH } from "./villageScenery";

const TUTORIAL_DEPTH = VILLAGE_UI_DEPTH + 20;
const TIP_POSITION = { x: 640, y: 650 } as const;
const STAR_COUNTER_POSITION = { x: 1_124, y: 48 } as const;

const ACTIVITY_NAMES: Record<WorldActivityId, string> = {
  "ai-workshop": "AI 제작소",
  "data-flight": "데이터 비행장",
  "ethics-review": "윤리 심사소",
};

type BuildingLabel = Readonly<{
  featureId: WorldActivityId;
  container: Phaser.GameObjects.Container;
  arrow: Phaser.GameObjects.Graphics;
}>;

function createTipBar(scene: Phaser.Scene, text: string, tag = "TIP") {
  const width = Math.max(520, text.length * 21 + 170);
  const g = addUiSurface(
    scene,
    { x: -width / 2, y: -35, width, height: 70 },
    "cream",
    { radius: UI_RADII.panel, shadow: "medium" },
  );
  g.fillStyle(COLORS.mint, 1);
  g.fillRoundedRect(-width / 2 + 26, -23, 72, 46, 18);
  const tagText = scene.add
    .text(-width / 2 + 62, -1, tag, getTextStyle("support", { fontSize: "17px" }))
    .setOrigin(0.5)
    .setResolution(3);
  const body = scene.add
    .text(45, 0, text, getTextStyle("heading", { fontSize: "21px" }))
    .setOrigin(0.5)
    .setResolution(3);
  return scene.add
    .container(TIP_POSITION.x, TIP_POSITION.y, [g, tagText, body])
    .setDepth(TUTORIAL_DEPTH)
    .setAlpha(0)
    .setScale(0.94);
}

function createBuildingLabel(
  scene: Phaser.Scene,
  featureId: WorldActivityId,
  anchor: Point,
  stars: number,
): BuildingLabel {
  const name = ACTIVITY_NAMES[featureId];
  const label = scene.add
    .text(0, 0, `${name}   ★ ${stars}/3`, {
      fontFamily: FONT_FAMILY, fontSize: "18px", fontStyle: "bold", color: "#315567",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const width = label.width + 36;
  const height = 42;
  const plate = scene.add.graphics();
  plate.fillStyle(COLORS.ink, 0.16).fillRoundedRect(-width / 2 + 2, -height / 2 + 4, width, height, 16);
  plate.fillStyle(0xfffaf0, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 16);
  plate.lineStyle(2.5, 0x6fb0b2, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
  // Pointer under the chip, toward the building.
  const arrow = scene.add.graphics();
  arrow.fillStyle(0xfffaf0, 1).fillTriangle(-10, height / 2 - 1, 10, height / 2 - 1, 0, height / 2 + 14);
  arrow.lineStyle(2.5, 0x6fb0b2, 1).lineBetween(-10, height / 2 - 1, 0, height / 2 + 14);
  arrow.lineBetween(0, height / 2 + 14, 10, height / 2 - 1);
  const container = scene.add
    .container(anchor.x, anchor.y - 58, [plate, arrow, label])
    .setDepth(TUTORIAL_DEPTH)
    .setAlpha(0);
  return { featureId, container, arrow };
}

export type VillageTutorialOptions = Readonly<{
  mapDefinition: MapDefinition;
  progress: WorldProgressSnapshot;
  /** True on the very first entry from the intro; false when returning from an activity. */
  firstVisit: boolean;
  /** Stars just brought back from an activity, if any. */
  returnedResult?: WorldActivityResult;
}>;

export type VillageTutorial = ReturnType<typeof createVillageTutorial>;

/**
 * Light-touch guidance for the village: a persistent star counter, a two-step
 * first-visit walkthrough (move, then find a building), floating building
 * labels, and a short toast when stars come back from an activity.
 */
export function createVillageTutorial(scene: Phaser.Scene, options: VillageTutorialOptions) {
  const { mapDefinition, progress } = options;
  const markers = mapDefinition.scenery.flatMap((scenery) =>
    scenery.progressMarker?.kind === "activity-stars" ? [scenery.progressMarker] : [],
  );
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Star counter (always visible) ---------------------------------------
  const totalStars = getWorldTotalStars(progress);
  const exitState = getWorldExitState(progress);
  const counterWidth = 262;
  const counterHeight = 64;
  const counterPlate = scene.add.graphics();
  counterPlate.fillStyle(COLORS.ink, 0.2).fillRoundedRect(-counterWidth / 2 + 2, -counterHeight / 2 + 4, counterWidth, counterHeight, 18);
  counterPlate.fillStyle(0xfffaf0, 0.96).fillRoundedRect(-counterWidth / 2, -counterHeight / 2, counterWidth, counterHeight, 18);
  counterPlate.lineStyle(2.5, 0xd9c7a2, 1).strokeRoundedRect(-counterWidth / 2, -counterHeight / 2, counterWidth, counterHeight, 18);
  const counterStar = scene.add
    .text(-counterWidth / 2 + 30, -1, "★", { fontFamily: FONT_FAMILY, fontSize: "30px", fontStyle: "bold", color: "#E9A735" })
    .setOrigin(0.5)
    .setResolution(3);
  const counterValue = scene.add
    .text(-counterWidth / 2 + 56, -12, `별 ${totalStars} / ${WORLD_EXIT_REQUIRED_STARS}`, {
      fontFamily: FONT_FAMILY, fontSize: "21px", fontStyle: "bold", color: "#315567",
    })
    .setOrigin(0, 0.5)
    .setResolution(3);
  const counterNote = scene.add
    .text(-counterWidth / 2 + 56, 13, exitState.kind === "locked" ? `${exitState.missingStars}개 더 모으면 졸업길이 열려요` : "별빛 졸업길이 열렸어요!", {
      fontFamily: FONT_FAMILY, fontSize: "13px", fontStyle: "bold", color: exitState.kind === "locked" ? "#5e7884" : "#2f7f7b",
    })
    .setOrigin(0, 0.5)
    .setResolution(3);
  const counter = scene.add
    .container(STAR_COUNTER_POSITION.x, STAR_COUNTER_POSITION.y, [counterPlate, counterStar, counterValue, counterNote])
    .setDepth(TUTORIAL_DEPTH);

  // --- Return toast ---------------------------------------------------------
  if (options.returnedResult && options.returnedResult.stars > 0) {
    const { featureId, stars } = options.returnedResult;
    const toast = createTipBar(scene, `${ACTIVITY_NAMES[featureId]}에서 별 ${"★".repeat(stars)} 획득!  저장되었어요.`, "별");
    scene.tweens.add({ targets: toast, alpha: 1, scale: 1, duration: 260, ease: "Back.easeOut" });
    scene.tweens.add({ targets: toast, alpha: 0, y: TIP_POSITION.y + 24, delay: 3_200, duration: 300, ease: "Sine.easeIn",
      onComplete: () => toast.destroy(true) });
    scene.tweens.killTweensOf(counterStar);
    scene.tweens.add({ targets: counterStar, scale: 1.5, duration: 160, yoyo: true, repeat: 2, ease: "Sine.easeOut" });
  }

  // --- First-visit walkthrough ------------------------------------------------
  let step: "move" | "find" | "done" = options.firstVisit ? "move" : "done";
  let tip: Phaser.GameObjects.Container | undefined;
  let labels: BuildingLabel[] = [];
  let autoHideTimer: Phaser.Time.TimerEvent | undefined;

  const showTip = (text: string, tag = "TIP") => {
    hideTip(true);
    tip = createTipBar(scene, text, tag);
    scene.tweens.add({ targets: tip, alpha: 1, scale: 1, duration: 260, ease: "Back.easeOut" });
  };
  function hideTip(immediate = false) {
    const current = tip;
    tip = undefined;
    if (!current) return;
    scene.tweens.killTweensOf(current);
    if (immediate) { current.destroy(true); return; }
    scene.tweens.add({ targets: current, alpha: 0, y: TIP_POSITION.y + 24, duration: 300, ease: "Sine.easeIn",
      onComplete: () => current.destroy(true) });
  }
  const showLabels = () => {
    labels = markers.map((marker, index) => {
      const item = createBuildingLabel(scene, marker.featureId, marker.position, progress[marker.featureId]);
      scene.tweens.add({ targets: item.container, alpha: 1, y: item.container.y - 6, delay: index * 120, duration: 260, ease: "Cubic.easeOut" });
      if (!prefersReducedMotion) {
        scene.tweens.add({ targets: item.container, y: item.container.y - 14, delay: index * 120 + 260, duration: 900,
          yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
      return item;
    });
  };
  const hideLabels = () => {
    const current = labels;
    labels = [];
    for (const item of current) {
      scene.tweens.killTweensOf(item.container);
      scene.tweens.add({ targets: item.container, alpha: 0, duration: 260, ease: "Sine.easeIn",
        onComplete: () => item.container.destroy(true) });
    }
  };

  if (step === "move") showTip("방향키 또는 화면을 터치해서 미디를 움직여 보세요!");

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    autoHideTimer?.remove(false);
    hideTip(true);
    for (const item of labels) item.container.destroy(true);
    labels = [];
  });

  return {
    counter,
    /** Call once the player has moved for the first time. */
    notifyMoved: () => {
      if (step !== "move") return;
      step = "find";
      scene.time.delayedCall(700, () => {
        if (step !== "find") return;
        showTip("건물 앞으로 가면 입장 버튼이 나와요. 별을 모아 졸업길을 열어요!");
        showLabels();
        autoHideTimer = scene.time.delayedCall(12_000, () => { if (step === "find") finish(); });
      });
    },
    /** Call when the entry prompt first appears next to a building. */
    notifyPromptShown: () => {
      if (step === "find") finish();
    },
    finish,
  };

  function finish() {
    if (step === "done") return;
    step = "done";
    autoHideTimer?.remove(false);
    hideTip();
    hideLabels();
  }
}
