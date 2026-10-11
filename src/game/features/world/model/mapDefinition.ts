import type {
  FeatureDestination,
  WorldActivityId,
  WORLD_COMPLETION_READY_EVENT,
} from "../../../core/navigation";
import type { PlayerFacing } from "../../../core/player/playerFacing";

export type MapId = string;
export type PortalId = string;

export type Point = Readonly<{
  x: number;
  y: number;
}>;

export type Size = Readonly<{
  width: number;
  height: number;
}>;

export type AxisAlignedBounds = Readonly<{
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}>;

export type SpawnDefinition = Readonly<{
  position: Point;
  facing: PlayerFacing;
}>;

export type SceneryDefinition = Readonly<{
  id: string;
  assetKey: string;
  url: string;
  position: Point;
  displaySize: Size;
  occlusionArea: AxisAlignedBounds;
  /**
   * Where the thing meets the ground, as a fraction of its height from the
   * top of its picture (0 = top, 1 = bottom). Midi with her feet above this
   * line walks behind it; below it, in front.
   */
  groundLine: number;
  /** Drawn mirrored left-to-right (its points are mirrored to match). */
  flipX?: boolean;
  progressMarker?:
    | Readonly<{
        kind: "activity-stars";
        featureId: WorldActivityId;
        position: Point;
        capacity: 3;
      }>
    | Readonly<{
        kind: "starlight-exit";
        position: Point;
        requiredStars: 7;
      }>;
}>;

type PortalBase = Readonly<{
  id: PortalId;
  position: Point;
  label: string;
  interactionRadius: number;
  interactionArea?: Readonly<{
    kind: "ellipse";
    radiusX: number;
    radiusY: number;
  }>;
  interactionComparison: "strictly-less-than";
  /**
   * Scenery id: the entry button never shows while Midi stands behind this
   * building (past the middle of its ground outline).
   */
  frontOf?: string;
}>;

export type FeaturePortalDefinition = PortalBase &
  Readonly<{
    availability: Readonly<{ kind: "always" }>;
    destination: FeatureDestination;
    returnSpawn: SpawnDefinition;
  }>;

export type CompletionPortalDefinition = PortalBase &
  Readonly<{
    availability: Readonly<{
      kind: "world-star-total";
      requiredStars: 7;
    }>;
    destination: Readonly<{
      kind: "world-completion-placeholder";
      completionEvent: typeof WORLD_COMPLETION_READY_EVENT;
    }>;
  }>;

export type PortalDefinition =
  | FeaturePortalDefinition
  | CompletionPortalDefinition;

export function isPointWithinPortalInteractionArea(
  portal: PortalDefinition,
  point: Point,
) {
  if (portal.interactionArea?.kind === "ellipse") {
    const normalizedX = (point.x - portal.position.x) /
      portal.interactionArea.radiusX;
    const normalizedY = (point.y - portal.position.y) /
      portal.interactionArea.radiusY;
    return normalizedX * normalizedX + normalizedY * normalizedY < 1;
  }

  return Math.hypot(
    point.x - portal.position.x,
    point.y - portal.position.y,
  ) < portal.interactionRadius;
}

export type PolygonCollisionDefinition = Readonly<{
  id: string;
  points: readonly Point[];
}>;

export type EllipseCollisionDefinition = Readonly<{
  id: string;
  center: Point;
  radiusX: number;
  radiusY: number;
  boundary: "exclusive" | "inclusive";
  maskBypassPadding?: Readonly<{
    x: number;
    y: number;
  }>;
}>;

export type CurvedMovementGuideDefinition = Readonly<{
  id: string;
  center: Point;
  radiusX: number;
  radiusY: number;
}>;

export type PrecomputedCollisionMaskDefinition = Readonly<{
  schemaVersion: 1;
  mapWidth: number;
  mapHeight: number;
  cellSize: number;
  columns: number;
  rows: number;
  encoding: "base64-bitset";
  bitsetBase64: string;
  sampleOffsets: readonly Point[];
}>;

/**
 * A building's ground outline and painted columns, in map coordinates.
 * `id` is the scenery piece it belongs to.
 */
export type BuildingShapeDefinition = Readonly<{
  id: string;
  /** Where the building meets the ground; Midi's feet stay outside it. */
  footprint: readonly Point[];
  /** The picture split into equal columns, left to right. */
  columnLeft: number;
  columnWidth: number;
  /** First and last painted y of each column (null = nothing painted). */
  columnTop: readonly (number | null)[];
  columnBottom: readonly (number | null)[];
  /** Overrides `maxHiddenBehindBuilding` for this building. */
  maxHiddenBehind?: number;
}>;

/** Midi's size on the ground and on screen, around her position. */
export type PlayerBodyDefinition = Readonly<{
  /** Her feet are this far below her position. */
  feetOffsetY: number;
  /** The patch of ground under her that must stay off a building. */
  footRadiusX: number;
  footRadiusY: number;
  /** Her body on screen, measured up from her feet. */
  bodyHalfWidth: number;
  bodyHeight: number;
}>;

export type CollisionDefinition = Readonly<{
  movementBounds: AxisAlignedBounds;
  blockedOutsideBounds: AxisAlignedBounds;
  resolution: "x-then-y";
  polygons: readonly PolygonCollisionDefinition[];
  buildings: readonly BuildingShapeDefinition[];
  playerBody: PlayerBodyDefinition;
  /**
   * Behind a building, Midi may walk on until the building hides this
   * fraction of her body (0 = not at all, 1 = completely).
   */
  maxHiddenBehindBuilding: number;
  ellipses: readonly EllipseCollisionDefinition[];
  curvedMovementGuides: readonly CurvedMovementGuideDefinition[];
  maskWalkableOverrides?: readonly AxisAlignedBounds[];
  precomputedMask: PrecomputedCollisionMaskDefinition;
}>;

export type MapDefinition = Readonly<{
  schemaVersion: 1;
  id: MapId;
  size: Size;
  background: Readonly<{
    assetKey: string;
    url: string;
    fit: "stretch" | "contain" | "cover";
  }>;
  defaultSpawn: SpawnDefinition;
  scenery: readonly SceneryDefinition[];
  portals: readonly PortalDefinition[];
  collision: CollisionDefinition;
}>;

export function defineMap<
  const TDefinition extends MapDefinition,
>(definition: TDefinition): TDefinition {
  return definition;
}
