import { GAME_ASSETS } from "../../../assets";
import { defineMap } from "./mapDefinition";
import { VILLAGE_COLLISION_MASK } from "./villageCollisionMask";
import {
  VILLAGE_MAP_LAYOUT_SIZE,
  getVillageBuildingPosition,
  getVillageBuildingSize,
  getVillageStarPosition,
  isVillageBuildingMirrored,
  offsetVillageBounds,
  offsetVillagePoint,
  offsetVillagePoints,
  offsetVillageRadius,
  offsetVillageSize,
} from "./villageLayoutGrid";

export const VILLAGE_MAP = defineMap({
  schemaVersion: 1,
  id: "world",
  size: VILLAGE_MAP_LAYOUT_SIZE,
  background: {
    assetKey: "village-ground",
    url: GAME_ASSETS.world.ground,
    fit: "stretch",
  },
  defaultSpawn: {
    // Midi starts a little below the middle, under the fountain.
    position: { x: 642, y: 604 },
    facing: "front",
  },
  scenery: [
    {
      id: "ai-shop",
      assetKey: "village-ai-shop",
      url: GAME_ASSETS.world.shop,
      position: getVillageBuildingPosition("ai-shop"),
      displaySize: getVillageBuildingSize("ai-shop"),
      flipX: isVillageBuildingMirrored("ai-shop"),
      occlusionArea: offsetVillageBounds("ai-shop", {
        minX: 111, maxX: 428, minY: -48, maxY: 64,
      }),
      progressMarker: {
        kind: "activity-stars",
        featureId: "ai-workshop",
        position: getVillageStarPosition("ai-shop"),
        capacity: 3,
      },
    },
    {
      id: "airport",
      assetKey: "village-airport",
      url: GAME_ASSETS.world.airport,
      position: getVillageBuildingPosition("airport"),
      displaySize: getVillageBuildingSize("airport"),
      flipX: isVillageBuildingMirrored("airport"),
      occlusionArea: offsetVillageBounds("airport", {
        minX: 824, maxX: 1_154, minY: -88, maxY: 37,
      }),
      progressMarker: {
        kind: "activity-stars",
        featureId: "data-flight",
        position: getVillageStarPosition("airport"),
        capacity: 3,
      },
    },
    {
      id: "ethics-office",
      assetKey: "village-ethics-office",
      url: GAME_ASSETS.world.ethicsOffice,
      position: getVillageBuildingPosition("ethics-office"),
      displaySize: getVillageBuildingSize("ethics-office"),
      flipX: isVillageBuildingMirrored("ethics-office"),
      occlusionArea: offsetVillageBounds("ethics-office", {
        minX: 125, maxX: 410, minY: 252, maxY: 372,
      }),
      progressMarker: {
        kind: "activity-stars",
        featureId: "ethics-review",
        position: getVillageStarPosition("ethics-office"),
        capacity: 3,
      },
    },
    {
      id: "ai-world-gate",
      assetKey: "village-ai-world-gate",
      url: GAME_ASSETS.world.aiWorldGate,
      position: getVillageBuildingPosition("ai-world-gate"),
      displaySize: getVillageBuildingSize("ai-world-gate"),
      flipX: isVillageBuildingMirrored("ai-world-gate"),
      occlusionArea: offsetVillageBounds("ai-world-gate", {
        minX: 906, maxX: 1_292, minY: 240, maxY: 380,
      }),
      progressMarker: {
        kind: "starlight-exit",
        position: offsetVillagePoint("ai-world-gate", { x: 1_085, y: 347 }),
        requiredStars: 7,
      },
    },
    {
      id: "fountain",
      assetKey: "village-fountain",
      url: GAME_ASSETS.world.fountain,
      position: getVillageBuildingPosition("fountain"),
      displaySize: getVillageBuildingSize("fountain"),
      flipX: isVillageBuildingMirrored("fountain"),
      // Only Midi behind the tiers is drawn under the fountain; beside the
      // basin and in front of it she stays on top.
      occlusionArea: offsetVillageBounds("fountain", {
        minX: 557, maxX: 710, minY: 174, maxY: 365,
      }),
    },
  ],
  portals: [
    {
      id: "shop",
      position: offsetVillagePoint("ai-shop", { x: 318, y: 236 }),
      label: "생활 속 AI 제작소",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "ai-workshop",
      },
      returnSpawn: {
        // Beside the door, toward the plaza: the doors of the front row face
        // the bottom edge of the screen.
        position: offsetVillagePoint("ai-shop", { x: 440, y: 274 }),
        facing: "front",
      },
      interactionRadius: offsetVillageRadius("ai-shop", 205),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("ai-shop", {
          width: 205, height: 115,
        }).width,
        radiusY: offsetVillageSize("ai-shop", {
          width: 205, height: 115,
        }).height,
      },
      interactionComparison: "strictly-less-than",
    },
    {
      id: "workshop",
      // The entry prompt belongs to the paved approach in front of the door.
      // Keeping this ellipse below the building prevents activation at its
      // sides or behind its roof while retaining a broad front approach.
      position: offsetVillagePoint("ethics-office", { x: 318, y: 665 }),
      label: "윤리 심사소",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "ethics-review",
      },
      returnSpawn: {
        position: offsetVillagePoint("ethics-office", { x: 427, y: 537 }),
        facing: "front",
      },
      interactionRadius: offsetVillageRadius("ethics-office", 200),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("ethics-office", {
          width: 183, height: 130,
        }).width,
        radiusY: offsetVillageSize("ethics-office", {
          width: 183, height: 130,
        }).height,
      },
      interactionComparison: "strictly-less-than",
    },
    {
      id: "library",
      position: offsetVillagePoint("airport", { x: 950, y: 227 }),
      label: "데이터 비행 공항",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "data-flight",
      },
      returnSpawn: {
        position: offsetVillagePoint("airport", { x: 827, y: 295 }),
        facing: "front",
      },
      interactionRadius: offsetVillageRadius("airport", 208),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("airport", {
          width: 208, height: 110,
        }).width,
        radiusY: offsetVillageSize("airport", {
          width: 208, height: 110,
        }).height,
      },
      interactionComparison: "strictly-less-than",
    },
    {
      id: "starlight-exit",
      position: getVillageBuildingPosition("ai-world-gate"),
      label: "별빛 졸업길",
      availability: {
        kind: "world-star-total",
        requiredStars: 7,
      },
      destination: {
        kind: "world-completion-placeholder",
        completionEvent: "world:starlight-graduation-path-ready",
      },
      interactionRadius: offsetVillageRadius("ai-world-gate", 220),
      interactionComparison: "strictly-less-than",
    },
  ],
  collision: {
    movementBounds: { minX: 20, maxX: 1260, minY: 100, maxY: 705 },
    blockedOutsideBounds: { minX: 14, maxX: 1266, minY: 90, maxY: 714 },
    resolution: "x-then-y",
    // Each building's footprint plus the strip of ground behind it where
    // Midi would be drawn under the artwork, so she never slips behind a
    // building. Outlines follow the artwork's silhouette, widened by half of
    // Midi's width (measured from the runtime WebPs).
    polygons: [
      {
        id: "ai-shop-building",
        points: offsetVillagePoints("ai-shop", [
          { x: 111, y: 223 }, { x: 121, y: 215 }, { x: 126, y: 115 },
          { x: 135, y: 96 }, { x: 164, y: 83 }, { x: 169, y: 56 },
          { x: 222, y: 55 }, { x: 232, y: 62 }, { x: 251, y: 58 },
          { x: 294, y: 40 }, { x: 362, y: 43 }, { x: 381, y: 51 },
          { x: 410, y: 75 }, { x: 414, y: 82 }, { x: 419, y: 185 },
          { x: 424, y: 215 }, { x: 424, y: 237 }, { x: 395, y: 250 },
          { x: 390, y: 260 }, { x: 347, y: 279 }, { x: 304, y: 285 },
          { x: 265, y: 301 }, { x: 222, y: 297 }, { x: 121, y: 241 },
          { x: 111, y: 241 },
        ]),
      },
      {
        id: "airport-building",
        points: offsetVillagePoints("airport", [
          { x: 1_154, y: 93 }, { x: 1_148, y: 79 }, { x: 1_131, y: 68 },
          { x: 1_119, y: 12 }, { x: 1_051, y: 10 }, { x: 1_039, y: 21 },
          { x: 982, y: 21 }, { x: 965, y: 30 }, { x: 936, y: 34 },
          { x: 907, y: 55 }, { x: 862, y: 73 }, { x: 850, y: 85 },
          { x: 833, y: 94 }, { x: 827, y: 103 }, { x: 827, y: 224 },
          { x: 839, y: 224 }, { x: 844, y: 231 }, { x: 856, y: 233 },
          { x: 862, y: 264 }, { x: 867, y: 266 }, { x: 902, y: 266 },
          { x: 913, y: 256 }, { x: 919, y: 261 }, { x: 953, y: 261 },
          { x: 970, y: 251 }, { x: 976, y: 260 }, { x: 993, y: 269 },
          { x: 1_034, y: 268 }, { x: 1_131, y: 216 }, { x: 1_137, y: 110 },
          { x: 1_142, y: 105 }, { x: 1_154, y: 105 },
        ]),
      },
      {
        id: "ethics-office-building",
        points: offsetVillagePoints("ethics-office", [
          { x: 410, y: 466 }, { x: 381, y: 402 }, { x: 334, y: 356 },
          { x: 295, y: 346 }, { x: 223, y: 350 }, { x: 199, y: 362 },
          { x: 180, y: 383 }, { x: 166, y: 392 }, { x: 156, y: 404 },
          { x: 152, y: 422 }, { x: 142, y: 431 }, { x: 137, y: 470 },
          { x: 132, y: 476 }, { x: 128, y: 529 }, { x: 128, y: 557 },
          { x: 137, y: 557 }, { x: 142, y: 566 }, { x: 156, y: 578 },
          { x: 195, y: 596 }, { x: 262, y: 607 }, { x: 314, y: 607 },
          { x: 348, y: 598 }, { x: 391, y: 566 }, { x: 396, y: 558 },
          { x: 401, y: 511 }, { x: 410, y: 511 },
        ]),
      },
      {
        // The whole tablet, cover included: Midi enters the portal from the
        // front and cannot walk through or behind either half.
        id: "ai-world-gate-tablet",
        points: offsetVillagePoints("ai-world-gate", [
          { x: 906, y: 551 }, { x: 912, y: 362 }, { x: 936, y: 350 },
          { x: 996, y: 350 }, { x: 1_092, y: 378 }, { x: 1_134, y: 378 },
          { x: 1_218, y: 400 }, { x: 1_272, y: 406 }, { x: 1_284, y: 418 },
          { x: 1_290, y: 502 }, { x: 1_290, y: 554 }, { x: 1_278, y: 554 },
          { x: 1_272, y: 560 }, { x: 1_266, y: 652 }, { x: 1_242, y: 667 },
          { x: 1_194, y: 663 }, { x: 1_086, y: 626 }, { x: 1_038, y: 627 },
          { x: 966, y: 604 }, { x: 948, y: 604 }, { x: 930, y: 598 },
          { x: 918, y: 588 }, { x: 906, y: 588 },
        ]),
      },
    ],
    ellipses: [
      {
        id: "fountain",
        // The basin and the ground behind its tiers, where Midi would vanish
        // behind the fountain; she walks around its back over the lawn.
        center: offsetVillagePoint("fountain", { x: 634, y: 308 }),
        radiusX: offsetVillageSize("fountain", {
          width: 149, height: 128,
        }).width,
        radiusY: offsetVillageSize("fountain", {
          width: 149, height: 128,
        }).height,
        boundary: "inclusive",
      },
    ],
    curvedMovementGuides: [
      {
        id: "ethics-office-footprint",
        center: offsetVillagePoint("ethics-office", { x: 267, y: 557 }),
        radiusX: offsetVillageSize("ethics-office", {
          width: 124, height: 67,
        }).width,
        radiusY: offsetVillageSize("ethics-office", {
          width: 124, height: 67,
        }).height,
      },
    ],
    precomputedMask: {
      ...VILLAGE_COLLISION_MASK,
      sampleOffsets: [
        { x: 0, y: 6 }, { x: -15, y: 4 }, { x: 15, y: 4 },
        { x: -10, y: 12 }, { x: 10, y: 12 },
      ],
    },
  },
} as const);

