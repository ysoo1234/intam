import Phaser from "phaser";
import { GAME_ASSETS } from "../../assets";
import { FONT_FAMILY, UI_MOTION } from "./theme";

export const GAME_CHROME_TEXTURES = {
  villageReturnButton: "game-village-return-button",
  pauseButton: "game-pause-button",
  statusPanel: "game-status-panel",
} as const;

const DEFAULT_CHROME_DEPTH = 90;
/** Above the start screen (depth 1 000), so 마을로 돌아가기 works there too. */
export const VILLAGE_RETURN_BUTTON_DEPTH = 1_010;
const DEFAULT_STATUS_HUD = {
  x: 1_018,
  y: 46,
  width: 500,
  height: 81,
} as const;

// The status-panel source has transparent pixels around its painted frame.
// These defaults align the return button to the *visible* top and bottom of
// that frame while preserving the return-button artwork's native aspect ratio.
const DEFAULT_RETURN_BUTTON = {
  x: 122,
  y: 44.5,
  width: 210,
  height: 69,
} as const;

const STATUS_REFERENCE = {
  width: 2_668,
  dividerXs: [738, 1_468, 2_014],
  textCenterXs: [399, 1_103, 1_741, 2_307],
} as const;

// The text is mathematically centered on the source guide above, but the
// painted highlights and rounded ends make the outer cells look off-center.
// Keep the dividers fixed and compensate only the two outer labels.
const STATUS_TEXT_OPTICAL_OFFSETS = [6, 0, 0, -10] as const;

const HIGH_DPI_TEXT_RESOLUTION = 3;

export function preloadGameChromeAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(GAME_CHROME_TEXTURES.villageReturnButton)) {
    scene.load.image(
      GAME_CHROME_TEXTURES.villageReturnButton,
      GAME_ASSETS.ui.villageReturnButton,
    );
  }
  if (!scene.textures.exists(GAME_CHROME_TEXTURES.pauseButton)) {
    scene.load.image(GAME_CHROME_TEXTURES.pauseButton, GAME_ASSETS.ui.pauseButton);
  }
  if (!scene.textures.exists(GAME_CHROME_TEXTURES.statusPanel)) {
    scene.load.image(
      GAME_CHROME_TEXTURES.statusPanel,
      GAME_ASSETS.ui.statusPanel,
    );
  }
}

type VillageReturnButtonOptions = Readonly<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
}>;

export function createVillageReturnButton(
  scene: Phaser.Scene,
  onPress: () => void,
  options: VillageReturnButtonOptions = {},
) {
  const x = options.x ?? DEFAULT_RETURN_BUTTON.x;
  const y = options.y ?? DEFAULT_RETURN_BUTTON.y;
  const width = options.width ?? DEFAULT_RETURN_BUTTON.width;
  const height = options.height ?? DEFAULT_RETURN_BUTTON.height;
  const depth = options.depth ?? VILLAGE_RETURN_BUTTON_DEPTH;
  const background = scene.add
    .image(0, 0, GAME_CHROME_TEXTURES.villageReturnButton)
    .setDisplaySize(width, height);
  const label = scene.add
    .text(width * 0.11, 0, "마을로 돌아가기", {
      color: "#315567",
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      padding: {right: 4},
      fontStyle: "bold",
      align: "center",
    })
    .setOrigin(0.5)
    .setResolution(HIGH_DPI_TEXT_RESOLUTION);
  const container = scene.add
    .container(x, y, [background, label])
    .setDepth(depth)
    .setSize(width, height)
    .setInteractive({ useHandCursor: true });

  let hovering = false;
  container.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      scene.tweens.killTweensOf(container);
      const restingY = options.y ?? DEFAULT_RETURN_BUTTON.y;
      scene.tweens.add({
        targets: container,
        y: restingY + 4,
        scaleX: 0.97,
        scaleY: 0.9,
        duration: UI_MOTION.pressDurationMs,
        yoyo: true,
        ease: "Sine.easeOut",
        onComplete: () => {
          container
            .setY(restingY)
            .setScale(hovering ? 1.018 : 1);
        },
      });
      onPress();
    },
  );
  container.on("pointerover", () => {
    hovering = true;
    if (!scene.tweens.isTweening(container)) container.setScale(1.018);
  });
  container.on("pointerout", () => {
    hovering = false;
    if (!scene.tweens.isTweening(container)) container.setScale(1);
  });
  return container;
}

export type GameStatusHud = Readonly<{
  container: Phaser.GameObjects.Container;
  texts: readonly Phaser.GameObjects.Text[];
  setValue: (index: number, value: string, color?: string) => void;
  setValues: (values: readonly string[]) => void;
}>;

type GameStatusHudOptions = Readonly<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  colors?: readonly string[];
}>;

function fitStatusText(
  text: Phaser.GameObjects.Text,
  value: string,
  maxWidth: number,
) {
  const baseSize = value.includes("♥") || value.includes("♡") ? 22 : 18;
  text.setText(value).setFontSize(baseSize);
  if (text.width > maxWidth) {
    text.setFontSize(Math.max(14, Math.floor((baseSize * maxWidth) / text.width)));
  }
}

export function createGameStatusHud(
  scene: Phaser.Scene,
  initialValues: readonly [string, string, string, string],
  options: GameStatusHudOptions = {},
): GameStatusHud {
  const x = options.x ?? DEFAULT_STATUS_HUD.x;
  const y = options.y ?? DEFAULT_STATUS_HUD.y;
  const width = options.width ?? DEFAULT_STATUS_HUD.width;
  const height = options.height ?? DEFAULT_STATUS_HUD.height;
  const depth = options.depth ?? DEFAULT_CHROME_DEPTH;
  const dividerRatios = STATUS_REFERENCE.dividerXs.map(
    (dividerX) => dividerX / STATUS_REFERENCE.width,
  );
  const textCenterRatios = STATUS_REFERENCE.textCenterXs.map(
    (textCenterX) => textCenterX / STATUS_REFERENCE.width,
  );
  const cellWidths = [
    dividerRatios[0] * width,
    (dividerRatios[1] - dividerRatios[0]) * width,
    (dividerRatios[2] - dividerRatios[1]) * width,
    (1 - dividerRatios[2]) * width,
  ];
  const background = scene.add
    .image(0, 0, GAME_CHROME_TEXTURES.statusPanel)
    .setDisplaySize(width, height);
  const dividers = scene.add.graphics();
  dividers.lineStyle(2, 0xdcb382, 0.82);
  dividerRatios.forEach((dividerRatio) => {
    const dividerX = Math.round(-width / 2 + dividerRatio * width);
    const dividerHalfHeight = Math.round(height * 0.29);
    dividers.lineBetween(
      dividerX,
      -dividerHalfHeight,
      dividerX,
      dividerHalfHeight,
    );
  });
  const defaultColors = ["#315567", "#315567", "#ee655e", "#315567"];
  const texts = initialValues.map((value, index) => {
    const text = scene.add
      .text(
        Math.round(
          -width / 2 +
            textCenterRatios[index] * width +
            STATUS_TEXT_OPTICAL_OFFSETS[index],
        ),
        0,
        value,
        {
          color: options.colors?.[index] ?? defaultColors[index],
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          fontStyle: "bold",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setResolution(HIGH_DPI_TEXT_RESOLUTION);
    fitStatusText(text, value, cellWidths[index] - 24);
    return text;
  });
  const container = scene.add
    .container(x, y, [background, dividers, ...texts])
    .setDepth(depth);

  const setValue = (index: number, value: string, color?: string) => {
    const text = texts[index];
    if (!text) return;
    if (color) text.setColor(color);
    fitStatusText(text, value, cellWidths[index] - 24);
  };
  return {
    container,
    texts,
    setValue,
    setValues: (values) => values.forEach((value, index) => setValue(index, value)),
  };
}
