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

const coreKitchenModelRoot = path.resolve(
  "src/game/features/core-kitchen/model",
);
const {
  CORE_KINDS,
  CORE_KITCHEN_RULES,
  CORE_LANE_Y,
} = loadTypeScriptModule(path.join(coreKitchenModelRoot, "config.ts"));
const coreKitchenRules = loadTypeScriptModule(
  path.join(coreKitchenModelRoot, "rules.ts"),
);
const {
  AI_CORES,
  KITCHEN_ORDERS,
  KITCHEN_ROUND_COUNT,
} = loadTypeScriptModule("src/game/content/coreKitchen.ts");

assert.deepEqual(CORE_KINDS, ["input", "process", "output"]);
assert.deepEqual(CORE_LANE_Y, {
  input: 455,
  process: 535,
  output: 615,
});
assert.deepEqual(CORE_KITCHEN_RULES, {
  machineInteractionDistance: 155,
  corePickupDistance: 82,
  playerSpeed: 205,
  conveyorWrapMinX: 235,
  conveyorWrapMaxX: 850,
});
assert.equal(KITCHEN_ROUND_COUNT, 5);

const coreById = new Map(AI_CORES.map((core) => [core.id, core]));
for (const order of KITCHEN_ORDERS) {
  for (const kind of CORE_KINDS) {
    const referencedCore = coreById.get(order.recipe[kind]);
    assert.ok(
      referencedCore,
      `${order.id} references missing ${kind} core ${order.recipe[kind]}.`,
    );
    assert.equal(
      referencedCore.kind,
      kind,
      `${order.id} references a ${referencedCore.kind} core in its ${kind} slot.`,
    );
  }
}

const recipe = KITCHEN_ORDERS[0].recipe;
const installed = {
  input: { core: { id: recipe.input } },
  process: { core: { id: "wrong" } },
};
assert.equal(coreKitchenRules.countInstalledCoreKinds(installed), 2);
assert.deepEqual(
  coreKitchenRules.getWrongCoreKinds(recipe, installed),
  ["process", "output"],
);
const completeInstallation = Object.fromEntries(
  CORE_KINDS.map((kind) => [kind, { core: { id: recipe[kind] } }]),
);
assert.deepEqual(
  coreKitchenRules.getWrongCoreKinds(recipe, completeInstallation),
  [],
);
assert.deepEqual(coreKitchenRules.getKitchenMistakeProgress(2), {
  mistakeCount: 3,
  combo: 0,
});
assert.deepEqual(coreKitchenRules.getKitchenSuccessProgress(4, 2), {
  correctCount: 5,
  combo: 3,
});
assert.equal(coreKitchenRules.getKitchenStarRating(0), "★★★");
assert.equal(coreKitchenRules.getKitchenStarRating(1), "★★★");
assert.equal(coreKitchenRules.getKitchenStarRating(2), "★★☆");
assert.equal(coreKitchenRules.getKitchenStarRating(3), "★★☆");
assert.equal(coreKitchenRules.getKitchenStarRating(4), "★☆☆");

console.log("Core Kitchen model rules passed.");

const serviceShopModelRoot = path.resolve(
  "src/game/features/ai-service-shop/model",
);
const { AI_SERVICE_SHOP_LAYOUT } = loadTypeScriptModule(
  path.join(serviceShopModelRoot, "config.ts"),
);
const serviceShopRules = loadTypeScriptModule(
  path.join(serviceShopModelRoot, "rules.ts"),
);
const {
  AI_SERVICE_QUESTIONS,
  AI_SERVICE_ROUND_COUNT,
  AI_TOOLS,
} = loadTypeScriptModule("src/game/content/questions.ts");

assert.deepEqual(AI_SERVICE_SHOP_LAYOUT, {
  padXs: [175, 410, 640, 870, 1105],
  padY: 535,
});
assert.equal(AI_SERVICE_ROUND_COUNT, 6);
assert.equal(serviceShopRules.getServiceChoiceCount(0), 3);
assert.equal(serviceShopRules.getServiceChoiceCount(1), 3);
assert.equal(serviceShopRules.getServiceChoiceCount(2), 4);
assert.equal(serviceShopRules.getServiceChoiceCount(3), 4);
assert.equal(serviceShopRules.getServiceChoiceCount(4), 5);
assert.equal(serviceShopRules.getServiceChoiceCount(5), 5);
assert.deepEqual(serviceShopRules.getServicePadIndices(3), [1, 2, 3]);
assert.deepEqual(serviceShopRules.getServicePadIndices(4), [0, 1, 3, 4]);
assert.deepEqual(serviceShopRules.getServicePadIndices(5), [0, 1, 2, 3, 4]);
assert.equal(serviceShopRules.isCorrectServiceChoice("tool", "tool"), true);
assert.equal(serviceShopRules.isCorrectServiceChoice("wrong", "tool"), false);
assert.deepEqual(serviceShopRules.getServiceMistakeProgress(2), {
  mistakeCount: 3,
  combo: 0,
});
assert.deepEqual(serviceShopRules.getServiceSuccessProgress(4, 2, false), {
  correctCount: 5,
  combo: 3,
});
assert.deepEqual(serviceShopRules.getServiceSuccessProgress(4, 2, true), {
  correctCount: 5,
  combo: 0,
});
assert.equal(serviceShopRules.getServiceStarCount(0), 3);
assert.equal(serviceShopRules.getServiceStarCount(1), 3);
assert.equal(serviceShopRules.getServiceStarCount(2), 2);
assert.equal(serviceShopRules.getServiceStarCount(3), 2);
assert.equal(serviceShopRules.getServiceStarCount(4), 1);

const serviceToolById = new Map(AI_TOOLS.map((tool) => [tool.id, tool]));
assert.equal(
  serviceToolById.size,
  AI_TOOLS.length,
  "AI service tool IDs must be unique.",
);
assert.equal(
  new Set(AI_SERVICE_QUESTIONS.map((question) => question.id)).size,
  AI_SERVICE_QUESTIONS.length,
  "AI service question IDs must be unique.",
);
for (const question of AI_SERVICE_QUESTIONS) {
  assert.equal(
    question.choiceIds.length,
    5,
    `${question.id} must provide exactly five choices for later rounds.`,
  );
  assert.equal(
    new Set(question.choiceIds).size,
    question.choiceIds.length,
    `${question.id} contains duplicate choices.`,
  );
  assert.ok(
    serviceToolById.has(question.answerId),
    `${question.id} references missing answer ${question.answerId}.`,
  );
  assert.equal(
    question.choiceIds.filter((choiceId) => choiceId === question.answerId)
      .length,
    1,
    `${question.id} must include its answer exactly once.`,
  );
  for (const choiceId of question.choiceIds) {
    assert.ok(
      serviceToolById.has(choiceId),
      `${question.id} references missing choice ${choiceId}.`,
    );
  }
}

console.log("AI Service Shop model rules passed.");

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
  villageCollision.isBlocked(280, 214),
  true,
  "The northwest garden must remain blocked by the checked-in mask.",
);
assert.equal(
  villageCollision.isBlocked(640, 590),
  false,
  "The central south path must remain walkable.",
);

for (const point of [
  { x: 100, y: 300 },
  { x: 450, y: 140 },
  { x: 1_000, y: 560 },
  { x: 1_180, y: 500 },
  { x: 80, y: 650 },
]) {
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    true,
    `Visible village greenery at (${point.x}, ${point.y}) must be blocked.`,
  );
}

for (const point of [
  { x: 500, y: 400 },
  { x: 800, y: 500 },
  { x: 640, y: 650 },
]) {
  assert.equal(
    villageCollision.isBlocked(point.x, point.y),
    false,
    `Visible village paving at (${point.x}, ${point.y}) must stay walkable.`,
  );
}

for (const probe of [
  { label: "AI shop body", point: { x: 300, y: 250 } },
  { label: "data airport body", point: { x: 1_080, y: 320 } },
  { label: "Ethics Review right wall", point: { x: 365, y: 540 } },
  { label: "Ethics Review tight right wall", point: { x: 392, y: 540 } },
  { label: "AI world portal barrier", point: { x: 744, y: 205 } },
]) {
  assert.equal(
    villageCollision.isBlocked(probe.point.x, probe.point.y),
    true,
    `${probe.label} must keep the player's feet out of the building.`,
  );
}

assert.equal(
  villageCollision.isBlocked(405, 540),
  false,
  "Open paving beside the Ethics Review office must remain walkable.",
);

assert.equal(
  villageCollision.isBlocked(230, 445),
  false,
  "The player may overlap the Ethics Review roof, but not its wall below.",
);

for (const probe of [
  {
    portalId: "shop",
    excludedPoint: { x: 590, y: 285 },
    includedPoints: [
      { x: 180, y: 285 },
      { x: 520, y: 285 },
      { x: 356, y: 380 },
    ],
  },
  {
    portalId: "workshop",
    excludedPoint: { x: 330, y: 440 },
    includedPoints: [
      { x: 110, y: 650 },
      { x: 480, y: 650 },
      { x: 295, y: 680 },
    ],
  },
  {
    portalId: "library",
    excludedPoint: { x: 800, y: 520 },
    includedPoints: [
      { x: 850, y: 380 },
      { x: 1_220, y: 380 },
      { x: 1_045, y: 475 },
    ],
  },
]) {
  const portal = VILLAGE_MAP.portals.find(({ id }) => id === probe.portalId);
  assert.ok(portal, `Village portal ${probe.portalId} must exist.`);
  assert.equal(
    isPointWithinPortalInteractionArea(portal, probe.excludedPoint),
    false,
    `Village portal ${probe.portalId} must stay outside its marked approach area.`,
  );
  for (const includedPoint of probe.includedPoints) {
    assert.equal(
      isPointWithinPortalInteractionArea(portal, includedPoint),
      true,
      `Village portal ${probe.portalId} must activate throughout its marked approach area.`,
    );
  }
}

const ethicsPortal = VILLAGE_MAP.portals.find(({ id }) => id === "workshop");
assert.ok(ethicsPortal, "Ethics Review portal must exist.");
for (const point of [
  { x: 405, y: 540 },
  { x: 429, y: 540 },
  { x: 295, y: 540 },
]) {
  assert.equal(
    isPointWithinPortalInteractionArea(ethicsPortal, point),
    false,
    `Ethics Review must not activate beside or behind the building at (${point.x}, ${point.y}).`,
  );
}
assert.equal(
  isPointWithinPortalInteractionArea(ethicsPortal, { x: 429, y: 580 }),
  true,
  "Ethics Review must activate at the requested front-right approach point.",
);
assert.equal(
  isPointWithinPortalInteractionArea(ethicsPortal, { x: 500, y: 650 }),
  false,
  "Ethics Review front approach must stop about 15px before its former right edge.",
);

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
  { x: 280, y: 214 },
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
