import Phaser from "phaser";
import { drawOutlinedPill } from "../../../core/visual/outlinedButton";
import { getTextStyle } from "../../../core/visual/theme";

export type VillageTestAction = Readonly<{ label: string; run: () => void }>;

const BUTTON = { width: 112, height: 40, right: 14, top: 12 } as const;
const MENU = { width: 268, row: 42, padding: 8, gap: 8, radius: 16 } as const;
const INK = "#315567";

type PointerHandler = (
  pointer: Phaser.Input.Pointer, x: number, y: number, event: Phaser.Types.Input.EventData,
) => void;
const swallow: PointerHandler = (_pointer, _x, _y, event) => event.stopPropagation();

/**
 * One small "테스트 ▾" button in the top-right corner. A tap drops a list of
 * test actions below it (numbered, one per row); a tap on a row runs it,
 * a tap anywhere else closes the list. Taps never reach the village, so
 * Midi does not walk off while the list is used.
 */
export function createVillageTestMenu(
  scene: Phaser.Scene,
  options: Readonly<{
    sceneWidth: number;
    depth: number;
    actions: readonly VillageTestAction[];
    /** False while something else (a question, the ending) is on screen. */
    canOpen: () => boolean;
    /** Runs as the list opens (stop Midi). */
    onOpen?: () => void;
  }>,
) {
  const buttonX = options.sceneWidth - BUTTON.right - BUTTON.width / 2;
  const buttonY = BUTTON.top + BUTTON.height / 2;
  const surface = drawOutlinedPill(scene.add.graphics(), BUTTON.width, BUTTON.height, "cream");
  const buttonLabel = scene.add
    .text(0, -1, "테스트 ▾", getTextStyle("support", { color: INK, fontSize: "16px" }))
    .setOrigin(0.5)
    .setResolution(3);
  const button = scene.add
    .container(buttonX, buttonY, [surface, buttonLabel])
    .setSize(BUTTON.width, BUTTON.height)
    .setDepth(options.depth)
    .setAlpha(0.85)
    .setInteractive({ useHandCursor: true });

  // Anywhere outside the list closes it (and the tap goes no further).
  const blocker = scene.add
    .rectangle(options.sceneWidth / 2, 360, options.sceneWidth, 720, 0x000000, 0.001)
    .setDepth(options.depth - 0.5)
    .setVisible(false);

  const menuHeight = MENU.padding * 2 + MENU.row * options.actions.length;
  const menuRight = options.sceneWidth - BUTTON.right;
  const menuTop = BUTTON.top + BUTTON.height + MENU.gap;
  const panel = scene.add.graphics();
  panel.fillStyle(0x163f4a, 0.18).fillRoundedRect(-MENU.width + 3, 5, MENU.width, menuHeight, MENU.radius);
  panel.fillStyle(0xfffdf6, 0.98).fillRoundedRect(-MENU.width, 0, MENU.width, menuHeight, MENU.radius);
  panel.lineStyle(3, 0x6fb0b2, 1).strokeRoundedRect(-MENU.width, 0, MENU.width, menuHeight, MENU.radius);
  const menu = scene.add.container(menuRight, menuTop, [panel]).setDepth(options.depth + 0.5).setVisible(false);

  let open = false;
  const setOpen = (next: boolean) => {
    open = next;
    menu.setVisible(next);
    blocker.setVisible(next);
    if (next) blocker.setInteractive();
    else blocker.disableInteractive();
    buttonLabel.setText(next ? "테스트 ▴" : "테스트 ▾");
    button.setAlpha(next ? 1 : 0.85);
  };

  options.actions.forEach((action, index) => {
    const y = MENU.padding + MENU.row * index + MENU.row / 2;
    const highlight = scene.add
      .rectangle(-MENU.width / 2, y, MENU.width - 12, MENU.row - 4, 0xd9efea, 1)
      .setVisible(false);
    const label = scene.add
      .text(-MENU.width + 18, y, `${index + 1}. ${action.label}`, getTextStyle("support", { color: INK, fontSize: "16px" }))
      .setOrigin(0, 0.5)
      .setResolution(3);
    const hit = scene.add
      .zone(-MENU.width / 2, y, MENU.width - 12, MENU.row)
      .setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => highlight.setVisible(true));
    hit.on("pointerout", () => highlight.setVisible(false));
    hit.on("pointerdown", swallow);
    hit.on("pointerup", ((_pointer, _x, _y, event) => {
      event.stopPropagation();
      highlight.setVisible(false);
      setOpen(false);
      action.run();
    }) as PointerHandler);
    // A thin line between rows.
    if (index > 0) {
      const line = scene.add.rectangle(-MENU.width / 2, y - MENU.row / 2, MENU.width - 28, 1, 0x6fb0b2, 0.35);
      menu.add(line);
    }
    menu.add([highlight, label, hit]);
  });

  button.on("pointerover", () => button.setAlpha(1));
  button.on("pointerout", () => { if (!open) button.setAlpha(0.85); });
  button.on("pointerdown", swallow);
  button.on("pointerup", ((_pointer, _x, _y, event) => {
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    if (!options.canOpen()) return;
    options.onOpen?.();
    setOpen(true);
  }) as PointerHandler);
  blocker.on("pointerdown", swallow);
  blocker.on("pointerup", ((_pointer, _x, _y, event) => {
    event.stopPropagation();
    setOpen(false);
  }) as PointerHandler);

  /** A short note that fades under the button (for actions that change nothing on screen). */
  const notify = (text: string, holdMs = 1_400) => {
    const note = scene.add
      .text(menuRight, menuTop + 4, text, {
        ...getTextStyle("support", { color: "#fffdf6", fontSize: "16px" }),
        backgroundColor: "#315567",
        padding: { x: 12, y: 7 },
        wordWrap: { width: 420 },
      })
      .setOrigin(1, 0)
      .setResolution(3)
      .setDepth(options.depth + 1);
    scene.tweens.add({
      targets: note, alpha: 0, delay: holdMs, duration: 500, onComplete: () => note.destroy(),
    });
  };

  return { isOpen: () => open, close: () => setOpen(false), notify };
}
