import Phaser from "phaser";
import { configureSceneCamera } from "../runtime/configureSceneCamera";
import { PAGE_BACKDROPS } from "../runtime/pageBackdrop";
import type { SceneKey } from "../scenes/sceneKeys";
import { FONT_FAMILY } from "./theme";

/**
 * While a place still has pictures to load (only the first visit: after that
 * they stay loaded), the canvas would show its plain background colour.
 * Instead the place's own colour fills the screen, the same colour the
 * door closed into, with the page's loading card: three dots bobbing in
 * turn and "이동하는 중...". Call at the end of `preload()`; it does nothing
 * when nothing needs loading.
 *
 * The scene's own update (and so its tweens) does not run while it loads,
 * so the dots are moved from the game's render step instead.
 */
const DOT_COLORS = [0x70cfaa, 0xf87962, 0xf5bd46] as const;
const CARD = { width: 300, height: 128, radius: 28 } as const;
const DEPTH = 100_000;

const hex = (value: string) => Phaser.Display.Color.HexStringToColor(value).color;

export function showSceneLoading(scene: Phaser.Scene, renderScale: number) {
  if (scene.load.list.size === 0) return;
  configureSceneCamera(scene, renderScale);
  const backdrop = PAGE_BACKDROPS[scene.sys.settings.key as SceneKey];
  // One calm colour: exactly the colour the door closed into.
  const color = backdrop ? hex(backdrop.middle) : 0x94b5e5;
  const background = scene.add.rectangle(640, 360, 1280, 720, color, 1).setDepth(DEPTH);
  const card = scene.add.graphics().setDepth(DEPTH + 1);
  const left = 640 - CARD.width / 2;
  const top = 360 - CARD.height / 2;
  card.fillStyle(0x163f4a, 0.22).fillRoundedRect(left, top + 6, CARD.width, CARD.height, CARD.radius);
  card.fillStyle(0xfffdf6, 1).fillRoundedRect(left, top, CARD.width, CARD.height, CARD.radius);
  card.lineStyle(4, 0x6fb0b2, 1).strokeRoundedRect(left, top, CARD.width, CARD.height, CARD.radius);
  const dots = DOT_COLORS.map((color, index) =>
    scene.add.circle(640 + (index - 1) * 28, 336, 8, color, 1).setDepth(DEPTH + 2));
  const label = scene.add
    .text(640, 382, "이동하는 중...", {
      color: "#315567", fontFamily: FONT_FAMILY, fontSize: "20px", fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3)
    .setDepth(DEPTH + 2);

  // The same bob as the page's loading dots: 1.1 s, each a little after the last.
  const bob = () => {
    const t = performance.now() / 1_100;
    dots.forEach((dot, index) => {
      const phase = (((t - index * 0.164) % 1) + 1) % 1;
      const lift = phase < 0.4 ? Math.sin((phase / 0.4) * Math.PI * 0.5) : Math.cos(((phase - 0.4) / 0.6) * Math.PI * 0.5);
      dot.setY(336 - lift * 9).setScale(1 + lift * 0.12).setAlpha(0.75 + lift * 0.25);
    });
  };
  scene.game.events.on(Phaser.Core.Events.PRE_RENDER, bob);
  const remove = () => {
    scene.game.events.off(Phaser.Core.Events.PRE_RENDER, bob);
    [background, card, ...dots, label].forEach((object) => object.destroy());
  };
  scene.load.once(Phaser.Loader.Events.COMPLETE, remove);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(Phaser.Core.Events.PRE_RENDER, bob));
}
