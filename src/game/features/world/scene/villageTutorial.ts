import Phaser from "phaser";
import {
  getWorldTotalStars,
  WORLD_EXIT_REQUIRED_STARS,
  type WorldActivityId,
  type WorldActivityResult,
  type WorldProgressSnapshot,
} from "../../../core/navigation";
import {
  createCoachCard, createCoachPointer, createCoachSpotlight,
  type CoachCard, type CoachPointer, type CoachSpotlight,
} from "../../../core/visual/coachGuide";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import type { MapDefinition, Point } from "../model/mapDefinition";
import type { MidiMood } from "../../../core/player/midiFrames";
import { createVillageMidiBubble, VILLAGE_BUBBLE_LETTER_MS } from "./villageMidiBubble";
import { createVillageMidiFace } from "./villageMidiFace";
import {
  createVillageGateCount, createVillageNameTag, findVillagePlaceLayer, getVillageNameTagPosition,
  VILLAGE_NAME_TAG_DEPTH, type VillagePlaceId,
} from "./villageNameTags";
import { VILLAGE_STAR_TEXTURES } from "./villageProgressPresentation";
import { VILLAGE_UI_DEPTH, type VillageSceneryLayer } from "./villageScenery";

const TUTORIAL_DEPTH = VILLAGE_UI_DEPTH + 20;
const POINTER_DEPTH = VILLAGE_NAME_TAG_DEPTH;
/** Above the village and Midi, below every tip, arrow and button. */
const SPOTLIGHT_DEPTH = VILLAGE_UI_DEPTH - 10;
/** Midi's line closes this long after she starts walking. */
const BUBBLE_HIDE_AFTER_MOVE_MS = 1_000;

/** The two "확인" cards of the first visit (same card as inside the AI 제작소). */
const CARDS = {
  move: { title: "미디를 움직여요", text: "방향키를 누르거나 화면을 터치해서\n미디를 움직일 수 있어요." },
  enter: { title: "건물에 들어가요", text: "입장하기 버튼을 터치하거나,\nSpace 키를 눌러 건물에 들어갈 수 있어요." },
} as const;
const CARD_DEPTH = VILLAGE_UI_DEPTH + 40;
const CARD_WIDTH = 520;
/** The pause after arriving in the village before Midi's first line. */
const FIRST_LINE_DELAY_MS = 500;
/** Card centre heights to try, nearest the middle first; the first one clear of Midi wins. */
const CARD_Y_CHOICES = [300, 480, 190] as const;
const CARD_HALF_HEIGHT = 105;
/** Midi's line when the starlight gate is still locked, closed shortly after it is said. */
const LOCKED_GATE_LINE = "별이 부족해. 더 모아 오자!";
const SHORT_LINE_HOLD_MS = 1_000;
/** Little sparkle dot for the stars' "촤라랑". */
const SPARKLE_TEXTURE = "village-tutorial-sparkle";
const ACTIVITY_PLACES = ["ai-workshop", "data-flight", "ethics-review"] as const;
/** Time between one roof star lighting and the next. */
const STAR_CASCADE_MS = 150;
/** How bright a lit star's glow gets: as it lights, at rest, and at the top of its breath. */
const STAR_GLOW = { pop: 0.32, rest: 0.12, breathe: 0.22 } as const;

const ACTIVITY_NAMES: Record<WorldActivityId, string> = {
  "ai-workshop": "AI 제작소",
  "data-flight": "데이터 비행장",
  "ethics-review": "윤리 심사소",
};

/**
 * Where the ring and arrow stand on the ground in front of each building's
 * door, as an offset from the building image's centre in its displayed size
 * (fractions). x grows to the right, y grows downward.
 */
const DOOR_POINTS: Record<WorldActivityId, Point> = {
  "ai-workshop": { x: 0.42, y: 0.42 },
  "data-flight": { x: 0.3, y: 0.42 },
  "ethics-review": { x: -0.04, y: 0.45 },
};

/** "배움마을" in the display face at the top, like a place name when you arrive. */
function createPlaceTitle(scene: Phaser.Scene, text: string) {
  const title = scene.add
    .text(0, 0, text, {
      fontFamily: DISPLAY_FONT_FAMILY, fontSize: "46px", color: "#ffffff",
      stroke: "#2b5f73", strokeThickness: 9,
      shadow: { offsetX: 0, offsetY: 4, color: "rgba(20, 50, 60, 0.35)", blur: 6, fill: true, stroke: true },
    })
    .setOrigin(0.5)
    .setResolution(2);
  return scene.add.container(640, 52, [title]).setDepth(TUTORIAL_DEPTH).setAlpha(0);
}

/** "로" after a vowel or ㄹ ending, otherwise "으로" (제작소로, 비행장으로). */
function withRoParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11_171) return "로";
  const final = code % 28;
  return final === 0 || final === 8 ? "로" : "으로";
}

export type VillageTutorialOptions = Readonly<{
  mapDefinition: MapDefinition;
  sceneryLayers: readonly VillageSceneryLayer[];
  progress: WorldProgressSnapshot;
  /** True until the player has entered a building once (saved in the browser). */
  firstVisit: boolean;
  /** Stars just brought back from an activity, if any. */
  returnedResult?: WorldActivityResult;
  /** Midi's village sprite, so her mouth and face can move while she talks. */
  playerSprite?: Phaser.GameObjects.Image;
  playerDisplayHeight: number;
}>;

export type VillageTutorial = ReturnType<typeof createVillageTutorial>;

/**
 * Village guidance.
 *
 * First visit (each line waits for a tap or Space; the bubble shows a hint):
 *  1. "배움마을" at the top, Midi lit: "여기가 배움마을이야!"
 *  2. The starlight gate lit with its name tag: "…별빛 졸업길도 이 마을에 있어."
 *  3. "★ 0 / 7" over the gate: "…별이 7개 필요해."
 *  4. The three buildings lit with their name tags: "별은 AI 제작소, …"
 *  5. "먼저 AI 제작소로 가 볼까?" — once said, the AI 제작소 door lights up with
 *     the ring and arrow and the "미디를 움직여요" card opens (Midi waits for 확인).
 *  6. Her line closes 1 s after she starts walking, or as soon as an entry
 *     button is about to show. At the first door she reaches, the
 *     "건물에 들어가요" card opens over the lit entry button. At the AI 제작소
 *     door the ring and arrow go away.
 *
 * Coming back out of any building: "좋아. 계속 별을 모아보자!", closed 1 s
 * after it is said. (No star toast: the stars light up over the building.)
 */
export function createVillageTutorial(scene: Phaser.Scene, options: VillageTutorialOptions) {
  const { mapDefinition, progress } = options;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fadeIn = (target: Phaser.GameObjects.Container) =>
    scene.tweens.add({ targets: target, alpha: 1, duration: 240, ease: "Sine.easeOut" });
  const fadeOutAndDestroy = (target: Phaser.GameObjects.Container | undefined) => {
    if (!target?.active) return;
    scene.tweens.killTweensOf(target);
    scene.tweens.add({ targets: target, alpha: 0, duration: 260, onComplete: () => target.destroy(true) });
  };

  // --- Which building to light up --------------------------------------------
  // Only the first visit points at a building; later Midi just cheers the player on.
  const targetId: WorldActivityId | undefined = options.firstVisit ? "ai-workshop" : undefined;
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
  const toTarget = `${targetName}${withRoParticle(targetName)}`;
  const doorPoint: Point | undefined = targetLayer && targetId
    ? {
      x: targetLayer.definition.position.x + DOOR_POINTS[targetId].x * targetLayer.definition.displaySize.width,
      y: targetLayer.definition.position.y + DOOR_POINTS[targetId].y * targetLayer.definition.displaySize.height,
    }
    : undefined;

  let done = !options.firstVisit;
  let arrived = false;
  const spawn = mapDefinition.defaultSpawn.position;
  let lastPlayer: Point = { ...spawn };
  /** Midi may not move (or go in) while this is true: a card or "tap to go on" is up. */
  let blocking = false;
  let card: CoachCard | undefined;
  let enterCardShown = false;

  // --- Spotlight (first visit only) -------------------------------------------
  const spotlight: CoachSpotlight | undefined = options.firstVisit
    ? createCoachSpotlight(scene, { depth: SPOTLIGHT_DEPTH, alpha: 0.55 })
    : undefined;
  let spotlightOn = Boolean(spotlight);
  let doorLit = false;
  // Repainted only after Midi has moved a little, not every frame.
  let litPlayer: Point | undefined;
  const paintSpotlight = (player: Point) => {
    if (!spotlight || !spotlightOn) return;
    litPlayer = { ...player };
    const midi = { x: player.x, y: player.y - 40, width: 230, height: 200 };
    if (!doorLit || !doorPoint || arrived) {
      spotlight.focusAreas([midi]);
      return;
    }
    // The door, its steps and the ring in front of them.
    spotlight.focusAreas([midi, { x: doorPoint.x - 10, y: doorPoint.y - 55, width: 240, height: 210 }]);
  };
  const spotlightOff = () => {
    spotlightOn = false;
    spotlight?.destroy();
  };

  // --- Midi's line --------------------------------------------------------------
  const bubble = createVillageMidiBubble(scene, TUTORIAL_DEPTH, Boolean(reducedMotion));
  let bubbleOpen = false;
  let hasMoved = false;
  let bubbleHideTimer: Phaser.Time.TimerEvent | undefined;
  const face = createVillageMidiFace(scene, options.playerSprite, options.playerDisplayHeight);
  /** The door a line was said at (it may stay over that door's button); others close it. */
  let lineDoorId: string | undefined;
  const closeBubble = () => {
    bubbleHideTimer?.remove(false);
    bubbleHideTimer = undefined;
    if (!bubbleOpen) return;
    bubbleOpen = false;
    bubble.hide();
    face.end();
  };
  const closeBubbleSoon = () => {
    if (!bubbleOpen || !hasMoved || blocking || bubbleHideTimer) return;
    bubbleHideTimer = scene.time.delayedCall(BUBBLE_HIDE_AFTER_MOVE_MS, closeBubble);
  };
  type SayOptions = Readonly<{
    onDone?: () => void;
    waitForTap?: boolean;
    /** Eyes while talking. */
    mood?: MidiMood;
    /** Face (or the wave) once the line is out. */
    after?: MidiMood | "wave";
    /** Called as letters appear (with how many are showing), for timed effects. */
    onProgress?: (shownCount: number) => void;
  }>;
  const say = (line: string, sayOptions: SayOptions = {}) => {
    bubbleOpen = true;
    const mood = sayOptions.mood ?? "idle";
    face.startLine(mood);
    bubble.say(
      line,
      () => {
        face.rest(sayOptions.after ?? mood);
        sayOptions.onDone?.();
      },
      sayOptions.waitForTap ?? false,
      (letter, shownCount) => {
        if (letter) face.letter(letter, VILLAGE_BUBBLE_LETTER_MS);
        sayOptions.onProgress?.(shownCount);
      },
    );
    bubble.follow(lastPlayer, false);
  };

  // --- Ring, arrow, glow and name tag on the target ----------------------------
  let glow: Phaser.GameObjects.Image | undefined;
  let pointer: CoachPointer | undefined;
  let nameTag: Phaser.GameObjects.Container | undefined;
  const showHighlight = () => {
    if (done || arrived || !targetLayer || !targetId || !doorPoint || glow) return;
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
      targets: glow, alpha: { from: 0.03, to: reducedMotion ? 0.09 : 0.14 },
      duration: 900, yoyo: !reducedMotion, repeat: reducedMotion ? 0 : -1, ease: "Sine.easeInOut",
    });
    pointer = createCoachPointer(scene, doorPoint.x, doorPoint.y, {
      depth: POINTER_DEPTH, ringWidth: 120, ringHeight: 40, size: 110,
    });
    // Above the roof and its stars; the same tag every building shows at its door.
    nameTag = createVillageNameTag(scene, targetId);
    const tagPoint = getVillageNameTagPosition(targetLayer);
    nameTag.setPosition(tagPoint.x, tagPoint.y);
    scene.tweens.add({ targets: nameTag, alpha: 1, duration: 260 });
    doorLit = true;
    paintSpotlight(lastPlayer);
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

  /** A "확인" card; Midi stays still until it is pressed. */
  const openCard = (kind: keyof typeof CARDS, index: number, onClose: () => void) => {
    blocking = true;
    // Near the middle of the screen, but never over Midi (or the entry button above her).
    const midiTop = lastPlayer.y - 175;
    const midiBottom = lastPlayer.y + 15;
    const overlapsMidi = (y: number) =>
      Math.abs(lastPlayer.x - 640) < CARD_WIDTH / 2 + 70 &&
      y - CARD_HALF_HEIGHT < midiBottom && y + CARD_HALF_HEIGHT > midiTop;
    const y = CARD_Y_CHOICES.find((choice) => !overlapsMidi(choice)) ?? CARD_Y_CHOICES[0];
    card = createCoachCard(scene, {
      x: 640, y, width: CARD_WIDTH, ...CARDS[kind], buttonLabel: "확인",
      step: { index, total: 2 }, depth: CARD_DEPTH,
      onNext: () => {
        card = undefined;
        blocking = false;
        onClose();
        closeBubbleSoon();
      },
    });
  };

  // --- First visit: the welcome tour, one line per tap --------------------------
  const tourTags: Phaser.GameObjects.Container[] = [];
  const clearTourTags = () => {
    for (const tag of tourTags.splice(0)) fadeOutAndDestroy(tag);
  };
  const showTourTag = (placeId: VillagePlaceId, delay = 0) => {
    const layer = findVillagePlaceLayer(options.sceneryLayers, placeId);
    if (!layer) return;
    const tag = createVillageNameTag(scene, placeId);
    const point = getVillageNameTagPosition(layer);
    tag.setPosition(point.x, point.y);
    tourTags.push(tag);
    scene.tweens.add({ targets: tag, alpha: 1, delay, duration: 260 });
  };
  /**
   * Spotlight on Midi plus whole buildings, with room around each one like
   * Midi's own (an ellipse has to be wider than the picture to take in its
   * corners, plus a little ground around it).
   */
  const lightPlaces = (placeIds: readonly VillagePlaceId[]) => {
    if (!spotlight) return;
    const areas = placeIds.flatMap((placeId) => {
      const layer = findVillagePlaceLayer(options.sceneryLayers, placeId);
      if (!layer) return [];
      const { position, displaySize } = layer.definition;
      return [{ x: position.x, y: position.y, width: displaySize.width * 1.28, height: displaySize.height * 1.2 }];
    });
    spotlight.focusAreas([{ x: spawn.x, y: spawn.y - 40, width: 230, height: 200 }, ...areas]);
  };

  // A building "lights up": a warm glow over its picture, its name tag, and the spotlight.
  const tourGlows: Phaser.GameObjects.Image[] = [];
  const litPlaces: VillagePlaceId[] = [];
  const lightUpPlace = (placeId: VillagePlaceId) => {
    if (litPlaces.includes(placeId)) return;
    litPlaces.push(placeId);
    lightPlaces(litPlaces);
    showTourTag(placeId);
    const layer = findVillagePlaceLayer(options.sceneryLayers, placeId);
    if (!layer) return;
    const { definition, image } = layer;
    const shine = scene.add
      .image(definition.position.x, definition.position.y, definition.assetKey)
      .setDisplaySize(definition.displaySize.width, definition.displaySize.height)
      .setFlipX(definition.flipX === true)
      .setTint(0xfff0b0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(image.depth + 0.005)
      .setAlpha(0);
    tourGlows.push(shine);
    // A faint warm blink as it switches on, then just the spotlight, the same
    // as Midi (no lasting glow, so the picture is never glaring).
    scene.tweens.add({
      targets: shine, alpha: { from: 0, to: reducedMotion ? 0.04 : 0.08 }, duration: 220, ease: "Sine.easeOut",
      onComplete: () => {
        scene.tweens.add({ targets: shine, alpha: 0, duration: 520, ease: "Sine.easeIn" });
      },
    });
  };
  const clearTourGlows = () => {
    for (const shine of tourGlows.splice(0)) {
      scene.tweens.killTweensOf(shine);
      scene.tweens.add({ targets: shine, alpha: 0, duration: 260, onComplete: () => shine.destroy() });
    }
    litPlaces.splice(0);
  };

  /**
   * "촤라랑": on each roof the stars light up one after another (left to right),
   * on all three buildings at the same time, with a few soft sparkles; then
   * they keep a gentle glow until Midi's next line.
   */
  let starsSparkled = false;
  const sparkleStars = () => {
    if (starsSparkled) return;
    starsSparkled = true;
    if (!scene.textures.exists(SPARKLE_TEXTURE)) {
      const dot = scene.make.graphics({ x: 0, y: 0 }, false);
      dot.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
      dot.generateTexture(SPARKLE_TEXTURE, 12, 12);
      dot.destroy();
    }
    ACTIVITY_PLACES.forEach((placeId) => {
      const row = scene.children.getByName(`village-stars-${placeId}`) as Phaser.GameObjects.Container | null;
      if (!row) return;
      const stars = row.list
        .filter((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image && child.alpha === 1)
        .sort((a, b) => a.x - b.x);
      stars.forEach((star, starIndex) => {
        const delay = reducedMotion ? 0 : starIndex * STAR_CASCADE_MS;
        const x = row.x + star.x;
        const y = row.y + star.y;
        const glowStar = scene.add
          .image(x, y, VILLAGE_STAR_TEXTURES.filled)
          .setDisplaySize(star.displayWidth, star.displayHeight)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(TUTORIAL_DEPTH - 2)
          .setAlpha(0);
        tourGlows.push(glowStar);
        const rest = { x: glowStar.scaleX, y: glowStar.scaleY };
        // A soft pop as it lights, then a calm glow that breathes until the next line.
        scene.tweens.add({
          targets: glowStar, alpha: STAR_GLOW.pop, scaleX: rest.x * 1.18, scaleY: rest.y * 1.18,
          delay, duration: 200, ease: "Sine.easeOut",
          onComplete: () => {
            scene.tweens.add({
              targets: glowStar, alpha: STAR_GLOW.rest, scaleX: rest.x, scaleY: rest.y, duration: 320, ease: "Sine.easeInOut",
              onComplete: () => {
                if (reducedMotion) return;
                scene.tweens.add({
                  targets: glowStar, alpha: { from: STAR_GLOW.rest, to: STAR_GLOW.breathe },
                  duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
                });
              },
            });
          },
        });
        if (reducedMotion) return;
        scene.time.delayedCall(delay, () => {
          const burst = scene.add.particles(x, y, SPARKLE_TEXTURE, {
            emitting: false, lifespan: { min: 380, max: 650 }, speed: { min: 30, max: 90 },
            scale: { start: 0.35, end: 0 }, alpha: { start: 0.5, end: 0 },
            tint: [0xffffff, 0xfff2a8], blendMode: Phaser.BlendModes.ADD,
          }).setDepth(TUTORIAL_DEPTH - 1);
          burst.explode(4);
          scene.time.delayedCall(800, () => burst.destroy());
        });
      });
    });
  };

  /** "(star) 0 / 7" on the middle of the tablet while Midi explains it. */
  let gateCount: Phaser.GameObjects.Container | undefined;
  const showGateCount = () => {
    const layer = findVillagePlaceLayer(options.sceneryLayers, "starlight-exit");
    if (!layer || gateCount) return;
    gateCount = createVillageGateCount(
      scene, layer, getWorldTotalStars(progress), WORLD_EXIT_REQUIRED_STARS, TUTORIAL_DEPTH,
    ).setScale(0.8);
    scene.tweens.add({ targets: gateCount, alpha: 1, scale: 1, duration: 320, ease: "Back.easeOut" });
  };
  const hideGateCount = () => {
    fadeOutAndDestroy(gateCount);
    gateCount = undefined;
  };

  const STAR_LINE = "AI 제작소, 데이터 비행장,\n윤리 심사소에서 별을 얻을 수 있을 거야.";
  // As Midi says each name, that building lights up; at "별을" the stars sparkle.
  const starLineCues: readonly Readonly<{ at: number; run: () => void }>[] = [
    { at: STAR_LINE.indexOf("AI 제작소") + 1, run: () => lightUpPlace("ai-workshop") },
    { at: STAR_LINE.indexOf("데이터 비행장") + 1, run: () => lightUpPlace("data-flight") },
    { at: STAR_LINE.indexOf("윤리 심사소") + 1, run: () => lightUpPlace("ethics-review") },
    { at: STAR_LINE.indexOf("별을") + 1, run: sparkleStars },
  ];

  const tour: readonly Readonly<{ line: string; say: SayOptions; enter: () => void }>[] = [
    {
      line: "여기가 배움마을이야!",
      say: { mood: "happy", after: "wave" },
      enter: () => {
        paintSpotlight(spawn);
        placeTitle = createPlaceTitle(scene, "배움마을");
        fadeIn(placeTitle);
      },
    },
    {
      line: "너희들의 세계로 통하는 별빛 졸업길도 이 마을에 있어.",
      say: { mood: "idle", after: "idle" },
      enter: () => {
        fadeOutAndDestroy(placeTitle);
        placeTitle = undefined;
        lightPlaces(["starlight-exit"]);
        showTourTag("starlight-exit");
      },
    },
    {
      line: `별빛 졸업길을 열려면 별 ${WORLD_EXIT_REQUIRED_STARS}개를 모아야 해.`,
      say: { mood: "surprised", after: "idle" },
      enter: showGateCount,
    },
    {
      line: STAR_LINE,
      say: {
        mood: "happy",
        after: "happy",
        onProgress: (shownCount) => {
          for (const cue of starLineCues) if (shownCount >= cue.at) cue.run();
        },
      },
      enter: () => {
        hideGateCount();
        clearTourTags();
        lightPlaces([]);
      },
    },
  ];
  let placeTitle: Phaser.GameObjects.Container | undefined;
  let tourIndex = -1;
  let waitingForTap = false;
  const stopListening = () => {
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, onTourTap);
    scene.input.keyboard?.off("keydown-SPACE", onTourKey);
    scene.input.keyboard?.off("keydown-ENTER", onTourKey);
  };
  const nextTourLine = () => {
    tourIndex += 1;
    const step = tour[tourIndex];
    if (step) {
      step.enter();
      say(step.line, { ...step.say, waitForTap: true });
      return;
    }
    // Tour over: back to Midi, then "go to the AI 제작소" with its card.
    waitingForTap = false;
    stopListening();
    clearTourTags();
    clearTourGlows();
    paintSpotlight(lastPlayer);
    say(`먼저 ${toTarget} 가 볼까?`, {
      mood: "happy",
      after: "idle",
      onDone: () => {
        showHighlight();
        openCard("move", 0, () => undefined);
      },
    });
  };
  const advanceTour = () => {
    if (!waitingForTap) return;
    if (bubble.isTyping()) {
      bubble.finish();
      return;
    }
    // The key that went on must not also act in the village this frame.
    scene.input.keyboard?.resetKeys();
    nextTourLine();
  };
  // (The "처음부터" button stops its own taps, so they never reach this.)
  function onTourTap() {
    advanceTour();
  }
  function onTourKey(event: KeyboardEvent) {
    if (event.repeat) return;
    event.preventDefault();
    advanceTour();
  }

  if (options.firstVisit) {
    // On arrival the village dims at once with the light on Midi; she starts
    // talking a moment later.
    blocking = true;
    waitingForTap = true;
    paintSpotlight(spawn);
    scene.time.delayedCall(FIRST_LINE_DELAY_MS, () => {
      if (done) return;
      nextTourLine();
      scene.input.on(Phaser.Input.Events.POINTER_DOWN, onTourTap);
      scene.input.keyboard?.on("keydown-SPACE", onTourKey);
      scene.input.keyboard?.on("keydown-ENTER", onTourKey);
    });
  }

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    done = true;
    stopListening();
    card?.dismiss();
    spotlight?.destroy();
    bubble.destroy();
    placeTitle?.destroy(true);
    gateCount?.destroy(true);
    for (const tag of tourTags) tag.destroy(true);
    for (const shine of tourGlows) shine.destroy();
    pointer?.destroy();
    glow?.destroy();
    nameTag?.destroy(true);
  });

  return {
    /**
     * At the locked starlight gate: Midi says the stars are not enough yet.
     * The line closes 1 s after it is said, or as soon as she reaches another door.
     */
    /** True while the "별이 부족해" line is up at this door (its button hides then). */
    isGateLineUp: (portalId: string | undefined) => lineDoorId !== undefined && lineDoorId === portalId,
    sayGateLocked: (portalId: string) => {
      if (blocking) return;
      say(LOCKED_GATE_LINE, {
        mood: "worried",
        after: "idle",
        onDone: () => {
          bubbleHideTimer?.remove(false);
          bubbleHideTimer = scene.time.delayedCall(SHORT_LINE_HOLD_MS, closeBubble);
        },
      });
      lineDoorId = portalId;
    },
    /** True while a card or the welcome line is up: Midi must not move or go in. */
    isBlocking: () => blocking,
    /** Call once the player has moved for the first time. */
    notifyMoved: () => {
      hasMoved = true;
      closeBubbleSoon();
    },
    /**
     * Call every frame with Midi's position, the portal whose entry prompt
     * is showing (undefined when none), the portal she stands at and whether
     * she is still on her way somewhere (a tap target or a held key).
     */
    update: (
      playerPosition: Point,
      promptPortalId: string | undefined,
      nearPortalId = promptPortalId,
      playerMoving = false,
    ) => {
      lastPlayer = playerPosition;
      const atDoor = promptPortalId !== undefined;
      // Her line must never sit over another door's entry button: it closes first.
      if (atDoor && !blocking && promptPortalId !== lineDoorId) closeBubble();
      // Leaving the gate forgets the locked line, so the button shows again on
      // return. The button itself is hidden while the line is up, so "leaving"
      // is judged by the door Midi stands at, not by the button.
      if (lineDoorId !== undefined && nearPortalId !== lineDoorId) lineDoorId = undefined;
      bubble.follow(playerPosition, atDoor);
      if (done) return;
      if (spotlightOn && !blocking) {
        const moved = litPlayer
          ? Math.hypot(playerPosition.x - litPlayer.x, playerPosition.y - litPlayer.y)
          : Number.POSITIVE_INFINITY;
        if (moved > 28) paintSpotlight(playerPosition);
      }
      if (glow && targetLayer) glow.setDepth(targetLayer.image.depth + 0.005);
      // The door's front yard is wide, so Midi often enters it on her way to
      // the spot that was tapped: the ring and the card wait until she stops.
      if (!arrived && targetPortal && promptPortalId === targetPortal.id && !playerMoving) {
        // At the target door: the ring and arrow are done.
        arrived = true;
        hideHighlight();
      }
      if (options.firstVisit && atDoor && !enterCardShown && !blocking && !playerMoving) {
        // First door reached: light Midi and the entry button above her, then explain it.
        enterCardShown = true;
        spotlight?.focusAreas([{ x: playerPosition.x, y: playerPosition.y - 85, width: 260, height: 250 }]);
        openCard("enter", 1, spotlightOff);
      }
    },
    /** Call when Midi walks into a building. */
    notifyEntered: () => {
      done = true;
      spotlightOff();
      closeBubble();
      hideHighlight();
    },
  };
}
