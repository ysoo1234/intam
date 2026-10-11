import type {
  AxisAlignedBounds,
  BuildingShapeDefinition,
  Point,
  Size,
} from "./mapDefinition";
import {
  VILLAGE_BUILDING_SHAPE_COLUMNS,
  VILLAGE_BUILDING_SHAPES,
} from "./villageBuildingShapes";

/**
 * 배움마을 건물 배치표입니다. 이 표의 x, y, width, height만 수정하세요.
 *
 * 화면의 가로와 세로를 각각 0~1000으로 봅니다.
 * - x: 건물 이미지 왼쪽 모서리 (화면 왼쪽 0 → 오른쪽 1000)
 * - y: 건물 이미지 위쪽 모서리 (화면 위 0 → 아래 1000)
 * - width: 화면 가로 폭을 1000으로 본 건물 너비
 * - height: 화면 세로 높이를 1000으로 본 건물 높이
 *
 * 예: { x: 100, y: 200, width: 300, height: 300 }
 * 건물 이미지와 입구, 별 표시, 가림 영역, 충돌 영역이 함께 이동·확대됩니다.
 * 건물 위 별은 아래 VILLAGE_STAR_GRID에서 별도로 옮길 수 있습니다.
 */
export const VILLAGE_LAYOUT_GRID_MAX = 1_000;

export const VILLAGE_MAP_LAYOUT_SIZE = {
  width: 1_280,
  height: 720,
} as const;

export const VILLAGE_BUILDING_GRID = {
  "ai-shop": { x: 88, y: 550, width: 233, height: 393 },
  "airport": { x: 105, y: 63, width: 198, height: 353 },
  "ethics-office": { x: 705, y: 548, width: 201, height: 381 },
  "ai-world-gate": { x: 665, y: 60, width: 225, height: 381 },
  "fountain": { x: 410, y: 275, width: 180, height: 342 },
} as const;

/**
 * 좌우로 뒤집어 그릴 건물 id를 넣으세요. 입구, 충돌, 가림 영역도 함께
 * 뒤집힙니다. 왼쪽 파란집(airport)과 오른쪽 노란집(ethics-office)은 문이
 * 광장 가운데를 보도록 뒤집어 둡니다.
 */
export const VILLAGE_MIRRORED_BUILDINGS: ReadonlySet<string> = new Set<string>(["airport", "ethics-office"]);

export function isVillageBuildingMirrored(id: string) {
  return VILLAGE_MIRRORED_BUILDINGS.has(id);
}

/**
 * 건물 위 별 위치표입니다. 화면 전체를 0~1000으로 보고 x, y만 수정하세요.
 * x가 커지면 오른쪽, y가 커지면 아래쪽으로 이동합니다.
 */
export const VILLAGE_STAR_GRID = {
  "ai-shop": { x: 266, y: 585 },
  airport: { x: 243, y: 125 },
  "ethics-office": { x: 776, y: 589 },
} as const;

export type VillageBuildingId = keyof typeof VILLAGE_BUILDING_GRID;

type VillageBuildingFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

const VILLAGE_BUILDING_BASELINE: Record<
  VillageBuildingId,
  VillageBuildingFrame
> = {
  "ai-shop": { x: 270, y: 175, width: 266, height: 253 },
  airport: { x: 989, y: 145, width: 269, height: 252 },
  "ethics-office": { x: 267, y: 482, width: 235, height: 254 },
  "ai-world-gate": { x: 1_099, y: 514, width: 324, height: 308 },
  fountain: { x: 633, y: 310, width: 238, height: 251 },
};

function fromGrid(value: number, extent: number) {
  return (value / VILLAGE_LAYOUT_GRID_MAX) * extent;
}

export function getVillageStarPosition(
  id: keyof typeof VILLAGE_STAR_GRID,
): Point {
  const star = VILLAGE_STAR_GRID[id];
  return {
    x: fromGrid(star.x, VILLAGE_MAP_LAYOUT_SIZE.width),
    y: fromGrid(star.y, VILLAGE_MAP_LAYOUT_SIZE.height),
  };
}

export function getVillageBuildingFrame(
  id: VillageBuildingId,
): VillageBuildingFrame {
  const grid = VILLAGE_BUILDING_GRID[id];
  const width = fromGrid(grid.width, VILLAGE_MAP_LAYOUT_SIZE.width);
  const height = fromGrid(grid.height, VILLAGE_MAP_LAYOUT_SIZE.height);
  return {
    x: fromGrid(grid.x, VILLAGE_MAP_LAYOUT_SIZE.width) + width / 2,
    y: fromGrid(grid.y, VILLAGE_MAP_LAYOUT_SIZE.height) + height / 2,
    width,
    height,
  };
}

export function getVillageBuildingPosition(id: VillageBuildingId): Point {
  const frame = getVillageBuildingFrame(id);
  return { x: frame.x, y: frame.y };
}

export function getVillageBuildingSize(id: VillageBuildingId): Size {
  const frame = getVillageBuildingFrame(id);
  return { width: frame.width, height: frame.height };
}

function getVillageBuildingTransform(id: VillageBuildingId) {
  const baseline = VILLAGE_BUILDING_BASELINE[id];
  const frame = getVillageBuildingFrame(id);
  return {
    baseline,
    frame,
    scaleX: frame.width / baseline.width,
    scaleY: frame.height / baseline.height,
  };
}

export function offsetVillagePoint(
  id: VillageBuildingId,
  point: Point,
): Point {
  const { baseline, frame, scaleX, scaleY } =
    getVillageBuildingTransform(id);
  const direction = isVillageBuildingMirrored(id) ? -1 : 1;
  return {
    x: frame.x + (point.x - baseline.x) * scaleX * direction,
    y: frame.y + (point.y - baseline.y) * scaleY,
  };
}

export function offsetVillagePoints(
  id: VillageBuildingId,
  points: readonly Point[],
): readonly Point[] {
  return points.map((point) => offsetVillagePoint(id, point));
}

export function offsetVillageSize(
  id: VillageBuildingId,
  size: Size,
): Size {
  const { scaleX, scaleY } = getVillageBuildingTransform(id);
  return { width: size.width * scaleX, height: size.height * scaleY };
}

export function offsetVillageRadius(
  id: VillageBuildingId,
  radius: number,
) {
  const { scaleX, scaleY } = getVillageBuildingTransform(id);
  return radius * Math.max(scaleX, scaleY);
}

export function offsetVillageBounds(
  id: VillageBuildingId,
  bounds: AxisAlignedBounds,
): AxisAlignedBounds {
  const minimum = offsetVillagePoint(id, {
    x: bounds.minX,
    y: bounds.minY,
  });
  const maximum = offsetVillagePoint(id, {
    x: bounds.maxX,
    y: bounds.maxY,
  });
  return {
    minX: Math.min(minimum.x, maximum.x),
    maxX: Math.max(minimum.x, maximum.x),
    minY: minimum.y,
    maxY: maximum.y,
  };
}

/**
 * A building's ground outline and painted columns (measured from its picture
 * by scripts/generate-village-building-shapes.mjs) placed where the layout
 * grid puts the building, mirrored with it.
 */
export function villageBuildingShape(
  id: VillageBuildingId,
  options: Readonly<{ maxHiddenBehind?: number }> = {},
): BuildingShapeDefinition {
  const shape = VILLAGE_BUILDING_SHAPES[id];
  const frame = getVillageBuildingFrame(id);
  const mirrored = isVillageBuildingMirrored(id);
  const left = frame.x - frame.width / 2;
  const top = frame.y - frame.height / 2;
  const toY = (fraction: number) =>
    fraction < 0 ? null : top + fraction * frame.height;
  const columns = (values: readonly number[]) => {
    const placed = values.map(toY);
    return mirrored ? placed.reverse() : placed;
  };
  return {
    id,
    footprint: shape.footprint.map(([fx, fy]) => ({
      x: left + (mirrored ? 1 - fx : fx) * frame.width,
      y: top + fy * frame.height,
    })),
    columnLeft: left,
    columnWidth: frame.width / VILLAGE_BUILDING_SHAPE_COLUMNS,
    columnTop: columns(shape.top),
    columnBottom: columns(shape.bottom),
    ...options,
  };
}
