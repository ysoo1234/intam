import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";
import type { WorkshopOrder } from "../model";
import { createWorkshopProductArt } from "./workshopProducts";

/**
 * User-tunable layout values for the full-screen product crafting panel.
 * Coordinates are relative to the panel container at (centerX, centerY).
 */
export const WORKSHOP_STAR_CATCH_TUNING = {
  centerX: 640,
  centerY: 360,
  panelX: 0,
  panelY: 0,
  panelWidth: 860,
  panelHeight: 434,
  titleX: 0,
  titleY: -180,
  titleFontSize: 27,
  productX: 0,
  productY: -55,
  productSize: 104,
  trackX: 0,
  // The dark track on the v3 panel art: 76 px under the centre, 38 px tall.
  trackY: 76,
  trackHalfWidth: 275,
  targetHeight: 37,
  targetRadius: 12,
  markerWidth: 10,
  markerHeight: 52,
  /** The big 멈춤 button on the panel's bottom plate. */
  // The panel art's bottom plate overlaps the body: on screen it spans
  // 115..217 px under the panel centre (art rows 625..818 of 818), so the
  // button sits at its middle, 166.
  stopX: 0,
  stopY: 166,
  // Drawn over the whole plate, so the plate itself is the button.
  stopWidth: 230,
  stopHeight: 79,
  stopFontSize: 25,
} as const;

export const WORKSHOP_STAR_CATCH_TRACK_Y = WORKSHOP_STAR_CATCH_TUNING.trackY;
export const WORKSHOP_STAR_CATCH_HALF_WIDTH =
  WORKSHOP_STAR_CATCH_TUNING.trackHalfWidth;

export type WorkshopStarCatchView = {
  container: Phaser.GameObjects.Container;
  marker: Phaser.GameObjects.Graphics;
  /** The title row: "상품 제작 중 · 성공 n / N". */
  statusText: Phaser.GameObjects.Text;
  /** The blueprint turns into the real product (a pop and a sparkle). */
  revealProduct: () => void;
};

/**
 * After how many successes the blueprint turns into the real product: two
 * thirds of the way (2 of 3), so the last stop finishes something the player
 * can already see, never on the very last stop.
 */
export function getWorkshopProductRevealHit(required: number) {
  return Math.min(required - 1, Math.max(1, Math.round((required * 2) / 3)));
}

/** The title row text for `hits` successes out of `required`. */
export function formatWorkshopStarCatchStatus(hits: number, required: number) {
  return `상품 제작 중  ·  성공 ${hits} / ${required}`;
}

export function randomizeWorkshopStarZone() {
  return Phaser.Math.Between(
    -WORKSHOP_STAR_CATCH_HALF_WIDTH + 70,
    WORKSHOP_STAR_CATCH_HALF_WIDTH - 70,
  );
}

export function drawWorkshopStarZone(
  zone: Phaser.GameObjects.Graphics,
  center: number,
  width: number,
) {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const top = tuning.trackY - tuning.targetHeight / 2;
  const visualTop = top - 1;
  const visualHeight = tuning.targetHeight + 1;
  zone.clear();
  zone.fillStyle(0xe4f6f1, 0.82);
  zone.fillRoundedRect(
    tuning.trackX + center - width / 2,
    visualTop,
    width,
    visualHeight,
    tuning.targetRadius,
  );
  zone.lineStyle(2, 0x79cfd2, 0.92);
  zone.strokeRoundedRect(
    tuning.trackX + center - width / 2,
    visualTop,
    width,
    visualHeight,
    tuning.targetRadius,
  );
}

function createCraftingPuffVisuals(scene: Phaser.Scene) {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const createPuff = (
    texture: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) =>
    scene.add
      .image(x, y, texture)
      .setDisplaySize(width, height)
      .setAlpha(0);
  const backPuffs = [
    createPuff(
      "workshop-dust-rise",
      tuning.productX - 24,
      tuning.productY - 10,
      96,
      108,
    ),
  ];
  const coverPuffSpecs = [
    ["workshop-dust-center", tuning.productY + 4, 142, 122],
    ["workshop-dust-diagonal", tuning.productY + 5, 126, 118],
    ["workshop-dust-sweep", tuning.productY + 8, 136, 112],
  ] as const;
  const coverPuffs = [...coverPuffSpecs, ...coverPuffSpecs].map(
    ([texture, y, width, height]) =>
      createPuff(texture, tuning.productX, y, width, height),
  );
  const frontPuffs = [
    ...coverPuffs,
    createPuff(
      "workshop-dust-low",
      tuning.productX + 3,
      tuning.productY + 22,
      106,
      64,
    ),
  ];
  const tools = [
    scene.add
      .image(tuning.productX, tuning.productY + 18, "workshop-tool-hammer")
      .setDisplaySize(48, 50)
      .setAlpha(0),
    scene.add
      .image(tuning.productX, tuning.productY + 18, "workshop-tool-screw")
      .setDisplaySize(34, 32)
      .setAlpha(0),
    scene.add
      .image(tuning.productX, tuning.productY + 18, "workshop-tool-nut")
      .setDisplaySize(34, 31)
      .setAlpha(0),
    scene.add
      .image(tuning.productX, tuning.productY + 18, "workshop-tool-gear")
      .setDisplaySize(36, 33)
      .setAlpha(0),
  ];

  return { backPuffs, coverPuffs, frontPuffs, tools };
}

function animateCraftingPuffVisuals(
  scene: Phaser.Scene,
  visuals: ReturnType<typeof createCraftingPuffVisuals>,
) {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const ambientPuffs = [visuals.backPuffs[0], visuals.frontPuffs.at(-1)!];
  ambientPuffs.forEach((puff, index) => {
    const baseScaleX = puff.scaleX;
    const baseScaleY = puff.scaleY;
    const startX = puff.x;
    const startY = puff.y;
    const launchAmbientPuff = () => {
      const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      const offsetX = Phaser.Math.Between(2, 9) * direction;
      puff
        .setPosition(startX + Phaser.Math.Between(-5, 5), startY + 6)
        .setAngle(Phaser.Math.Between(-5, 5))
        .setFlipX(direction < 0)
        .setScale(baseScaleX * 0.74, baseScaleY * 0.74)
        .setAlpha(0);
      scene.tweens.add({
        targets: puff,
        alpha: index === 0 ? 0.58 : 0.5,
        scaleX: baseScaleX * 0.9,
        scaleY: baseScaleY * 0.9,
        duration: 190,
        ease: "Quad.easeOut",
        onComplete: () => {
          scene.tweens.add({
            targets: puff,
            alpha: 0,
            x: puff.x + offsetX,
            y: startY - Phaser.Math.Between(7, 14),
            scaleX: baseScaleX * 1.04,
            scaleY: baseScaleY * 1.04,
            duration: 560,
            ease: "Cubic.easeOut",
            onComplete: () =>
              scene.time.delayedCall(
                Phaser.Math.Between(220, 420),
                launchAmbientPuff,
              ),
          });
        },
      });
    };
    scene.time.delayedCall(index * 260, launchAmbientPuff);
  });

  const coverFlights = visuals.coverPuffs.map((image) => ({
    image,
    baseScaleX: image.scaleX,
    baseScaleY: image.scaleY,
  }));
  const activeCoverPuffs = new Set<Phaser.GameObjects.Image>();
  const launchCoverPuff = () => {
    const availableFlights = coverFlights.filter(
      ({ image }) => !activeCoverPuffs.has(image),
    );
    if (availableFlights.length === 0) return;
    const { image, baseScaleX, baseScaleY } =
      availableFlights[Phaser.Math.Between(0, availableFlights.length - 1)];
    activeCoverPuffs.add(image);
    const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    const startX = tuning.productX + Phaser.Math.Between(-18, 18);
    const startY = tuning.productY + Phaser.Math.Between(5, 17);
    const driftX = Phaser.Math.Between(6, 16) * direction;
    image
      .setPosition(startX, startY)
      .setAngle(Phaser.Math.Between(-9, 9))
      .setFlipX(direction < 0)
      .setScale(baseScaleX * 0.54, baseScaleY * 0.54)
      .setAlpha(0);
    scene.tweens.add({
      targets: image,
      alpha: 1,
      x: startX + driftX * 0.3,
      y: startY - 4,
      scaleX: baseScaleX * 0.92,
      scaleY: baseScaleY * 0.92,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => {
        scene.time.delayedCall(90, () => {
          scene.tweens.add({
            targets: image,
            alpha: 0,
            x: startX + driftX,
            y: startY - Phaser.Math.Between(12, 22),
            scaleX: baseScaleX * 1.04,
            scaleY: baseScaleY * 1.04,
            duration: 500,
            ease: "Cubic.easeOut",
            onComplete: () => {
              image.setAlpha(0);
              activeCoverPuffs.delete(image);
            },
          });
        });
      },
    });
  };
  const scheduleNextCoverBurst = () => {
    launchCoverPuff();
    if (Phaser.Math.Between(0, 99) < 28) {
      scene.time.delayedCall(Phaser.Math.Between(110, 190), launchCoverPuff);
    }
    scene.time.delayedCall(
      Phaser.Math.Between(320, 520),
      scheduleNextCoverBurst,
    );
  };
  scene.time.delayedCall(90, scheduleNextCoverBurst);

  const toolFlights = [
    { image: visuals.tools[0], x: -72, y: -66, angle: -42 },
    { image: visuals.tools[1], x: 70, y: -60, angle: 68 },
    { image: visuals.tools[2], x: -60, y: -52, angle: -72 },
    { image: visuals.tools[3], x: 64, y: -60, angle: 96 },
  ].map((flight) => ({
    ...flight,
    baseScaleX: flight.image.scaleX,
    baseScaleY: flight.image.scaleY,
  }));
  let lastToolIndex = 0;
  const launchNextTool = () => {
    const nextToolIndex =
      (lastToolIndex + Phaser.Math.Between(1, toolFlights.length - 1)) %
      toolFlights.length;
    const { image, x, y, angle, baseScaleX, baseScaleY } =
      toolFlights[nextToolIndex];
    lastToolIndex = nextToolIndex;
    image
      .setPosition(tuning.productX, tuning.productY + 26)
      .setAngle(-angle * 0.18)
      .setScale(baseScaleX * 0.46, baseScaleY * 0.46)
      .setAlpha(1);
    scene.tweens.add({
      targets: image,
      alpha: { from: 1, to: 0, ease: "Expo.easeIn" },
      x: tuning.productX + x,
      y: tuning.productY + y,
      angle,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => image.setAlpha(0),
    });
    scene.time.delayedCall(
      Phaser.Math.Between(420, 720),
      launchNextTool,
    );
  };
  scene.time.delayedCall(130, launchNextTool);
}

export function createWorkshopStarCatchView(
  scene: Phaser.Scene,
  order: WorkshopOrder,
  starX: number,
  starZoneCenter: number,
  starZoneWidth: number,
  /** A tap on the 멈춤 button stops the star (Space does too). */
  onStop: () => void,
): WorkshopStarCatchView {
  const tuning = WORKSHOP_STAR_CATCH_TUNING;
  const container = scene.add
    .container(tuning.centerX, tuning.centerY)
    .setDepth(70);
  // The shade swallows floor taps (Midi must not wander off during crafting).
  const shade = scene.add
    .rectangle(0, 0, 1_280, 720, 0x173f43, 0.42)
    .setInteractive();
  shade.on("pointerdown", (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => event.stopPropagation());
  const panel = scene.add
    .image(tuning.panelX, tuning.panelY, "workshop-crafting-panel")
    .setDisplaySize(tuning.panelWidth, tuning.panelHeight);
  const title = scene.add
    .text(tuning.titleX, tuning.titleY, formatWorkshopStarCatchStatus(0, order.requiredStarHits), {
      color: "#173f43",
      fontFamily: FONT_FAMILY,
      fontSize: `${tuning.titleFontSize}px`,
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setResolution(3);
  const product = order.products[0];
  const productArt = product
    ? createWorkshopProductArt(scene, product, tuning.productSize, "blueprint").setPosition(
        tuning.productX,
        tuning.productY,
      )
    : scene.add
        .image(tuning.productX, tuning.productY, "workshop-crafting-panel")
        .setVisible(false);
  // The finished product waits, hidden, right where the blueprint floats.
  const finishedArt = product
    ? createWorkshopProductArt(scene, product, tuning.productSize, "finished")
        .setPosition(tuning.productX, tuning.productY)
        .setAlpha(0)
    : undefined;
  const craftingPuff = createCraftingPuffVisuals(scene);
  const { backPuffs, frontPuffs, tools } = craftingPuff;
  const zone = scene.add.graphics().setName("star-zone");
  drawWorkshopStarZone(zone, starZoneCenter, starZoneWidth);
  const marker = scene.add.graphics().setName("star-marker");
  marker.fillStyle(0xf8f1d8, 0.96);
  marker.fillRoundedRect(
    -tuning.markerWidth / 2,
    -tuning.markerHeight / 2,
    tuning.markerWidth,
    tuning.markerHeight,
    tuning.markerWidth / 2,
  );
  marker.lineStyle(2, 0x58bdc7, 0.95);
  marker.strokeRoundedRect(
    -tuning.markerWidth / 2,
    -tuning.markerHeight / 2,
    tuning.markerWidth,
    tuning.markerHeight,
    tuning.markerWidth / 2,
  );
  marker.setPosition(tuning.trackX + starX, tuning.trackY);
  // The amber 멈춤 button sits on the panel's bottom edge; pressing swaps in
  // the pressed art (same size, so nothing behind it shows). A tap anywhere
  // on the panel stops too (and Space).
  const stopSurface = scene.add.image(0, 0, "workshop-stop-button").setDisplaySize(tuning.stopWidth, tuning.stopHeight);
  const stopLabel: Phaser.GameObjects.Text = scene.add
    .text(0, -3, "멈춤!", {
      fontFamily: FONT_FAMILY, fontSize: `${tuning.stopFontSize}px`, fontStyle: "bold", color: "#ffffff",
      stroke: "#c06a24", strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setResolution(3);
  const drawStop = (pressed: boolean) => {
    stopSurface.setTexture(pressed ? "workshop-stop-button-pressed" : "workshop-stop-button")
      .setDisplaySize(tuning.stopWidth, tuning.stopHeight);
    stopLabel.setY(pressed ? 1 : -3);
  };
  const stopButton = scene.add
    .container(tuning.stopX, tuning.stopY, [stopSurface, stopLabel])
    .setSize(tuning.stopWidth, tuning.stopHeight)
    .setInteractive({ useHandCursor: true });
  const press = (event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    drawStop(true);
    scene.time.delayedCall(140, () => drawStop(false));
    onStop();
  };
  stopButton.on("pointerdown", (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => press(event));
  // The whole crafting panel works as the button too.
  panel.setInteractive({ useHandCursor: true }).on("pointerdown", (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => press(event));
  container.add([
    shade,
    panel,
    ...backPuffs,
    productArt,
    ...(finishedArt ? [finishedArt] : []),
    ...tools,
    ...frontPuffs,
    title,
    zone,
    marker,
    stopButton,
  ]);
  animateCraftingPuffVisuals(scene, craftingPuff);
  scene.tweens.add({
    targets: finishedArt ? [productArt, finishedArt] : productArt,
    y: { from: tuning.productY - 3, to: tuning.productY + 3 },
    angle: { from: -1, to: 1 },
    duration: 420,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  container.setScale(0.9).setAlpha(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    alpha: 1,
    duration: 300,
    ease: "Back.easeOut",
  });
  let revealed = false;
  const revealProduct = () => {
    if (revealed || !finishedArt) return;
    revealed = true;
    scene.tweens.add({ targets: productArt, alpha: 0, duration: 260, ease: "Sine.easeIn" });
    const rest = { x: finishedArt.scaleX, y: finishedArt.scaleY };
    finishedArt.setScale(rest.x * 0.7, rest.y * 0.7);
    scene.tweens.add({
      targets: finishedArt,
      alpha: 1,
      scaleX: rest.x,
      scaleY: rest.y,
      duration: 380,
      ease: "Back.easeOut",
    });
  };
  return { container, marker, statusText: title, revealProduct };
}
