import type {
  MapDefinition,
  Point,
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

      const blockedByEllipse = collision.ellipses.some((ellipse) => {
        const distanceSquared = getEllipseDistanceSquared(x, y, ellipse);
        return ellipse.boundary === "exclusive"
          ? distanceSquared < 1
          : distanceSquared <= 1;
      });
      if (blockedByEllipse) return true;

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
