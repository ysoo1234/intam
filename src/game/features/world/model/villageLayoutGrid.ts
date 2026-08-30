import type { AxisAlignedBounds, Point, Size } from "./mapDefinition";

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
  "ai-shop": { x: 137, y: 140, width: 208, height: 341 },
  "airport": { x: 742, y: 238, width: 210, height: 350 },
  "ethics-office": { x: 75, y: 490, width: 207, height: 368 },
  "ai-world-gate": { x: 455, y: -78, width: 253, height: 428 },
  "fountain": { x: 398, y: 425, width: 167, height: 314 },
} as const;

/**
 * 건물 위 별 위치표입니다. 화면 전체를 0~1000으로 보고 x, y만 수정하세요.
 * x가 커지면 오른쪽, y가 커지면 아래쪽으로 이동합니다.
 */
export const VILLAGE_STAR_GRID = {
  "ai-shop": { x: 295, y: 170 },
  airport: { x: 807, y: 300 },
  "ethics-office": { x: 210, y: 540 },
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
  return {
    x: frame.x + (point.x - baseline.x) * scaleX,
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
    minX: minimum.x,
    maxX: maximum.x,
    minY: minimum.y,
    maxY: maximum.y,
  };
}
