import Phaser from "phaser";
import { createGamePauseMenu } from "../../../core/visual/gamePauseMenu";
import { applyArtTone } from "../../../core/visual/artTone";
import {
  createGameStatusHud,
  
} from "../../../core/visual/gameChrome";
import { COLORS, FONT_FAMILY, getTextStyle } from "../../../core/visual/theme";
import { AI_WORKSHOP_LAYOUT } from "./layout";

export type WorkshopBackgroundView = {
  workbenchGlow: Phaser.GameObjects.Rectangle;
  workbenchSprite: Phaser.GameObjects.Image;
};

export type WorkshopHudView = {
  timerText: Phaser.GameObjects.Text;
  coinText: Phaser.GameObjects.Text;
  mistakeText: Phaser.GameObjects.Text;
  customerCountText: Phaser.GameObjects.Text;
  dialoguePanel: Phaser.GameObjects.Graphics;
  dialogueText: Phaser.GameObjects.Text;
  promptText: Phaser.GameObjects.Text;
};

export type WorkshopCustomerView = {
  customerContainer: Phaser.GameObjects.Container;
  customerShadow: Phaser.GameObjects.Ellipse;
  customerArt: Phaser.GameObjects.Image;
  customerEmoji: Phaser.GameObjects.Text;
  customerRoleText: Phaser.GameObjects.Text;
};

export type WorkshopPlayerView = {
  player: Phaser.GameObjects.Container;
  playerSprite: Phaser.GameObjects.Image;
  playerShadow: Phaser.GameObjects.Ellipse;
};

const DIALOGUE_BUBBLE = {
  // Up and to the right of the customer's head; the right edge stays clear
  // of the product shelf panel.
  centerX: 222,
  /** Lowest the bubble's body goes (screen y). */
  anchorBottom: 266,
  minWidth: 292,
  width: 360,
  /** Body corner radius. */
  radius: 26,
  /**
   * The tail: the body sits `headGap` above the head top, and the tail runs
   * `length` down beside the face, ending `faceSide` right of the head centre
   * at about eye/mouth height. `lean` is how far right of the tip its base starts.
   */
  tail: { baseWidth: 28, length: 40, headGap: 16, faceSide: 46, lean: 18 },
  /** Thin outline in the game's ink colour, a cream body. */
  outline: { width: 2.5, color: 0x2b6a80 },
  fill: 0xfffbf2,
  shadow: { offsetY: 4, alpha: 0.12 },
  // Space around the sentence inside the body.
  padding: { left: 22, right: 22, top: 18, bottom: 20 },
  lineHeight: 23,
} as const;


// Customer art uses a shared 454px-wide canvas. Its visual center is 16px to
// the left of the stage anchor, so keep every related element in one aligned
// group instead of correcting the art, shadow, and nameplate separately.
const CUSTOMER_VISUAL_OFFSET_X = 23;
const CUSTOMER_NAMEPLATE_WIDTH = 220;
// Decrease either Y value to move the corresponding element upward.
export const WORKSHOP_CUSTOMER_NAMEPLATE_TUNING = {
  plateY: 160,
  textY: 164,
} as const;

export function createWorkshopBackground(
  scene: Phaser.Scene,
): WorkshopBackgroundView {
  const background = scene.add
    .image(640, 360, "ai-workshop-interior")
    .setDisplaySize(1280, 720)
    .setDepth(0);
  applyArtTone(background, { saturation: -0.04, brightness: 1 });

  const workbenchGlow = scene.add
    .rectangle(
      AI_WORKSHOP_LAYOUT.workbench.x,
      AI_WORKSHOP_LAYOUT.workbench.interactionY,
      570,
      34,
      0x76edf1,
      0.12,
    )
    .setDepth(31)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: workbenchGlow,
    alpha: { from: 0.08, to: 0.3 },
    scale: { from: 0.94, to: 1.05 },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  const workbenchSprite = scene.add
    .image(
      AI_WORKSHOP_LAYOUT.workbench.x,
      AI_WORKSHOP_LAYOUT.workbench.y,
      "ai-workbench-foreground",
    )
    .setDisplaySize(820, 212)
    .setOrigin(0.5, 1)
    .setDepth(AI_WORKSHOP_LAYOUT.workbench.depth);
  applyArtTone(workbenchSprite, { saturation: -0.03, brightness: 1 });
  return { workbenchGlow, workbenchSprite };
}

export function createWorkshopHud(
  scene: Phaser.Scene,
  pause: Parameters<typeof createGamePauseMenu>[1],
): WorkshopHudView {
  createGamePauseMenu(scene, pause);
  const statusHud = createGameStatusHud(scene, [
    "손님 1명",
    "수입 0코인",
    "♥ ♥ ♥",
    "02:00",
  ]);
  const customerCountText = statusHud.texts[0]!;
  const coinText = statusHud.texts[1]!;
  const mistakeText = statusHud.texts[2]!;
  const timerText = statusHud.texts[3]!;

  // The speech bubble is drawn in code (see drawWorkshopDialogueBubble), so its
  // tail can curve toward the customer and the outline stays thin at any size.
  // `dialoguePanel` is the bubble's graphics object; it is hidden until a line is said.
  const dialoguePanel = scene.add.graphics().setDepth(24).setVisible(false);
  const dialogueText = scene.add
    .text(0, 0, "", {
      color: "#111111",
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      lineSpacing: 5,
      wordWrap: {
        width:
          DIALOGUE_BUBBLE.width -
          DIALOGUE_BUBBLE.padding.left -
          DIALOGUE_BUBBLE.padding.right,
        useAdvancedWrap: true,
      },
    })
    .setData(
      "dialogue-max-text-width",
      DIALOGUE_BUBBLE.width -
        DIALOGUE_BUBBLE.padding.left -
        DIALOGUE_BUBBLE.padding.right,
    )
    .setResolution(3)
    .setDepth(25);
  const promptText = scene.add
    .text(690, 680, "손님의 부탁을 들어 보세요", getTextStyle("body", {
      backgroundColor: "#fff9e9e8",
      fontSize: "18px",
      padding: { x: 17, y: 8 },
    }))
    .setOrigin(0.5)
    .setDepth(40)
    // The workshop now teaches the rules in its dedicated start panel.
    // Keep this legacy status channel available to the scene logic, but do
    // not render the repetitive bottom-of-screen tips over the artwork.
    .setVisible(false);

  return {
    timerText,
    coinText,
    mistakeText,
    customerCountText,
    dialoguePanel,
    dialogueText,
    promptText,
  };
}

export function createWorkshopCustomer(
  scene: Phaser.Scene,
): WorkshopCustomerView {
  const artLayout = AI_WORKSHOP_LAYOUT.customerArt;
  const customerShadow = scene.add
    .ellipse(artLayout.x, 104, 104, 16, 0x172b31, 0.16);
  const customerArt = scene.add
    .image(0, 0, "customer-fallback")
    .setDisplaySize(artLayout.width, artLayout.height)
    .setPosition(artLayout.x, artLayout.y);
  const customerEmoji = scene.add
    .text(-54, -55, "🛍️", { fontSize: "37px" })
    .setOrigin(0.5);
  const rolePlate = scene.add.image(
    artLayout.x,
    WORKSHOP_CUSTOMER_NAMEPLATE_TUNING.plateY,
    "workshop-customer-nameplate",
  );
  // The generated nameplate may gain a little vertical padding between
  // revisions. Scaling both axes from one factor preserves its authored ratio.
  rolePlate.setScale(CUSTOMER_NAMEPLATE_WIDTH / rolePlate.width);
  const customerRoleText = scene.add
    .text(0, WORKSHOP_CUSTOMER_NAMEPLATE_TUNING.textY, "오늘의 손님", {
      ...getTextStyle("support", { fontSize: "15px" }),
      color: "#111111",
      align: "center",
    })
    .setOrigin(0.5)
    // The top tab makes the cream writing area sit below the texture center.
    // Align the text with that visible area rather than the full image bounds.
    .setPosition(artLayout.x, WORKSHOP_CUSTOMER_NAMEPLATE_TUNING.textY)
    .setResolution(3);
  const customerVisualGroup = scene.add.container(
    CUSTOMER_VISUAL_OFFSET_X,
    0,
    [
      customerShadow,
      customerArt,
      customerEmoji,
      rolePlate,
      customerRoleText,
    ],
  );
  const customerContainer = scene.add
    .container(-170, AI_WORKSHOP_LAYOUT.customerStage.y, [customerVisualGroup])
    .setDepth(16);
  return {
    customerContainer,
    customerShadow,
    customerArt,
    customerEmoji,
    customerRoleText,
  };
}



function measureWorkshopDialogueLine(
  text: Phaser.GameObjects.Text,
  value: string,
) {
  return (
    text.context.measureText(value).width + value.length * text.letterSpacing
  );
}



export function syncWorkshopDialoguePanel(
  panel: Phaser.GameObjects.Graphics | undefined,
  text: Phaser.GameObjects.Text | undefined,
  /** The customer's head top on screen; the bubble and its tail stay above it. */
  headTopY?: number,
) {
  if (!panel || !text) return;
  if (!text.text) {
    panel.setData("dialogue-signature", "");
    panel.setVisible(false);
    return;
  }
  const layoutText =
    (text.getData("dialogue-layout-text") as string | undefined) ?? text.text;
  const { padding, tail } = DIALOGUE_BUBBLE;
  // Measured once per line of dialogue (this runs every frame); setting the
  // wrap width redraws the text, so that happens only when the width changes.
  let measured = text.getData("dialogue-measured") as { layoutText: string; width: number; lineCount: number } | undefined;
  if (!measured || measured.layoutText !== layoutText) {
    const layoutLines = layoutText.split("\n").filter((line) => line.length > 0);
    const longestLineWidth = Math.max(
      ...layoutLines.map((line) => measureWorkshopDialogueLine(text, line)),
    );
    const width = Phaser.Math.Clamp(
      Math.ceil(longestLineWidth) + padding.left + padding.right + 2,
      DIALOGUE_BUBBLE.minWidth,
      DIALOGUE_BUBBLE.width,
    );
    measured = { layoutText, width, lineCount: Phaser.Math.Clamp(layoutLines.length, 2, 4) };
    text.setData("dialogue-measured", measured);
    const wrapWidth = width - padding.left - padding.right;
    if (text.style.wordWrapWidth !== wrapWidth) text.setWordWrapWidth(wrapWidth, true);
  }
  const { width, lineCount } = measured;
  const bottom = headTopY === undefined
    ? DIALOGUE_BUBBLE.anchorBottom
    : Math.min(DIALOGUE_BUBBLE.anchorBottom, Math.round(headTopY - tail.headGap));
  const tipY = bottom + tail.length;
  const headX = AI_WORKSHOP_LAYOUT.customerStage.x + CUSTOMER_VISUAL_OFFSET_X + AI_WORKSHOP_LAYOUT.customerArt.x;
  const signature = `${layoutText}|${width}|${lineCount}|${tipY}|${headX}`;
  if (panel.getData("dialogue-signature") === signature) return;
  panel.setData("dialogue-signature", signature);

  const bodyHeight = padding.top + padding.bottom + lineCount * DIALOGUE_BUBBLE.lineHeight;
  const left = DIALOGUE_BUBBLE.centerX - width / 2;
  const top = bottom - bodyHeight;
  drawWorkshopDialogueBubble(panel, { left, top, width, height: bodyHeight, tipX: headX + tail.faceSide, tipY });
  panel.setVisible(true);
  text.setPosition(Math.round(left + padding.left), Math.round(top + padding.top));
}

type BubbleShape = Readonly<{ left: number; top: number; width: number; height: number; tipX: number; tipY: number }>;

/**
 * A rounded speech bubble whose tail leaves the bottom edge and curves down
 * to (tipX, tipY), beside the customer's face, so it points at them without touching.
 */
function drawWorkshopDialogueBubble(graphics: Phaser.GameObjects.Graphics, shape: BubbleShape) {
  const { left, top, width, height, tipX, tipY } = shape;
  const { radius, tail, outline, fill, shadow } = DIALOGUE_BUBBLE;
  const right = left + width;
  const bottom = top + height;
  // The tail's base sits a little right of the tip, so it leans toward the head.
  const baseCenter = Phaser.Math.Clamp(tipX + tail.lean, left + radius + tail.baseWidth / 2, right - radius - tail.baseWidth / 2);
  const baseLeft = baseCenter - tail.baseWidth / 2;
  const baseRight = baseCenter + tail.baseWidth / 2;

  const points: Phaser.Math.Vector2[] = [];
  const arc = (cx: number, cy: number, from: number, to: number) => {
    for (let step = 0; step <= 8; step += 1) {
      const angle = from + ((to - from) * step) / 8;
      points.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }
  };
  const curve = (from: Phaser.Math.Vector2, control: Phaser.Math.Vector2, to: Phaser.Math.Vector2) => {
    const bezier = new Phaser.Curves.QuadraticBezier(from, control, to);
    points.push(...bezier.getPoints(10).slice(1));
  };
  // Clockwise from the top-left corner.
  arc(left + radius, top + radius, Math.PI, Math.PI * 1.5);
  arc(right - radius, top + radius, Math.PI * 1.5, Math.PI * 2);
  arc(right - radius, bottom - radius, 0, Math.PI * 0.5);
  points.push(new Phaser.Math.Vector2(baseRight, bottom));
  const tip = new Phaser.Math.Vector2(tipX, tipY);
  // The outer side bows gently and the inner side stays nearly straight,
  // so the tail tapers to a soft point rather than a hook or a blunt nub.
  const length = tipY - bottom;
  curve(new Phaser.Math.Vector2(baseRight, bottom), new Phaser.Math.Vector2(baseRight - 2, bottom + length * 0.68), tip);
  curve(tip, new Phaser.Math.Vector2(baseLeft + 4, bottom + length * 0.5), new Phaser.Math.Vector2(baseLeft, bottom));
  arc(left + radius, bottom - radius, Math.PI * 0.5, Math.PI);

  graphics.clear();
  graphics.fillStyle(0x173f43, shadow.alpha);
  graphics.fillPoints(points.map((point) => new Phaser.Math.Vector2(point.x, point.y + shadow.offsetY)), true);
  graphics.fillStyle(fill, 1);
  graphics.fillPoints(points, true);
  graphics.lineStyle(outline.width, outline.color, 1);
  graphics.strokePoints(points, true, true);
}

export function setWorkshopCustomerRole(
  text: Phaser.GameObjects.Text | undefined,
  value: string,
) {
  if (!text) return;
  const fontSize = 15;
  const availableWidth = 176;
  text.setText(value).setFontSize(fontSize);
  if (text.width > availableWidth) {
    text.setFontSize(
      Math.max(11, Math.floor((fontSize * availableWidth) / text.width)),
    );
  }
}

export function createWorkshopPlayer(scene: Phaser.Scene): WorkshopPlayerView {
  const playerShadow = scene.add.ellipse(0, 57, 80, 23, COLORS.ink, 0.17);
  const playerSprite = scene.add
    .image(0, 0, "player-front")
    // One uniform scale for every facing (frames are 2x, 226 px tall).
    .setScale(125 / 226);
  const player = scene.add
    .container(845, 500, [playerShadow, playerSprite])
    .setDepth(30);
  return { player, playerSprite, playerShadow };
}
