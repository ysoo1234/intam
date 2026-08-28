export const AI_WORKSHOP_LAYOUT = {
  customerArt: { x: -16, y: -43, width: 227, height: 340 },
  customerStage: { x: 183, y: 482 },
  customerInteraction: { x: 245, y: 500, radius: 175 },
  workbench: { x: 855, y: 714, interactionY: 585, depth: 33 },
  playerBounds: { left: 300, right: 1180, top: 398, bottom: 550 },
  // Player coordinates use the centre of Midi, not the feet. These guides
  // follow the visible floor edges in the workshop art so the left and lower
  // rugs remain usable without letting the sprite enter the furniture.
  walkableCeiling: [
    { x: 300, y: 510 },
    { x: 350, y: 486 },
    { x: 430, y: 430 },
    { x: 520, y: 403 },
    { x: 620, y: 398 },
    { x: 1180, y: 398 },
  ],
  walkableFloor: [
    { x: 300, y: 550 },
    { x: 430, y: 550 },
    { x: 520, y: 530 },
    { x: 650, y: 505 },
    { x: 1180, y: 505 },
  ],
  ceilingObstacles: [
    // The planter is attached to the upper furniture boundary. Add a compact
    // smooth bump to that boundary rather than a full circle around its leaves.
    { x: 400, radiusX: 34, bumpY: 20 },
  ],
  playerVisual: {
    halfHeight: 62.5,
    carriedArtHalfSize: 82,
    carriedBaseScale: 0.73,
    carriedGap: -20,
    carriedSpacing: 92,
  },
  playerSpeed: 400,
} as const;
