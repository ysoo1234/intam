import { runEthicsDeliveryTests } from "./test-ethics-delivery.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function loadTypeScriptModule(filePath) {
  const absolutePath = path.resolve(filePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath);

  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  moduleCache.set(absolutePath, compiledModule.exports);

  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) return nativeRequire(specifier);
    const requestedPath = path.resolve(path.dirname(absolutePath), specifier);
    const resolvedPath = path.extname(requestedPath)
      ? requestedPath
      : fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()
        ? path.join(requestedPath, "index.ts")
        : `${requestedPath}.ts`;
    return loadTypeScriptModule(resolvedPath);
  };

  const execute = new Function(
    "require",
    "module",
    "exports",
    "__filename",
    "__dirname",
    output,
  );
  execute(
    localRequire,
    compiledModule,
    compiledModule.exports,
    absolutePath,
    path.dirname(absolutePath),
  );
  moduleCache.set(absolutePath, compiledModule.exports);
  return compiledModule.exports;
}

const modelRoot = path.resolve("src/game/features/data-flight/model");
const { DATA_FLIGHT_CONFIG } = loadTypeScriptModule(
  path.join(modelRoot, "config.ts"),
);
const rules = loadTypeScriptModule(path.join(modelRoot, "rules.ts"));
const pointerOwnership = loadTypeScriptModule(
  "src/game/core/input/pointerOwnership.ts",
);

assert.equal(DATA_FLIGHT_CONFIG.gameDurationMs, 150_000);
assert.equal(DATA_FLIGHT_CONFIG.questionIntervalMs, 27_000);
assert.equal(DATA_FLIGHT_CONFIG.firstQuestionScore, 200);
assert.equal(DATA_FLIGHT_CONFIG.feverDurationMs, 7_000);
assert.equal(DATA_FLIGHT_CONFIG.initialHearts, 3);
assert.equal(DATA_FLIGHT_CONFIG.playerSpeed, 552.5);
assert.deepEqual(DATA_FLIGHT_CONFIG.dataSpawnInterval, {
  minMs: 100,
  maxMs: 700,
});
assert.equal(DATA_FLIGHT_CONFIG.feverFormationIntervalMs, 3_700);
assert.equal(DATA_FLIGHT_CONFIG.feverMagnetRadius, 200);
assert.equal(DATA_FLIGHT_CONFIG.feverMagnetVerticalRadius, 105);
assert.deepEqual(DATA_FLIGHT_CONFIG.playerBounds, {
  minX: 125,
  maxX: 1_135,
  minY: 125,
  maxY: 635,
});

const airportPointer = {
  active: false,
  id: -1,
  targetX: 220,
  targetY: 360,
};
assert.equal(pointerOwnership.tryClaimPointer(airportPointer, 1), true);
airportPointer.targetX = 480;
airportPointer.targetY = 270;
assert.equal(pointerOwnership.tryClaimPointer(airportPointer, 2), false);
assert.deepEqual(airportPointer, {
  active: true,
  id: 1,
  targetX: 480,
  targetY: 270,
});
assert.equal(pointerOwnership.releaseClaimedPointer(airportPointer, 2), false);
assert.deepEqual(airportPointer, {
  active: true,
  id: 1,
  targetX: 480,
  targetY: 270,
});
assert.equal(pointerOwnership.releaseClaimedPointer(airportPointer, 1), true);
assert.deepEqual(airportPointer, {
  active: false,
  id: -1,
  targetX: 480,
  targetY: 270,
});

assert.equal(DATA_FLIGHT_CONFIG.obstacleSpawnInterval.scoreStep, 700);
assert.equal(rules.getDifficultyTier(-1), 0);
assert.equal(rules.getDifficultyTier(0), 0);
assert.equal(rules.getDifficultyTier(699), 0);
assert.equal(rules.getDifficultyTier(700), 1);
assert.equal(rules.getDifficultyTier(4_199), 5);
assert.equal(rules.getDifficultyTier(4_900), 7);
assert.equal(rules.getDifficultyTier(9_000), 7);

assert.equal(rules.getObjectBaseSpeed("data", 3_000), 355);
assert.equal(rules.getObjectBaseSpeed("question", 3_000), 390);
assert.equal(rules.getObjectBaseSpeed("obstacle", 0), 270);
assert.equal(rules.getObjectBaseSpeed("obstacle", 700), 320);
assert.equal(rules.getObjectBaseSpeed("obstacle", 3_500), 505);
assert.equal(rules.getObjectBaseSpeed("obstacle", 4_900), 590);

assert.equal(rules.getObstacleAmplitudeMax(0), 72);
assert.equal(rules.getObstacleAmplitudeMax(700), 90);
assert.equal(rules.getObstacleAmplitudeMax(3_500), 145);
assert.equal(rules.getObstacleAmplitudeMax(4_900), 160);
assert.equal(rules.getObstacleBobSpeedMax(0), 0.0045);
assert.equal(rules.getObstacleBobSpeedMax(700), 0.0052);
assert.equal(rules.getObstacleBobSpeedMax(3_500), 0.0075);
assert.equal(rules.getObstacleBobSpeedMax(4_900), 0.0084);
assert.equal(rules.getObstacleHorizontalAmplitudeMax(0), 0);
assert.equal(rules.getObstacleHorizontalAmplitudeMax(700), 0);
assert.equal(rules.getObstacleHorizontalAmplitudeMax(1_400), 18);
assert.equal(rules.getObstacleHorizontalAmplitudeMax(2_800), 38);
assert.equal(rules.getObstacleHorizontalAmplitudeMax(4_900), 64);
assert.deepEqual(rules.getObstacleSpawnIntervalBounds(0), {
  min: 2_500,
  max: 3_200,
});
assert.deepEqual(rules.getObstacleSpawnIntervalBounds(700), {
  min: 2_100,
  max: 2_750,
});
assert.deepEqual(rules.getObstacleSpawnIntervalBounds(3_500), {
  min: 1_050,
  max: 1_450,
});
assert.deepEqual(rules.getObstacleSpawnIntervalBounds(4_900), {
  min: 850,
  max: 1_200,
});
assert.equal(rules.shouldSpawnEdgeObstacle(0, 0), false);
assert.equal(rules.shouldSpawnEdgeObstacle(700, 0.17), true);
assert.equal(rules.shouldSpawnEdgeObstacle(700, 0.18), false);
assert.equal(rules.shouldSpawnDoubleEdgeObstacle(1_400, 0.07), true);
assert.equal(rules.shouldSpawnDoubleEdgeObstacle(1_400, 0.08), false);

assert.equal(rules.getCollectedDataScore(false), 10);
assert.equal(rules.getCollectedDataScore(true), 30);
assert.equal(rules.getCollectedDifficultyPoints(), 10);
const observedFeverCollectionCount = 50;
const observedFeverScoreGain =
  observedFeverCollectionCount * rules.getCollectedDataScore(true);
const observedFeverDifficultyGain =
  observedFeverCollectionCount * rules.getCollectedDifficultyPoints() +
  DATA_FLIGHT_CONFIG.correctAnswerScore;
assert.equal(observedFeverScoreGain, 1_500);
assert.equal(observedFeverDifficultyGain, 650);
for (
  let progressWithinTier = 0;
  progressWithinTier < DATA_FLIGHT_CONFIG.obstacleSpawnInterval.scoreStep;
  progressWithinTier += 1
) {
  assert.ok(
    rules.getDifficultyTier(progressWithinTier + observedFeverDifficultyGain) -
      rules.getDifficultyTier(progressWithinTier) <=
      1,
    "One fever round must not skip a difficulty tier.",
  );
}
assert.equal(rules.decrementHeart(3), 2);
assert.equal(rules.decrementHeart(1), 0);
assert.equal(rules.decrementHeart(0), 0);
assert.equal(rules.isFeverActive(6_999, 7_000), true);
assert.equal(rules.isFeverActive(7_000, 7_000), false);
assert.equal(rules.clampFrameDelta(16), 16);
assert.equal(rules.clampFrameDelta(80), 50);
assert.deepEqual(rules.createFlightResult(true, 320, 9, 2, 1), {
  completed: true,
  score: 320,
  collected: 9,
  correctAnswers: 2,
  remainingHearts: 1,
});

console.log("Data Flight model rules passed.");

const workshopModelRoot = path.resolve(
  "src/game/features/ai-workshop/model",
);
const { AI_WORKSHOP_CONFIG } = loadTypeScriptModule(
  path.join(workshopModelRoot, "config.ts"),
);
const workshopRules = loadTypeScriptModule(
  path.join(workshopModelRoot, "rules.ts"),
);

assert.equal(AI_WORKSHOP_CONFIG.gameDurationMs, 120_000);
assert.equal(AI_WORKSHOP_CONFIG.sessionRequestLimit, 12);
assert.equal(AI_WORKSHOP_CONFIG.requiredStarHits, 3);
assert.equal(AI_WORKSHOP_CONFIG.maxWrongDeliveries, 3);

const request = { id: "request", productId: "product" };
const product = { id: "product" };
assert.deepEqual(
  workshopRules.createWorkshopOrder(request, new Map([[product.id, product]])),
  { requests: [request], products: [product], requiredStarHits: 3 },
);
assert.equal(
  workshopRules.isWorkshopDeliveryCorrect(
    [{ id: "a" }, { id: "b" }],
    [{ id: "b" }, { id: "a" }],
  ),
  true,
);
assert.equal(
  workshopRules.isWorkshopDeliveryCorrect([{ id: "a" }], [{ id: "b" }]),
  false,
);
assert.deepEqual(workshopRules.getWorkshopReward(1, 0), {
  baseReward: 100,
  perfectBonus: 50,
  reward: 150,
});
assert.deepEqual(workshopRules.getWorkshopReward(4, 1), {
  baseReward: 130,
  perfectBonus: 0,
  reward: 130,
});
assert.deepEqual(workshopRules.getStarCatchDifficulty(1), {
  speed: 500,
  zoneWidth: 125,
});
assert.deepEqual(workshopRules.getStarCatchDifficulty(13), {
  speed: 650,
  zoneWidth: 78,
});

console.log("AI Workshop model rules passed.");

runEthicsDeliveryTests(loadTypeScriptModule);

const villageMovement = loadTypeScriptModule(
  "src/game/features/world/model/villageMovement.ts",
);
const { VILLAGE_MAP } = loadTypeScriptModule(
  "src/game/features/world/model/villageMap.ts",
);
const { isPointWithinPortalInteractionArea } = loadTypeScriptModule(
  "src/game/features/world/model/mapDefinition.ts",
);
const { createVillageCollision } = loadTypeScriptModule(
  "src/game/features/world/model/villageCollision.ts",
);
const villageCollision = createVillageCollision(VILLAGE_MAP);

assert.equal(villageMovement.clampVillageFrameDelta(-1), 0);
assert.equal(villageMovement.clampVillageFrameDelta(16), 16);
assert.equal(villageMovement.clampVillageFrameDelta(80), 50);

const fountainBlocked = (x, y) => {
  const dx = (x - 100) / 20;
  const dy = (y - 100) / 15;
  return dx * dx + dy * dy <= 1;
};
const sweptAroundFountain = villageMovement.resolveVillageMovement(
  { x: 75, y: 100 },
  { x: 50, y: 18 },
  { x: 75, y: 100 },
  fountainBlocked,
  [{ center: { x: 100, y: 100 }, radiusX: 20, radiusY: 15 }],
);
assert.equal(fountainBlocked(sweptAroundFountain.x, sweptAroundFountain.y), false);
assert.ok(
  sweptAroundFountain.y > 100,
  "Diagonal movement should slide around an obstacle instead of entering it.",
);

const tunneledAcrossFountain = villageMovement.resolveVillageMovement(
  { x: 75, y: 100 },
  { x: 50, y: 0 },
  { x: 75, y: 100 },
  fountainBlocked,
  [{ center: { x: 100, y: 100 }, radiusX: 20, radiusY: 15 }],
);
assert.ok(
  !fountainBlocked(tunneledAcrossFountain.x, tunneledAcrossFountain.y),
  "Automatic curved movement must remain outside the obstacle.",
);
assert.ok(
  tunneledAcrossFountain.y < 100,
  "A head-on input should choose a stable side and glide around the obstacle.",
);

const gardenPixelBlocked = (x, y) => {
  const dx = (x - 200) / 60;
  const dy = (y - 200) / 30;
  return dx * dx + dy * dy <= 1;
};
const sweptAroundGarden = villageMovement.resolveVillageMovement(
  { x: 130, y: 200 },
  { x: 90, y: 0 },
  { x: 130, y: 200 },
  gardenPixelBlocked,
  [{
    center: { x: 200, y: 200 },
    radiusX: 70,
    radiusY: 40,
    projectToBoundary: false,
  }],
);
assert.ok(
  !gardenPixelBlocked(sweptAroundGarden.x, sweptAroundGarden.y),
  "A pixel-mapped garden must remain blocked while using a curved guide.",
);
assert.ok(
  sweptAroundGarden.y < 200,
  "Holding toward a garden should guide the player around its curved edge.",
);
assert.ok(
  Math.hypot(sweptAroundGarden.x - 130, sweptAroundGarden.y - 200) <= 90.01,
  "A visual movement guide must never eject the player beyond the requested distance.",
);

let heldGardenPosition = { x: 130, y: 200 };
for (let frame = 0; frame < 80; frame += 1) {
  const nextPosition = villageMovement.resolveVillageMovement(
    heldGardenPosition,
    { x: 2, y: 0 },
    heldGardenPosition,
    gardenPixelBlocked,
    [{
      center: { x: 200, y: 200 },
      radiusX: 70,
      radiusY: 40,
      projectToBoundary: false,
    }],
  );
  assert.ok(
    Math.hypot(
      nextPosition.x - heldGardenPosition.x,
      nextPosition.y - heldGardenPosition.y,
    ) <= 2.01,
    "A held direction must never snap the player farther than one frame.",
  );
  heldGardenPosition = nextPosition;
}
assert.ok(
  Math.abs(heldGardenPosition.y - 200) > 1,
  "A held direction should continuously curve around a pixel-mapped garden.",
);

assert.deepEqual(
  villageMovement.recoverVillagePosition(
    { x: 100, y: 100 },
    { x: 75, y: 100 },
    fountainBlocked,
  ),
  { x: 75, y: 100 },
  "A blocked player must return to the last known safe position.",
);

assert.equal(
  villageCollision.isBlocked(
    VILLAGE_MAP.defaultSpawn.position.x,
    VILLAGE_MAP.defaultSpawn.position.y,
  ),
  false,
  "The default village spawn must remain walkable.",
);
assert.equal(
  villageCollision.isBlocked(500, 90),
  true,
  "The forest edge behind the garden must remain blocked by the checked-in mask.",
);
assert.equal(
  villageCollision.isBlocked(640, 565),
  false,
  "The central south plaza must remain walkable.",
);

for (const point of [
  { x: 30, y: 300 },
  { x: 1_250, y: 300 },
  { x: 640, y: 10 },
  { x: 300, y: 40 },
  { x: 500, y: 90 },
  // garden trees stay blocked even though the bushes around them are not
  { x: 455, y: 135 },
  { x: 1_095, y: 455 },
]) {
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    true,
    `Village trees, hills and sky at (${point.x}, ${point.y}) must be blocked.`,
  );
}

for (const point of [
  { x: 450, y: 470 },
  { x: 830, y: 330 },
  { x: 640, y: 660 },
  // small bushes and flower beds inside the garden
  { x: 425, y: 300 },
  { x: 545, y: 655 },
  { x: 765, y: 570 },
  // beside the fountain basin, where Midi is drawn in front of it
  { x: 790, y: 380 },
]) {
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    false,
    `Village paving and small bushes at (${point.x}, ${point.y}) must stay walkable.`,
  );
}

// Building probes follow villageLayoutGrid.ts, so moving or resizing a
// building there keeps these checks meaningful without editing coordinates.
const polygonCentre = (id) => {
  const polygon = VILLAGE_MAP.collision.polygons.find((entry) => entry.id === id);
  assert.ok(polygon, `Village collision polygon ${id} must exist.`);
  const sum = polygon.points.reduce(
    (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / polygon.points.length, y: sum.y / polygon.points.length };
};
for (const [label, id] of [
  ["AI shop body", "ai-shop-building"],
  ["data airport body", "airport-building"],
  ["Ethics Review body", "ethics-office-building"],
  ["AI world tablet and cover", "ai-world-gate-tablet"],
]) {
  const point = polygonCentre(id);
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    true,
    `${label} must keep the player's feet out of the building.`,
  );
}

for (const portalId of ["shop", "workshop", "library"]) {
  const portal = VILLAGE_MAP.portals.find(({ id }) => id === portalId);
  assert.ok(portal, `Village portal ${portalId} must exist.`);
  assert.ok(portal.interactionArea, `Village portal ${portalId} must mark an approach area.`);
  const { x, y } = portal.position;
  const { radiusX, radiusY } = portal.interactionArea;
  for (const outside of [
    { x, y: y - radiusY * 1.1 },
    { x: x - radiusX * 1.1, y },
    { x: x + radiusX * 1.1, y },
  ]) {
    assert.equal(
      isPointWithinPortalInteractionArea(portal, outside),
      false,
      `Village portal ${portalId} must stay outside its marked approach area.`,
    );
  }
  for (const inside of [
    { x: x - radiusX * 0.75, y },
    { x: x + radiusX * 0.75, y },
    { x, y: y + radiusY * 0.75 },
  ]) {
    assert.equal(
      isPointWithinPortalInteractionArea(portal, inside),
      true,
      `Village portal ${portalId} must activate throughout its marked approach area.`,
    );
  }
  if (portal.returnSpawn) {
    assert.equal(
      villageCollision.isBlocked(portal.returnSpawn.position.x, portal.returnSpawn.position.y),
      false,
      `Returning from ${portalId} must place Midi on walkable paving.`,
    );
  }
}

for (const portal of VILLAGE_MAP.portals) {
  let reachableApproach = false;
  const interactionRadiusX = portal.interactionArea?.radiusX ??
    portal.interactionRadius;
  const interactionRadiusY = portal.interactionArea?.radiusY ??
    portal.interactionRadius;
  for (let offsetY = -interactionRadiusY; offsetY <= interactionRadiusY; offsetY += 8) {
    for (let offsetX = -interactionRadiusX; offsetX <= interactionRadiusX; offsetX += 8) {
      const point = {
        x: portal.position.x + offsetX,
        y: portal.position.y + offsetY,
      };
      if (
        isPointWithinPortalInteractionArea(portal, point) &&
        !villageCollision.isBlocked(point.x, point.y)
      ) {
        reachableApproach = true;
        break;
      }
    }
    if (reachableApproach) break;
  }
  assert.equal(
    reachableApproach,
    true,
    `Village portal ${portal.id} must keep a walkable interaction approach.`,
  );
}

const villageMask = VILLAGE_MAP.collision.precomputedMask;
const villageReachability = new Uint8Array(
  villageMask.columns * villageMask.rows,
);
const villageReachabilityQueue = [];
const villageStartColumn = Math.round(
  VILLAGE_MAP.defaultSpawn.position.x / villageMask.cellSize,
);
const villageStartRow = Math.round(
  VILLAGE_MAP.defaultSpawn.position.y / villageMask.cellSize,
);
const villageStartIndex =
  villageStartRow * villageMask.columns + villageStartColumn;
villageReachability[villageStartIndex] = 1;
villageReachabilityQueue.push(villageStartIndex);

for (let cursor = 0; cursor < villageReachabilityQueue.length; cursor += 1) {
  const cellIndex = villageReachabilityQueue[cursor];
  const column = cellIndex % villageMask.columns;
  const row = Math.floor(cellIndex / villageMask.columns);

  for (const [offsetColumn, offsetRow] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    const nextColumn = column + offsetColumn;
    const nextRow = row + offsetRow;
    if (
      nextColumn < 0 ||
      nextColumn >= villageMask.columns ||
      nextRow < 0 ||
      nextRow >= villageMask.rows
    ) {
      continue;
    }

    const nextIndex = nextRow * villageMask.columns + nextColumn;
    if (villageReachability[nextIndex] === 1) continue;
    const nextX = nextColumn * villageMask.cellSize;
    const nextY = nextRow * villageMask.cellSize;
    if (villageCollision.isBlocked(nextX, nextY)) continue;

    villageReachability[nextIndex] = 1;
    villageReachabilityQueue.push(nextIndex);
  }
}

for (const portal of VILLAGE_MAP.portals) {
  let connectedApproachCells = 0;
  for (let cellIndex = 0; cellIndex < villageReachability.length; cellIndex += 1) {
    if (villageReachability[cellIndex] !== 1) continue;
    const column = cellIndex % villageMask.columns;
    const row = Math.floor(cellIndex / villageMask.columns);
    const x = column * villageMask.cellSize;
    const y = row * villageMask.cellSize;
    if (isPointWithinPortalInteractionArea(portal, { x, y })) {
      connectedApproachCells += 1;
    }
  }

  assert.ok(
    connectedApproachCells > 0,
    `Village portal ${portal.id} must remain connected to the default spawn.`,
  );
}

const replacementBackgroundCollision = createVillageCollision({
  ...VILLAGE_MAP,
  background: {
    ...VILLAGE_MAP.background,
    assetKey: "replacement-village-art",
    url: "/assets/world/replacement-village-art.webp",
  },
});
for (const point of [
  VILLAGE_MAP.defaultSpawn.position,
  { x: 60, y: 200 },
  { x: 640, y: 590 },
  ...VILLAGE_MAP.portals.map((portal) => portal.position),
]) {
  assert.equal(
    replacementBackgroundCollision.isBlocked(point.x, point.y),
    villageCollision.isBlocked(point.x, point.y),
    "Replacing visual village art must not change collision results.",
  );
}

const villageCurvedGuides = [
  ...VILLAGE_MAP.collision.ellipses.map((ellipse) => ({
    ...ellipse,
    projectToBoundary: true,
  })),
  ...VILLAGE_MAP.collision.curvedMovementGuides.map((guide) => ({
    ...guide,
    projectToBoundary: false,
  })),
];
function advanceVillagePosition(
  position,
  displacement,
  memory,
  label = "Direction changes",
) {
  const nextPosition = villageMovement.resolveVillageMovement(
    position,
    displacement,
    position,
    (x, y) => villageCollision.isBlocked(x, y),
    villageCurvedGuides,
    memory,
  );
  assert.equal(
    villageCollision.isBlocked(nextPosition.x, nextPosition.y),
    false,
    "Direction changes must remain outside village collision.",
  );
  assert.ok(
    Math.hypot(nextPosition.x - position.x, nextPosition.y - position.y) <=
      Math.hypot(displacement.x, displacement.y) + 0.01,
    `${label}: movement must never move farther than one frame.`,
  );
  return nextPosition;
}

function assertSmoothDirectionChange(
  label,
  start,
  firstDisplacement,
  nextDisplacement,
) {
  const rememberedMemory = villageMovement.createVillageMovementMemory();
  let contactPosition = start;
  for (
    let frame = 0;
    frame < 48 && !rememberedMemory.obstacleKey;
    frame += 1
  ) {
    contactPosition = advanceVillagePosition(
      contactPosition,
      firstDisplacement,
      rememberedMemory,
      label,
    );
  }
  assert.ok(
    rememberedMemory.obstacleKey,
    `${label}: the first input must establish an obstacle encounter.`,
  );
  for (let frame = 0; frame < 6; frame += 1) {
    contactPosition = advanceVillagePosition(
      contactPosition,
      firstDisplacement,
      rememberedMemory,
      label,
    );
  }

  let rememberedPosition = contactPosition;
  let freshPosition = contactPosition;
  const freshMemory = villageMovement.createVillageMovementMemory();
  let rememberedOppositeFrames = 0;
  let freshOppositeFrames = 0;
  let rememberedOppositeDistance = 0;
  let freshOppositeDistance = 0;
  let rememberedStationaryFrames = 0;
  let freshStationaryFrames = 0;
  let maxRememberedStationaryFrames = 0;
  let maxFreshStationaryFrames = 0;
  const oppositeSamples = [];
  const requiresCurvedGlide = (position, displacement, memory) => {
    const guide = villageCurvedGuides.find(
      (candidate) => candidate.id === memory.obstacleKey,
    );
    if (!guide) return false;
    const normalX =
      (position.x - guide.center.x) / (guide.radiusX * guide.radiusX);
    const normalY =
      (position.y - guide.center.y) / (guide.radiusY * guide.radiusY);
    const normalLength = Math.hypot(normalX, normalY);
    if (normalLength === 0) return false;
    const outwardAmount =
      displacement.x * (normalX / normalLength) +
      displacement.y * (normalY / normalLength);
    const movementLength = Math.hypot(displacement.x, displacement.y);
    return (
      outwardAmount < movementLength * 0.5 &&
      villageCollision.isBlocked(
        position.x + displacement.x,
        position.y + displacement.y,
      )
    );
  };
  for (let frame = 0; frame < 24; frame += 1) {
    const rememberedRequiresGlide = requiresCurvedGlide(
      rememberedPosition,
      nextDisplacement,
      rememberedMemory,
      label,
    );
    const freshRequiresGlide = requiresCurvedGlide(
      freshPosition,
      nextDisplacement,
      freshMemory,
      label,
    );
    const rememberedNext = advanceVillagePosition(
      rememberedPosition,
      nextDisplacement,
      rememberedMemory,
    );
    const freshNext = advanceVillagePosition(
      freshPosition,
      nextDisplacement,
      freshMemory,
    );
    const requestedDistance = Math.hypot(
      nextDisplacement.x,
      nextDisplacement.y,
    );
    const requestedX = nextDisplacement.x / requestedDistance;
    const requestedY = nextDisplacement.y / requestedDistance;
    const rememberedProgress =
      (rememberedNext.x - rememberedPosition.x) * requestedX +
      (rememberedNext.y - rememberedPosition.y) * requestedY;
    const freshProgress =
      (freshNext.x - freshPosition.x) * requestedX +
      (freshNext.y - freshPosition.y) * requestedY;
    const rememberedDistance = Math.hypot(
      rememberedNext.x - rememberedPosition.x,
      rememberedNext.y - rememberedPosition.y,
    );
    const freshDistance = Math.hypot(
      freshNext.x - freshPosition.x,
      freshNext.y - freshPosition.y,
    );
    if (rememberedProgress < -0.02) {
      rememberedOppositeFrames += 1;
      rememberedOppositeDistance += -rememberedProgress;
      oppositeSamples.push({
        frame,
        from: rememberedPosition,
        to: rememberedNext,
        rememberedMemory: { ...rememberedMemory },
      });
    }
    if (freshProgress < -0.02) {
      freshOppositeFrames += 1;
      freshOppositeDistance += -freshProgress;
    }
    rememberedStationaryFrames = rememberedRequiresGlide
      ? rememberedDistance < 0.1
        ? rememberedStationaryFrames + 1
        : 0
      : 0;
    freshStationaryFrames = freshRequiresGlide
      ? freshDistance < 0.1
        ? freshStationaryFrames + 1
        : 0
      : 0;
    maxRememberedStationaryFrames = Math.max(
      maxRememberedStationaryFrames,
      rememberedStationaryFrames,
    );
    maxFreshStationaryFrames = Math.max(
      maxFreshStationaryFrames,
      freshStationaryFrames,
    );
    rememberedPosition = rememberedNext;
    freshPosition = freshNext;
  }

  assert.equal(
    rememberedOppositeFrames <= 1,
    true,
    `${label}: remembered slide side opposed the new input repeatedly; ` +
      JSON.stringify(oppositeSamples),
  );
  assert.equal(
    freshOppositeFrames <= 1,
    true,
    `${label}: a fresh tangent choice opposed the new input repeatedly.`,
  );
  assert.ok(
    rememberedOppositeDistance <= 0.5,
    `${label}: remembered correction moved ` +
      `${rememberedOppositeDistance.toFixed(2)}px against the new input.`,
  );
  assert.ok(
    freshOppositeDistance <= 0.5,
    `${label}: fresh correction moved ` +
      `${freshOppositeDistance.toFixed(2)}px against the new input.`,
  );
  assert.ok(
    maxRememberedStationaryFrames <= 3,
    `${label}: remembered movement stalled for ` +
      `${maxRememberedStationaryFrames} frames at ` +
      `(${rememberedPosition.x.toFixed(2)}, ${rememberedPosition.y.toFixed(2)}), ` +
      `memory=${JSON.stringify(rememberedMemory)}.`,
  );
  assert.ok(
    maxFreshStationaryFrames <= 3,
    `${label}: fresh movement stalled for ${maxFreshStationaryFrames} frames.`,
  );
  assert.ok(
    Math.hypot(
      rememberedPosition.x - freshPosition.x,
      rememberedPosition.y - freshPosition.y,
    ) <= 0.1,
    `${label}: a large input turn must match a fresh-memory endpoint.`,
  );
}

const fountainCollision = VILLAGE_MAP.collision.ellipses.find(
  (ellipse) => ellipse.id === "fountain",
);
assert.ok(fountainCollision, "The village fountain collision must exist.");
const fountainClearance = 14;
const fountainBottom = {
  x: fountainCollision.center.x,
  y: fountainCollision.center.y + fountainCollision.radiusY + fountainClearance,
};
const fountainTop = {
  x: fountainCollision.center.x,
  y: fountainCollision.center.y - fountainCollision.radiusY - fountainClearance,
};
const fountainLeft = {
  x: fountainCollision.center.x - fountainCollision.radiusX - fountainClearance,
  y: fountainCollision.center.y,
};
const fountainRight = {
  x: fountainCollision.center.x + fountainCollision.radiusX + fountainClearance,
  y: fountainCollision.center.y,
};

for (const transition of [
  ["fountain bottom up-right", fountainBottom, { x: 0, y: -3.84 }, { x: 3.84, y: 0 }],
  ["fountain bottom up-right diagonal", fountainBottom, { x: 0, y: -3.84 }, { x: Math.SQRT1_2 * 3.84, y: -Math.SQRT1_2 * 3.84 }],
  ["fountain bottom exact 60-degree turn", fountainBottom, { x: 0, y: -3.84 }, { x: Math.sqrt(3) * 1.92, y: -1.92 }],
  ["fountain west right-down", fountainLeft, { x: 3.84, y: 0 }, { x: 0, y: 3.84 }],
  ["fountain east left-down", fountainRight, { x: -3.84, y: 0 }, { x: 0, y: 3.84 }],
  ["fountain north down-right", fountainTop, { x: 0, y: 3.84 }, { x: 3.84, y: 0 }],
]) {
  assertSmoothDirectionChange(...transition);
}

function assertSmoothGradualDirectionChange(rampFrames) {
  const label = `fountain gradual 90-degree turn over ${rampFrames} frames`;
  const firstDisplacement = { x: 0, y: -3.84 };
  const rememberedMemory = villageMovement.createVillageMovementMemory();
  let contactPosition = fountainBottom;
  for (
    let frame = 0;
    frame < 48 && !rememberedMemory.obstacleKey;
    frame += 1
  ) {
    contactPosition = advanceVillagePosition(
      contactPosition,
      firstDisplacement,
      rememberedMemory,
    );
  }
  assert.ok(
    rememberedMemory.obstacleKey,
    `${label}: the initial input must establish an obstacle encounter.`,
  );
  for (let frame = 0; frame < 6; frame += 1) {
    contactPosition = advanceVillagePosition(
      contactPosition,
      firstDisplacement,
      rememberedMemory,
    );
  }

  let rememberedPosition = contactPosition;
  let freshPosition = contactPosition;
  const freshMemory = villageMovement.createVillageMovementMemory();
  let rememberedOppositeFrames = 0;
  let freshOppositeFrames = 0;
  let rememberedOppositeDistance = 0;
  let freshOppositeDistance = 0;
  const rememberedOppositeSamples = [];
  const freshOppositeSamples = [];
  let rememberedStationaryFrames = 0;
  let freshStationaryFrames = 0;
  let maxRememberedStationaryFrames = 0;
  let maxFreshStationaryFrames = 0;
  let rememberedSevereReversals = 0;
  let freshSevereReversals = 0;
  const rememberedReversalSamples = [];
  const freshReversalSamples = [];
  let previousRememberedMovement = null;
  let previousFreshMovement = null;
  const totalFrames = rampFrames + 24;

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const progress = Math.min((frame + 1) / rampFrames, 1);
    const angle = progress * (Math.PI / 2);
    const displacement = {
      x: Math.sin(angle) * 3.84,
      y: -Math.cos(angle) * 3.84,
    };
    const rememberedNext = advanceVillagePosition(
      rememberedPosition,
      displacement,
      rememberedMemory,
    );
    const freshNext = advanceVillagePosition(
      freshPosition,
      displacement,
      freshMemory,
    );
    const inputLength = Math.hypot(displacement.x, displacement.y);
    const inputX = displacement.x / inputLength;
    const inputY = displacement.y / inputLength;
    const rememberedMovement = {
      x: rememberedNext.x - rememberedPosition.x,
      y: rememberedNext.y - rememberedPosition.y,
    };
    const freshMovement = {
      x: freshNext.x - freshPosition.x,
      y: freshNext.y - freshPosition.y,
    };
    const rememberedProgress =
      rememberedMovement.x * inputX + rememberedMovement.y * inputY;
    const freshProgress =
      freshMovement.x * inputX + freshMovement.y * inputY;
    const rememberedDistance = Math.hypot(
      rememberedMovement.x,
      rememberedMovement.y,
    );
    const freshDistance = Math.hypot(freshMovement.x, freshMovement.y);

    if (rememberedProgress < -0.02) {
      rememberedOppositeFrames += 1;
      rememberedOppositeDistance += -rememberedProgress;
      rememberedOppositeSamples.push({
        frame,
        input: displacement,
        movement: rememberedMovement,
        memory: { ...rememberedMemory },
      });
    }
    if (freshProgress < -0.02) {
      freshOppositeFrames += 1;
      freshOppositeDistance += -freshProgress;
      freshOppositeSamples.push({
        frame,
        input: displacement,
        movement: freshMovement,
        memory: { ...freshMemory },
      });
    }
    if (previousRememberedMovement && rememberedDistance >= 0.1) {
      const previousDistance = Math.hypot(
        previousRememberedMovement.x,
        previousRememberedMovement.y,
      );
      if (
        previousDistance >= 0.1 &&
        (previousRememberedMovement.x * rememberedMovement.x +
          previousRememberedMovement.y * rememberedMovement.y) /
          (previousDistance * rememberedDistance) <
          -0.8
      ) {
        rememberedSevereReversals += 1;
        rememberedReversalSamples.push({
          frame,
          previous: previousRememberedMovement,
          current: rememberedMovement,
          position: rememberedPosition,
          memory: { ...rememberedMemory },
        });
      }
    }
    if (previousFreshMovement && freshDistance >= 0.1) {
      const previousDistance = Math.hypot(
        previousFreshMovement.x,
        previousFreshMovement.y,
      );
      if (
        previousDistance >= 0.1 &&
        (previousFreshMovement.x * freshMovement.x +
          previousFreshMovement.y * freshMovement.y) /
          (previousDistance * freshDistance) <
          -0.8
      ) {
        freshSevereReversals += 1;
        freshReversalSamples.push({
          frame,
          previous: previousFreshMovement,
          current: freshMovement,
          position: freshPosition,
          memory: { ...freshMemory },
        });
      }
    }
    rememberedStationaryFrames =
      rememberedDistance < 0.1 ? rememberedStationaryFrames + 1 : 0;
    freshStationaryFrames =
      freshDistance < 0.1 ? freshStationaryFrames + 1 : 0;
    maxRememberedStationaryFrames = Math.max(
      maxRememberedStationaryFrames,
      rememberedStationaryFrames,
    );
    maxFreshStationaryFrames = Math.max(
      maxFreshStationaryFrames,
      freshStationaryFrames,
    );
    previousRememberedMovement = rememberedMovement;
    previousFreshMovement = freshMovement;
    rememberedPosition = rememberedNext;
    freshPosition = freshNext;
  }

  assert.ok(
    rememberedOppositeFrames <= 1 && rememberedOppositeDistance <= 0.5,
    `${label}: remembered movement opposed the rotating input for ` +
      `${rememberedOppositeFrames} frames / ` +
      `${rememberedOppositeDistance.toFixed(2)}px; ` +
      JSON.stringify(rememberedOppositeSamples),
  );
  assert.ok(
    freshOppositeFrames <= 1 && freshOppositeDistance <= 0.5,
    `${label}: fresh movement opposed the rotating input for ` +
      `${freshOppositeFrames} frames / ` +
      `${freshOppositeDistance.toFixed(2)}px; ` +
      JSON.stringify(freshOppositeSamples),
  );
  assert.equal(
    rememberedSevereReversals,
    0,
    `${label}: remembered movement must not bounce between frames; ` +
      JSON.stringify(rememberedReversalSamples),
  );
  assert.equal(
    freshSevereReversals,
    0,
    `${label}: fresh movement must not bounce between frames; ` +
      JSON.stringify(freshReversalSamples),
  );
  assert.ok(
    maxRememberedStationaryFrames <= 4,
    `${label}: remembered movement stalled for ` +
      `${maxRememberedStationaryFrames} frames.`,
  );
  assert.ok(
    maxFreshStationaryFrames <= 4,
    `${label}: fresh movement stalled for ${maxFreshStationaryFrames} frames.`,
  );
  assert.ok(
    Math.hypot(
      rememberedPosition.x - freshPosition.x,
      rememberedPosition.y - freshPosition.y,
    ) <= 0.1,
    `${label}: remembered movement must converge with fresh-memory movement.`,
  );
}

for (const rampFrames of [6, 12, 18, 30]) {
  assertSmoothGradualDirectionChange(rampFrames);
}

{
  const memory = villageMovement.createVillageMovementMemory();
  const displacement = { x: 0, y: -3.84 };
  let position = fountainBottom;
  let positionTwoFramesAgo = null;
  let previousMovement = null;
  let severeReversals = 0;
  let twoFrameReturns = 0;
  const reversalSamples = [];

  for (let frame = 0; frame < 130; frame += 1) {
    const nextPosition = advanceVillagePosition(
      position,
      displacement,
      memory,
    );
    const movement = {
      x: nextPosition.x - position.x,
      y: nextPosition.y - position.y,
    };
    const movementDistance = Math.hypot(movement.x, movement.y);
    if (previousMovement && movementDistance >= 0.1) {
      const previousDistance = Math.hypot(
        previousMovement.x,
        previousMovement.y,
      );
      if (
        previousDistance >= 0.1 &&
        (previousMovement.x * movement.x +
          previousMovement.y * movement.y) /
          (previousDistance * movementDistance) <
          -0.8
      ) {
        severeReversals += 1;
        reversalSamples.push({
          frame,
          from: position,
          to: nextPosition,
          previousMovement,
          movement,
          memory: { ...memory },
        });
      }
    }
    if (
      positionTwoFramesAgo &&
      movementDistance >= 0.1 &&
      Math.hypot(
        nextPosition.x - positionTwoFramesAgo.x,
        nextPosition.y - positionTwoFramesAgo.y,
      ) < 0.05
    ) {
      twoFrameReturns += 1;
    }
    positionTwoFramesAgo = position;
    position = nextPosition;
    previousMovement = movement;
  }

  assert.equal(
    severeReversals,
    0,
    "A continuous upward hold against the fountain " +
      "must not reverse direction between mask cells; " +
      JSON.stringify(reversalSamples),
  );
  assert.equal(
    twoFrameReturns,
    0,
    "A continuous upward hold must not alternate between two positions.",
  );
}

console.log("Village movement safety rules passed.");
