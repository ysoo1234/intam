/**
 * Logical 1280 x 720 placement for the inspection office. The booth artwork
 * (`inspection-booth-v2`) has its service window at the upper left, a narrow
 * clerk aisle behind the desk, and a wide honey desktop in the foreground.
 */
export const ETHICS_LAYOUT = {
  // Cream arched opening of the service window, measured on the booth art.
  window: { x: 76, y: 62, width: 318, height: 268, archRadius: 96 },
  // A student stands in the corridor behind the sill; the mask crops the legs.
  // Workshop customer art: 454 x 680 canvas, feet at y 642 of the canvas.
  visitor: { x: 232, feetY: 584, height: 690, canvasHeight: 680, canvasFootY: 642 },
  // Where the visitor's speech bubble sits, just right of the window.
  visitorBubble: { x: 548, y: 262, maxWidth: 250 },
  // Counter sill: forms slide from here onto the desk and back.
  sill: { x: 330, y: 352 },
  // Midi stands in the clerk aisle, behind the desk and in front of the shelves.
  midi: { x: 850, feetY: 342, height: 196 },
  // The inspection form lies on the desk in front of Midi.
  form: { x: 830, y: 462, width: 500, height: 300 },
  // Rubber soles of both stamps rest on the desk's front corners.
  stamps: { approve: { x: 466, y: 644 }, reject: { x: 1190, y: 644 } },
  stampSize: { width: 150, height: 138 },
  // Plain cabinet front under the window carries the review-rule panel.
  rulebook: { x: 195, y: 548, width: 300, height: 236 },
  hint: { x: 830, y: 650 },
} as const;
