import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { ETHICS_LAYOUT } from "./layout";

export const ETHICS_TEXTURES = {
  booth: "ethics-booth",
  boothFront: "ethics-booth-front",
  desk: "ethics-desk",
  midiBack: "ethics-midi-back",
  sparkle: "ethics-fx-sparkle",
  sparkleSmall: "ethics-fx-sparkle-small",
  sweat: "ethics-fx-sweat",
  sweatSmall: "ethics-fx-sweat-small",
  form: "ethics-form",
  stampApprove: "ethics-stamp-approve",
  stampReject: "ethics-stamp-reject",
  midiFront: "ethics-midi-front",
  midiLeft: "ethics-midi-left",
  midiRight: "ethics-midi-right",
  midiHappy: "ethics-midi-happy",
  midiWorried: "ethics-midi-worried",
} as const;

export function getEthicsVisitorTexture(id: string, mood: "waiting" | "happy") {
  return `ethics-visitor-${id}-${mood}`;
}

export const ETHICS_DEPTH = {
  office: 0,
  visitor: 30,
  boothFront: 35,
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

export function preloadEthicsReviewAssets(scene: Phaser.Scene) {
  const source = GAME_ASSETS.ethicsReview;
  const assets: Record<string, string> = {
    [ETHICS_TEXTURES.booth]: source.booth,
    [ETHICS_TEXTURES.boothFront]: source.boothFront,
    [ETHICS_TEXTURES.desk]: source.desk,
    [ETHICS_TEXTURES.midiBack]: source.midiBack,
    [ETHICS_TEXTURES.sparkle]: source.midiEffects.sparkle,
    [ETHICS_TEXTURES.sparkleSmall]: source.midiEffects.sparkleSmall,
    [ETHICS_TEXTURES.sweat]: source.midiEffects.sweat,
    [ETHICS_TEXTURES.sweatSmall]: source.midiEffects.sweatSmall,
    [ETHICS_TEXTURES.form]: source.form,
    [ETHICS_TEXTURES.stampApprove]: source.stampApprove,
    [ETHICS_TEXTURES.stampReject]: source.stampReject,
    [ETHICS_TEXTURES.midiFront]: source.midiFront,
    [ETHICS_TEXTURES.midiLeft]: source.midiLeft,
    [ETHICS_TEXTURES.midiRight]: source.midiRight,
    [ETHICS_TEXTURES.midiHappy]: source.midiHappy,
    [ETHICS_TEXTURES.midiWorried]: source.midiWorried,
    ...Object.fromEntries(
      Object.entries(source.visitors).flatMap(([id, art]) => [
        [getEthicsVisitorTexture(id, "waiting"), art.waiting],
        [getEthicsVisitorTexture(id, "happy"), art.happy],
      ]),
    ),
  };
  for (const [key, asset] of Object.entries(assets)) {
    if (!scene.textures.exists(key)) scene.load.image(key, asset);
  }
}

export function createEthicsOffice(scene: Phaser.Scene) {
  const booth = ETHICS_LAYOUT.boothPanel;
  const desk = ETHICS_LAYOUT.deskPanel;
  scene.add.image(booth.x, booth.y, ETHICS_TEXTURES.booth).setOrigin(0)
    .setDisplaySize(booth.width, booth.height).setDepth(ETHICS_DEPTH.office);
  // Frame, sill and counter in front of the student, so they stand behind the counter.
  scene.add.image(booth.x, booth.y, ETHICS_TEXTURES.boothFront).setOrigin(0)
    .setDisplaySize(booth.width, booth.height).setDepth(ETHICS_DEPTH.boothFront);
  scene.add.image(desk.x, desk.y, ETHICS_TEXTURES.desk).setOrigin(0)
    .setDisplaySize(desk.width, desk.height).setDepth(ETHICS_DEPTH.office);
  // A soft seam between the two panels.
  const seam = scene.add.graphics().setDepth(ETHICS_DEPTH.boothFront + 1);
  seam.fillStyle(0x24434a, 0.55).fillRect(desk.x - 3, 0, 6, 720);
  seam.fillStyle(0xffffff, 0.18).fillRect(desk.x + 3, 0, 2, 720);
  return seam;
}
