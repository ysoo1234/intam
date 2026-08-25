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
      position: { x: 289, y: 156 },
      displaySize: { width: 292, height: 264 },
      occlusionArea: { minX: 160, maxX: 420, minY: 20, maxY: 245 },
    },
    {
      id: "airport",
      assetKey: "village-airport",
      url: GAME_ASSETS.world.airport,
      position: { x: 989, y: 145 },
      displaySize: { width: 269, height: 275 },
      occlusionArea: { minX: 875, maxX: 1_115, minY: 5, maxY: 205 },
    },
    {
      id: "ethics-office",
      assetKey: "village-ethics-office",
      url: GAME_ASSETS.world.ethicsOffice,
      position: { x: 242, y: 518 },
      displaySize: { width: 251, height: 240 },
      occlusionArea: { minX: 135, maxX: 390, minY: 385, maxY: 585 },
    },
    {
      id: "ai-world-gate",
      assetKey: "village-ai-world-gate",
      url: GAME_ASSETS.world.aiWorldGate,
      position: { x: 1_099, y: 514 },
      displaySize: { width: 324, height: 328 },
      occlusionArea: { minX: 850, maxX: 1_220, minY: 340, maxY: 600 },
    },
    {
      id: "fountain",
      assetKey: "village-fountain",
      url: GAME_ASSETS.world.fountain,
      position: { x: 636, y: 330 },
      displaySize: { width: 211, height: 218 },
      occlusionArea: { minX: 505, maxX: 767, minY: 220, maxY: 365 },
    },
  ],
  portals: [
    {
      id: "shop",
      position: { x: 360, y: 305 },
      label: "생활 속 AI 가게",
      available: true,
      destination: {
        kind: "feature",
        featureId: "ai-workshop",
      },
      interactionRadius: 100,
      interactionComparison: "strictly-less-than",
    },
    {
      id: "workshop",
      position: { x: 285, y: 654 },
      label: "윤리 심사소",
      available: true,
      destination: {
        kind: "feature",
        featureId: "ethics-review",
      },
      interactionRadius: 105,
      interactionComparison: "strictly-less-than",
    },
    {
      id: "library",
      position: { x: 910, y: 304 },
      label: "데이터 비행 공항",
      available: true,
      destination: {
        kind: "feature",
        featureId: "data-flight",
      },
      interactionRadius: 100,
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
          { x: 143, y: 24 }, { x: 435, y: 24 }, { x: 435, y: 260 },
          { x: 410, y: 288 }, { x: 162, y: 288 }, { x: 143, y: 260 },
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
          { x: 132, y: 538 }, { x: 352, y: 538 }, { x: 368, y: 610 },
          { x: 348, y: 638 }, { x: 138, y: 638 }, { x: 116, y: 610 },
          { x: 116, y: 566 },
        ],
      },
    ],
    ellipses: [
      {
        id: "fountain",
        center: { x: 636, y: 364 },
        radiusX: 164,
        radiusY: 120,
        boundary: "inclusive",
        maskBypassPadding: { x: 42, y: 34 },
      },
    ],
    curvedMovementGuides: [
      {
        id: "northwest-garden",
        center: { x: 280, y: 214 },
        radiusX: 223,
        radiusY: 126,
      },
      {
        id: "northeast-garden",
        center: { x: 1_000, y: 214 },
        radiusX: 223,
        radiusY: 126,
      },
      {
        id: "southwest-garden",
        center: { x: 184, y: 600 },
        radiusX: 304,
        radiusY: 160,
      },
      {
        id: "southeast-garden",
        center: { x: 1_088, y: 612 },
        radiusX: 322,
        radiusY: 172,
      },
      {
        id: "ethics-office-footprint",
        center: { x: 242, y: 582 },
        radiusX: 132,
        radiusY: 62,
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
