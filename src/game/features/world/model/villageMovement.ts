export type WorldPosition = Readonly<{
  x: number;
  y: number;
}>;

export type WorldDisplacement = Readonly<{
  x: number;
  y: number;
}>;

export type CurvedVillageObstacle = Readonly<{
  id?: string;
  center: WorldPosition;
  radiusX: number;
  radiusY: number;
  projectToBoundary?: boolean;
}>;

type TangentSign = -1 | 1;

export type VillageMovementMemory = {
  obstacleKey: string | null;
  tangentSign: TangentSign;
  clearFrames: number;
  encounterInputX: number;
  encounterInputY: number;
  encounterWasHeadOn: boolean;
  lastMoveFromX: number | null;
  lastMoveFromY: number | null;
  lastMoveToX: number | null;
  lastMoveToY: number | null;
};

export const VILLAGE_MOVEMENT_CONFIG = {
  baselinePlayerSpeed: 230,
  defaultSpeedMultiplier: 1.5,
  playerSpeed: 230 * 1.5,
  sprintMultiplier: 1.5,
  maxFrameDeltaMs: 50,
  maxStepDistance: 4,
} as const;

export function clampVillageFrameDelta(deltaMs: number) {
  return Math.min(Math.max(deltaMs, 0), VILLAGE_MOVEMENT_CONFIG.maxFrameDeltaMs);
}

export function createVillageMovementMemory(): VillageMovementMemory {
  return {
    obstacleKey: null,
    tangentSign: 1,
    clearFrames: 0,
    encounterInputX: 0,
    encounterInputY: 0,
    encounterWasHeadOn: true,
    lastMoveFromX: null,
    lastMoveFromY: null,
    lastMoveToX: null,
    lastMoveToY: null,
  };
}

export function resetVillageMovementMemory(memory: VillageMovementMemory) {
  memory.obstacleKey = null;
  memory.tangentSign = 1;
  memory.clearFrames = 0;
  memory.encounterInputX = 0;
  memory.encounterInputY = 0;
  memory.encounterWasHeadOn = true;
  memory.lastMoveFromX = null;
  memory.lastMoveFromY = null;
  memory.lastMoveToX = null;
  memory.lastMoveToY = null;
}

function resetVillageMovementReturnGuard(memory: VillageMovementMemory) {
  memory.lastMoveFromX = null;
  memory.lastMoveFromY = null;
  memory.lastMoveToX = null;
  memory.lastMoveToY = null;
}

function isSamePosition(left: WorldPosition, right: WorldPosition) {
  return left.x === right.x && left.y === right.y;
}

const MASK_GUIDE_OUTWARD_BIASES = [
  0, 0.15, 0.35, 0.6, 1, 1.7, 3, 6, 12, 16, 24, 32,
] as const;
const EXPLICIT_ELLIPSE_OUTWARD_BIASES = [
  0.08, 0.2, 0.35, 0.55, 0.8, 1, 1.7, 3, 6, 12, 16, 24, 32,
] as const;
const SLIDE_STEP_SCALES = [1, 0.75, 0.5, 0.25] as const;
const ENCOUNTER_INPUT_RESET_COSINE = Math.cos((5 * Math.PI) / 180);
const GENTLE_TURN_MIN_COSINE = Math.cos((10 * Math.PI) / 180);
const GENTLE_TURN_MAX_COSINE = Math.cos((2 * Math.PI) / 180);

function getObstacleKey(obstacle: CurvedVillageObstacle, index: number) {
  return (
    obstacle.id ??
    `${index}:${obstacle.center.x}:${obstacle.center.y}:` +
      `${obstacle.radiusX}:${obstacle.radiusY}`
  );
}

function isNearRememberedObstacle(
  position: WorldPosition,
  obstacles: readonly CurvedVillageObstacle[],
  obstacleKey: string,
) {
  const obstacleIndex = obstacles.findIndex(
    (obstacle, index) => getObstacleKey(obstacle, index) === obstacleKey,
  );
  if (obstacleIndex < 0) return false;
  const obstacle = obstacles[obstacleIndex];
  const normalizedX =
    (position.x - obstacle.center.x) / obstacle.radiusX;
  const normalizedY =
    (position.y - obstacle.center.y) / obstacle.radiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1.35 * 1.35;
}

function getCurvedObstacleBasis(
  position: WorldPosition,
  obstacle: CurvedVillageObstacle,
) {
  const normalX =
    (position.x - obstacle.center.x) /
    (obstacle.radiusX * obstacle.radiusX);
  const normalY =
    (position.y - obstacle.center.y) /
    (obstacle.radiusY * obstacle.radiusY);
  const normalLength = Math.hypot(normalX, normalY);
  if (normalLength === 0) return null;

  const outwardX = normalX / normalLength;
  const outwardY = normalY / normalLength;
  return {
    outwardX,
    outwardY,
    tangentX: -outwardY,
    tangentY: outwardX,
  };
}

function findCurvedSlideCandidate(
  current: WorldPosition,
  obstacle: CurvedVillageObstacle,
  tangentSign: TangentSign,
  movementLength: number,
  isBlocked: (x: number, y: number) => boolean,
  nonOpposingInput?: WorldDisplacement,
  rejectsCandidate?: (candidate: WorldPosition) => boolean,
) {
  const basis = getCurvedObstacleBasis(current, obstacle);
  if (!basis) return null;
  const outwardBiases =
    obstacle.projectToBoundary === false
      ? MASK_GUIDE_OUTWARD_BIASES
      : EXPLICIT_ELLIPSE_OUTWARD_BIASES;
  const inputBoundaryBiases: number[] = [];
  if (nonOpposingInput) {
    const tangentInputAmount =
      basis.tangentX * tangentSign * nonOpposingInput.x +
      basis.tangentY * tangentSign * nonOpposingInput.y;
    const outwardInputAmount =
      basis.outwardX * nonOpposingInput.x +
      basis.outwardY * nonOpposingInput.y;
    if (tangentInputAmount >= 0 && outwardInputAmount < -0.0001) {
      const boundaryBias = tangentInputAmount / -outwardInputAmount;
      inputBoundaryBiases.push(
        boundaryBias * 0.9,
        boundaryBias * 0.98,
        boundaryBias,
      );
    }
  }
  const candidateBiases = [...outwardBiases, ...inputBoundaryBiases].sort(
    (left, right) => left - right,
  );

  for (const stepScale of SLIDE_STEP_SCALES) {
    for (const outwardBias of candidateBiases) {
      const directionX =
        basis.tangentX * tangentSign + basis.outwardX * outwardBias;
      const directionY =
        basis.tangentY * tangentSign + basis.outwardY * outwardBias;
      const directionLength = Math.hypot(directionX, directionY);
      if (
        nonOpposingInput &&
        (directionX * nonOpposingInput.x +
          directionY * nonOpposingInput.y) /
          (directionLength *
            Math.hypot(nonOpposingInput.x, nonOpposingInput.y)) <
          -0.005
      ) {
        continue;
      }
      const scaledLength = movementLength * stepScale;
      const candidate = {
        x: current.x + (directionX / directionLength) * scaledLength,
        y: current.y + (directionY / directionLength) * scaledLength,
      };
      if (
        !isBlocked(candidate.x, candidate.y) &&
        !rejectsCandidate?.(candidate)
      ) {
        return candidate;
      }
    }
  }

  if (nonOpposingInput && obstacle.projectToBoundary === false) {
    const inputLength = Math.hypot(
      nonOpposingInput.x,
      nonOpposingInput.y,
    );
    const inputX = nonOpposingInput.x / inputLength;
    const inputY = nonOpposingInput.y / inputLength;
    const lateralDirections = [
      { x: -inputY, y: inputX },
      { x: inputY, y: -inputX },
    ].sort(
      (left, right) =>
        right.x * basis.outwardX +
        right.y * basis.outwardY +
        2 *
          (right.x * basis.tangentX * tangentSign +
            right.y * basis.tangentY * tangentSign) -
        (left.x * basis.outwardX +
          left.y * basis.outwardY +
          2 *
            (left.x * basis.tangentX * tangentSign +
              left.y * basis.tangentY * tangentSign)),
    );

    // A low-resolution mask can form a one-cell stair where the analytic
    // ellipse tangent and every outward-biased variant are blocked. In that
    // case, step sideways in an input-perpendicular direction. Prefer the
    // remembered tangent side while retaining a smaller outward bias; this
    // keeps adjacent mask cells from choosing opposite lateral directions.
    // The move has zero reverse progress and gets off the stair without a
    // visible bounce.
    for (const stepScale of SLIDE_STEP_SCALES) {
      for (const direction of lateralDirections) {
        const scaledLength = movementLength * stepScale;
        const candidate = {
          x: current.x + direction.x * scaledLength,
          y: current.y + direction.y * scaledLength,
        };
        if (
          !isBlocked(candidate.x, candidate.y) &&
          !rejectsCandidate?.(candidate)
        ) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function getCurvedSlideClearance(
  current: WorldPosition,
  obstacle: CurvedVillageObstacle,
  tangentSign: TangentSign,
  movementLength: number,
  isBlocked: (x: number, y: number) => boolean,
) {
  let probe = current;
  let openSteps = 0;
  // Probe far enough to see a full garden-side dead end (for example the
  // southwest island against the world edge). This runs only when a new
  // obstacle encounter chooses its remembered side, never every frame.
  for (let step = 0; step < 96; step += 1) {
    const candidate = findCurvedSlideCandidate(
      probe,
      obstacle,
      tangentSign,
      movementLength,
      isBlocked,
    );
    if (!candidate) break;
    probe = candidate;
    openSteps += 1;
  }
  return openSteps;
}

function getTangentPreference(
  current: WorldPosition,
  displacement: WorldDisplacement,
  obstacle: CurvedVillageObstacle,
  movementLength: number,
) {
  const basis = getCurvedObstacleBasis(current, obstacle);
  if (!basis) {
    return {
      sign: 1 as TangentSign,
      isHeadOn: true,
      hasDirectionalTangent: false,
    };
  }
  const tangentAmount =
    displacement.x * basis.tangentX + displacement.y * basis.tangentY;
  if (Math.abs(tangentAmount) >= movementLength * 0.08) {
    return {
      sign: (tangentAmount < 0 ? -1 : 1) as TangentSign,
      isHeadOn: false,
      hasDirectionalTangent: true,
    };
  }

  // A perfectly head-on input has no mathematical tangent component. Use a
  // deterministic fallback; the clearance probe below may select the other
  // side before the choice is remembered for this obstacle encounter.
  if (Math.abs(basis.outwardY) >= Math.abs(basis.outwardX)) {
    const preferredX = current.x <= obstacle.center.x ? -1 : 1;
    return {
      sign: (basis.tangentX * preferredX < 0 ? -1 : 1) as TangentSign,
      isHeadOn: true,
      hasDirectionalTangent:
        Math.abs(tangentAmount) >= movementLength * 0.005,
    };
  }
  const preferredY = current.y <= obstacle.center.y ? -1 : 1;
  return {
    sign: (basis.tangentY * preferredY < 0 ? -1 : 1) as TangentSign,
    isHeadOn: true,
    hasDirectionalTangent:
      Math.abs(tangentAmount) >= movementLength * 0.005,
  };
}

function trySlideAlongCurvedObstacle(
  current: WorldPosition,
  displacement: WorldDisplacement,
  obstacles: readonly CurvedVillageObstacle[],
  isBlocked: (x: number, y: number) => boolean,
  movementMemory?: VillageMovementMemory,
) {
  const target = {
    x: current.x + displacement.x,
    y: current.y + displacement.y,
  };

  for (let obstacleIndex = 0; obstacleIndex < obstacles.length; obstacleIndex += 1) {
    const obstacle = obstacles[obstacleIndex];
    const targetX = (target.x - obstacle.center.x) / obstacle.radiusX;
    const targetY = (target.y - obstacle.center.y) / obstacle.radiusY;
    const guideProximitySquared =
      obstacle.projectToBoundary === false ? 1.15 * 1.15 : 1.05;
    if (targetX * targetX + targetY * targetY > guideProximitySquared) {
      continue;
    }

    const basis = getCurvedObstacleBasis(current, obstacle);
    if (!basis) continue;
    const inwardAmount =
      displacement.x * basis.outwardX + displacement.y * basis.outwardY;
    if (inwardAmount >= Math.hypot(displacement.x, displacement.y) * 0.75) {
      continue;
    }

    const movementLength = Math.hypot(displacement.x, displacement.y);
    const obstacleKey = getObstacleKey(obstacle, obstacleIndex);
    const sameObstacleEncounter = movementMemory?.obstacleKey === obstacleKey;
    const encounterInputCosine =
      sameObstacleEncounter && movementMemory
        ? (displacement.x / movementLength) *
            movementMemory.encounterInputX +
          (displacement.y / movementLength) *
            movementMemory.encounterInputY
        : 1;
    const inputDirectionChanged = Boolean(
      sameObstacleEncounter &&
        movementMemory &&
        encounterInputCosine <=
          ENCOUNTER_INPUT_RESET_COSINE + Number.EPSILON * 8,
    );
    if (inputDirectionChanged && movementMemory) {
      resetVillageMovementReturnGuard(movementMemory);
    }
    const continuingEncounter =
      sameObstacleEncounter && !inputDirectionChanged;
    const tangentPreference = getTangentPreference(
      current,
      displacement,
      obstacle,
      movementLength,
    );
    const ambiguousTangentDirectionChange = Boolean(
      tangentPreference.isHeadOn &&
        tangentPreference.hasDirectionalTangent &&
        (!sameObstacleEncounter ||
          encounterInputCosine <=
            GENTLE_TURN_MAX_COSINE + Number.EPSILON * 8),
    );
    if (ambiguousTangentDirectionChange && movementMemory) {
      // Near the exact radial direction, the two tangent sides are almost
      // equally valid. Pause instead of letting a tiny joystick change pick
      // one side for a frame and the opposite side on the next frame.
      movementMemory.obstacleKey = obstacleKey;
      movementMemory.tangentSign = sameObstacleEncounter
        ? movementMemory.tangentSign
        : tangentPreference.sign;
      movementMemory.encounterInputX = displacement.x / movementLength;
      movementMemory.encounterInputY = displacement.y / movementLength;
      movementMemory.encounterWasHeadOn = true;
      resetVillageMovementReturnGuard(movementMemory);
      movementMemory.clearFrames = 0;
      return current;
    }
    const gentleTangentDirectionChange = Boolean(
      sameObstacleEncounter &&
        movementMemory &&
        !tangentPreference.isHeadOn &&
        tangentPreference.sign !== movementMemory.tangentSign &&
        encounterInputCosine >=
          GENTLE_TURN_MIN_COSINE - Number.EPSILON * 8 &&
        encounterInputCosine <=
          GENTLE_TURN_MAX_COSINE + Number.EPSILON * 8,
    );
    if (gentleTangentDirectionChange && movementMemory) {
      // When a joystick crosses the local tangent during a gradual turn,
      // changing slide sides in one frame looks like a bounce. Hold for one
      // frame and commit the new side, so the next frame departs cleanly.
      movementMemory.tangentSign = tangentPreference.sign;
      movementMemory.encounterInputX = displacement.x / movementLength;
      movementMemory.encounterInputY = displacement.y / movementLength;
      movementMemory.encounterWasHeadOn = false;
      resetVillageMovementReturnGuard(movementMemory);
      movementMemory.clearFrames = 0;
      return current;
    }
    let tangentSign =
      continuingEncounter ||
      (inputDirectionChanged && tangentPreference.isHeadOn)
        ? movementMemory?.tangentSign ?? tangentPreference.sign
        : tangentPreference.sign;

    if (!sameObstacleEncounter && tangentPreference.isHeadOn) {
      const alternateSign = (tangentSign * -1) as TangentSign;
      const preferredClearance = getCurvedSlideClearance(
        current,
        obstacle,
        tangentSign,
        movementLength,
        isBlocked,
      );
      const alternateClearance = getCurvedSlideClearance(
        current,
        obstacle,
        alternateSign,
        movementLength,
        isBlocked,
      );
      if (alternateClearance > preferredClearance) tangentSign = alternateSign;
    }

    const rejectsImmediateReturn =
      continuingEncounter &&
      movementMemory?.lastMoveFromX !== null &&
      movementMemory?.lastMoveFromY !== null &&
      movementMemory?.lastMoveToX !== null &&
      movementMemory?.lastMoveToY !== null &&
      Math.hypot(
        current.x - movementMemory.lastMoveToX,
        current.y - movementMemory.lastMoveToY,
      ) < 0.1
        ? (candidate: WorldPosition) => {
            const previousX =
              movementMemory.lastMoveToX! -
              movementMemory.lastMoveFromX!;
            const previousY =
              movementMemory.lastMoveToY! -
              movementMemory.lastMoveFromY!;
            const candidateX = candidate.x - current.x;
            const candidateY = candidate.y - current.y;
            return (
              (previousX * candidateX + previousY * candidateY) /
                (Math.hypot(previousX, previousY) *
                  Math.hypot(candidateX, candidateY)) <
              -0.8
            );
          }
        : undefined;
    const candidate = findCurvedSlideCandidate(
      current,
      obstacle,
      tangentSign,
      movementLength,
      isBlocked,
      (continuingEncounter
        ? movementMemory?.encounterWasHeadOn === false
        : inputDirectionChanged ||
          !tangentPreference.isHeadOn ||
          tangentPreference.hasDirectionalTangent)
        ? displacement
        : undefined,
      rejectsImmediateReturn,
    );
    if (!candidate) continue;

    if (movementMemory) {
      if (!continuingEncounter) {
        movementMemory.encounterInputX = displacement.x / movementLength;
        movementMemory.encounterInputY = displacement.y / movementLength;
        movementMemory.encounterWasHeadOn = tangentPreference.isHeadOn;
      }
      movementMemory.obstacleKey = obstacleKey;
      movementMemory.tangentSign = tangentSign;
      movementMemory.clearFrames = 0;
    }
    return candidate;
  }

  return null;
}

/**
 * Slide candidates when the straight step is blocked, in order of
 * preference: shallow turns, the axis slides, then turns pointing a little
 * backwards (only useful for climbing out of a pocket). 0 marks the axis
 * slide along the dominant input component, 1 the minor one.
 */
const SLIDE_CANDIDATES: readonly (number | "major" | "minor")[] = [
  "major", 30, -30, 45, -45, 60, -60, 75, -75, "minor",
  105, -105, 120, -120, 135, -135,
];
const SLIDE_LOOKAHEAD_STEPS = 4;

function countSlideClearance(
  candidate: WorldPosition,
  directionX: number,
  directionY: number,
  isBlocked: (x: number, y: number) => boolean,
) {
  let clearance = 0;
  while (
    clearance < SLIDE_LOOKAHEAD_STEPS &&
    !isBlocked(
      candidate.x + directionX * (clearance + 1),
      candidate.y + directionY * (clearance + 1),
    )
  ) {
    clearance += 1;
  }
  return clearance;
}

/**
 * The painted walkable mask has bushes and kerbs at every angle, so a pure
 * x-then-y slide wedges Midi in concave corners where neither axis is open,
 * or walks her into a dead end she then cannot leave. Take the first
 * candidate (see SLIDE_CANDIDATES) that stays open for the whole lookahead;
 * if none does, the one that stays open longest.
 */
function findSlide(
  current: WorldPosition,
  stepX: number,
  stepY: number,
  isBlocked: (x: number, y: number) => boolean,
) {
  const length = Math.hypot(stepX, stepY);
  if (length === 0) return null;
  const baseAngle = Math.atan2(stepY, stepX);
  const horizontalDominant = Math.abs(stepX) >= Math.abs(stepY);
  let best: WorldPosition | null = null;
  let bestClearance = -1;
  for (const entry of SLIDE_CANDIDATES) {
    let directionX: number;
    let directionY: number;
    if (typeof entry === "number") {
      const angle = baseAngle + (entry * Math.PI) / 180;
      directionX = Math.cos(angle) * length;
      directionY = Math.sin(angle) * length;
    } else if ((entry === "major") === horizontalDominant) {
      directionX = stepX;
      directionY = 0;
    } else {
      directionX = 0;
      directionY = stepY;
    }
    if (directionX === 0 && directionY === 0) continue;
    const candidate = {
      x: current.x + directionX,
      y: current.y + directionY,
    };
    if (isBlocked(candidate.x, candidate.y)) continue;
    if (typeof entry === "number" && Math.abs(entry) > 90) {
      // A backward turn is only for leaving a pocket she walked into: take
      // it when the way forward opens up from there. Facing a flat wall it
      // would not, and she should stand still rather than drift.
      const twoBack = {
        x: candidate.x + directionX,
        y: candidate.y + directionY,
      };
      if (
        hasForwardExit(candidate, stepX, stepY, isBlocked) ||
        (!isBlocked(twoBack.x, twoBack.y) &&
          hasForwardExit(twoBack, stepX, stepY, isBlocked))
      ) {
        return candidate;
      }
      continue;
    }
    const clearance = countSlideClearance(
      candidate, directionX, directionY, isBlocked,
    );
    if (clearance === SLIDE_LOOKAHEAD_STEPS) return candidate;
    if (clearance > bestClearance) {
      best = candidate;
      bestClearance = clearance;
    }
  }
  return best;
}

const FORWARD_EXIT_DEGREES = [0, 30, -30, 45, -45] as const;

function hasForwardExit(
  from: WorldPosition,
  stepX: number,
  stepY: number,
  isBlocked: (x: number, y: number) => boolean,
) {
  const length = Math.hypot(stepX, stepY);
  const baseAngle = Math.atan2(stepY, stepX);
  return FORWARD_EXIT_DEGREES.some((degrees) => {
    const angle = baseAngle + (degrees * Math.PI) / 180;
    const directionX = Math.cos(angle) * length;
    const directionY = Math.sin(angle) * length;
    const next = { x: from.x + directionX, y: from.y + directionY };
    return (
      !isBlocked(next.x, next.y) &&
      countSlideClearance(next, directionX, directionY, isBlocked) ===
        SLIDE_LOOKAHEAD_STEPS
    );
  });
}

export function recoverVillagePosition(
  current: WorldPosition,
  lastSafe: WorldPosition,
  isBlocked: (x: number, y: number) => boolean,
) {
  if (!isBlocked(current.x, current.y)) return current;
  if (!isBlocked(lastSafe.x, lastSafe.y)) return lastSafe;

  // This is a final safety net for a changed map or an invalid saved position.
  // Search nearby rings instead of leaving the player inside an obstacle.
  for (let radius = 4; radius <= 64; radius += 4) {
    for (let index = 0; index < 16; index += 1) {
      const angle = (Math.PI * 2 * index) / 16;
      const candidate = {
        x: current.x + Math.cos(angle) * radius,
        y: current.y + Math.sin(angle) * radius,
      };
      if (!isBlocked(candidate.x, candidate.y)) return candidate;
    }
  }

  return current;
}

export function resolveVillageMovement(
  start: WorldPosition,
  displacement: WorldDisplacement,
  lastSafe: WorldPosition,
  isBlocked: (x: number, y: number) => boolean,
  curvedObstacles: readonly CurvedVillageObstacle[] = [],
  movementMemory?: VillageMovementMemory,
) {
  let current = recoverVillagePosition(start, lastSafe, isBlocked);
  const distance = Math.hypot(displacement.x, displacement.y);
  if (distance === 0) return current;

  const stepCount = Math.max(
    1,
    Math.ceil(distance / VILLAGE_MOVEMENT_CONFIG.maxStepDistance),
  );
  const stepX = displacement.x / stepCount;
  const stepY = displacement.y / stepCount;
  let usedCurvedSlide = false;

  for (let step = 0; step < stepCount; step += 1) {
    const combined = { x: current.x + stepX, y: current.y + stepY };
    if (!isBlocked(combined.x, combined.y)) {
      current = combined;
      continue;
    }

    const curvedSlide = trySlideAlongCurvedObstacle(
      current,
      { x: stepX, y: stepY },
      curvedObstacles,
      isBlocked,
      movementMemory,
    );
    if (curvedSlide) {
      current = curvedSlide;
      usedCurvedSlide = true;
      continue;
    }

    const slide = findSlide(current, stepX, stepY, isBlocked);
    if (slide) current = slide;
  }

  if (movementMemory && !usedCurvedSlide && movementMemory.obstacleKey) {
    if (
      isNearRememberedObstacle(
        current,
        curvedObstacles,
        movementMemory.obstacleKey,
      )
    ) {
      movementMemory.clearFrames = 0;
    } else {
      movementMemory.clearFrames += 1;
    }
    if (movementMemory.clearFrames >= 4) {
      movementMemory.obstacleKey = null;
      movementMemory.clearFrames = 0;
      resetVillageMovementReturnGuard(movementMemory);
    }
  }

  const resolved = isSamePosition(current, start)
    ? recoverVillagePosition(current, lastSafe, isBlocked)
    : current;
  if (
    movementMemory &&
    Math.hypot(resolved.x - start.x, resolved.y - start.y) >= 0.1
  ) {
    movementMemory.lastMoveFromX = start.x;
    movementMemory.lastMoveFromY = start.y;
    movementMemory.lastMoveToX = resolved.x;
    movementMemory.lastMoveToY = resolved.y;
  }
  return resolved;
}
