/**
 * Where everything sits in the ending (1280 x 720 game pixels). The village
 * acts keep the bottom strip for Midi and her line; the portal opens over
 * the middle of the village like the intro's door.
 */
export const ENDING_DEPTH = {
  village: 1,
  dim: 2,
  glow: 3,
  stars: 4,
  portal: 5,
  ring: 5.2,
  customers: 6,
  light: 7,
  narrator: 20,
  panel: 21,
  button: 22,
  bars: 19,
  skip: 31,
  certificateDim: 40,
  certificate: 41,
  certificateUi: 42,
  flash: 60,
} as const;

/** Midi's line, along the bottom (the intro's story panel, a little lower). */
export const ENDING_PANEL = { left: 214, right: 1196, y: 652, height: 84 } as const;
/** Midi telling the story, bottom-left (feet at y). Face frames are 320 px with a 311 px body. */
export const ENDING_NARRATOR = { x: 118, y: 706, height: 150 } as const;
export const MIDI_FACE_BODY_RATIO = 311 / 320;

// Door to the school library, opened over the village. Same generated ring as
// the intro (story-portal-frame-v1: ring centre 819,479, ring width 1484 on 1639 x 960).
export const ENDING_PORTAL = { x: 640, y: 286, width: 620, height: 326 } as const;
export const ENDING_PORTAL_FRAME = { ringWidth: 1_484, originX: 819 / 1_639, originY: 479 / 960 } as const;
/** The 16:9 library picture covers the whole opening. */
export const ENDING_LIBRARY_VIEW = { width: 620, height: 349 } as const;

// Workshop customers who gather to wave goodbye: feet spots and heights,
// four on each side of the door (a back row and a front row), clear of the
// door, the promise button and Midi. Interleaved left/right so they stream
// in from both sides at once.
export const ENDING_CUSTOMER_SPOTS = [
  { x: 262, y: 624, height: 176 },
  { x: 1_018, y: 624, height: 176 },
  { x: 392, y: 612, height: 166 },
  { x: 888, y: 612, height: 166 },
  { x: 204, y: 556, height: 148 },
  { x: 1_076, y: 556, height: 148 },
  { x: 330, y: 548, height: 142 },
  { x: 950, y: 548, height: 142 },
] as const;
/** Customer canvases are 454 x 680 with the feet centred at (227, 641). */
export const ENDING_CUSTOMER_FEET = { x: 227 / 454, y: 641 / 680 } as const;

export const ENDING_PROMISE_BUTTON = { x: 640, y: 548, width: 250, height: 64 } as const;
export const ENDING_SKIP = { x: 1_172, y: 42, width: 132, height: 42 } as const;
export const ENDING_CINEMA_BAR = 52;

/** The certificate on screen (its canvas is 1600 x 1130). */
export const ENDING_CERTIFICATE_VIEW = { x: 640, y: 306, width: 800 } as const;
// Caption close under the certificate, buttons below it with room at the bottom.
export const ENDING_CERTIFICATE_CAPTION_Y = 614;
export const ENDING_CERTIFICATE_BUTTONS_Y = 662;
