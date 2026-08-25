import Phaser from "phaser";
import { applyArtTone } from "../../../core/visual/artTone";
import {
  COLORS,
  getTextStyle,
  TEXT_COLORS,
} from "../../../core/visual/theme";
import {
  addSpeechBubble,
  addUiButton,
  addUiSurface,
} from "../../../core/visual/uiPrimitives";
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
  dialogueText: Phaser.GameObjects.Text;
  promptText: Phaser.GameObjects.Text;
};

export type WorkshopCustomerView = {
  customerContainer: Phaser.GameObjects.Container;
  customerShadow: Phaser.GameObjects.Image;
  customerArt: Phaser.GameObjects.Image;
  customerEmoji: Phaser.GameObjects.Text;
  customerRoleText: Phaser.GameObjects.Text;
};

export type WorkshopPlayerView = {
  player: Phaser.GameObjects.Container;
  playerSprite: Phaser.GameObjects.Image;
  playerShadow: Phaser.GameObjects.Ellipse;
};

export function createWorkshopBackground(
  scene: Phaser.Scene,
): WorkshopBackgroundView {
  const background = scene.add
    .image(640, 360, "ai-workshop-interior")
    .setDisplaySize(1280, 720)
    .setDepth(0);
  applyArtTone(background, { saturation: -0.14, brightness: 1.01 });
  scene.add
    .rectangle(640, 360, 1270, 710, 0xffffff, 0)
    .setStrokeStyle(8, COLORS.ink, 0.95)
    .setDepth(45);

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
  applyArtTone(workbenchSprite, { saturation: -0.08, brightness: 1.01 });
  return { workbenchGlow, workbenchSprite };
}

export function createWorkshopHud(
  scene: Phaser.Scene,
  onBack: () => void,
): WorkshopHudView {
  const back = createRoundButton(scene, 55, 52, "←", onBack);
  back.setDepth(60);

  addUiSurface(
    scene,
    { x: 102, y: 20, width: 250, height: 64 },
    "dark",
    {
      radius: 26,
      fillAlpha: 0.94,
      borderColor: COLORS.cream,
      borderAlpha: 1,
      borderWidth: 4,
      shadow: "small",
      depth: 50,
    },
  );
  scene.add
    .text(227, 52, "생활 속 AI 제작소", getTextStyle("heading", {
      color: TEXT_COLORS.onDark,
      fontSize: "24px",
    }))
    .setOrigin(0.5)
    .setDepth(51);

  addUiSurface(
    scene,
    { x: 730, y: 20, width: 520, height: 64 },
    "raised",
    {
      radius: 26,
      fillAlpha: 0.94,
      borderWidth: 4,
      shadow: "small",
      depth: 50,
    },
  );
  const customerCountText = scene.add
    .text(760, 52, "손님 1", getTextStyle("body", {
      fontSize: "20px",
    }))
    .setOrigin(0, 0.5)
    .setDepth(51);
  const coinText = scene.add
    .text(920, 52, "💰 0", getTextStyle("body", {
      color: "#a06024",
      fontSize: "20px",
    }))
    .setOrigin(0.5)
    .setDepth(51);
  const mistakeText = scene.add
    .text(1068, 52, "실수 ♡ ♡ ♡", getTextStyle("body", {
      color: TEXT_COLORS.danger,
      fontSize: "19px",
    }))
    .setOrigin(0.5)
    .setDepth(51);
  const timerText = scene.add
    .text(1220, 52, "02:00", getTextStyle("label", {
      fontSize: "21px",
    }))
    .setOrigin(1, 0.5)
    .setDepth(51);

  addSpeechBubble(scene, 286, 186).setPosition(23, 108).setDepth(24);
  const dialogueText = scene.add
    .text(49, 134, "", getTextStyle("body", {
      fontSize: "21px",
      lineSpacing: 8,
      wordWrap: { width: 234 },
    }))
    .setDepth(25);
  const promptText = scene.add
    .text(690, 680, "손님의 부탁을 들어 보세요", getTextStyle("body", {
      backgroundColor: "#fff9e9e8",
      fontSize: "18px",
      padding: { x: 17, y: 8 },
    }))
    .setOrigin(0.5)
    .setDepth(40);

  return {
    timerText,
    coinText,
    mistakeText,
    customerCountText,
    dialogueText,
    promptText,
  };
}

export function createWorkshopCustomer(
  scene: Phaser.Scene,
): WorkshopCustomerView {
  const artLayout = AI_WORKSHOP_LAYOUT.customerArt;
  const customerShadow = scene.add
    .image(artLayout.x, artLayout.y + 5, "customer-fallback")
    .setDisplaySize(artLayout.width + 10, artLayout.height + 12)
    .setTint(0x174a52)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.2);
  const customerArt = scene.add
    .image(0, 0, "customer-fallback")
    .setDisplaySize(artLayout.width, artLayout.height)
    .setPosition(artLayout.x, artLayout.y);
  const customerEmoji = scene.add
    .text(-54, -55, "🛍️", { fontSize: "37px" })
    .setOrigin(0.5);
  const rolePlate = scene.add.graphics();
  rolePlate.fillStyle(COLORS.paper, 0.96);
  rolePlate.lineStyle(4, COLORS.ink, 1);
  rolePlate.fillRoundedRect(artLayout.x - 140, 143, 280, 46, 18);
  rolePlate.strokeRoundedRect(artLayout.x - 140, 143, 280, 46, 18);
  const customerRoleText = scene.add
    .text(0, 166, "오늘의 손님", {
      ...getTextStyle("support"),
      align: "center",
      wordWrap: { width: 260 },
    })
    .setOrigin(0.5)
    .setPosition(artLayout.x, 166);
  const customerContainer = scene.add
    .container(-170, AI_WORKSHOP_LAYOUT.customerStage.y, [
      customerShadow,
      customerArt,
      customerEmoji,
      rolePlate,
      customerRoleText,
    ])
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
  customerShadow: Phaser.GameObjects.Image | undefined,
  customerArt: Phaser.GameObjects.Image | undefined,
) {
  if (!customerShadow || !customerArt) return;
  customerShadow
    .setTexture(customerArt.texture.key)
    .setDisplaySize(customerArt.displayWidth + 10, customerArt.displayHeight + 12)
    .setPosition(customerArt.x, customerArt.y + 5)
    .setFlipX(customerArt.flipX)
    .setAngle(customerArt.angle)
    .setVisible(customerArt.visible);
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

function createRoundButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
) {
  const { container } = addUiButton(scene, {
    x,
    y,
    width: 66,
    height: 66,
    radius: 33,
    label,
    onPress: onClick,
    variant: "paper",
    fontSize: "29px",
  });
  container.setSize(76, 76);
  return container;
}
