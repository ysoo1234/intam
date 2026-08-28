import Phaser from "phaser";
import { applyArtTone } from "../../../core/visual/artTone";
import {
  createGameStatusHud,
  createVillageReturnButton,
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
  dialoguePanel: Phaser.GameObjects.Image;
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
  centerX: 190,
  anchorBottom: 312,
  minWidth: 292,
  width: 360,
  sourceWidth: 420,
  // Keep the authored vertical proportions even when the bubble is made a
  // little narrower. Tying this to `width` would also shrink the requested
  // top/bottom breathing room.
  verticalScale: 380 / 420,
  // Preserve the authored curves and centered tail as fixed caps. Only the
  // straight-sided middle strip is repeated when another text line is needed.
  top: { y: 0, height: 42 },
  middle: { y: 96, height: 24 },
  bottomSlice: { y: 160, height: 71 },
  // Horizontal caps and the tail keep their source proportions. Only the
  // featureless straight strips between them resize with the sentence.
  sideCapWidth: 42,
  tail: { x: 172, width: 76 },
  tailHeight: 34,
  // User-tunable dialogue whitespace. The top/bottom values add only straight
  // middle-strip space, so the authored curves and tail never get distorted.
  padding: {
    left: 22,
    right: 22,
    top: 20,
    bottom: 20,
  },
  // The fixed top cap already contains this much room above the text.
  intrinsicTextTop: 12,
} as const;

type DialogueBubbleThreeSlice = [
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
];

type DialogueBubbleFiveSlice = [
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
  Phaser.GameObjects.Image,
];

type DialogueBubbleSegments = {
  top: DialogueBubbleThreeSlice;
  middles: DialogueBubbleThreeSlice[];
  bottom: DialogueBubbleFiveSlice;
};

const DIALOGUE_SEGMENTS_DATA_KEY = "dialogue-segments";

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
  onBack: () => void,
): WorkshopHudView {
  createVillageReturnButton(scene, onBack);
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

  const dialogueTexture = scene.textures.get("workshop-dialogue-bubble");
  const capWidth = DIALOGUE_BUBBLE.sideCapWidth;
  const rightCapX = DIALOGUE_BUBBLE.sourceWidth - capWidth;
  const tailRight = DIALOGUE_BUBBLE.tail.x + DIALOGUE_BUBBLE.tail.width;
  const dialogueFrames = [
    { frame: "dialogue-top-left", x: 0, ...DIALOGUE_BUBBLE.top, width: capWidth },
    {
      frame: "dialogue-top-middle",
      x: capWidth,
      ...DIALOGUE_BUBBLE.top,
      width: rightCapX - capWidth,
    },
    {
      frame: "dialogue-top-right",
      x: rightCapX,
      ...DIALOGUE_BUBBLE.top,
      width: capWidth,
    },
    {
      frame: "dialogue-middle-left",
      x: 0,
      ...DIALOGUE_BUBBLE.middle,
      width: capWidth,
    },
    {
      frame: "dialogue-middle-center",
      x: capWidth,
      ...DIALOGUE_BUBBLE.middle,
      width: rightCapX - capWidth,
    },
    {
      frame: "dialogue-middle-right",
      x: rightCapX,
      ...DIALOGUE_BUBBLE.middle,
      width: capWidth,
    },
    {
      frame: "dialogue-bottom-left",
      x: 0,
      ...DIALOGUE_BUBBLE.bottomSlice,
      width: capWidth,
    },
    {
      frame: "dialogue-bottom-left-fill",
      x: capWidth,
      ...DIALOGUE_BUBBLE.bottomSlice,
      width: DIALOGUE_BUBBLE.tail.x - capWidth,
    },
    {
      frame: "dialogue-bottom-tail",
      x: DIALOGUE_BUBBLE.tail.x,
      ...DIALOGUE_BUBBLE.bottomSlice,
      width: DIALOGUE_BUBBLE.tail.width,
    },
    {
      frame: "dialogue-bottom-right-fill",
      x: tailRight,
      ...DIALOGUE_BUBBLE.bottomSlice,
      width: rightCapX - tailRight,
    },
    {
      frame: "dialogue-bottom-right",
      x: rightCapX,
      ...DIALOGUE_BUBBLE.bottomSlice,
      width: capWidth,
    },
  ] as const;
  dialogueFrames.forEach(({ frame, x, y, width, height }) => {
    if (!dialogueTexture.has(frame)) {
      dialogueTexture.add(frame, 0, x, y, width, height);
    }
  });

  const createDialogueSegment = (frame: string) =>
    scene.add
      .image(0, 0, "workshop-dialogue-bubble", frame)
      .setOrigin(0)
      .setDepth(24)
      .setVisible(false);

  const dialoguePanel = createDialogueSegment("dialogue-top-left");
  const dialogueTopPanels: DialogueBubbleThreeSlice = [
    dialoguePanel,
    createDialogueSegment("dialogue-top-middle"),
    createDialogueSegment("dialogue-top-right"),
  ];
  const dialogueMiddlePanels = [0, 1, 2].map(() =>
    [
      createDialogueSegment("dialogue-middle-left"),
      createDialogueSegment("dialogue-middle-center"),
      createDialogueSegment("dialogue-middle-right"),
    ] as DialogueBubbleThreeSlice,
  );
  const dialogueBottomPanels: DialogueBubbleFiveSlice = [
    createDialogueSegment("dialogue-bottom-left"),
    createDialogueSegment("dialogue-bottom-left-fill"),
    createDialogueSegment("dialogue-bottom-tail"),
    createDialogueSegment("dialogue-bottom-right-fill"),
    createDialogueSegment("dialogue-bottom-right"),
  ];
  dialoguePanel.setData(DIALOGUE_SEGMENTS_DATA_KEY, {
    top: dialogueTopPanels,
    middles: dialogueMiddlePanels,
    bottom: dialogueBottomPanels,
  } satisfies DialogueBubbleSegments);
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

export function syncWorkshopCustomerShadow(
  customerShadow: Phaser.GameObjects.Ellipse | undefined,
  customerArt: Phaser.GameObjects.Image | undefined,
) {
  if (!customerShadow || !customerArt) return;
  customerShadow
    .setDisplaySize(
      Phaser.Math.Clamp(customerArt.displayWidth * 0.48, 82, 112),
      16,
    )
    .setPosition(
      customerArt.x,
      customerArt.y + customerArt.displayHeight / 2 - 24,
    )
    .setVisible(customerArt.visible);
}

function getDialogueBubbleSegments(
  panel: Phaser.GameObjects.Image,
): DialogueBubbleSegments | undefined {
  return panel.getData(DIALOGUE_SEGMENTS_DATA_KEY) as
    | DialogueBubbleSegments
    | undefined;
}

function setDialogueBubbleVisible(
  panel: Phaser.GameObjects.Image,
  visible: boolean,
) {
  const segments = getDialogueBubbleSegments(panel);
  segments?.top.forEach((segment) => segment.setVisible(visible));
  segments?.bottom.forEach((segment) => segment.setVisible(visible));
  segments?.middles.flat().forEach((segment) => segment.setVisible(false));
}

function measureWorkshopDialogueLine(
  text: Phaser.GameObjects.Text,
  value: string,
) {
  return (
    text.context.measureText(value).width + value.length * text.letterSpacing
  );
}

function layoutDialogueThreeSlice(
  row: DialogueBubbleThreeSlice,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const capWidth = DIALOGUE_BUBBLE.sideCapWidth * DIALOGUE_BUBBLE.verticalScale;
  const middleWidth = width - capWidth * 2;
  row[0].setPosition(left, top).setDisplaySize(capWidth, height);
  row[1]
    .setPosition(left + capWidth, top)
    .setDisplaySize(middleWidth, height);
  row[2]
    .setPosition(left + capWidth + middleWidth, top)
    .setDisplaySize(capWidth, height);
}

function layoutDialogueBottomSlice(
  row: DialogueBubbleFiveSlice,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const scale = DIALOGUE_BUBBLE.verticalScale;
  const capWidth = DIALOGUE_BUBBLE.sideCapWidth * scale;
  const tailWidth = DIALOGUE_BUBBLE.tail.width * scale;
  const fillWidth = (width - capWidth * 2 - tailWidth) / 2;
  const widths = [capWidth, fillWidth, tailWidth, fillWidth, capWidth];
  let nextX = left;
  row.forEach((segment, index) => {
    const segmentWidth = widths[index] ?? 0;
    segment.setPosition(nextX, top).setDisplaySize(segmentWidth, height);
    nextX += segmentWidth;
  });
}

export function syncWorkshopDialoguePanel(
  panel: Phaser.GameObjects.Image | undefined,
  text: Phaser.GameObjects.Text | undefined,
) {
  if (!panel || !text) return;
  if (!text.text) {
    panel.setData("dialogue-signature", "");
    setDialogueBubbleVisible(panel, false);
    return;
  }
  const segments = getDialogueBubbleSegments(panel);
  if (!segments) return;

  const layoutText =
    (text.getData("dialogue-layout-text") as string | undefined) ?? text.text;
  const layoutLines = layoutText.split("\n").filter((line) => line.length > 0);
  const longestLineWidth = Math.max(
    ...layoutLines.map((line) => measureWorkshopDialogueLine(text, line)),
  );
  const width = Phaser.Math.Clamp(
    Math.ceil(longestLineWidth) +
      DIALOGUE_BUBBLE.padding.left +
      DIALOGUE_BUBBLE.padding.right +
      2,
    DIALOGUE_BUBBLE.minWidth,
    DIALOGUE_BUBBLE.width,
  );
  const textWidth =
    width - DIALOGUE_BUBBLE.padding.left - DIALOGUE_BUBBLE.padding.right;
  text.setWordWrapWidth(textWidth, true);
  const lineCount = Phaser.Math.Clamp(layoutLines.length, 2, 4);
  const signature = `${layoutText}|${width}|${lineCount}`;
  if (panel.getData("dialogue-signature") === signature) return;
  panel.setData("dialogue-signature", signature);
  const middleCount = lineCount - 2;
  const scale = DIALOGUE_BUBBLE.verticalScale;
  const topHeight = DIALOGUE_BUBBLE.top.height * scale;
  const standardMiddleHeight = DIALOGUE_BUBBLE.middle.height * scale;
  const middleHeights = [
    (DIALOGUE_BUBBLE.padding.top + DIALOGUE_BUBBLE.padding.bottom) * scale,
    ...Array.from(
      { length: middleCount },
      () => standardMiddleHeight,
    ),
  ];
  const bottomHeight = DIALOGUE_BUBBLE.bottomSlice.height * scale;
  const height =
    topHeight +
    middleHeights.reduce((total, middleHeight) => total + middleHeight, 0) +
    bottomHeight;
  const left = DIALOGUE_BUBBLE.centerX - width / 2;
  const top = DIALOGUE_BUBBLE.anchorBottom - height;

  setDialogueBubbleVisible(panel, true);
  layoutDialogueThreeSlice(segments.top, left, top, width, topHeight);

  let nextY = top + topHeight;
  segments.middles.forEach((middleRow, index) => {
    const middleHeight = middleHeights[index] ?? 0;
    const visible = middleHeight > 0;
    middleRow.forEach((middle) => middle.setVisible(visible));
    if (visible) {
      layoutDialogueThreeSlice(
        middleRow,
        left,
        nextY,
        width,
        middleHeight,
      );
    }
    if (visible) nextY += middleHeight;
  });
  layoutDialogueBottomSlice(segments.bottom, left, nextY, width, bottomHeight);

  text.setPosition(
    Math.round(left + DIALOGUE_BUBBLE.padding.left),
    Math.round(
      top +
        DIALOGUE_BUBBLE.intrinsicTextTop +
        DIALOGUE_BUBBLE.padding.top * scale,
    ),
  );
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
    .setDisplaySize(110, 125);
  const player = scene.add
    .container(845, 500, [playerShadow, playerSprite])
    .setDepth(30);
  return { player, playerSprite, playerShadow };
}
