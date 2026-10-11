/**
 * Logical 1280 x 720 placement for the review office, in two panels like a
 * border booth: the service window on the left (0–560) and the desk seen from
 * above on the right (560–1280).
 *
 * Booth art (1086 x 1448) is drawn 560 wide (scale 0.5157) and 13 px up, so
 * art pixel (x, y) lands at (x * 0.5157, y * 0.5157 - 13). Desk art
 * (1254 x 1254) fills 560..1280 x 0..720 (scale 0.5742).
 */
export const ETHICS_LAYOUT = {
  boothPanel: { x: 0, y: -13, width: 560, height: 747 },
  deskPanel: { x: 560, y: 0, width: 720, height: 720 },
  // The open part of the arched window (the cut-out in the front booth layer).
  window: { x: 128, y: 24, width: 350, height: 325, archRadius: 77 },
  // A student stands in the hallway behind the counter; the booth's front
  // layer (frame, sill, counter) is drawn over them.
  // Student art: 636 x 952 canvas (1.4x the customer canvas, close to the
  // source resolution), feet centred at y 897 of the canvas.
  visitor: { x: 303, feetY: 545, height: 690, canvasHeight: 952, canvasFootY: 897 },
  // The visitor's speech bubble, up and to the right of the window.
  // The bubble's left edge (its tail tip is 16 px further left), just right of the student's head.
  visitorBubble: { left: 384, y: 116, maxWidth: 250 },
  // The document tray on the counter: forms slide from here onto the desk and back.
  sill: { x: 410, y: 423 },
  // Midi stands in front of the counter with its back to us; the screen edge
  // crops its lower body.
  midi: { x: 150, feetY: 748, height: 290 },
  midiBubble: { x: 290, y: 420 },
  // The inspection form lies on the desk mat (art 960 x 440, stamp circle lower right).
  form: { x: 930, y: 292, width: 470, height: 215 },
  // Both stamps stand on the two coasters below the mat.
  stamps: { approve: { x: 784, y: 652 }, reject: { x: 1054, y: 652 } },
  // The small copy of the form lying on the booth's counter mat.
  counterForm: { x: 283, y: 451, topWidth: 112, bottomWidth: 126, height: 50 },
  stampSize: { width: 168, height: 180 },
  // The practice's 다음 button sits on the mat under the form.
  hint: { x: 930, y: 470 },
} as const;
