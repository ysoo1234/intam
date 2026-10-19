import Phaser from "phaser";
import { ENDING_FINALE } from "../../../content/endingStory";
import { MIDI_FRAME_HEIGHT, MIDI_POSE } from "../../../core/player/midiFrames";
import { applyPageBackdrop } from "../../../core/runtime/pageBackdrop";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { addGradientImage } from "../../../core/visual/gradientImage";
import { FONT_FAMILY } from "../../../core/visual/theme";
import { addEndingArtButton } from "./endingButtons";
import { ENDING_LIGHT } from "./endingLights";

export const ENDING_FINALE_TEXTURES = { board: "ending-gem-board" } as const;

// The first screen's layout (IntroScene), with the board lit and a new title.
const BOARD = { x: 640, y: 352, width: 560, height: 420 } as const;
const MASCOT = { x: 124, y: 665, height: 153 } as const;
const SKY = { top: 0x7fd0f2, bottom: 0xa99ad8 } as const;
// Above everything of the village acts, under the certificate (40+) for "다시 보기".
const DEPTH = { sky: 32, rays: 33, sparkles: 34, glow: 35, board: 36, mascot: 37, title: 38, ui: 39, fade: 39.5 } as const;
// Gem centres on the board artwork as a fraction of its size from its centre (1448 x 1086 art).
const GEM_SPOTS = [
  [-0.007, -0.249], [-0.177, -0.142], [0.166, -0.142],
  [-0.007, -0.036], [-0.177, 0.075], [0.166, 0.075],
  [-0.007, 0.185], [-0.177, 0.292], [0.166, 0.292],
] as const;
const GEM_TINTS = [0x8af0c4, 0x8ad7ff, 0xff8aa8, 0xffb37a, 0xd9e0ec, 0xffd36b, 0x9ec9ff, 0xc6f08a, 0xb59cff] as const;

/**
 * The last screen mirrors the first one: same sky, rays and gem board, but
 * the board shines with every gem and the title says the light is back.
 */
export function showEndingFinale(
  scene: Phaser.Scene,
  options: Readonly<{
    calm: boolean;
    /** Back to the village, stars and records kept. */
    onReturn: () => void;
    /** Opens the certificate again to look at the photo or retake it. */
    onShowPhoto: () => void;
    /** Fade in from the village instead of the door's white (a repeat visit). */
    fromVillage?: boolean;
  }>,
) {
  const motion = (ms: number) => (options.calm ? 0 : ms);
  // The page around the canvas takes the first screen's sky colours again.
  applyPageBackdrop(SCENE_KEYS.intro);
  addGradientImage(scene, { x: 0, y: 0, width: 1280, height: 720 }, SKY).setDepth(DEPTH.sky);
  const sky = scene.add.graphics().setDepth(DEPTH.sky);
  for (let ring = 0; ring < 6; ring += 1) {
    sky.fillStyle(0xffffff, 0.06);
    sky.fillEllipse(BOARD.x, BOARD.y + 30, 1_000 - ring * 120, 640 - ring * 80);
  }
  const rays = scene.add.graphics();
  for (let index = 0; index < 18; index += 1) {
    const angle = (Math.PI * 2 * index) / 18;
    const spread = index % 2 === 0 ? 0.07 : 0.04;
    rays.fillStyle(0xffffff, index % 2 === 0 ? 0.2 : 0.11);
    rays.fillTriangle(
      0, 0,
      Math.cos(angle - spread) * 900, Math.sin(angle - spread) * 900,
      Math.cos(angle + spread) * 900, Math.sin(angle + spread) * 900,
    );
  }
  const rayGroup = scene.add.container(BOARD.x, BOARD.y + 40, [rays]).setDepth(DEPTH.rays).setBlendMode(Phaser.BlendModes.ADD);
  // Still rays (a spinning burst feels dizzying), only a slow breath, like the first screen.
  if (!options.calm) {
    scene.tweens.add({ targets: rayGroup, alpha: { from: 0.75, to: 1 }, duration: 3_200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  const sparkleSpots = [
    [168, 210, 1], [116, 360, 0.7], [250, 470, 0.55], [1_080, 196, 0.9], [1_170, 330, 0.65],
    [1_040, 470, 1], [1_188, 520, 0.6], [330, 150, 0.6], [960, 120, 0.55], [92, 540, 0.8],
  ] as const;
  sparkleSpots.forEach(([x, y, size], index) => {
    const sparkle = scene.add.star(x, y, 4, 3 * size, 22 * size, 0xffffff, 0.95)
      .setDepth(DEPTH.sparkles).setBlendMode(Phaser.BlendModes.ADD);
    if (options.calm) return;
    scene.tweens.add({
      targets: sparkle, scale: { from: 0.55, to: 1.1 }, alpha: { from: 0.35, to: 1 },
      duration: 1_100 + (index % 4) * 260, delay: index * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  });

  // The board, now shining with all nine gems.
  const halo = scene.add.image(BOARD.x, BOARD.y, ENDING_LIGHT.glow)
    .setBlendMode(Phaser.BlendModes.ADD).setScale(3.2).setAlpha(0.7).setDepth(DEPTH.glow);
  if (!options.calm) {
    scene.tweens.add({ targets: halo, alpha: 0.45, scale: 3, duration: 1_600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  const board = scene.add.image(BOARD.x, BOARD.y, ENDING_FINALE_TEXTURES.board).setDepth(DEPTH.board);
  const boardScale = Math.min(BOARD.width / board.width, BOARD.height / board.height);
  board.setScale(boardScale);
  GEM_SPOTS.forEach(([fx, fy], index) => {
    const x = BOARD.x + fx * board.displayWidth;
    const y = BOARD.y + fy * board.displayHeight;
    const shine = scene.add.image(x, y, ENDING_LIGHT.glow)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(GEM_TINTS[index]).setScale(0.42).setAlpha(0.7).setDepth(DEPTH.board + 0.1);
    const sparkle = scene.add.image(x, y, ENDING_LIGHT.sparkle)
      .setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0.8).setDepth(DEPTH.board + 0.2);
    if (options.calm) return;
    scene.tweens.add({
      targets: [shine, sparkle], alpha: { from: 0.4, to: 0.9 }, duration: 900 + index * 70,
      delay: index * 110, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    scene.tweens.add({ targets: sparkle, angle: 90, duration: 2_600, repeat: -1 });
  });

  // Title (drawn in code until its generated artwork arrives).
  const title = scene.add
    .text(640, 76, ENDING_FINALE.title, {
      fontFamily: DISPLAY_FONT_FAMILY, fontSize: "54px", color: "#ffffff",
      stroke: "#5a55c8", strokeThickness: 12,
      shadow: { offsetX: 0, offsetY: 5, color: "#2b3f86", blur: 0, fill: false, stroke: true },
      padding: { x: 8, y: 8 },
    })
    .setOrigin(0.5)
    .setResolution(2)
    .setDepth(DEPTH.title);
  // Midi waves goodbye where she greeted the student on the first screen.
  const midi = scene.add
    .image(0, 0, MIDI_POSE.wave)
    .setScale(MASCOT.height / MIDI_FRAME_HEIGHT)
    .setOrigin(0.5, 0.985);
  const bubbleText = scene.add
    .text(0, 0, ENDING_FINALE.midi, { fontFamily: FONT_FAMILY, fontSize: "18px", fontStyle: "bold", color: "#315567" })
    .setOrigin(0.5)
    .setResolution(3);
  const bubbleWidth = bubbleText.width + 34;
  const bubble = scene.add.graphics();
  bubble.fillStyle(0x2b3f86, 0.14).fillRoundedRect(-bubbleWidth / 2 + 3, -18, bubbleWidth, 40, 16);
  bubble.fillStyle(0xffffff, 1).fillRoundedRect(-bubbleWidth / 2, -20, bubbleWidth, 40, 16);
  bubble.lineStyle(2, 0xc9c2ec, 1).strokeRoundedRect(-bubbleWidth / 2, -20, bubbleWidth, 40, 16);
  bubble.fillStyle(0xffffff, 1).fillTriangle(-bubbleWidth / 2 + 24, 18, -bubbleWidth / 2 + 40, 18, -bubbleWidth / 2 + 24, 32);
  const bubbleGroup = scene.add.container(bubbleWidth / 2 + 10, -MASCOT.height - 30, [bubble, bubbleText]);
  const mascot = scene.add.container(MASCOT.x, MASCOT.y, [midi, bubbleGroup]).setDepth(DEPTH.mascot);
  if (!options.calm) {
    scene.tweens.add({ targets: mascot, y: MASCOT.y - 6, duration: 1_300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // Both buttons together sit centred under the board (group spans 401..880).
  const buttons = [
    addEndingArtButton(scene, {
      x: 546, y: 652, width: 290, height: 62, label: ENDING_FINALE.returnToVillage,
      variant: "primary", fontSize: "23px", depth: DEPTH.ui, onPress: options.onReturn,
    }),
    // A quieter, smaller companion: look at (or retake) the photo.
    addEndingArtButton(scene, {
      x: 794, y: 653, width: 172, height: 52, label: ENDING_FINALE.showPhoto,
      variant: "paper", fontSize: "18px", depth: DEPTH.ui, onPress: options.onShowPhoto,
    }),
  ];

  // Appears out of the door's white light, or simply fades in on a repeat visit.
  const fade = scene.add
    .rectangle(640, 360, 1280, 720, options.fromVillage ? 0xf5efe3 : 0xffffff, 1)
    .setDepth(DEPTH.fade);
  scene.tweens.add({
    targets: fade, fillAlpha: 0, duration: motion(options.fromVillage ? 500 : 900),
    ease: "Sine.easeOut", onComplete: () => fade.destroy(),
  });
  if (!options.calm && !options.fromVillage) {
    board.setScale(boardScale * 0.92);
    scene.tweens.add({ targets: board, scale: boardScale, duration: 900, ease: "Back.easeOut" });
    title.setAlpha(0).setY(58);
    scene.tweens.add({ targets: title, alpha: 1, y: 76, delay: 500, duration: 560, ease: "Back.easeOut" });
    for (const object of [...buttons, bubbleGroup]) {
      object.setAlpha(0);
      scene.tweens.add({ targets: object, alpha: 1, delay: 1_000, duration: 400 });
    }
  }
  return {
    /** Hides the two buttons while the certificate is open over the screen, so only its own buttons show. */
    setButtonsVisible(visible: boolean) {
      for (const button of buttons) {
        scene.tweens.killTweensOf(button);
        button.setVisible(visible).setAlpha(1);
      }
    },
  };
}
