import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import { ETHICS_RULES } from "../content";
import type { EthicsCategory } from "../model";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_TEXTURES = {
  booth: "ethics-booth",
  form: "ethics-form",
  stampApprove: "ethics-stamp-approve",
  stampReject: "ethics-stamp-reject",
  midiFront: "ethics-midi-front",
  midiLeft: "ethics-midi-left",
  midiRight: "ethics-midi-right",
} as const;

export function getEthicsVisitorTexture(id: string, mood: "waiting" | "happy") {
  return `ethics-visitor-${id}-${mood}`;
}

export const ETHICS_DEPTH = {
  office: 0,
  rulebook: 20,
  visitor: 30,
  midi: 40,
  form: 60,
  stamps: 80,
  effects: 100,
  bubble: 110,
  hint: 120,
  overlay: 1_000,
} as const;

export const ethicsTextStyle = (
  size: number, color = "#315567",
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY, fontSize: `${size}px`,
  fontStyle: "bold", color, align: "center",
});

export function getEthicsTopicTexture(category: EthicsCategory) {
  return `ethics-topic-${category}`;
}

export function preloadEthicsReviewAssets(scene: Phaser.Scene) {
  const source = GAME_ASSETS.ethicsReview;
  const assets: Record<string, string> = {
    [ETHICS_TEXTURES.booth]: source.booth,
    [ETHICS_TEXTURES.form]: source.form,
    [ETHICS_TEXTURES.stampApprove]: source.stampApprove,
    [ETHICS_TEXTURES.stampReject]: source.stampReject,
    [ETHICS_TEXTURES.midiFront]: source.midiFront,
    [ETHICS_TEXTURES.midiLeft]: source.midiLeft,
    [ETHICS_TEXTURES.midiRight]: source.midiRight,
    ...Object.fromEntries(
      Object.entries(source.visitors).flatMap(([id, art]) => [
        [getEthicsVisitorTexture(id, "waiting"), art.waiting],
        [getEthicsVisitorTexture(id, "happy"), art.happy],
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(source.topics).map(([topic, asset]) => [getEthicsTopicTexture(topic as EthicsCategory), asset]),
    ),
  };
  for (const [key, asset] of Object.entries(assets)) {
    if (!scene.textures.exists(key)) scene.load.image(key, asset);
  }
}

export function createEthicsOffice(scene: Phaser.Scene) {
  scene.add.image(640, 360, ETHICS_TEXTURES.booth).setDisplaySize(1280, 720).setDepth(ETHICS_DEPTH.office);
  // Soft daylight falling through the window onto the sill and desk corner.
  const light = scene.add.graphics().setDepth(ETHICS_DEPTH.office + 1);
  light.fillStyle(0xfff3d0, 0.16).fillEllipse(300, 372, 420, 60);
  light.fillStyle(0xfff3d0, 0.10).fillEllipse(760, 470, 760, 320);
  return light;
}

export type EthicsRulebook = ReturnType<typeof createEthicsRulebook>;

/** Five review rules on the cabinet front; the active rule glows. */
export function createEthicsRulebook(scene: Phaser.Scene) {
  const box = ETHICS_LAYOUT.rulebook;
  const rowHeight = 38;
  const top = -box.height / 2 + 46;
  const panel = scene.add.graphics();
  panel.fillStyle(COLORS.ink, 0.12).fillRoundedRect(-box.width / 2 + 3, -box.height / 2 + 6, box.width, box.height, 22);
  panel.fillStyle(0xfffaf0, 1).fillRoundedRect(-box.width / 2, -box.height / 2, box.width, box.height, 22);
  panel.lineStyle(3, 0x79b1b2, 1).strokeRoundedRect(-box.width / 2, -box.height / 2, box.width, box.height, 22);
  panel.lineStyle(1.5, 0xe6d8bb, 1).strokeRoundedRect(-box.width / 2 + 8, -box.height / 2 + 8, box.width - 16, box.height - 16, 16);
  // Two pins hold the sheet to the cabinet.
  for (const px of [-box.width / 2 + 26, box.width / 2 - 26]) {
    panel.fillStyle(0xc9a35c, 1).fillCircle(px, -box.height / 2 + 20, 6);
    panel.fillStyle(0xfff0c8, 1).fillCircle(px - 1.5, -box.height / 2 + 18.5, 2.2);
  }
  const title = scene.add.text(0, -box.height / 2 + 24, "AI 사용 심사 기준", ethicsTextStyle(19, "#2f7f7b"))
    .setOrigin(0.5).setResolution(3);
  const rows = ETHICS_RULES.map(([category, label], index) => {
    const y = top + index * rowHeight + 10;
    const highlight = scene.add.graphics().setVisible(false);
    highlight.fillStyle(0xd9f1ec, 1).fillRoundedRect(-box.width / 2 + 14, y - 16, box.width - 28, 33, 12);
    highlight.lineStyle(2, 0x6fbdb2, 1).strokeRoundedRect(-box.width / 2 + 14, y - 16, box.width - 28, 33, 12);
    const icon = scene.add.image(-box.width / 2 + 40, y, getEthicsTopicTexture(category));
    icon.setScale(Math.min(30 / icon.width, 30 / icon.height));
    const text = scene.add.text(-box.width / 2 + 64, y, label, ethicsTextStyle(17, "#4a6a74"))
      .setOrigin(0, 0.5).setResolution(3);
    return { category, highlight, icon, text };
  });
  const container = scene.add.container(box.x, box.y, [
    panel, title, ...rows.flatMap(row => [row.highlight, row.icon, row.text]),
  ]).setDepth(ETHICS_DEPTH.rulebook);
  let active: EthicsCategory | undefined;
  return {
    container,
    setActive: (category?: EthicsCategory) => {
      if (category === active) return;
      active = category;
      for (const row of rows) {
        const on = row.category === category;
        row.highlight.setVisible(on);
        row.text.setColor(on ? "#1f6e68" : "#4a6a74");
        scene.tweens.killTweensOf(row.icon);
        if (on) {
          scene.tweens.add({ targets: row.icon, scale: row.icon.scale * 1.2, duration: 140, yoyo: true, ease: "Sine.easeOut" });
        }
      }
    },
  };
}
