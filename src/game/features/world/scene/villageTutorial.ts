import Phaser from "phaser";
import {
  WORLD_ACTIVITY_IDS,
  type WorldActivityId,
  type WorldActivityResult,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import {
  createCoachPointer, createCoachSpotlight, showCoachPraise,
  type CoachPointer, type CoachSpotlight,
} from "../../../core/visual/coachGuide";
import { COLORS, FONT_FAMILY, getTextStyle, UI_RADII } from "../../../core/visual/theme";
import { addUiSurface } from "../../../core/visual/uiPrimitives";
import type { MapDefinition, Point } from "../model/mapDefinition";
import { VILLAGE_UI_DEPTH, type VillageSceneryLayer } from "./villageScenery";

const TUTORIAL_DEPTH = VILLAGE_UI_DEPTH + 20;
const POINTER_DEPTH = VILLAGE_UI_DEPTH + 5;
/** Above the village and Midi, below every tip, arrow and button. */
const SPOTLIGHT_DEPTH = VILLAGE_UI_DEPTH - 10;
const TIP_POSITION = { x: 640, y: 650 } as const;
/** Tips sit at the top so they never cover Midi or a door. */
const TOP_TIP_POSITION = { x: 640, y: 72 } as const;
/** "좋아요!" pops up right under the tip. */
const PRAISE_POSITION = { x: 640, y: 160 } as const;
const RETURN_TOAST_MS = 3_500;

const ACTIVITY_NAMES: Record<WorldActivityId, string> = {
  "ai-workshop": "AI 제작소",
  "data-flight": "데이터 비행장",
  "ethics-review": "윤리 심사소",
};

/**
 * Where the arrow stands in front of each building's door, as an offset from
 * the building image's centre in its displayed size (fractions).
 */
const DOOR_POINTS: Record<WorldActivityId, Point> = {
  "ai-workshop": { x: 0.38, y: 0.23 },
  "data-flight": { x: 0.3, y: 0.42 },
  "ethics-review": { x: -0.04, y: 0.45 },
};

function createTipBar(
  scene: Phaser.Scene,
  text: string,
  tag = "TIP",
  position: Point = TIP_POSITION,
) {
  const body = scene.add
    .text(45, 0, text, getTextStyle("heading", { fontSize: "21px" }))
    .setOrigin(0.5)
    .setResolution(3);
  const width = Math.max(520, body.width + 170);
  body.setX(45);
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
  return scene.add
    .container(position.x, position.y, [g, tagText, body])
    .setDepth(TUTORIAL_DEPTH)
    .setAlpha(0)
    .setScale(0.94);
}

/** A name tag above the building to visit. */
function createNameTag(scene: Phaser.Scene, text: string) {
  const label = scene.add
    .text(0, 0, text, { color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "21px", fontStyle: "bold" })
    .setOrigin(0.5)
    .setResolution(3);
  const width = label.width + 40;
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 0.25).fillRoundedRect(-width / 2 + 2, -20, width, 44, 22);
  g.fillStyle(0xd9544a, 1).fillRoundedRect(-width / 2, -23, width, 44, 22);
  g.lineStyle(3, 0xffffff, 1).strokeRoundedRect(-width / 2, -23, width, 44, 22);
  return scene.add.container(0, 0, [g, label]).setDepth(POINTER_DEPTH).setAlpha(0);
}

export type VillageTutorialOptions = Readonly<{
  mapDefinition: MapDefinition;
  sceneryLayers: readonly VillageSceneryLayer[];
  progress: WorldProgressSnapshot;
  /** True until the player has entered a building once (saved in the browser). */
  firstVisit: boolean;
  /** Stars just brought back from an activity, if any. */
  returnedResult?: WorldActivityResult;
}>;

export type VillageTutorial = ReturnType<typeof createVillageTutorial>;

/**
 * Village guidance. First visit: "move Midi" tip, a "좋아요!" bubble once she
 * moves, then the AI 제작소 lights up with an arrow until Midi reaches its
 * door, where the tip explains how to enter. Later visits light up the next
 * building that has no stars yet. Also shows the star toast after a return.
 */
export function createVillageTutorial(scene: Phaser.Scene, options: VillageTutorialOptions) {
  const { mapDefinition, progress } = options;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // --- Return toast ---------------------------------------------------------
  const hasReturnToast = Boolean(options.returnedResult && options.returnedResult.stars > 0);
  if (options.returnedResult && hasReturnToast) {
    const { featureId, stars } = options.returnedResult;
    const toast = createTipBar(scene, `${ACTIVITY_NAMES[featureId]}에서 별 ${"★".repeat(stars)} 획득!  저장되었어요.`, "별");
    scene.tweens.add({ targets: toast, alpha: 1, scale: 1, duration: 260, ease: "Back.easeOut" });
    scene.tweens.add({ targets: toast, alpha: 0, y: TIP_POSITION.y + 24, delay: RETURN_TOAST_MS - 300, duration: 300, ease: "Sine.easeIn",
      onComplete: () => toast.destroy(true) });
  }

  // --- Which building to light up --------------------------------------------
  const targetId: WorldActivityId | undefined = options.firstVisit
    ? "ai-workshop"
    : WORLD_ACTIVITY_IDS.find((id) => progress[id] === 0);
  const targetLayer = options.sceneryLayers.find(
    ({ definition }) =>
      definition.progressMarker?.kind === "activity-stars" &&
      definition.progressMarker.featureId === targetId,
  );
  const targetPortal = mapDefinition.portals.find(
    (portal) => portal.destination.kind === "feature" && portal.destination.featureId === targetId,
  );
  // The short name ("AI 제작소"), not the portal's full label.
  const targetName = targetId ? ACTIVITY_NAMES[targetId] : "";

  let step: "move" | "praise" | "go" | "enter" | "done" = options.firstVisit ? "move" : "done";
  // First visit only: the screen darkens around whatever Midi should do next.
  const spotlight: CoachSpotlight | undefined = options.firstVisit
    ? createCoachSpotlight(scene, { depth: SPOTLIGHT_DEPTH, alpha: 0.55 })
    : undefined;
  const spawn = mapDefinition.defaultSpawn.position;
  // While walking to the building, Midi keeps her own pool of light; it is
  // repainted only after she has moved a little, not every frame.
  let litPlayer: Point | undefined;
  const lightTargetAndPlayer = (playerPosition: Point) => {
    if (!targetLayer || !spotlight) return;
    const { definition } = targetLayer;
    litPlayer = { ...playerPosition };
    spotlight.focusAreas([
      {
        x: definition.position.x, y: definition.position.y + 10,
        width: definition.displaySize.width + 70, height: definition.displaySize.height + 60, shape: "rect",
      },
      { x: playerPosition.x, y: playerPosition.y - 30, width: 260, height: 220 },
    ]);
  };
  let tip: Phaser.GameObjects.Container | undefined;
  let arrivedPraised = false;
  let glow: Phaser.GameObjects.Image | undefined;
  let pointer: CoachPointer | undefined;
  let nameTag: Phaser.GameObjects.Container | undefined;

  const showTip = (text: string, tag = "TIP", position: Point = TIP_POSITION) => {
    hideTip(true);
    tip = createTipBar(scene, text, tag, position);
    scene.tweens.add({ targets: tip, alpha: 1, scale: 1, duration: 260, ease: "Back.easeOut" });
  };
  function hideTip(immediate = false) {
    const current = tip;
    tip = undefined;
    if (!current) return;
    scene.tweens.killTweensOf(current);
    if (immediate) { current.destroy(true); return; }
    scene.tweens.add({ targets: current, alpha: 0, y: current.y + 24, duration: 300, ease: "Sine.easeIn",
      onComplete: () => current.destroy(true) });
  }

  const showHighlight = () => {
    if (!targetLayer || !targetId || glow) return;
    const { definition, image } = targetLayer;
    // A warm, gentle shimmer over the building: enough to catch the eye
    // without washing the picture out.
    glow = scene.add
      .image(definition.position.x, definition.position.y, definition.assetKey)
      .setDisplaySize(definition.displaySize.width, definition.displaySize.height)
      .setFlipX(definition.flipX === true)
      .setTint(0xffe9a0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(image.depth + 0.005)
      .setAlpha(0);
    scene.tweens.add({
      targets: glow, alpha: { from: 0.05, to: reducedMotion ? 0.14 : 0.22 },
      duration: 900, yoyo: !reducedMotion, repeat: reducedMotion ? 0 : -1, ease: "Sine.easeInOut",
    });
    const door = DOOR_POINTS[targetId];
    const doorX = definition.position.x + door.x * definition.displaySize.width;
    const doorY = definition.position.y + door.y * definition.displaySize.height;
    pointer = createCoachPointer(scene, doorX, doorY, { depth: POINTER_DEPTH, ringWidth: 120, ringHeight: 40, size: 110 });
    nameTag = createNameTag(scene, targetName);
    // Above the roof and its stars, so the door stays clear for the arrow.
    nameTag.setPosition(
      definition.position.x,
      definition.position.y - definition.displaySize.height / 2 - 6,
    );
    scene.tweens.add({ targets: nameTag, alpha: 1, duration: 260 });
  };
  const hideHighlight = () => {
    pointer?.destroy();
    pointer = undefined;
    for (const target of [glow, nameTag]) {
      if (!target) continue;
      scene.tweens.killTweensOf(target);
      scene.tweens.add({ targets: target, alpha: 0, duration: 260, onComplete: () => target.destroy() });
    }
    glow = undefined;
    nameTag = undefined;
  };
  const showGoTip = () => {
    if (step === "done" || !targetId) return;
    step = "go";
    litPlayer = undefined;
    showTip(`다음은 ${targetName}로 이동해 봅시다.`, "다음", TOP_TIP_POSITION);
  };

  if (step === "move") {
    // Light Midi where she starts, so the eye goes to her.
    spotlight?.focus(spawn.x, spawn.y - 30, 150, 130);
    showTip("방향키 또는 화면을 터치해서 미디를 움직여 보세요!", "TIP", TOP_TIP_POSITION);
  } else if (targetId) {
    // Returning: light up the next building once the star toast has gone.
    scene.time.delayedCall(hasReturnToast ? RETURN_TOAST_MS : 600, () => {
      step = "go";
      showHighlight();
      showGoTip();
    });
  }

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    step = "done";
    spotlight?.destroy();
    hideTip(true);
    pointer?.destroy();
    glow?.destroy();
    nameTag?.destroy(true);
  });

  return {
    /** Call once the player has moved for the first time. */
    notifyMoved: () => {
      if (step !== "move") return;
      step = "praise";
      spotlight?.hide();
      showCoachPraise(scene, "좋아요!", PRAISE_POSITION.x, PRAISE_POSITION.y, {
        depth: TUTORIAL_DEPTH + 1,
        onDone: () => {
          if (step !== "praise") return;
          showHighlight();
          showGoTip();
        },
      });
    },
    /**
     * Call every frame with Midi's position and the portal whose entry prompt
     * is showing (undefined when none).
     */
    update: (playerPosition: Point, promptPortalId: string | undefined) => {
      if (step === "go" && spotlight) {
        const moved = litPlayer
          ? Math.hypot(playerPosition.x - litPlayer.x, playerPosition.y - litPlayer.y)
          : Number.POSITIVE_INFINITY;
        if (moved > 28) lightTargetAndPlayer(playerPosition);
      }
      if (glow && targetLayer) glow.setDepth(targetLayer.image.depth + 0.005);
      if (!targetPortal) return;
      const atTarget = promptPortalId === targetPortal.id;
      if (step === "go" && atTarget) {
        step = "enter";
        pointer?.container.setVisible(false);
        // Midi, the door and the entry button above her.
        spotlight?.focusRect(playerPosition.x, playerPosition.y - 60, 400, 260);
        showTip("Space 키를 누르거나 '입장하기' 버튼을 눌러 들어가요!", "입장", TOP_TIP_POSITION);
        if (!arrivedPraised) {
          arrivedPraised = true;
          showCoachPraise(scene, "좋아요!", PRAISE_POSITION.x, PRAISE_POSITION.y, { depth: TUTORIAL_DEPTH + 1 });
        }
      } else if (step === "enter" && !atTarget) {
        pointer?.container.setVisible(true);
        showGoTip();
      }
    },
    /** Call when Midi walks into a building. */
    notifyEntered: () => {
      step = "done";
      spotlight?.destroy();
      hideTip();
      hideHighlight();
    },
  };
}
