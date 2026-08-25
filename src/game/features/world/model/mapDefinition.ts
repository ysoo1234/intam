import type { FeatureDestination } from "../../../core/navigation";
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
}>;

export type PortalDefinition = Readonly<{
  id: PortalId;
  position: Point;
  label: string;
  available: boolean;
  destination: FeatureDestination;
  interactionRadius: number;
  interactionComparison: "strictly-less-than";
}>;

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

export type CollisionDefinition = Readonly<{
  movementBounds: AxisAlignedBounds;
  blockedOutsideBounds: AxisAlignedBounds;
  resolution: "x-then-y";
  polygons: readonly PolygonCollisionDefinition[];
  ellipses: readonly EllipseCollisionDefinition[];
  curvedMovementGuides: readonly CurvedMovementGuideDefinition[];
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
