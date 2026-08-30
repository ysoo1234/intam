import { GAME_ASSETS } from "../../../assets";
import { defineMap } from "./mapDefinition";
import { VILLAGE_COLLISION_MASK } from "./villageCollisionMask";
import {
  VILLAGE_MAP_LAYOUT_SIZE,
  getVillageBuildingPosition,
  getVillageBuildingSize,
  getVillageStarPosition,
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
    position: { x: 628, y: 610 },
    facing: "front",
  },
  scenery: [
    {
      id: "ai-shop",
      assetKey: "village-ai-shop",
      url: GAME_ASSETS.world.shop,
      position: getVillageBuildingPosition("ai-shop"),
      displaySize: getVillageBuildingSize("ai-shop"),
      occlusionArea: offsetVillageBounds("ai-shop", {
        minX: 112, maxX: 448, minY: 42, maxY: 225,
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
      occlusionArea: offsetVillageBounds("airport", {
        minX: 875, maxX: 1_115, minY: 5, maxY: 205,
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
      occlusionArea: offsetVillageBounds("ethics-office", {
        minX: 105, maxX: 510, minY: 350, maxY: 590,
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
      occlusionArea: offsetVillageBounds("ai-world-gate", {
        minX: 850, maxX: 1_220, minY: 340, maxY: 600,
      }),
      progressMarker: {
        kind: "starlight-exit",
        position: offsetVillagePoint("ai-world-gate", { x: 1_085, y: 347 }),
        requiredStars: 9,
      },
    },
    {
      id: "fountain",
      assetKey: "village-fountain",
      url: GAME_ASSETS.world.fountain,
      position: getVillageBuildingPosition("fountain"),
      displaySize: getVillageBuildingSize("fountain"),
      occlusionArea: offsetVillageBounds("fountain", {
        minX: 500, maxX: 772, minY: 174, maxY: 426,
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
        position: offsetVillagePoint("ai-shop", { x: 360, y: 318 }),
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
        position: offsetVillagePoint("ethics-office", { x: 310, y: 680 }),
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
        position: offsetVillagePoint("airport", { x: 910, y: 318 }),
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
        requiredStars: 9,
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
    movementBounds: { minX: 60, maxX: 1220, minY: 80, maxY: 680 },
    blockedOutsideBounds: { minX: 32, maxX: 1248, minY: 30, maxY: 700 },
    resolution: "x-then-y",
    polygons: [
      {
        id: "ai-shop-building",
        points: offsetVillagePoints("ai-shop", [
          { x: 137, y: 49 }, { x: 403, y: 49 }, { x: 403, y: 275 },
          { x: 385, y: 302 }, { x: 155, y: 302 }, { x: 137, y: 275 },
        ]),
      },
      {
        id: "airport-building",
        points: offsetVillagePoints("airport", [
          { x: 854, y: 7 }, { x: 1_124, y: 7 }, { x: 1_124, y: 254 },
          { x: 1_100, y: 283 }, { x: 875, y: 283 }, { x: 854, y: 254 },
        ]),
      },
      {
        id: "ethics-office-building",
        points: offsetVillagePoints("ethics-office", [
          { x: 149, y: 455 }, { x: 400, y: 455 }, { x: 420, y: 567 },
          { x: 405, y: 593 }, { x: 155, y: 593 }, { x: 134, y: 567 },
          { x: 134, y: 480 },
        ]),
      },
      {
        id: "ai-world-gate-portal-barrier",
        points: offsetVillagePoints("ai-world-gate", [
          { x: 1_020, y: 600 }, { x: 1_185, y: 615 },
          { x: 1_185, y: 645 }, { x: 1_020, y: 630 },
        ]),
      },
    ],
    ellipses: [
      {
        id: "fountain",
        center: offsetVillagePoint("fountain", { x: 636, y: 372 }),
        radiusX: offsetVillageSize("fountain", {
          width: 166, height: 122,
        }).width,
        radiusY: offsetVillageSize("fountain", {
          width: 166, height: 122,
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

export type VillageMapDefinition = typeof VILLAGE_MAP;
