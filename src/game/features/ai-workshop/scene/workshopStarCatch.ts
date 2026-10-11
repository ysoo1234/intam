import Phaser from "phaser";
import { COLORS } from "../../../core/visual/theme";
import { getStarCatchDifficulty, type WorkshopOrder } from "../model";
import { createWorkshopSparkBurst } from "./workshopEffects";
import {
  createWorkshopStarCatchView,
  drawWorkshopStarZone,
  formatWorkshopStarCatchStatus,
  getWorkshopProductRevealHit,
  randomizeWorkshopStarZone,
  WORKSHOP_STAR_CATCH_HALF_WIDTH, WORKSHOP_STAR_CATCH_TRACK_Y, WORKSHOP_STAR_CATCH_TUNING,
} from "./workshopStarCatchView";

/**
 * The crafting minigame at the workbench: a star slides along a track and
 * Midi stops it inside the glowing zone `order.requiredStarHits` times.
 */
export class WorkshopStarCatch {
  private container?: Phaser.GameObjects.Container;
  private marker?: Phaser.GameObjects.Graphics;
  private statusText?: Phaser.GameObjects.Text;
  private revealProduct?: () => void;
  private zoneCenter = 0;
  private zoneWidth = 120;
  private x = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
  private direction: 1 | -1 = 1;
  private locked = false;
  private order?: WorkshopOrder;
  private customerNumber = 0;
  hits = 0;
  misses = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly setPrompt: (text: string) => void,
  ) {}

  /** Counts reset for each new customer. */
  resetCounts() {
    this.hits = 0;
    this.misses = 0;
    this.locked = false;
  }

  start(order: WorkshopOrder, customerNumber: number, onStop: () => void) {
    this.order = order;
    this.customerNumber = customerNumber;
    this.resetCounts();
    this.direction = 1;
    this.x = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
    this.setPrompt(`색 칸 안에서 멈추세요 · 성공 0 / ${order.requiredStarHits}`);
    this.container?.destroy(true);
    this.zoneWidth = getStarCatchDifficulty(customerNumber).zoneWidth;
    this.zoneCenter = randomizeWorkshopStarZone();
    const view = createWorkshopStarCatchView(this.scene, order, this.x, this.zoneCenter, this.zoneWidth, onStop);
    this.container = view.container;
    this.marker = view.marker;
    this.statusText = view.statusText;
    this.revealProduct = view.revealProduct;
  }

  destroy() {
    this.container?.destroy(true);
    this.container = undefined;
    this.order = undefined;
  }

  update(delta: number) {
    if (this.locked || !this.marker || !this.order) return;
    const speed = getStarCatchDifficulty(this.customerNumber).speed;
    this.x += this.direction * speed * (delta / 1000);
    if (this.x >= WORKSHOP_STAR_CATCH_HALF_WIDTH) {
      this.x = WORKSHOP_STAR_CATCH_HALF_WIDTH;
      this.direction = -1;
    } else if (this.x <= -WORKSHOP_STAR_CATCH_HALF_WIDTH) {
      this.x = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
      this.direction = 1;
    }
    this.marker.setX(WORKSHOP_STAR_CATCH_TUNING.trackX + this.x);
  }

  /** Stops the star; `onComplete` runs after the last required hit. */
  tryCatch(onComplete: () => void) {
    const order = this.order;
    if (!order || this.locked) return;
    const scene = this.scene;
    this.locked = true;
    const success = Math.abs(this.x - this.zoneCenter) <= this.zoneWidth / 2;
    if (success) {
      this.hits += 1;
      this.statusText?.setText(formatWorkshopStarCatchStatus(this.hits, order.requiredStarHits));
      this.setPrompt(`좋아요! 성공 ${this.hits} / ${order.requiredStarHits}`);
      scene.cameras.main.flash(120, 255, 232, 120);
      createWorkshopSparkBurst(
        scene,
        WORKSHOP_STAR_CATCH_TUNING.centerX + WORKSHOP_STAR_CATCH_TUNING.trackX + this.x,
        WORKSHOP_STAR_CATCH_TUNING.centerY + WORKSHOP_STAR_CATCH_TRACK_Y,
        COLORS.yellow,
      );
      scene.tweens.add({ targets: this.marker, scaleX: 1.7, scaleY: 1.12, duration: 180, yoyo: true });
      // Two thirds done: the blueprint becomes the real product.
      if (this.hits === getWorkshopProductRevealHit(order.requiredStarHits)) {
        this.revealProduct?.();
        createWorkshopSparkBurst(
          scene,
          WORKSHOP_STAR_CATCH_TUNING.centerX + WORKSHOP_STAR_CATCH_TUNING.productX,
          WORKSHOP_STAR_CATCH_TUNING.centerY + WORKSHOP_STAR_CATCH_TUNING.productY,
          COLORS.yellow,
        );
      }
      if (this.hits >= order.requiredStarHits) {
        scene.time.delayedCall(420, onComplete);
        return;
      }
    } else {
      this.misses += 1;
      this.statusText?.setText(formatWorkshopStarCatchStatus(this.hits, order.requiredStarHits));
      this.setPrompt("괜찮아요! 성공 횟수는 그대로예요. 다시 도전!");
      scene.cameras.main.shake(90, 0.003);
      scene.tweens.add({
        targets: this.marker, y: WORKSHOP_STAR_CATCH_TRACK_Y + 18, alpha: 0.25, angle: 45, duration: 180,
      });
    }
    scene.time.delayedCall(430, () => this.resetRound());
  }

  private resetRound() {
    if (!this.container || !this.order) return;
    this.locked = false;
    this.x = this.direction === 1 ? -WORKSHOP_STAR_CATCH_HALF_WIDTH : WORKSHOP_STAR_CATCH_HALF_WIDTH;
    this.zoneCenter = randomizeWorkshopStarZone();
    const zone = this.container.getByName("star-zone") as Phaser.GameObjects.Graphics | null;
    if (zone) drawWorkshopStarZone(zone, this.zoneCenter, this.zoneWidth);
    this.marker
      ?.setPosition(WORKSHOP_STAR_CATCH_TUNING.trackX + this.x, WORKSHOP_STAR_CATCH_TRACK_Y)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0);
  }
}
