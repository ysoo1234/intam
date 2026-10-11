import type {
  BuildingShapeDefinition,
  CollisionDefinition,
  MapDefinition,
  Point,
  PlayerBodyDefinition,
  PrecomputedCollisionMaskDefinition,
} from "./mapDefinition";

function decodeBase64Bitset(encoded: string, expectedByteLength: number) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(expectedByteLength);
  let accumulator = 0;
  let accumulatedBits = 0;
  let byteIndex = 0;

  for (const character of encoded) {
    if (character === "=") break;
    const value = alphabet.indexOf(character);
    if (value < 0) continue;

    accumulator = (accumulator << 6) | value;
    accumulatedBits += 6;
    if (accumulatedBits < 8) continue;

    accumulatedBits -= 8;
    if (byteIndex < bytes.length) {
      bytes[byteIndex] = (accumulator >> accumulatedBits) & 0xff;
      byteIndex += 1;
    }
    accumulator &= (1 << accumulatedBits) - 1;
  }

  if (byteIndex !== expectedByteLength) {
    throw new Error(
      `Village collision mask decoded to ${byteIndex} bytes; ` +
        `expected ${expectedByteLength}.`,
    );
  }

  return bytes;
}

function isPointOnSegment(point: Point, start: Point, end: Point) {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > 0.0001) return false;

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);
  if (dot < 0) return false;

  const lengthSquared =
    (end.x - start.x) * (end.x - start.x) +
    (end.y - start.y) * (end.y - start.y);
  return dot <= lengthSquared;
}

function isPointInsidePolygon(point: Point, vertices: readonly Point[]) {
  let inside = false;

  for (
    let currentIndex = 0, previousIndex = vertices.length - 1;
    currentIndex < vertices.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = vertices[currentIndex];
    const previous = vertices[previousIndex];
    if (isPointOnSegment(point, previous, current)) return true;

    const crossesRay =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (crossesRay) inside = !inside;
  }

  return inside;
}

function getEllipseDistanceSquared(
  x: number,
  y: number,
  ellipse: MapDefinition["collision"]["ellipses"][number],
) {
  return (
    ((x - ellipse.center.x) * (x - ellipse.center.x)) /
      (ellipse.radiusX * ellipse.radiusX) +
    ((y - ellipse.center.y) * (y - ellipse.center.y)) /
      (ellipse.radiusY * ellipse.radiusY)
  );
}

/** Top and bottom of a polygon along the vertical line at `x`. */
function getVerticalSpan(x: number, vertices: readonly Point[]) {
  let min = Infinity;
  let max = -Infinity;
  for (
    let currentIndex = 0, previousIndex = vertices.length - 1;
    currentIndex < vertices.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const a = vertices[previousIndex];
    const b = vertices[currentIndex];
    if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) {
      const y = a.x === b.x
        ? Math.min(a.y, b.y)
        : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      const yEnd = a.x === b.x ? Math.max(a.y, b.y) : y;
      min = Math.min(min, y);
      max = Math.max(max, yEnd);
    }
  }
  return min <= max ? { min, max } : null;
}

function getSegmentDistanceSquared(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return cx * cx + cy * cy;
}

type PreparedBuilding = Readonly<{
  shape: BuildingShapeDefinition;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  pictureTop: number;
  pictureRight: number;
}>;

function prepareBuilding(shape: BuildingShapeDefinition): PreparedBuilding {
  const xs = shape.footprint.map(({ x }) => x);
  const ys = shape.footprint.map(({ y }) => y);
  const tops = shape.columnTop.filter((y): y is number => y !== null);
  return {
    shape,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    pictureTop: Math.min(...tops),
    pictureRight: shape.columnLeft + shape.columnWidth * shape.columnTop.length,
  };
}

/** Midi's feet touch (or stand inside) the building's ground outline. */
function isFootOnBuilding(
  building: PreparedBuilding,
  body: PlayerBodyDefinition,
  feetX: number,
  feetY: number,
) {
  const { footRadiusX: radiusX, footRadiusY: radiusY } = body;
  if (
    feetX < building.minX - radiusX ||
    feetX > building.maxX + radiusX ||
    feetY < building.minY - radiusY ||
    feetY > building.maxY + radiusY
  ) {
    return false;
  }
  const { footprint } = building.shape;
  if (isPointInsidePolygon({ x: feetX, y: feetY }, footprint)) return true;

  // Stretch the ground vertically so Midi's oval foot patch becomes a circle,
  // then measure how close the outline comes.
  const stretch = radiusX / radiusY;
  const radiusSquared = radiusX * radiusX;
  for (
    let currentIndex = 0, previousIndex = footprint.length - 1;
    currentIndex < footprint.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const a = footprint[previousIndex];
    const b = footprint[currentIndex];
    if (
      getSegmentDistanceSquared(
        feetX, feetY * stretch, a.x, a.y * stretch, b.x, b.y * stretch,
      ) < radiusSquared
    ) {
      return true;
    }
  }
  return false;
}

/**
 * The y that splits "behind" from "in front of" a building at `x`: halfway
 * between the back and front of its ground outline (beside the building, the
 * nearest edge counts).
 */
function getBuildingDepthLineY(building: PreparedBuilding, x: number) {
  const clampedX = Math.min(building.maxX - 0.01, Math.max(building.minX + 0.01, x));
  const span = getVerticalSpan(clampedX, building.shape.footprint);
  return span ? (span.min + span.max) / 2 : building.maxY;
}

/**
 * The most (0-1) of Midi's height the building's picture covers in any one
 * column of her body. Taking the most, not the average, means a wall edge
 * may not slice her in half from the side: behind a building only her lower
 * body sinks out of sight, evenly, as if she stood on the ground behind it.
 */
function getHiddenFraction(
  building: PreparedBuilding,
  body: PlayerBodyDefinition,
  feetX: number,
  feetY: number,
) {
  const { shape } = building;
  const headY = feetY - body.bodyHeight;
  let mostCovered = 0;
  for (let x = feetX - body.bodyHalfWidth; x <= feetX + body.bodyHalfWidth; x += 2) {
    const column = Math.floor((x - shape.columnLeft) / shape.columnWidth);
    const top = shape.columnTop[column];
    const bottom = shape.columnBottom[column];
    if (top === null || top === undefined || bottom === null || bottom === undefined) continue;
    mostCovered = Math.max(
      mostCovered,
      Math.min(feetY, bottom) - Math.max(headY, top),
    );
  }
  return mostCovered / body.bodyHeight;
}

function isBlockedByBuilding(
  building: PreparedBuilding,
  collision: CollisionDefinition,
  x: number,
  y: number,
) {
  const body = collision.playerBody;
  const feetX = x;
  const feetY = y + body.feetOffsetY;
  if (isFootOnBuilding(building, body, feetX, feetY)) return true;

  // Behind the building: fine until it hides too much of her.
  if (
    feetX < building.shape.columnLeft - body.bodyHalfWidth ||
    feetX > building.pictureRight + body.bodyHalfWidth ||
    feetY < building.pictureTop ||
    feetY >= getBuildingDepthLineY(building, feetX)
  ) {
    return false;
  }
  return (
    getHiddenFraction(building, body, feetX, feetY) >
    (building.shape.maxHiddenBehind ?? collision.maxHiddenBehindBuilding)
  );
}

/**
 * Whether Midi at `position` stands behind the scenery piece `sceneryId`
 * (so it is drawn over her). Undefined when the piece has no ground outline.
 */
export function isPlayerBehindBuilding(
  collision: CollisionDefinition,
  sceneryId: string,
  position: Point,
) {
  const shape = collision.buildings.find(({ id }) => id === sceneryId);
  if (!shape) return undefined;
  const feetY = position.y + collision.playerBody.feetOffsetY;
  return feetY < getBuildingDepthLineY(prepareBuilding(shape), position.x);
}

function createMaskLookup(mask: PrecomputedCollisionMaskDefinition) {
  const expectedCellCount = mask.columns * mask.rows;
  const bytes = decodeBase64Bitset(
    mask.bitsetBase64,
    Math.ceil(expectedCellCount / 8),
  );

  return (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= mask.mapWidth || y >= mask.mapHeight) {
      return true;
    }

    const column = Math.min(
      mask.columns - 1,
      Math.max(0, Math.round(x / mask.cellSize)),
    );
    const row = Math.min(
      mask.rows - 1,
      Math.max(0, Math.round(y / mask.cellSize)),
    );
    const cellIndex = row * mask.columns + column;
    return (bytes[cellIndex >> 3] & (1 << (cellIndex & 7))) !== 0;
  };
}

export function createVillageCollision(mapDefinition: MapDefinition) {
  const { collision, size } = mapDefinition;
  const mask = collision.precomputedMask;
  if (mask.mapWidth !== size.width || mask.mapHeight !== size.height) {
    throw new Error(
      `Village collision mask ${mask.mapWidth}x${mask.mapHeight} does not ` +
        `match map ${size.width}x${size.height}.`,
    );
  }
  const isMaskCellBlocked = createMaskLookup(mask);
  const buildings = collision.buildings.map(prepareBuilding);

  return Object.freeze({
    isBlocked(x: number, y: number) {
      const bounds = collision.blockedOutsideBounds;
      if (
        x < bounds.minX ||
        x > bounds.maxX ||
        y < bounds.minY ||
        y > bounds.maxY
      ) {
        return true;
      }

      if (
        collision.polygons.some(({ points }) =>
          isPointInsidePolygon({ x, y }, points),
        )
      ) {
        return true;
      }

      if (
        buildings.some((building) =>
          isBlockedByBuilding(building, collision, x, y),
        )
      ) {
        return true;
      }

      const blockedByEllipse = collision.ellipses.some((ellipse) => {
        const distanceSquared = getEllipseDistanceSquared(x, y, ellipse);
        return ellipse.boundary === "exclusive"
          ? distanceSquared < 1
          : distanceSquared <= 1;
      });
      if (blockedByEllipse) return true;

      if (
        collision.maskWalkableOverrides?.some(
          (area) =>
            x >= area.minX &&
            x <= area.maxX &&
            y >= area.minY &&
            y <= area.maxY,
        )
      ) {
        return false;
      }

      const bypassesMaskCollision = collision.ellipses.some((ellipse) => {
        const padding = ellipse.maskBypassPadding;
        if (!padding) return false;
        const radiusX = ellipse.radiusX + padding.x;
        const radiusY = ellipse.radiusY + padding.y;
        return (
          ((x - ellipse.center.x) * (x - ellipse.center.x)) /
              (radiusX * radiusX) +
            ((y - ellipse.center.y) * (y - ellipse.center.y)) /
              (radiusY * radiusY) <=
          1
        );
      });
      if (bypassesMaskCollision) return false;

      return mask.sampleOffsets.some((offset) =>
        isMaskCellBlocked(x + offset.x, y + offset.y),
      );
    },
  });
}
