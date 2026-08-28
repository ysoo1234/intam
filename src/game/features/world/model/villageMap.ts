import { GAME_ASSETS } from "../../../assets";
import { defineMap } from "./mapDefinition";
import { VILLAGE_COLLISION_MASK } from "./villageCollisionMask";

export const VILLAGE_MAP = defineMap({
  schemaVersion: 1,
  id: "world",
  size: { width: 1280, height: 720 },
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
      position: { x: 270, y: 175 },
      displaySize: { width: 266, height: 253 },
      occlusionArea: { minX: 112, maxX: 448, minY: 42, maxY: 225 },
      progressMarker: {
        kind: "activity-stars",
        featureId: "ai-workshop",
        position: { x: 270, y: 56 },
        capacity: 3,
      },
    },
    {
      id: "airport",
      assetKey: "village-airport",
      url: GAME_ASSETS.world.airport,
      position: { x: 989, y: 145 },
      displaySize: { width: 269, height: 252 },
      occlusionArea: { minX: 875, maxX: 1_115, minY: 5, maxY: 205 },
      progressMarker: {
        kind: "activity-stars",
        featureId: "data-flight",
        position: { x: 989, y: 42 },
        capacity: 3,
      },
    },
    {
      id: "ethics-office",
      assetKey: "village-ethics-office",
      url: GAME_ASSETS.world.ethicsOffice,
      position: { x: 267, y: 482 },
      displaySize: { width: 235, height: 254 },
      occlusionArea: { minX: 105, maxX: 510, minY: 350, maxY: 500 },
      progressMarker: {
        kind: "activity-stars",
        featureId: "ethics-review",
        position: { x: 267, y: 372 },
        capacity: 3,
      },
    },
    {
      id: "ai-world-gate",
      assetKey: "village-ai-world-gate",
      url: GAME_ASSETS.world.aiWorldGate,
      position: { x: 1_099, y: 514 },
      displaySize: { width: 324, height: 308 },
      occlusionArea: { minX: 850, maxX: 1_220, minY: 340, maxY: 600 },
      progressMarker: {
        kind: "starlight-exit",
        position: { x: 1_085, y: 347 },
        requiredStars: 9,
      },
    },
    {
      id: "fountain",
      assetKey: "village-fountain",
      url: GAME_ASSETS.world.fountain,
      position: { x: 633, y: 310 },
      displaySize: { width: 238, height: 251 },
      occlusionArea: { minX: 500, maxX: 772, minY: 174, maxY: 426 },
    },
  ],
  portals: [
    {
      id: "shop",
      position: { x: 270, y: 175 },
      label: "생활 속 AI 제작소",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "ai-workshop",
      },
      returnSpawn: {
        position: { x: 360, y: 318 },
        facing: "front",
      },
      interactionRadius: 210,
      interactionComparison: "strictly-less-than",
    },
    {
      id: "workshop",
      position: { x: 267, y: 482 },
      label: "윤리 심사소",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "ethics-review",
      },
      returnSpawn: {
        position: { x: 310, y: 680 },
        facing: "front",
      },
      interactionRadius: 205,
      interactionComparison: "strictly-less-than",
    },
    {
      id: "library",
      position: { x: 989, y: 145 },
      label: "데이터 비행 공항",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "data-flight",
      },
      returnSpawn: {
        position: { x: 910, y: 318 },
        facing: "front",
      },
      interactionRadius: 205,
      interactionComparison: "strictly-less-than",
    },
    {
      id: "starlight-exit",
      position: { x: 1_099, y: 514 },
      label: "별빛 졸업길",
      availability: {
        kind: "world-star-total",
        requiredStars: 9,
      },
      destination: {
        kind: "world-completion-placeholder",
        completionEvent: "world:starlight-graduation-path-ready",
      },
      interactionRadius: 220,
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
        points: [
          { x: 137, y: 49 }, { x: 403, y: 49 }, { x: 403, y: 275 },
          { x: 385, y: 302 }, { x: 155, y: 302 }, { x: 137, y: 275 },
        ],
      },
      {
        id: "airport-building",
        points: [
          { x: 854, y: 7 }, { x: 1_124, y: 7 }, { x: 1_124, y: 254 },
          { x: 1_100, y: 283 }, { x: 875, y: 283 }, { x: 854, y: 254 },
        ],
      },
      {
        id: "ethics-office-building",
        points: [
          { x: 149, y: 500 }, { x: 355, y: 500 }, { x: 370, y: 567 },
          { x: 351, y: 593 }, { x: 155, y: 593 }, { x: 134, y: 567 },
          { x: 134, y: 526 },
        ],
      },
    ],
    ellipses: [
      {
        id: "northwest-flowerbed",
        center: { x: 255, y: 180 },
        radiusX: 210,
        radiusY: 165,
        boundary: "inclusive",
        maskBypassPadding: { x: 6, y: 6 },
      },
      {
        id: "northeast-flowerbed",
        center: { x: 1_005, y: 180 },
        radiusX: 265,
        radiusY: 165,
        boundary: "inclusive",
        maskBypassPadding: { x: 6, y: 6 },
      },
      {
        id: "southwest-flowerbed",
        center: { x: 184, y: 600 },
        radiusX: 265,
        radiusY: 190,
        boundary: "inclusive",
        maskBypassPadding: { x: 6, y: 6 },
      },
      {
        id: "fountain",
        center: { x: 636, y: 372 },
        radiusX: 166,
        radiusY: 122,
        boundary: "inclusive",
        maskBypassPadding: { x: 18, y: 14 },
      },
    ],
    curvedMovementGuides: [
      {
        id: "northwest-garden",
        center: { x: 255, y: 180 },
        radiusX: 210,
        radiusY: 165,
      },
      {
        id: "northeast-garden",
        center: { x: 1_005, y: 180 },
        radiusX: 265,
        radiusY: 165,
      },
      {
        id: "southwest-garden",
        center: { x: 184, y: 600 },
        radiusX: 265,
        radiusY: 190,
      },
      {
        id: "ethics-office-footprint",
        center: { x: 267, y: 557 },
        radiusX: 124,
        radiusY: 67,
      },
    ],
    maskWalkableOverrides: [
      { minX: 700, maxX: 1_280, minY: 360, maxY: 720 },
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
