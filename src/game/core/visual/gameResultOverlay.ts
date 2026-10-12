import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { drawOutlinedPill, outlinedButtonTextStyle } from "./outlinedButton";
import { FONT_FAMILY, UI_MOTION } from "./theme";

const GAME_RESULT_TEXTURES = {
  panel: "game-result-panel",
  // The same star art as on the village roofs.
  starEmpty: "game-result-star-empty",
  starFilled: "game-result-star-filled",
} as const;

// Spaced so the card breathes: title, stars, numbers, best score and buttons
// each get their own band, with even gaps between them.
const RESULT_LAYOUT = {
  titleY: -172,
  starsY: -106,
  summaryY: -6,
  buttonsY: 152,
} as const;

/** The layout with number chips (`stats`) instead of a sentence. */
const STATS_LAYOUT = {
  chipsY: -14,
  chipWidth: 210,
  chipHeight: 76,
  chipGap: 28,
  bestY: 66,
  buttonsY: 152,
} as const;

/**
 * The two buttons sit side by side: "마을로 돌아가기" as a quiet cream button
 * on the left, the replay as the one bold teal button on the right.
 */
const RESULT_BUTTON = { width: 240, height: 60, gap: 28, radius: 22 } as const;

// Same face and colours as the start screen, so the two read as one set.
const RESULT_FONT_FAMILY = FONT_FAMILY;

const RESULT_TEXT_COLORS = {
  title: "#315567",
  summary: "#456a78",
} as const;

export type GameResultStat = Readonly<{ label: string; value: string }>;

export type GameResultOverlayConfig = Readonly<{
  title: string;
  stars: number;
  /** A sentence under the stars; ignored when `stats` is given. */
  summary?: string;
  /** Up to three big number chips, e.g. { label: "해결한 손님", value: "4명" }. */
  stats?: readonly GameResultStat[];
  /** The best score so far, with a 새 기록 badge when this play set it. */
  best?: Readonly<{ label: string; value: string; isNew: boolean }>;
  retryLabel: string;
  onRetry: () => void;
  onWorld: () => void;
}>;

export function preloadGameResultOverlayAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.panel)) {
    scene.load.image(GAME_RESULT_TEXTURES.panel, GAME_ASSETS.ui.gameResultPanel);
  }
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.starEmpty)) {
    scene.load.image(GAME_RESULT_TEXTURES.starEmpty, GAME_ASSETS.ui.villageActivityStarEmpty);
  }
  if (!scene.textures.exists(GAME_RESULT_TEXTURES.starFilled)) {
    scene.load.image(GAME_RESULT_TEXTURES.starFilled, GAME_ASSETS.ui.villageActivityStarFilled);
  }
}

export function createGameResultOverlay(
  scene: Phaser.Scene,
  config: GameResultOverlayConfig,
) {
  const shade = scene.add
    .rectangle(0, 0, 1280, 720, 0x102d37, 0.72)
    .setInteractive();
  const panel = scene.add
    .image(0, 0, GAME_RESULT_TEXTURES.panel)
    .setDisplaySize(780, 520);
  const title = scene.add
    .text(0, RESULT_LAYOUT.titleY, config.title, {
      color: RESULT_TEXT_COLORS.title,
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "36px",
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const starRow = createStarRow(scene, config.stars);
  const stats = config.stats?.slice(0, 3) ?? [];
  const layout = stats.length > 0 ? STATS_LAYOUT : RESULT_LAYOUT;
  const statChips = createStatChips(scene, stats);
  const bestLine = stats.length > 0 && config.best ? createBestLine(scene, config.best) : undefined;
  const summary = scene.add
    .text(0, RESULT_LAYOUT.summaryY, stats.length > 0 ? "" : config.summary ?? "", {
      color: RESULT_TEXT_COLORS.summary,
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "23px",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 12,
      wordWrap: { width: 610, useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setResolution(3);

  let actionLocked = false;
  const runOnce = (action: () => void) => {
    if (actionLocked) return;
    actionLocked = true;
    retry.disableInteractive();
    world.disableInteractive();
    action();
  };
  const buttonOffset = (RESULT_BUTTON.width + RESULT_BUTTON.gap) / 2;
  const world = createResultButton(
    scene, -buttonOffset, layout.buttonsY, "마을로 돌아가기", "quiet",
    () => runOnce(config.onWorld),
  );
  const retry = createResultButton(
    scene, buttonOffset, layout.buttonsY, config.retryLabel, "bold",
    () => runOnce(config.onRetry),
  );
  const overlay = scene.add
    .container(640, 360, [
      shade,
      panel,
      title,
      starRow,
      summary,
      ...statChips,
      ...(bestLine ? [bestLine] : []),
      world,
      retry,
    ])
    .setDepth(1_000)
    .setAlpha(0)
    .setScale(0.97);

  shade.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => event.stopPropagation(),
  );
  scene.tweens.add({
    targets: overlay,
    alpha: 1,
    scale: 1,
    duration: 220,
    ease: "Back.easeOut",
  });
  return overlay;
}

/** Big, easy-to-read numbers in soft cream chips, side by side. */
function createStatChips(scene: Phaser.Scene, stats: readonly GameResultStat[]) {
  const { chipWidth: w, chipHeight: h, chipGap: gap, chipsY } = STATS_LAYOUT;
  const total = stats.length * w + Math.max(0, stats.length - 1) * gap;
  return stats.map((stat, index) => {
    const x = -total / 2 + w / 2 + index * (w + gap);
    const plate = scene.add.graphics();
    plate.fillStyle(0x173f43, 0.08).fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 20);
    plate.fillStyle(0xfffaf0, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 20);
    plate.lineStyle(2, 0xd9c7a2, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
    const label = scene.add
      .text(0, -15, stat.label, {
        color: "#5d7a85", fontFamily: RESULT_FONT_FAMILY, fontSize: "16px", fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setResolution(3);
    const value = scene.add
      .text(0, 12, stat.value, {
        color: RESULT_TEXT_COLORS.title, fontFamily: RESULT_FONT_FAMILY, fontSize: "28px", fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setResolution(3);
    return scene.add.container(x, chipsY, [plate, label, value]);
  });
}

/** "최고 기록 240코인", with a small 새 기록! badge when this play set it. */
function createBestLine(scene: Phaser.Scene, best: NonNullable<GameResultOverlayConfig["best"]>) {
  const text = scene.add
    .text(0, 0, `${best.label}  ${best.value}`, {
      color: "#2f7f7b", fontFamily: RESULT_FONT_FAMILY, fontSize: "19px", fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const line = scene.add.container(0, STATS_LAYOUT.bestY, [text]);
  if (!best.isNew) return line;
  const badgeLabel = scene.add
    .text(0, 0, "새 기록!", {
      color: "#ffffff", fontFamily: RESULT_FONT_FAMILY, fontSize: "15px", fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const bw = badgeLabel.width + 22;
  const badge = scene.add.graphics();
  badge.fillStyle(0xe8774f, 1).fillRoundedRect(-bw / 2, -13, bw, 26, 13);
  const badgeBox = scene.add.container(0, 0, [badge, badgeLabel]);
  const totalWidth = text.width + 12 + bw;
  text.setX(-totalWidth / 2 + text.width / 2);
  badgeBox.setX(totalWidth / 2 - bw / 2);
  line.add(badgeBox);
  scene.tweens.add({ targets: badgeBox, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return line;
}

function createStarRow(scene: Phaser.Scene, earnedStars: number) {
  const stars = Phaser.Math.Clamp(Math.round(earnedStars), 0, 3);
  const row = scene.add.container(0, RESULT_LAYOUT.starsY);
  // Like the roof rows in the village: the middle star a little higher and bigger.
  const starYs = [4, -5, 4] as const;
  for (let index = 0; index < 3; index += 1) {
    const filled = index < stars;
    const key = filled ? GAME_RESULT_TEXTURES.starFilled : GAME_RESULT_TEXTURES.starEmpty;
    const size = index === 1 ? 54 : 48;
    const x = (index - 1) * 56;
    const y = starYs[index] ?? 0;
    if (scene.textures.exists(key)) {
      row.add(scene.add.image(x, y + 4, key).setDisplaySize(size, size).setTint(0x173f43).setAlpha(0.16));
      row.add(scene.add.image(x, y, key).setDisplaySize(size, size));
    } else {
      row.add(
        scene.add
          .text(x, y, filled ? "★" : "☆", { color: filled ? "#f3bd3f" : "#b8c7c5", fontFamily: RESULT_FONT_FAMILY, fontSize: "43px" })
          .setOrigin(0.5),
      );
    }
  }
  return row;
}

function createResultButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  kind: "bold" | "quiet",
  onPress: () => void,
) {
  const { width: w, height: h, radius: r } = RESULT_BUTTON;
  const bold = kind === "bold";
  // Thin-outlined like the other buttons: teal for the replay, cream for the way back.
  const plate = drawOutlinedPill(scene.add.graphics(), w, h, bold ? "teal" : "cream", { radius: r + 6 });
  const text = scene.add
    .text(0, -1, label, {
      fontFamily: RESULT_FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      ...outlinedButtonTextStyle(bold ? "teal" : "cream"),
    })
    .setOrigin(0.5)
    .setResolution(3);
  const button = scene.add
    .container(x, y, [plate, text])
    .setSize(w, h + 5)
    .setInteractive({ useHandCursor: true });
  const stopPointer = (
    _pointer: Phaser.Input.Pointer,
    _localX: number,
    _localY: number,
    event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation();
  button.on("pointerdown", stopPointer);
  let pressed = false;
  button.on("pointerover", () => {
    if (pressed) return;
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scale: UI_MOTION.hoverScale,
      duration: 100,
      ease: "Sine.easeOut",
    });
  });
  button.on("pointerout", () => {
    // On a touch screen "out" comes right after "up": it must not cancel the press.
    if (pressed) return;
    scene.tweens.killTweensOf(button);
    scene.tweens.add({ targets: button, scale: 1, duration: 100 });
  });
  button.on(
    "pointerup",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (pressed) return;
      pressed = true;
      scene.tweens.killTweensOf(button);
      scene.tweens.add({
        targets: button,
        scale: UI_MOTION.pressedScale,
        duration: UI_MOTION.pressDurationMs,
        yoyo: true,
        ease: "Sine.easeOut",
      });
      // The action runs on its own timer, so nothing that stops the little
      // press animation (a pointer leaving, a tap elsewhere) can swallow it.
      scene.time.delayedCall(UI_MOTION.pressDurationMs * 2, onPress);
    },
  );
  return button;
}
