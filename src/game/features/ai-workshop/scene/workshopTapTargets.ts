import Phaser from "phaser";
import { isCoachCardOpen } from "../../../core/visual/coachGuide";
import { isGameStartOverlayOpen } from "../../../core/visual/gameStartOverlay";
import type { WorkshopPhase } from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import type { WorkshopControls } from "./workshopControls";
import type { WorkshopProductChoice, WorkshopProductOrigin } from "./workshopProducts";
import { isWorkshopPlayerAtCustomer, isWorkshopPlayerAtWorkbench, WORKSHOP_TAP_SPOTS } from "./workshopStatus";

/**
 * Touch is the main control in the workshop: tapping a shelf product, an
 * empty shelf slot (or the product Midi carries), the workbench or the
 * customer walks Midi there and does the thing on arrival. The scene keeps
 * the rules (what a pick or a delivery means); this only aims the taps.
 */
export type WorkshopTapTargetDeps = Readonly<{
  controls: WorkshopControls;
  getPhase: () => WorkshopPhase;
  getPlayer: () => Phaser.GameObjects.Container | undefined;
  getHanging: () => readonly WorkshopProductChoice[];
  getCarriedOrigins: () => readonly WorkshopProductOrigin[];
  getCarriedVisuals: () => readonly Phaser.GameObjects.Container[];
  hasCarried: () => boolean;
  isFinished: () => boolean;
  pickProduct: (choice: WorkshopProductChoice) => void;
  returnCarried: (index: number) => void;
  useWorkbench: () => void;
  /** Tapped the workbench with empty hands. */
  needProductsFirst: () => void;
  deliver: () => void;
}>;

export type WorkshopTapTargets = ReturnType<typeof createWorkshopTapTargets>;

/** The customer's visual group is shifted this much inside its container (see workshopView). */
const CUSTOMER_GROUP_OFFSET_X = 23;

export function createWorkshopTapTargets(
  scene: Phaser.Scene,
  customer: Phaser.GameObjects.Container | undefined,
  deps: WorkshopTapTargetDeps,
) {
  const near = (x: number, y: number, within: number) => {
    const player = deps.getPlayer();
    return Boolean(player) && Phaser.Math.Distance.Between(player!.x, player!.y, x, y) < within;
  };
  // A tap makes Midi walk right up to the thing (Space from nearby is more forgiving).
  const { tapReach } = WORKSHOP_TAP_SPOTS;
  const nearProduct = (choice: WorkshopProductChoice) =>
    near(choice.container.x, WORKSHOP_TAP_SPOTS.shelfStandY, tapReach.product);

  /** Wraps a tap: ignored while a card or the start screen is up; never also a floor tap. */
  const onTap = (handler: () => void) => (
    _pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData,
  ) => {
    if (deps.isFinished() || isGameStartOverlayOpen(scene) || isCoachCardOpen(scene)) return;
    event.stopPropagation();
    handler();
  };

  const tapProduct = (choice: WorkshopProductChoice) => {
    if (deps.getPhase() !== "choosing" || !deps.getHanging().includes(choice)) return;
    deps.controls.walkTo({
      point: { x: choice.container.x, y: WORKSHOP_TAP_SPOTS.shelfStandY },
      inReach: () => nearProduct(choice),
      // The controls call act only on arrival or within reach, so no second
      // distance test here: one that was stricter left Midi standing a step
      // short of the shelf with empty hands.
      act: () => {
        if (deps.getPhase() === "choosing" && deps.getHanging().includes(choice)) deps.pickProduct(choice);
      },
    });
  };

  const tapSlot = (index: number) => {
    const origin = deps.getCarriedOrigins()[index];
    if (deps.getPhase() !== "choosing" || !origin) return;
    deps.controls.walkTo({
      point: { x: origin.x, y: WORKSHOP_TAP_SPOTS.shelfStandY },
      inReach: () => near(origin.x, WORKSHOP_TAP_SPOTS.shelfStandY, tapReach.product),
      act: () => {
        if (deps.getPhase() === "choosing" && deps.getCarriedOrigins()[index] === origin) deps.returnCarried(index);
      },
    });
  };

  const tapWorkbench = () => {
    if (deps.getPhase() !== "choosing") return;
    if (!deps.hasCarried()) {
      deps.needProductsFirst();
      return;
    }
    deps.controls.walkTo({
      point: WORKSHOP_TAP_SPOTS.workbenchStand,
      inReach: () => near(WORKSHOP_TAP_SPOTS.workbenchStand.x, WORKSHOP_TAP_SPOTS.workbenchStand.y, tapReach.workbench),
      act: () => {
        if (deps.getPhase() === "choosing" && isWorkshopPlayerAtWorkbench(deps.getPlayer())) deps.useWorkbench();
      },
    });
  };

  const tapCustomer = () => {
    if (deps.getPhase() !== "delivery") return;
    deps.controls.walkTo({
      point: WORKSHOP_TAP_SPOTS.customerStand,
      inReach: () => near(WORKSHOP_TAP_SPOTS.customerStand.x, WORKSHOP_TAP_SPOTS.customerStand.y, tapReach.customer),
      act: () => {
        if (deps.getPhase() === "delivery" && isWorkshopPlayerAtCustomer(deps.getPlayer())) deps.deliver();
      },
    });
  };

  // The workbench top, where the products go.
  const bench = WORKSHOP_TAP_SPOTS.workbench;
  scene.add
    .zone(bench.x, bench.y, bench.width, bench.height)
    .setDepth(AI_WORKSHOP_LAYOUT.workbench.depth + 1)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onTap(tapWorkbench));
  if (customer) {
    // The customer art sits inside a nested group, offset from the container.
    // (A container's hit rectangle is in top-left local coordinates: the
    // container's own position is at (width / 2, height / 2).)
    const art = AI_WORKSHOP_LAYOUT.customerArt;
    customer
      .setSize(art.width, art.height)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(art.x + CUSTOMER_GROUP_OFFSET_X, art.y, art.width, art.height),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      })
      .on("pointerdown", onTap(tapCustomer));
  }

  let slotZones: Phaser.GameObjects.Zone[] = [];
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    slotZones.forEach((zone) => zone.destroy());
    slotZones = [];
  });

  return {
    /** Call for every product put on the shelf. */
    makeProductTappable: (choice: WorkshopProductChoice) => {
      // The rectangle covers the picture and the name under it (local top-left coordinates).
      const { width, height } = WORKSHOP_TAP_SPOTS.productHit;
      choice.container
        .setSize(width, height)
        .setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, WORKSHOP_TAP_SPOTS.productHitOffsetY, width, height),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        })
        .on("pointerdown", onTap(() => tapProduct(choice)));
    },
    /** Call whenever the carried products change: empty slots (and the carried products) take taps. */
    syncSlots: () => {
      slotZones.forEach((zone) => zone.destroy());
      const { width, height } = WORKSHOP_TAP_SPOTS.productHit;
      slotZones = deps.getCarriedOrigins().map((origin, index) =>
        scene.add
          .zone(origin.x, origin.y + WORKSHOP_TAP_SPOTS.productHitOffsetY, width, height)
          .setDepth(21)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", onTap(() => tapSlot(index))),
      );
      deps.getCarriedVisuals().forEach((visual, index) => {
        visual
          .setSize(WORKSHOP_TAP_SPOTS.carriedHit, WORKSHOP_TAP_SPOTS.carriedHit)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", onTap(() => tapSlot(index)));
      });
    },
  };
}
