import type Phaser from "phaser";
import { AI_WORKSHOP_LAYOUT } from "./layout";

// Every v3-game customer is a 454 x 680 transparent canvas, drawn facing right
// (toward Midi). The drawings are built by the art script with the feet at
// y 641, the point between both feet on the canvas's centre line (x 227), and
// each person at a natural height (students smallest, then the elderly, then
// adults). So every customer gets the same scale; only these measurements
// differ: where the head (hat included) starts, and how wide the stance is.
const CUSTOMER_SOURCE_CANVAS_HEIGHT = 680;
const CUSTOMER_SOURCE_FOOT_Y = 642;

/** Every customer is drawn this much larger than the art box. */
export const WORKSHOP_CUSTOMER_DISPLAY_SCALE = 1.2;

const CUSTOMER_ART_METRICS: Readonly<Record<string, Readonly<{ topY: number; footSpan: number }>>> = {
  "busy-cleaner": { topY: 87, footSpan: 189 },
  "cafeteria-student": { topY: 217, footSpan: 106 },
  "courier": { topY: 75, footSpan: 194 },
  "crosswalk-police": { topY: 98, footSpan: 137 },
  "diary-student": { topY: 217, footSpan: 112 },
  "dinner-parent": { topY: 87, footSpan: 176 },
  "elderly-home-alone": { topY: 148, footSpan: 139 },
  "exercising-elderly": { topY: 138, footSpan: 135 },
  "foreign-call-student": { topY: 217, footSpan: 102 },
  "foreign-restaurant-traveler": { topY: 97, footSpan: 121 },
  "foreign-theatergoer": { topY: 112, footSpan: 99 },
  "frequent-laundry-person": { topY: 112, footSpan: 152 },
  "greenhouse-farmer": { topY: 87, footSpan: 174 },
  "long-distance-traveler": { topY: 112, footSpan: 140 },
  "mobility-patient": { topY: 152, footSpan: 103 },
  "novice-driver": { topY: 87, footSpan: 173 },
  "orchard-farmer": { topY: 113, footSpan: 150 },
  "pet-owner": { topY: 113, footSpan: 109 },
  "phone-parent": { topY: 113, footSpan: 114 },
  "school-prep-student": { topY: 217, footSpan: 143 },
  "science-homework-student": { topY: 207, footSpan: 146 },
  "stuffy-air-resident": { topY: 87, footSpan: 191 },
  "water-saving-farmer": { topY: 75, footSpan: 206 },
  "wide-field-farmer": { topY: 69, footSpan: 213 },
  "wrong-answer-student": { topY: 217, footSpan: 142 },
  "xray-doctor": { topY: 112, footSpan: 160 },
};
const DEFAULT_ART_METRIC = { topY: 102, footSpan: 150 } as const;

/** Where the drawing's head starts on its canvas. */
export function getWorkshopCustomerArtTopY(requestId: string) {
  return (CUSTOMER_ART_METRICS[requestId] ?? DEFAULT_ART_METRIC).topY;
}

/** How wide the stance is on the canvas (outer edge of one foot to the other). */
function getWorkshopCustomerFootSpan(requestId: string) {
  return (CUSTOMER_ART_METRICS[requestId] ?? DEFAULT_ART_METRIC).footSpan;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export type WorkshopCustomerVisualTransform = {
  visualScale: number;
  displayWidth: number;
  displayHeight: number;
  x: number;
  y: number;
  footBaselineY: number;
  /** Top of the head, in the customer container (same space as `y`). */
  headTopY: number;
  /** Width of the stance on screen, for the shadow under the feet. */
  footSpan: number;
};

export function getWorkshopCustomerVisualTransform(
  requestId: string,
): WorkshopCustomerVisualTransform {
  const artLayout = AI_WORKSHOP_LAYOUT.customerArt;
  const visualScale = WORKSHOP_CUSTOMER_DISPLAY_SCALE;
  const displayWidth = artLayout.width * visualScale;
  const displayHeight = artLayout.height * visualScale;
  const sourceFootOffsetFromCenter =
    CUSTOMER_SOURCE_FOOT_Y / CUSTOMER_SOURCE_CANVAS_HEIGHT - 0.5;
  const footBaselineY =
    artLayout.y + artLayout.height * sourceFootOffsetFromCenter;
  const y = footBaselineY - displayHeight * sourceFootOffsetFromCenter;
  const headTopY =
    y - displayHeight / 2 + (getWorkshopCustomerArtTopY(requestId) / CUSTOMER_SOURCE_CANVAS_HEIGHT) * displayHeight;

  const footSpan = getWorkshopCustomerFootSpan(requestId) * (displayHeight / CUSTOMER_SOURCE_CANVAS_HEIGHT);

  return { visualScale, displayWidth, displayHeight, x: artLayout.x, y, footBaselineY, headTopY, footSpan };
}

/**
 * The customer's head top on screen, which the speech bubble stays above.
 * Stored on the art when its picture is set.
 */
export const WORKSHOP_CUSTOMER_HEAD_TOP_KEY = "head-top-screen-y";

export function applyWorkshopCustomerVisualTransform(
  customerArt: Phaser.GameObjects.Image,
  requestId: string,
): WorkshopCustomerVisualTransform {
  const transform = getWorkshopCustomerVisualTransform(requestId);
  customerArt
    .setDisplaySize(transform.displayWidth, transform.displayHeight)
    .setPosition(transform.x, transform.y)
    .setData(WORKSHOP_CUSTOMER_HEAD_TOP_KEY, AI_WORKSHOP_LAYOUT.customerStage.y + transform.headTopY);
  return transform;
}

type WorkshopCustomerRequestVisualOptions = {
  customerArt: Phaser.GameObjects.Image | undefined;
  customerShadow: Phaser.GameObjects.Ellipse | undefined;
  customerEmoji: Phaser.GameObjects.Text | undefined;
  requestId: string;
  textureKey: string;
  fallbackEmoji: string;
  hasTexture: boolean;
};

export function applyWorkshopCustomerRequestVisual({
  customerArt,
  customerShadow,
  customerEmoji,
  requestId,
  textureKey,
  fallbackEmoji,
  hasTexture,
}: WorkshopCustomerRequestVisualOptions) {
  customerEmoji?.setText(fallbackEmoji).setVisible(!hasTexture);
  if (!customerArt) return;

  customerArt
    .setTexture(hasTexture ? textureKey : "customer-fallback")
    .setFlipX(false)
    .setAngle(0);
  if (hasTexture) {
    const transform = applyWorkshopCustomerVisualTransform(
      customerArt,
      requestId,
    );
    syncWorkshopNormalizedCustomerShadow(
      customerShadow,
      customerArt,
      transform,
    );
    return;
  }

  customerArt.setDisplaySize(150, 148).setPosition(0, 0);
  customerShadow
    ?.setDisplaySize(82, 16)
    .setPosition(0, 50)
    .setVisible(customerArt.visible);
}

export function syncWorkshopNormalizedCustomerShadow(
  customerShadow: Phaser.GameObjects.Ellipse | undefined,
  customerArt: Phaser.GameObjects.Image,
  transform: WorkshopCustomerVisualTransform,
) {
  // A soft oval just wider than the stance, centred between the feet.
  customerShadow
    ?.setDisplaySize(clamp(transform.footSpan * 1.15 + 18, 70, 140), 18)
    .setPosition(customerArt.x, transform.footBaselineY - 3)
    .setVisible(customerArt.visible);
}
