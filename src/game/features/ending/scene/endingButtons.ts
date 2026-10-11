import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import { FONT_FAMILY } from "../../../core/visual/theme";

/**
 * The ending's buttons reuse the game's painted button plates (blank pills
 * from the start overlay and the village), so they match the artwork instead
 * of looking like flat web buttons.
 */
const ENDING_BUTTON_PLATES = {
  /** Teal start-button plate: the one action that moves the story on. */
  primary: {
    key: "ending-button-primary",
    url: GAME_ASSETS.ui.gameStartButton,
    color: "#fffdf2",
    stroke: "#21777c",
  },
  /** Cream village plate: quiet secondary choices. */
  paper: {
    key: "ending-button-paper",
    url: GAME_ASSETS.ui.villageEntryButton,
    color: "#315567",
    stroke: "",
  },
} as const;

export type EndingButtonVariant = keyof typeof ENDING_BUTTON_PLATES;

export function preloadEndingButtons(scene: Phaser.Scene) {
  for (const plate of Object.values(ENDING_BUTTON_PLATES)) {
    if (!scene.textures.exists(plate.key)) scene.load.image(plate.key, plate.url);
  }
}

export type EndingButtonConfig = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  variant?: EndingButtonVariant;
  fontSize?: string;
  depth?: number;
  onPress: () => void;
}>;

export function addEndingArtButton(scene: Phaser.Scene, config: EndingButtonConfig) {
  const variant = ENDING_BUTTON_PLATES[config.variant ?? "paper"];
  const plate = scene.add.image(0, 0, variant.key).setDisplaySize(config.width, config.height);
  const label = scene.add
    .text(0, -2, config.label, {
      color: variant.color,
      fontFamily: FONT_FAMILY,
      fontSize: config.fontSize ?? "22px",
      fontStyle: "bold",
      ...(variant.stroke ? { stroke: variant.stroke, strokeThickness: 3 } : {}),
    })
    .setOrigin(0.5)
    .setResolution(3);
  const container = scene.add
    .container(config.x, config.y, [plate, label])
    .setSize(config.width, config.height)
    .setInteractive({ useHandCursor: true });
  if (config.depth !== undefined) container.setDepth(config.depth);
  let hovering = false;
  container.on("pointerover", () => {
    hovering = true;
    if (!scene.tweens.isTweening(container)) container.setScale(1.05);
  });
  container.on("pointerout", () => {
    hovering = false;
    if (!scene.tweens.isTweening(container)) container.setScale(1);
  });
  container.on(
    "pointerdown",
    (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      scene.tweens.killTweensOf(container);
      scene.tweens.add({
        targets: container,
        scale: 0.94,
        duration: 70,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => container.setScale(hovering ? 1.05 : 1),
      });
      config.onPress();
    },
  );
  return container;
}
