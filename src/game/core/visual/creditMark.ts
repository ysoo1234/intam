import Phaser from "phaser";
import { FONT_FAMILY } from "./theme";

/** The makers' names, shown quietly like a watermark on the first and last screens. */
export const CREDIT_TEXT = "제작: 정연수, 김준휘";

/** Small, faint credit in the bottom-right corner of the 1280 x 720 stage. */
export function addCreditMark(scene: Phaser.Scene, depth: number) {
  return scene.add
    .text(1246, 696, CREDIT_TEXT, { fontFamily: FONT_FAMILY, fontSize: "15px", color: "#ffffff" })
    .setOrigin(1, 1)
    .setAlpha(0.8)
    .setResolution(3)
    .setDepth(depth);
}
