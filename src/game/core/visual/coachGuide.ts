import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { DISPLAY_FONT_FAMILY } from "./fonts";
import { drawOutlinedPill, outlinedButtonTextStyle } from "./outlinedButton";
import { COLORS, FONT_FAMILY, TEXT_COLORS, UI_MOTION } from "./theme";

/**
 * Step-by-step tutorial pieces shared by the village and the activities:
 * a card Midi "says" with a 다음 button, a bouncing arrow that points at
 * where to go, and the 3-2-1 countdown before the real game starts.
 */

const openCards = new WeakMap<Phaser.Scene, number>();
const runningCountdowns = new WeakMap<Phaser.Scene, number>();
const MIDI_TEXTURE = "player-front";

export function isCoachCardOpen(scene: Phaser.Scene) {
  return (openCards.get(scene) ?? 0) > 0;
}

/**
 * A scene object lives on across 처음부터 다시 (scene.restart), so whatever
 * was open when it shut down (a card, a 3-2-1, a pause hold) must not carry
 * over: otherwise the restarted game thinks a card is still up and never
 * moves again. Cleared once per run of the scene.
 */
const resetHooked = new WeakSet<Phaser.Scene>();
function clearOnShutdown(scene: Phaser.Scene) {
  if (resetHooked.has(scene)) return;
  resetHooked.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    resetHooked.delete(scene);
    openCards.delete(scene);
    runningCountdowns.delete(scene);
  });
}

/** Counts as an open card (the game waits), e.g. while the pause menu is up. */
export function holdCoachCard(scene: Phaser.Scene) {
  clearOnShutdown(scene);
  openCards.set(scene, (openCards.get(scene) ?? 0) + 1);
}

export function releaseCoachCard(scene: Phaser.Scene) {
  openCards.set(scene, Math.max(0, (openCards.get(scene) ?? 1) - 1));
}

export type CoachCardConfig = Readonly<{
  x?: number;
  y?: number;
  width?: number;
  title: string;
  text: string;
  /** Button label; the card closes when it is pressed. */
  buttonLabel?: string;
  /** Shows "2 / 5" style progress dots. */
  step?: Readonly<{ index: number; total: number }>;
  depth?: number;
  onNext: () => void;
}>;

export type CoachCard = Readonly<{
  container: Phaser.GameObjects.Container;
  /** Closes the card without calling onNext. */
  dismiss: () => void;
}>;

export function createCoachCard(scene: Phaser.Scene, config: CoachCardConfig): CoachCard {
  // Left: Midi with the progress dots under her. Right: the words, and the
  // button at the bottom right under them. The card is only as wide as its
  // words need (up to `width`), so short tips get a small card.
  const maxWidth = Math.max(config.width ?? 0, 620);
  const padding = 22;
  const iconSize = 68;
  const sideRoom = 12;
  const iconColumn = iconSize + sideRoom * 2;
  const gap = 14;
  const buttonWidth = 120;
  const buttonHeight = 44;
  const maxTextWidth = maxWidth - padding * 2 - iconColumn - gap;

  const title = scene.add
    .text(0, 0, config.title, {
      color: TEXT_COLORS.primary, fontFamily: FONT_FAMILY, fontSize: "22px", fontStyle: "bold",
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
    })
    .setResolution(3);
  const body = scene.add
    .text(0, 0, config.text, {
      color: TEXT_COLORS.secondary, fontFamily: FONT_FAMILY, fontSize: "18px", fontStyle: "bold",
      lineSpacing: 5, wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
    })
    .setResolution(3);
  const showDots = Boolean(config.step && config.step.total > 1);
  const dotsRoom = showDots ? 22 : 0;
  const textWidth = Math.max(title.width, body.width, buttonWidth + 60);
  const rightHeight = title.height + 12 + body.height + 12 + buttonHeight;
  const leftHeight = iconSize + dotsRoom;
  const contentHeight = Math.max(rightHeight, leftHeight);
  const width = padding * 2 + iconColumn + gap + textWidth;
  const height = contentHeight + padding * 2;
  const top = -height / 2;
  const left = -width / 2;
  const contentTop = top + padding;
  const textLeft = left + padding + iconColumn + gap;
  title.setPosition(textLeft, contentTop);
  body.setPosition(textLeft, contentTop + title.height + 12);

  const surface = scene.add.graphics();
  surface.fillStyle(COLORS.ink, 0.2).fillRoundedRect(left + 3, top + 6, width, height, 26);
  surface.fillStyle(0xfffdf6, 1).fillRoundedRect(left, top, width, height, 26);
  surface.lineStyle(4, 0x6fb0b2, 1).strokeRoundedRect(left, top, width, height, 26);

  const iconX = left + padding + iconColumn / 2;
  const iconY = contentTop + (contentHeight - leftHeight) / 2 + iconSize / 2;
  const iconBack = scene.add.graphics();
  iconBack.fillStyle(0xdff3ef, 1).fillCircle(iconX, iconY, iconSize / 2);
  const children: Phaser.GameObjects.GameObject[] = [surface, iconBack];
  if (scene.textures.exists(MIDI_TEXTURE)) {
    const midi = scene.add.image(iconX, iconY + 3, MIDI_TEXTURE);
    midi.setScale((iconSize * 0.86) / midi.height);
    children.push(midi);
  }
  children.push(title, body);

  if (config.step && showDots) {
    const dots = scene.add.graphics();
    const dotGap = 13;
    const dotY = iconY + iconSize / 2 + 15;
    const startX = iconX - ((config.step.total - 1) * dotGap) / 2;
    for (let i = 0; i < config.step.total; i += 1) {
      dots.fillStyle(i === config.step.index ? 0x2a8b7e : 0xd9c7a2, 1);
      dots.fillCircle(startX + i * dotGap, dotY, i === config.step.index ? 5 : 4);
    }
    children.push(dots);
  }

  const buttonX = -left - padding - buttonWidth / 2;
  const buttonY = top + height - padding - buttonHeight / 2;
  const buttonSurface = drawOutlinedPill(scene.add.graphics(), buttonWidth, buttonHeight, "teal");
  const buttonLabel = scene.add
    .text(0, -1, `${config.buttonLabel ?? "다음"} ▶`, {
      fontFamily: FONT_FAMILY, fontSize: "17px", fontStyle: "bold", ...outlinedButtonTextStyle("teal"),
    })
    .setOrigin(0.5)
    .setResolution(3);
  const button = scene.add
    .container(buttonX, buttonY, [buttonSurface, buttonLabel])
    .setSize(buttonWidth, buttonHeight)
    .setInteractive({ useHandCursor: true });
  // (Space and Enter still press it; the card text says so where it matters.)
  children.push(button);

  // Touches on the card must not also steer Midi underneath it.
  const hitArea = scene.add
    .rectangle(0, 0, width, height, 0xffffff, 0.001)
    .setInteractive();
  const container = scene.add
    .container(config.x ?? 640, config.y ?? 130, [hitArea, ...children])
    .setDepth(config.depth ?? 1_100);

  clearOnShutdown(scene);
  openCards.set(scene, (openCards.get(scene) ?? 0) + 1);
  let closed = false;
  const keyboard = scene.input.keyboard;
  const openedAt = scene.time.now;
  const close = (next: boolean) => {
    if (closed) return;
    closed = true;
    keyboard?.off("keydown-SPACE", onKey);
    keyboard?.off("keydown-ENTER", onKey);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    openCards.set(scene, Math.max(0, (openCards.get(scene) ?? 1) - 1));
    // The key that closed the card must not also act in the game this frame.
    keyboard?.resetKeys();
    button.disableInteractive();
    scene.tweens.killTweensOf(container);
    scene.tweens.add({
      targets: container, alpha: 0, scale: 0.96, duration: 140, ease: "Sine.easeIn",
      onComplete: () => container.destroy(true),
    });
    if (next) config.onNext();
  };
  const press = () => {
    if (closed) return;
    scene.tweens.add({
      targets: button, scale: UI_MOTION.pressedScale, duration: UI_MOTION.pressDurationMs, yoyo: true,
    });
    close(true);
  };
  function onKey(event: KeyboardEvent) {
    event.preventDefault();
    // Ignore a held key and the press that was still down when the card opened.
    if (event.repeat || scene.time.now - openedAt < 250) return;
    press();
  }
  function onShutdown() {
    closed = true;
    keyboard?.off("keydown-SPACE", onKey);
    keyboard?.off("keydown-ENTER", onKey);
    openCards.delete(scene);
  }
  const stop = (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation();
  hitArea.on("pointerdown", stop);
  button.on("pointerdown", stop);
  button.on("pointerup", (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();
    press();
  });
  keyboard?.on("keydown-SPACE", onKey);
  keyboard?.on("keydown-ENTER", onKey);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);

  container.setAlpha(0).setScale(0.94);
  scene.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
  return { container, dismiss: () => close(false) };
}

export type CoachPointer = Readonly<{
  container: Phaser.GameObjects.Container;
  moveTo: (x: number, y: number) => void;
  destroy: () => void;
}>;

const ARROW_TEXTURE = "coach-arrow";
/** Loads the tutorial arrow; call from a scene's preload. */
export function preloadCoachAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(ARROW_TEXTURE)) {
    scene.load.image(ARROW_TEXTURE, GAME_ASSETS.ui.coachArrow);
  }
}

/**
 * The glossy yellow arrow pointing at (x, y) — from above by default, or from
 * `from: "below" | "left" | "right"` — bouncing toward it, with a pulsing
 * ring on the spot when `ring` is on.
 */
export function createCoachPointer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: Readonly<{
    depth?: number;
    from?: "above" | "below" | "left" | "right";
    ring?: boolean;
    ringWidth?: number;
    ringHeight?: number;
    /** Arrow length on screen (default 96). */
    size?: number;
  }> = {},
): CoachPointer {
  const ringWidth = options.ringWidth ?? 120;
  const ringHeight = options.ringHeight ?? 44;
  const showRing = options.ring ?? true;
  const size = options.size ?? 96;
  const ring = scene.add.ellipse(0, 0, ringWidth, ringHeight).setStrokeStyle(5, 0xffd84d, 1).setVisible(showRing);
  const ringFill = scene.add.ellipse(0, 0, ringWidth, ringHeight, 0xffe680, 0.28).setVisible(showRing);
  const from = options.from ?? "above";
  // The texture points right; rotate it to point at the spot, and stand it
  // off the spot on the side it comes from.
  const angle = { above: 90, below: -90, left: 0, right: 180 }[from];
  const gap = size * 0.72;
  const offset = {
    above: { x: 0, y: -gap },
    below: { x: 0, y: gap },
    left: { x: -gap, y: 0 },
    right: { x: gap, y: 0 },
  }[from];
  const arrowHolder = scene.add.container(offset.x, offset.y);
  if (scene.textures.exists(ARROW_TEXTURE)) {
    const arrow = scene.add.image(0, 0, ARROW_TEXTURE).setAngle(angle);
    arrow.setScale(size / arrow.width);
    arrowHolder.add(arrow);
  } else {
    const arrow = scene.add.graphics();
    arrow.fillStyle(COLORS.ink, 1).fillTriangle(-30, -60, 30, -60, 0, -22);
    arrow.fillStyle(0xffc93c, 1).fillTriangle(-26, -58, 26, -58, 0, -26);
    arrow.setAngle(angle - 90);
    arrowHolder.add(arrow);
  }
  const container = scene.add
    .container(x, y, [ringFill, ring, arrowHolder])
    .setDepth(options.depth ?? 1_050);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    const bounce = 14;
    const toward = { above: { y: offset.y + bounce }, below: { y: offset.y - bounce }, left: { x: offset.x + bounce }, right: { x: offset.x - bounce } }[from];
    scene.tweens.add({ targets: arrowHolder, ...toward, duration: 460, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    scene.tweens.add({ targets: [ring, ringFill], scale: 1.18, alpha: 0.55, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  container.setAlpha(0);
  scene.tweens.add({ targets: container, alpha: 1, duration: 220 });
  return {
    container,
    moveTo: (nextX, nextY) => container.setPosition(nextX, nextY),
    destroy: () => {
      scene.tweens.killTweensOf([container, arrowHolder, ring, ringFill]);
      container.destroy(true);
    },
  };
}

export type CoachSpotlightArea = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "ellipse" | "rect";
}>;

export type CoachSpotlight = Readonly<{
  /** Dims everything except a soft ellipse around (x, y). */
  focus: (x: number, y: number, radiusX: number, radiusY: number) => void;
  /** Dims everything except a soft rounded box. */
  focusRect: (x: number, y: number, width: number, height: number) => void;
  /** Dims everything except several areas at once. */
  focusAreas: (areas: readonly CoachSpotlightArea[]) => void;
  /** Dims the whole screen evenly. */
  dimAll: () => void;
  /** Fades the dimming out; a later focus brings it back. */
  hide: () => void;
  /** Removes it for good. */
  destroy: () => void;
}>;

/**
 * Darkens the scene and lights only the part the player should look at.
 * Drawn on a canvas texture (a dark fill with a soft hole), so it works the
 * same with the WebGL and Canvas renderers.
 */
export function createCoachSpotlight(
  scene: Phaser.Scene,
  options: Readonly<{ depth?: number; alpha?: number }> = {},
): CoachSpotlight {
  const width = 1_280;
  const height = 720;
  const key = `coach-spotlight-${Phaser.Math.RND.uuid()}`;
  const canvas = scene.textures.createCanvas(key, width, height);
  const image = scene.add
    .image(width / 2, height / 2, key)
    .setDepth(options.depth ?? 1_030)
    .setAlpha(0);
  const dimAlpha = options.alpha ?? 0.62;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const paint = (draw?: (context: CanvasRenderingContext2D) => void) => {
    if (!canvas) return;
    const context = canvas.context;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "source-over";
    context.fillStyle = `rgba(16, 45, 55, ${dimAlpha})`;
    context.fillRect(0, 0, width, height);
    if (draw) {
      context.globalCompositeOperation = "destination-out";
      draw(context);
      context.globalCompositeOperation = "source-over";
    }
    canvas.refresh();
  };
  const show = () => {
    scene.tweens.killTweensOf(image);
    scene.tweens.add({ targets: image, alpha: 1, duration: reducedMotion ? 0 : 260 });
  };
  const softEdge = 70;
  // The hole's edge is one smooth blur (a canvas shadow), not stacked rings:
  // the shape itself is drawn far off the canvas and only its blurred shadow
  // lands on the spot, so the light fades out evenly with no visible steps.
  const offCanvas = width * 2;
  const cutArea = (context: CanvasRenderingContext2D, area: CoachSpotlightArea) => {
    const grow = softEdge / 2;
    context.save();
    context.translate(-offCanvas, 0);
    context.shadowColor = "rgba(0, 0, 0, 1)";
    context.shadowBlur = softEdge;
    context.shadowOffsetX = offCanvas;
    context.shadowOffsetY = 0;
    context.beginPath();
    if (area.shape === "rect") {
      context.roundRect(
        area.x - area.width / 2 - grow, area.y - area.height / 2 - grow,
        area.width + grow * 2, area.height + grow * 2, 28 + grow,
      );
    } else {
      context.ellipse(area.x, area.y, area.width / 2 + grow, area.height / 2 + grow, 0, 0, Math.PI * 2);
    }
    context.fillStyle = "rgba(0, 0, 0, 1)";
    context.fill();
    context.restore();
  };
  const focusAreas = (areas: readonly CoachSpotlightArea[]) => {
    paint((context) => areas.forEach((area) => cutArea(context, area)));
    show();
  };

  return {
    focus: (x, y, radiusX, radiusY) =>
      focusAreas([{ x, y, width: radiusX * 2, height: radiusY * 2 }]),
    focusRect: (x, y, boxWidth, boxHeight) =>
      focusAreas([{ x, y, width: boxWidth, height: boxHeight, shape: "rect" }]),
    focusAreas,
    dimAll: () => {
      paint();
      show();
    },
    hide: () => {
      scene.tweens.killTweensOf(image);
      scene.tweens.add({ targets: image, alpha: 0, duration: reducedMotion ? 0 : 220 });
    },
    destroy: () => {
      if (!image.active) return;
      scene.tweens.killTweensOf(image);
      scene.tweens.add({
        targets: image, alpha: 0, duration: reducedMotion ? 0 : 220,
        onComplete: () => {
          image.destroy();
          if (scene.textures.exists(key)) scene.textures.remove(key);
        },
      });
    },
  };
}

/**
 * A big, cheerful "좋아요!" in the display face that pops in at (x, y), holds
 * for `holdMs`, then floats up and fades.
 */
export function showCoachPraise(
  scene: Phaser.Scene,
  text: string,
  x: number,
  y: number,
  options: Readonly<{ depth?: number; holdMs?: number; onDone?: () => void }> = {},
) {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: "64px",
      color: "#ffe066",
      stroke: "#c2471d",
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 6, color: "rgba(60, 20, 0, 0.35)", blur: 0, fill: true },
    })
    .setOrigin(0.5)
    .setResolution(2)
    .setDepth(options.depth ?? 1_120)
    .setScale(0.4)
    .setAlpha(0)
    .setAngle(-6);
  scene.tweens.add({ targets: label, scale: 1, alpha: 1, angle: 0, duration: 320, ease: "Back.easeOut" });
  scene.tweens.add({
    targets: label, y: y - 26, alpha: 0, delay: options.holdMs ?? 1_200, duration: 320, ease: "Sine.easeIn",
    onComplete: () => {
      label.destroy();
      options.onDone?.();
    },
  });
  return label;
}

/**
 * Big "3, 2, 1, 시작!" in the middle of the screen, then onDone. The scene
 * counts as paused (isCoachCardOpen) until then.
 *
 * Each number pops in and fades out on its own little clock (the game's
 * render step), so it looks the same whether the game clock is running (the
 * first count, which 멈춤 simply holds) or frozen (the count after 이어하기).
 */
export function playCoachCountdown(
  scene: Phaser.Scene,
  onDone: () => void,
  options: Readonly<{
    depth?: number;
    /**
     * Count while the scene's clock and tweens are paused (coming back from
     * 멈춤), so nothing in the game moves until "시작!". Otherwise the count
     * holds whenever the scene's clock is paused.
     */
    frozen?: boolean;
    /** The last word; "시작!" unless a place has its own (e.g. "출발!"). */
    goLabel?: string;
  }> = {},
): CoachCountdown {
  const depth = options.depth ?? 1_200;
  const frozen = options.frozen === true;
  clearOnShutdown(scene);
  runningCountdowns.set(scene, (runningCountdowns.get(scene) ?? 0) + 1);
  // Counts as an open card so the game waits until the last word.
  openCards.set(scene, (openCards.get(scene) ?? 0) + 1);
  const shade = scene.add.rectangle(640, 360, 1280, 720, 0x102d37, 0.32).setDepth(depth).setInteractive();
  const labels = ["3", "2", "1", options.goLabel ?? "시작!"];
  const STEP_MS = 800;
  const GO_MS = 560;
  const texts = labels.map((label, index) => {
    const isGo = index === labels.length - 1;
    return scene.add
      .text(640, 350, label, {
        color: isGo ? "#ffe680" : "#fffdf2", fontFamily: FONT_FAMILY,
        fontSize: isGo ? "112px" : "150px", fontStyle: "bold",
        stroke: "#21616a", strokeThickness: 14,
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(depth + 1)
      .setVisible(false);
  });
  const total = STEP_MS * 3 + GO_MS;
  let elapsed = 0;
  let last = performance.now();
  let stopped = false;
  let finished = false;

  const backOut = (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  };
  const clear = () => {
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
    texts.forEach((text) => text.destroy());
    shade.destroy();
  };
  const release = () => {
    runningCountdowns.set(scene, Math.max(0, (runningCountdowns.get(scene) ?? 1) - 1));
    openCards.set(scene, Math.max(0, (openCards.get(scene) ?? 1) - 1));
  };
  function step() {
    const now = performance.now();
    const dt = Math.min(now - last, 50);
    last = now;
    // The first count holds while 멈춤 has the game frozen.
    if (!frozen && scene.time.paused) return;
    elapsed += dt;
    texts.forEach((text, index) => {
      const isGo = index === labels.length - 1;
      const local = elapsed - index * STEP_MS;
      const life = isGo ? GO_MS + 160 : STEP_MS;
      if (local < 0 || local > life) {
        text.setVisible(false);
        return;
      }
      const fadeAt = isGo ? 520 : 600;
      const pop = Math.min(1, local / 260);
      let scale = 1.6 + (1 - 1.6) * backOut(pop);
      let alpha = Math.min(1, pop * 1.2);
      if (local > fadeAt) {
        const out = Math.min(1, (local - fadeAt) / 200);
        const eased = out * out;
        scale = 1 + (0.8 - 1) * eased;
        alpha = 1 - eased;
      }
      text.setVisible(true).setScale(scale).setAlpha(alpha);
    });
    if (!finished && elapsed >= total) {
      // The game goes on at the last word; the shade lifts as it fades.
      finished = true;
      release();
      // The fading shade must not catch the next tap (e.g. on 멈춤).
      shade.disableInteractive();
      scene.input.keyboard?.resetKeys();
      onDone();
    }
    if (finished) {
      const lift = Math.min(1, (elapsed - total) / 160);
      shade.setAlpha(1 - lift);
      if (lift >= 1 && elapsed >= total + 200) {
        stopped = true;
        clear();
      }
    }
  }
  function onShutdown() {
    if (stopped) return;
    stopped = true;
    if (!finished) release();
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, step);
  }
  scene.game.events.on(Phaser.Core.Events.PRE_RENDER, step);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
  return {
    cancel: () => {
      if (stopped) return;
      stopped = true;
      if (!finished) release();
      clear();
    },
  };
}

/** Whether a 3-2-1 is still counting in this scene. */
export function isCoachCountdownRunning(scene: Phaser.Scene) {
  return (runningCountdowns.get(scene) ?? 0) > 0;
}

/** A running 3-2-1; `cancel` takes it off the screen without calling its `onDone`. */
export type CoachCountdown = Readonly<{ cancel: () => void }>;
