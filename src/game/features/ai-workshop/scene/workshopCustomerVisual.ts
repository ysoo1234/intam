import type Phaser from "phaser";
import { AI_WORKSHOP_LAYOUT } from "./layout";

type WorkshopCustomerVisualMetric = {
  visibleHeight: number;
  opaqueArea: number;
};

// Every v3-game customer asset uses a 454 x 680 transparent canvas and the
// last visible foot pixel ends at y=642. The numbers below are the alpha-bound
// heights measured from both worried/happy runtime WebP files. Keeping this
// metadata beside the workshop scene lets us normalize the visible character,
// rather than scaling the transparent canvas as though every drawing filled it.
const CUSTOMER_SOURCE_CANVAS_HEIGHT = 680;
const CUSTOMER_SOURCE_FOOT_Y = 642;
export const WORKSHOP_CUSTOMER_TARGET_VISIBLE_HEIGHT = 523;
// Equal height alone still makes narrow drawings (notably phone-parent) read
// like miniature people next to broader poses. This area target is measured at
// alpha >= 32. We apply half of the area correction after height normalization
// (the geometric mean below), so short students keep their corrected height
// while slender adults gain enough uniform scale to stop reading as miniatures.
export const WORKSHOP_CUSTOMER_TARGET_OPAQUE_AREA = 70_000;
export const WORKSHOP_CUSTOMER_VISUAL_SCALE_LIMITS = {
  min: 0.96,
  max: 1.13,
} as const;

const CUSTOMER_VISUAL_METRICS: Readonly<
  Record<string, WorkshopCustomerVisualMetric>
> = {
  "school-prep-student": { visibleHeight: 465, opaqueArea: 61_676 },
  "foreign-call-student": { visibleHeight: 496, opaqueArea: 66_189 },
  "foreign-restaurant-traveler": { visibleHeight: 523, opaqueArea: 63_769 },
  "science-homework-student": { visibleHeight: 465, opaqueArea: 58_645 },
  "phone-parent": { visibleHeight: 532, opaqueArea: 59_905 },
  "diary-student": { visibleHeight: 465, opaqueArea: 56_122 },
  "dinner-parent": { visibleHeight: 532, opaqueArea: 64_807 },
  "busy-cleaner": { visibleHeight: 532, opaqueArea: 68_003 },
  "pet-owner": { visibleHeight: 523, opaqueArea: 70_685 },
  "elderly-home-alone": { visibleHeight: 505, opaqueArea: 66_644 },
  "stuffy-air-resident": { visibleHeight: 532, opaqueArea: 65_823 },
  "frequent-laundry-person": { visibleHeight: 523, opaqueArea: 70_850 },
  "wrong-answer-student": { visibleHeight: 465, opaqueArea: 61_180 },
  "cafeteria-student": { visibleHeight: 465, opaqueArea: 57_506 },
  "xray-doctor": { visibleHeight: 541, opaqueArea: 75_294 },
  "exercising-elderly": { visibleHeight: 505, opaqueArea: 62_943 },
  "mobility-patient": { visibleHeight: 523, opaqueArea: 71_287 },
  "crosswalk-police": { visibleHeight: 541, opaqueArea: 74_962 },
  "novice-driver": { visibleHeight: 532, opaqueArea: 64_360 },
  courier: { visibleHeight: 532, opaqueArea: 73_822 },
  "long-distance-traveler": { visibleHeight: 523, opaqueArea: 75_941 },
  "wide-field-farmer": { visibleHeight: 532, opaqueArea: 72_472 },
  "orchard-farmer": { visibleHeight: 532, opaqueArea: 71_372 },
  "greenhouse-farmer": { visibleHeight: 532, opaqueArea: 67_230 },
  "water-saving-farmer": { visibleHeight: 532, opaqueArea: 63_317 },
  "foreign-theatergoer": { visibleHeight: 536, opaqueArea: 74_338 },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export type WorkshopCustomerVisualTransform = {
  visualScale: number;
  displayWidth: number;
  displayHeight: number;
  x: number;
  y: number;
  footBaselineY: number;
};

export function getWorkshopCustomerVisualTransform(
  requestId: string,
): WorkshopCustomerVisualTransform {
  const artLayout = AI_WORKSHOP_LAYOUT.customerArt;
  const sourceVisibleHeight =
    CUSTOMER_VISUAL_METRICS[requestId]?.visibleHeight ??
    WORKSHOP_CUSTOMER_TARGET_VISIBLE_HEIGHT;
  const sourceOpaqueArea =
    CUSTOMER_VISUAL_METRICS[requestId]?.opaqueArea ??
    WORKSHOP_CUSTOMER_TARGET_OPAQUE_AREA;
  const heightScale =
    WORKSHOP_CUSTOMER_TARGET_VISIBLE_HEIGHT / sourceVisibleHeight;
  const perceivedAreaScale = Math.sqrt(
    WORKSHOP_CUSTOMER_TARGET_OPAQUE_AREA / sourceOpaqueArea,
  );
  const perceivedScale = Math.sqrt(
    heightScale * Math.max(heightScale, perceivedAreaScale),
  );
  const visualScale = clamp(
    perceivedScale,
    WORKSHOP_CUSTOMER_VISUAL_SCALE_LIMITS.min,
    WORKSHOP_CUSTOMER_VISUAL_SCALE_LIMITS.max,
  );
  const displayWidth = artLayout.width * visualScale;
  const displayHeight = artLayout.height * visualScale;
  const sourceFootOffsetFromCenter =
    CUSTOMER_SOURCE_FOOT_Y / CUSTOMER_SOURCE_CANVAS_HEIGHT - 0.5;
  const footBaselineY =
    artLayout.y + artLayout.height * sourceFootOffsetFromCenter;

  return {
    visualScale,
    displayWidth,
    displayHeight,
    x: artLayout.x,
    y: footBaselineY - displayHeight * sourceFootOffsetFromCenter,
    footBaselineY,
  };
}

export function applyWorkshopCustomerVisualTransform(
  customerArt: Phaser.GameObjects.Image,
  requestId: string,
): WorkshopCustomerVisualTransform {
  const transform = getWorkshopCustomerVisualTransform(requestId);
  customerArt
    .setDisplaySize(transform.displayWidth, transform.displayHeight)
    .setPosition(transform.x, transform.y);
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
    .setFlipX(hasTexture)
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
  customerShadow
    ?.setDisplaySize(
      clamp(customerArt.displayWidth * 0.48, 82, 112),
      16,
    )
    .setPosition(customerArt.x, transform.footBaselineY - 5)
    .setVisible(customerArt.visible);
}
