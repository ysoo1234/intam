import { GAME_ASSETS } from "../../../assets";
import { defineMap, type CurvedMovementGuideDefinition, type EllipseCollisionDefinition } from "./mapDefinition";
import { VILLAGE_COLLISION_MASK } from "./villageCollisionMask";
import {
  VILLAGE_MAP_LAYOUT_SIZE,
  getVillageBuildingPosition,
  getVillageBuildingSize,
  getVillageStarPosition,
  isVillageBuildingMirrored,
  offsetVillageBounds,
  offsetVillagePoint,
  offsetVillageRadius,
  offsetVillageSize,
  villageBuildingShape,
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
      groundLine: 0.99,
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
      groundLine: 0.98,
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
      groundLine: 0.99,
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
      groundLine: 0.9,
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
      groundLine: 0.99,
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
      // The front yard around the door steps.
      position: offsetVillagePoint("ai-shop", { x: 366, y: 289 }),
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
      interactionRadius: offsetVillageRadius("ai-shop", 116),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("ai-shop", {
          width: 116, height: 63,
        }).width,
        radiusY: offsetVillageSize("ai-shop", {
          width: 116, height: 63,
        }).height,
      },
      interactionComparison: "strictly-less-than",
      frontOf: "ai-shop",
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
      frontOf: "ethics-office",
    },
    {
      id: "library",
      // The front yard below and beside the hangar door and the plane (not
      // the plain wall side or the lawn behind it).
      position: offsetVillagePoint("airport", { x: 895, y: 271 }),
      label: "데이터 비행장",
      availability: { kind: "always" },
      destination: {
        kind: "feature",
        featureId: "data-flight",
      },
      returnSpawn: {
        position: offsetVillagePoint("airport", { x: 827, y: 295 }),
        facing: "front",
      },
      interactionRadius: offsetVillageRadius("airport", 159),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("airport", {
          width: 159, height: 74,
        }).width,
        radiusY: offsetVillageSize("airport", {
          width: 159, height: 74,
        }).height,
      },
      interactionComparison: "strictly-less-than",
      frontOf: "airport",
    },
    {
      id: "starlight-exit",
      // The front yard of the whole book.
      position: offsetVillagePoint("ai-world-gate", { x: 1_098, y: 674 }),
      label: "별빛 졸업길",
      availability: {
        kind: "world-star-total",
        requiredStars: 7,
      },
      destination: {
        kind: "world-completion-placeholder",
        completionEvent: "world:starlight-graduation-path-ready",
      },
      interactionRadius: offsetVillageRadius("ai-world-gate", 189),
      interactionArea: {
        kind: "ellipse",
        radiusX: offsetVillageSize("ai-world-gate", {
          width: 189, height: 78,
        }).width,
        radiusY: offsetVillageSize("ai-world-gate", {
          width: 189, height: 78,
        }).height,
      },
      interactionComparison: "strictly-less-than",
      frontOf: "ai-world-gate",
    },
  ],
  collision: {
    movementBounds: { minX: 20, maxX: 1260, minY: 100, maxY: 705 },
    blockedOutsideBounds: { minX: 14, maxX: 1266, minY: 90, maxY: 714 },
    resolution: "x-then-y",
    polygons: [
      {
        id: "west-forest-edge",
        points: [{ x: 0, y: 140 }, { x: 40, y: 140 }, { x: 40, y: 470 }, { x: 0, y: 470 }],
      },
    ],
    // Each building blocks only the ground it stands on (its outline traced
    // from the picture), so Midi walks right up to the walls without
    // stepping into them, and on the lawn behind it until the building
    // hides too much of her.
    buildings: [
      villageBuildingShape("ai-shop"),
      villageBuildingShape("airport"),
      villageBuildingShape("ethics-office"),
      // Like the fountain, the gate is a thin standing book: Midi may walk
      // along the lawn behind it (it hides her while she passes).
      villageBuildingShape("ai-world-gate", { maxHiddenBehind: 1 }),
      // The fountain is low except for its narrow tiers, so Midi may walk
      // all the way along the back of its basin (the basin itself still
      // blocks, and never covers her feet).
      villageBuildingShape("fountain", { maxHiddenBehind: 1 }),
    ],
    // Midi's position is just above her feet. Her ground patch is about as
    // wide as her body, so her arms never sink into a wall beside her.
    // bodyHalfWidth leaves out her hands and ear tips, which may tuck behind
    // a wall's edge.
    playerBody: {
      feetOffsetY: 10,
      footRadiusX: 38,
      footRadiusY: 7,
      bodyHalfWidth: 30,
      bodyHeight: 100,
    },
    // Behind a building Midi can walk on until it hides this much of her
    // height (0.4 = 40%, about up to her belly). Raise it to let her go
    // further behind, lower it to keep more of her in sight.
    maxHiddenBehindBuilding: 0.4,
    // Trees the painted mask leaves open: the tall cypress at the top of the
    // garden and the row of trees along the west edge.
    ellipses: [
      { id: "north-cypress", center: { x: 455, y: 148 }, radiusX: 16, radiusY: 22, boundary: "inclusive" },
    ] as EllipseCollisionDefinition[],
    curvedMovementGuides: [] as CurvedMovementGuideDefinition[],
    precomputedMask: {
      ...VILLAGE_COLLISION_MASK,
      sampleOffsets: [
        { x: 0, y: 6 }, { x: -15, y: 4 }, { x: 15, y: 4 },
        { x: -10, y: 12 }, { x: 10, y: 12 },
      ],
    },
  },
} as const);

