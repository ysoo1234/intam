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
assert.equal(DATA_FLIGHT_CONFIG.questionIntervalMs, 25_000);
// The last quiz must still leave room for its fever before the flight ends.
assert.equal(DATA_FLIGHT_CONFIG.lastQuestionWindowMs, 22_000);
assert.ok(
  DATA_FLIGHT_CONFIG.lastQuestionWindowMs >=
    DATA_FLIGHT_CONFIG.questionReadingMs + DATA_FLIGHT_CONFIG.feverDurationMs + 6_000,
  "A quiz needs reading time, the answers flying in and a full fever.",
);
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
// Rewards are a lucky draw in steps of 10: 20–50, then 40–70, 60–90 …
assert.deepEqual(workshopRules.getWorkshopReward(1, () => 0), { reward: 20 });
assert.deepEqual(workshopRules.getWorkshopReward(3, () => 0.999), { reward: 50 });
assert.deepEqual(workshopRules.getWorkshopReward(4, () => 0), { reward: 40 });
assert.deepEqual(workshopRules.getWorkshopReward(6, () => 0.5), { reward: 60 });
assert.deepEqual(workshopRules.getWorkshopReward(9, () => 0.999), { reward: 90 });
assert.deepEqual(workshopRules.getWorkshopRewardRange(10), { min: 80, max: 110 });
for (let i = 0; i < 200; i += 1) {
  const { reward } = workshopRules.getWorkshopReward(2);
  assert.ok([20, 30, 40, 50].includes(reward), `unexpected reward ${reward}`);
}
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
  // beside the fountain basin, a body width away from its rim
  { x: 800, y: 380 },
]) {
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    false,
    `Village paving and small bushes at (${point.x}, ${point.y}) must stay walkable.`,
  );
}

// Building probes follow villageLayoutGrid.ts, so moving or resizing a
// building there keeps these checks meaningful without editing coordinates.
const villageBodyOffsetY = VILLAGE_MAP.collision.playerBody.feetOffsetY;
const buildingFootprint = (id) => {
  const building = VILLAGE_MAP.collision.buildings.find((entry) => entry.id === id);
  assert.ok(building, `Village building shape ${id} must exist.`);
  const xs = building.footprint.map(({ x }) => x);
  const ys = building.footprint.map(({ y }) => y);
  return {
    building,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};
for (const [label, id] of [
  ["AI shop body", "ai-shop"],
  ["data airport body", "airport"],
  ["Ethics Review body", "ethics-office"],
  ["AI world tablet and cover", "ai-world-gate"],
  ["fountain", "fountain"],
]) {
  const { building } = buildingFootprint(id);
  const sum = building.footprint.reduce(
    (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
    { x: 0, y: 0 },
  );
  const centre = {
    x: sum.x / building.footprint.length,
    y: sum.y / building.footprint.length - villageBodyOffsetY,
  };
  assert.equal(
    villageCollision.isBlocked(centre.x, centre.y),
    true,
    `${label} must keep the player's feet off its ground outline.`,
  );
}

// Only the ground under a building blocks Midi, not its whole picture: the
// lawn behind the fountain's basin and behind the AI shop's roof is open
// until the building hides too much of her.
{
  const fountain = VILLAGE_MAP.scenery.find(({ id }) => id === "fountain");
  const fountainTop = fountain.position.y - fountain.displaySize.height / 2;
  const fountainFoot = buildingFootprint("fountain");
  let lowestBehind = -Infinity;
  for (let y = fountainTop - 60; y < fountainFoot.minY; y += 1) {
    if (villageCollision.isBlocked(fountain.position.x, y)) break;
    lowestBehind = y;
  }
  assert.ok(
    lowestBehind > fountainTop - villageBodyOffsetY + 10,
    "Midi must be able to step a little behind the fountain, not stop at the top of its picture.",
  );
  const shop = VILLAGE_MAP.scenery.find(({ id }) => id === "ai-shop");
  const shopTop = shop.position.y - shop.displaySize.height / 2;
  assert.equal(
    villageCollision.isBlocked(shop.position.x, shopTop + 10),
    false,
    "The lawn just behind the AI shop's roof must be walkable.",
  );
}

// Beside a wall Midi's whole body stays clear of it: her feet stop a body
// width away from the ground outline, never half inside the picture.
for (const id of ["ai-shop", "airport", "ethics-office", "fountain"]) {
  const foot = buildingFootprint(id);
  for (const [side, direction] of [["left", -1], ["right", 1]]) {
    const edgeX = direction < 0 ? foot.minX : foot.maxX;
    const y = foot.building.footprint
      .reduce((best, point) => (Math.abs(point.x - edgeX) < Math.abs(best.x - edgeX) ? point : best))
      .y - villageBodyOffsetY;
    assert.equal(
      villageCollision.isBlocked(edgeX + direction * 20, y),
      true,
      `Midi must not stand inside the ${side} wall of ${id}.`,
    );
  }
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

// Entry buttons show in a building's front yard but never once Midi has
// gone behind it.
{
  const { isPlayerBehindBuilding } = loadTypeScriptModule(
    "src/game/features/world/model/villageCollision.ts",
  );
  const isEntryShown = (portal, point) =>
    isPointWithinPortalInteractionArea(portal, point) &&
    isPlayerBehindBuilding(VILLAGE_MAP.collision, portal.frontOf, point) !== true;
  for (const portal of VILLAGE_MAP.portals) {
    assert.ok(portal.frontOf, `Village portal ${portal.id} must name its building.`);
    const outline = buildingFootprint(portal.frontOf);
    for (let x = outline.minX; x <= outline.maxX; x += 6) {
      for (let y = outline.minY - 150; y < outline.minY - villageBodyOffsetY; y += 6) {
        assert.equal(
          isEntryShown(portal, { x, y }),
          false,
          `Village portal ${portal.id} must not offer entry from behind its building (${x}, ${y}).`,
        );
      }
    }
  }
  // Front-yard spots the player expects to work (beside the plane, beside
  // the workshop steps, in front of the book's cover).
  const findPortal = (id) => VILLAGE_MAP.portals.find((portal) => portal.id === id);
  const airport = buildingFootprint("airport");
  const shop = buildingFootprint("ai-shop");
  const gate = buildingFootprint("ai-world-gate");
  for (const [id, point] of [
    ["library", { x: airport.maxX + 75, y: airport.maxY - 40 }],
    ["shop", { x: shop.maxX + 45, y: shop.maxY - 25 }],
    ["starlight-exit", { x: gate.minX + 35, y: gate.minY + 85 }],
  ]) {
    assert.equal(villageCollision.isBlocked(point.x, point.y), false, `${id} front-yard probe must be walkable.`);
    assert.equal(isEntryShown(findPortal(id), point), true, `Village portal ${id} must offer entry from its front yard.`);
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

// The fountain and the buildings block the ground they stand on.
// Walking into one and turning along it must keep Midi moving, never stuck.
const fountainOutline = buildingFootprint("fountain");
const fountainCentreX = (fountainOutline.minX + fountainOutline.maxX) / 2;
const fountainBottomY = fountainOutline.maxY - villageBodyOffsetY;

function holdDirection(start, displacement, frames, memory) {
  let position = start;
  let moved = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    const next = advanceVillagePosition(position, displacement, memory, "Fountain slide");
    moved += Math.hypot(next.x - position.x, next.y - position.y);
    position = next;
  }
  return { position, moved };
}

{
  // Walk up into the fountain from the plaza below it, then turn right.
  const memory = villageMovement.createVillageMovementMemory();
  const start = { x: fountainCentreX, y: fountainBottomY + 30 };
  assert.equal(villageCollision.isBlocked(start.x, start.y), false, "The plaza below the fountain must be walkable.");
  const up = holdDirection(start, { x: 0, y: -3.84 }, 30, memory);
  assert.ok(up.position.y >= fountainBottomY - 20, "Midi must stop at the fountain, not walk through it.");
  const right = holdDirection(up.position, { x: 3.84, y: 0 }, 20, memory);
  assert.ok(right.moved >= 3.84 * 20 * 0.7, "Turning along the fountain must keep Midi moving.");
  const diagonal = holdDirection(up.position, { x: 2.7, y: -2.7 }, 40, villageMovement.createVillageMovementMemory());
  assert.ok(diagonal.moved >= 40, "Pushing diagonally into the fountain must slide along it.");
}

{
  // Midi can walk straight along the back of the fountain, but her feet
  // stay above the basin's back rim so the basin never covers them.
  const memory = villageMovement.createVillageMovementMemory();
  const behindY = fountainOutline.minY - villageBodyOffsetY - 25;
  const start = { x: fountainOutline.minX - 10, y: behindY };
  assert.equal(villageCollision.isBlocked(start.x, start.y), false, "The lawn behind the fountain's left side must be walkable.");
  const across = holdDirection(start, { x: 3.84, y: 0 }, 70, memory);
  assert.ok(across.position.x > fountainOutline.maxX, "Midi must be able to pass behind the fountain.");
  assert.ok(Math.abs(across.position.y - behindY) < 12, "Passing behind the fountain must not need a detour.");
  assert.equal(
    villageCollision.isBlocked(fountainCentreX, fountainOutline.minY - villageBodyOffsetY),
    true,
    "Behind the fountain Midi's feet must stop before the basin rim.",
  );
}

{
  // The starlight gate is a thin standing book: Midi can walk along the
  // lawn behind it from one side to the other.
  const gate = buildingFootprint("ai-world-gate");
  const behindY = gate.minY - villageBodyOffsetY - 30;
  const start = { x: gate.minX - 40, y: behindY };
  assert.equal(villageCollision.isBlocked(start.x, start.y), false, "The lawn behind the starlight gate's left side must be walkable.");
  const across = holdDirection(start, { x: 3.84, y: 0 }, 110, villageMovement.createVillageMovementMemory());
  assert.ok(across.position.x > gate.maxX, "Midi must be able to pass behind the starlight gate.");
}

{
  // Walking from the fountain to the lawn behind the Ethics Review dome
  // passes bush corners in the painted mask; none of them may trap Midi.
  const memory = villageMovement.createVillageMovementMemory();
  const target = { x: 1_100, y: 385 };
  let position = { x: 758, y: 313 };
  let stalled = 0;
  for (let frame = 0; frame < 220 && Math.hypot(target.x - position.x, target.y - position.y) > 20; frame += 1) {
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const length = Math.hypot(dx, dy);
    const next = advanceVillagePosition(position, { x: (dx / length) * 2.88, y: (dy / length) * 2.88 }, memory, "Pocket");
    stalled = Math.hypot(next.x - position.x, next.y - position.y) < 0.05 ? stalled + 1 : 0;
    assert.ok(stalled < 20, `Midi must not get stuck in a bush corner (at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}).`);
    position = next;
  }
  assert.ok(
    Math.hypot(target.x - position.x, target.y - position.y) <= 20,
    "Midi must reach the lawn behind the Ethics Review dome.",
  );
}

console.log("Village movement safety rules passed.");
