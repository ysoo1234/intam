import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const composition = await readFile("src/game/createLearningGame.ts", "utf8");
const sceneRegistry = await readFile("src/game/sceneRegistry.ts", "utf8");
const sceneKeys = await readFile(
  "src/game/core/scenes/sceneKeys.ts",
  "utf8",
);
const introScene = await readFile(
  "src/game/features/intro/scene/IntroScene.ts",
  "utf8",
);
const worldScene = await readFile(
  "src/game/features/world/scene/WorldScene.ts",
  "utf8",
);
const villageScenery = await readFile(
  "src/game/features/world/scene/villageScenery.ts",
  "utf8",
);
const worldTouchDirection = await readFile(
  "src/game/features/world/scene/worldTouchDirection.ts",
  "utf8",
);
const floatingJoystick = await readFile(
  "src/game/core/input/floatingJoystick.ts",
  "utf8",
);
const pointerCoordinates = await readFile(
  "src/game/core/input/pointerCoordinates.ts",
  "utf8",
);
const villageMap = await readFile(
  "src/game/features/world/model/villageMap.ts",
  "utf8",
);
const villageMovement = await readFile(
  "src/game/features/world/model/villageMovement.ts",
  "utf8",
);
const villageCollision = await readFile(
  "src/game/features/world/model/villageCollision.ts",
  "utf8",
);
const villageCollisionMask = await readFile(
  "src/game/features/world/model/villageCollisionMask.ts",
  "utf8",
);
const ethicsScene = await readFile(
  "src/game/features/ethics-review/scene/EthicsReviewScene.ts",
  "utf8",
);
const ethicsControls = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewControls.ts",
  "utf8",
);
const ethicsPlayer = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewPlayer.ts",
  "utf8",
);
const ethicsView = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewView.ts",
  "utf8",
);
const ethicsEffects = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewEffects.ts",
  "utf8",
);
const airportScene = await readFile(
  "src/game/features/data-flight/scene/AirportScene.ts",
  "utf8",
);
const airportEffects = await readFile(
  "src/game/features/data-flight/scene/airportEffects.ts",
  "utf8",
);
const airportControls = await readFile(
  "src/game/features/data-flight/scene/airportControls.ts",
  "utf8",
);
const airportPlayer = await readFile(
  "src/game/features/data-flight/scene/airportPlayer.ts",
  "utf8",
);
const airportView = await readFile(
  "src/game/features/data-flight/scene/airportView.ts",
  "utf8",
);
const airportTextures = await readFile(
  "src/game/features/data-flight/scene/airportTextures.ts",
  "utf8",
);
const airportObjects = await readFile(
  "src/game/features/data-flight/scene/airportObjects.ts",
  "utf8",
);
const airportObjectMotion = await readFile(
  "src/game/features/data-flight/scene/airportObjectMotion.ts",
  "utf8",
);
const airportFeverFormation = await readFile(
  "src/game/features/data-flight/scene/airportFeverFormation.ts",
  "utf8",
);
const workshopScene = await readFile(
  "src/game/features/ai-workshop/scene/AiWorkshopScene.ts",
  "utf8",
);
const workshopView = await readFile(
  "src/game/features/ai-workshop/scene/workshopView.ts",
  "utf8",
);
const workshopDialogue = await readFile(
  "src/game/features/ai-workshop/scene/workshopDialogue.ts",
  "utf8",
);
const workshopStatus = await readFile(
  "src/game/features/ai-workshop/scene/workshopStatus.ts",
  "utf8",
);
const workshopControls = await readFile(
  "src/game/features/ai-workshop/scene/workshopControls.ts",
  "utf8",
);
const workshopLayout = await readFile(
  "src/game/features/ai-workshop/scene/layout.ts",
  "utf8",
);
const workshopPlayer = await readFile(
  "src/game/features/ai-workshop/scene/workshopPlayer.ts",
  "utf8",
);
const workshopCustomerVisual = await readFile(
  "src/game/features/ai-workshop/scene/workshopCustomerVisual.ts",
  "utf8",
);
const workshopRandomFiles = await Promise.all(
  [
    "workshopProducts.ts",
    "workshopCraftingView.ts",
    "workshopStarCatchView.ts",
    "workshopEffects.ts",
  ].map((file) =>
    readFile(`src/game/features/ai-workshop/scene/${file}`, "utf8"),
  ),
);
const coreKitchenScene = await readFile(
  "src/game/features/core-kitchen/scene/CoreKitchenScene.ts",
  "utf8",
);
const coreKitchenEffects = await readFile(
  "src/game/features/core-kitchen/scene/coreKitchenEffects.ts",
  "utf8",
);
const serviceShopScene = await readFile(
  "src/game/features/ai-service-shop/scene/ShopScene.ts",
  "utf8",
);
const serviceShopEffects = await readFile(
  "src/game/features/ai-service-shop/scene/shopEffects.ts",
  "utf8",
);
const serviceShopToolTextures = await readFile(
  "src/game/features/ai-service-shop/scene/shopToolTextures.ts",
  "utf8",
);

assert.doesNotMatch(
  composition,
  /class AirportScene/,
  "AirportScene must stay in its feature-owned module.",
);
assert.match(
  composition,
  /import \{ createRegisteredScenes \} from "\.\/sceneRegistry";/,
);
assert.equal(
  sceneRegistry.match(/new AirportScene\(renderScale\)/g)?.length,
  1,
  "AirportScene must be registered exactly once.",
);
assert.match(
  composition,
  /scene: createRegisteredScenes\(\{ onReady, renderScale \}\)/,
  "Phaser must receive its active scenes from the declarative registry.",
);
assert.match(sceneRegistry, /code: "duplicate-scene-id"/);
assert.match(sceneRegistry, /code: "duplicate-scene-key"/);
const declaredSceneKeyValues = [
  ...sceneKeys.matchAll(/^\s+\w+: "([^"]+)",$/gmu),
].map((match) => match[1]);
assert.equal(declaredSceneKeyValues.length, 7);
assert.equal(
  new Set(declaredSceneKeyValues).size,
  declaredSceneKeyValues.length,
  "Every scene key must be unique.",
);
const registeredSceneIds = [
  ...sceneRegistry.matchAll(/^\s+id: "([^"]+)",$/gmu),
].map((match) => match[1]);
assert.equal(registeredSceneIds.length, 7);
assert.equal(
  new Set(registeredSceneIds).size,
  registeredSceneIds.length,
  "Every registry id must be unique.",
);
const registeredSceneKeyNames = [
  ...sceneRegistry.matchAll(/^\s+sceneKey: SCENE_KEYS\.(\w+),$/gmu),
].map((match) => match[1]);
assert.equal(registeredSceneKeyNames.length, 7);
assert.equal(
  new Set(registeredSceneKeyNames).size,
  registeredSceneKeyNames.length,
  "Every registry entry must use a unique declared scene key.",
);
assert.match(introScene, /super\(SCENE_KEYS\.intro\)/);
assert.match(worldScene, /super\(SCENE_KEYS\.world\)/);
assert.match(ethicsScene, /super\(SCENE_KEYS\.ethicsReview\)/);
assert.equal(
  sceneRegistry.match(/new EthicsReviewScene\(renderScale\)/g)?.length,
  1,
  "EthicsReviewScene must be registered exactly once.",
);
assert.match(
  villageMap,
  /label: "윤리 심사소",[\s\S]*?availability: \{ kind: "always" \},[\s\S]*?featureId: "ethics-review"/,
  "The approved village portal must lead to Ethics Review.",
);
assert.match(
  villageMap,
  /id: "fountain",[\s\S]*?center: \{ x: 636, y: 372 \},[\s\S]*?radiusX: 166,[\s\S]*?radiusY: 122,[\s\S]*?boundary: "inclusive",[\s\S]*?maskBypassPadding: \{ x: 18, y: 14 \}/,
  "The fountain collision must cover its full visible base.",
);
for (const guideId of [
  "northwest-garden",
  "northeast-garden",
  "southwest-garden",
  "ethics-office-footprint",
]) {
  assert.match(
    villageMap,
    new RegExp(`id: "${guideId}"`),
    `The curved movement guide ${guideId} must remain registered.`,
  );
}
assert.match(
  villageMap,
  /id: "ethics-office-building",[\s\S]*?\{ x: 149, y: 500 \}/,
  "The Ethics Review collision must begin at its physical base, not its roof.",
);
for (const sceneryKey of [
  "village-ai-shop",
  "village-airport",
  "village-ethics-office",
  "village-ai-world-gate",
  "village-fountain",
]) {
  assert.match(villageMap, new RegExp(`assetKey: "${sceneryKey}"`));
}
assert.match(worldScene, /createVillageScenery\(this, WORLD_MAP\)/);
assert.match(worldScene, /getVillagePlayerDepth\(this\.player\.y\)/);
assert.match(villageScenery, /isPointWithinSceneryOcclusionArea/);
assert.match(villageScenery, /updateVillageSceneryDepths/);
assert.match(worldScene, /updateVillageSceneryDepths\(this\.sceneryLayers/);
assert.match(worldScene, /clampVillageFrameDelta\(delta\)/);
assert.match(worldScene, /resolveVillageMovement\(/);
assert.match(worldScene, /WORLD_CURVED_MOVEMENT_GUIDES/);
assert.match(worldScene, /projectToBoundary: false/);
assert.match(worldScene, /lastSafePosition/);
assert.match(worldScene, /createWorldTouchDirection\(this/);
assert.match(
  worldScene,
  /방향키 또는 화면을 터치하여 움직여 보세요!/,
  "World onboarding must explain keyboard and touch movement without arrow clutter.",
);
assert.match(floatingJoystick, /pointerdown/);
assert.match(floatingJoystick, /pointermove/);
assert.match(floatingJoystick, /pointerupoutside/);
assert.match(floatingJoystick, /Scenes\.Events\.SHUTDOWN/);
assert.match(floatingJoystick, /setVisible\(false\)/);
assert.match(
  pointerCoordinates,
  /getWorldPoint\(pointer\.x, pointer\.y, output\)/,
  "Pointer input must be translated through the active camera before gameplay uses it.",
);
assert.match(floatingJoystick, /getPointerWorldPoint\(scene, pointer/);
assert.match(worldTouchDirection, /pointerdown/);
assert.match(worldTouchDirection, /pointermove/);
assert.match(worldTouchDirection, /pointerupoutside/);
assert.match(worldTouchDirection, /Scenes\.Events\.SHUTDOWN/);
assert.match(worldTouchDirection, /getPointerWorldPoint\(scene, pointer/);
assert.match(worldTouchDirection, /hasTarget/);
assert.match(worldTouchDirection, /cancel/);
assert.match(worldTouchDirection, /nonImprovingFrames >= 14/);
assert.match(worldScene, /shop: "AI 제작소 입장하기"/);
assert.match(worldScene, /library: "데이터 비행장 입장하기"/);
assert.match(worldScene, /workshop: "윤리 심사소 입장하기"/);
assert.match(worldScene, /"village-entry-button"/);
assert.doesNotMatch(worldScene, /enterButton\?\.setVisible/);
assert.doesNotMatch(worldScene, /label: "톡!"/);
assert.doesNotMatch(worldScene, /fillRect\(0, 0, WORLD_MAP\.size\.width, 52\)/);
assert.match(villageMovement, /maxStepDistance: 4/);
assert.match(villageMovement, /defaultSpeedMultiplier: 1\.5/);
assert.match(villageMovement, /playerSpeed: 230 \* 1\.5/);
assert.match(villageMovement, /recoverVillagePosition/);
assert.match(villageMovement, /trySlideAlongCurvedObstacle/);
assert.match(villageMovement, /perfectly head-on input/);
assert.match(villageMap, /precomputedMask: \{/);
assert.match(villageMap, /\.\.\.VILLAGE_COLLISION_MASK/);
assert.match(villageCollisionMask, /encoding: "base64-bitset"/);
assert.match(villageCollisionMask, /cellSize: 4/);
assert.doesNotMatch(villageCollision, /Phaser|TextureManager|getPixel|getFrame/);
assert.doesNotMatch(worldScene, /WORLD_COLLISION\.isBlocked\(this\.textures/);
assert.match(
  villageMap,
  /id: "workshop",[\s\S]*?featureId: "ethics-review",[\s\S]*?interactionRadius: 205/,
  "The Ethics Review entrance must be reachable outside the building collision edge.",
);
assert.doesNotMatch(
  ethicsScene,
  /setInterval|GAME_DURATION|WRONG_PENALTY/,
  "Ethics Review must not bring back the React timer loop or time penalty.",
);
assert.match(
  ethicsScene,
  /create\(\) \{\s*this\.resetSceneState\(\);/,
  "Ethics Review must reset all state whenever its scene is re-entered.",
);
assert.match(ethicsScene, /private chooseVerdict\(verdict: EthicsVerdict\)/);
assert.match(
  ethicsScene,
  /evaluateReviewDecision\(this\.currentCase, verdict\)/,
  "Ethics Review must resolve each case with one verdict choice.",
);
assert.doesNotMatch(ethicsScene, /selectEvidence|pickUpDocument|handleAction/);
assert.doesNotMatch(ethicsScene, /"carrying"/);
assert.match(ethicsControls, /keydown-LEFT/);
assert.match(ethicsControls, /keydown-RIGHT/);
assert.match(ethicsControls, /keydown-SPACE/);
assert.match(ethicsControls, /keydown-ENTER/);
assert.match(ethicsControls, /Scenes\.Events\.SHUTDOWN/);
assert.match(ethicsView, /← 방향키/);
assert.match(ethicsView, /→ 방향키/);
assert.doesNotMatch(ethicsControls, /keydown-A/);
assert.doesNotMatch(ethicsControls, /keydown-D/);
assert.match(ethicsView, /사건 파일/);
assert.match(ethicsEffects, /playEthicsStationEffect/);
assert.match(ethicsEffects, /playEthicsCaseScan/);
assert.match(ethicsEffects, /playEthicsVerdictStamp/);
assert.match(
  ethicsPlayer,
  /scene\.add\s*\.container\(640, 584/,
);
const ethicsSceneLineCount = ethicsScene.split(/\r?\n/).length;
assert.ok(
  ethicsSceneLineCount <= 500,
  `EthicsReviewScene exceeds its 500-line target (${ethicsSceneLineCount}).`,
);
console.log("Ethics Review structure checks passed.");
assert.match(airportScene, /super\(SCENE_KEYS\.airport\)/);
for (const textureKey of [
  "airport-bad-data-doc",
  "airport-bad-data-image",
  "airport-bad-data-sound",
  "airport-bad-data-video",
  "airport-public-data-science-technology",
  "airport-public-data-education",
  "airport-public-data-transport",
  "airport-public-data-law",
  "airport-public-data-industry",
  "airport-public-data-medical",
  "airport-public-data-safety",
  "airport-public-data-environment",
  "airport-corrupted-data-cloud-top",
  "airport-corrupted-data-vortex-bottom",
]) {
  assert.match(
    airportTextures,
    new RegExp(`"${textureKey}"`),
    `${textureKey} must be released when AirportScene shuts down.`,
  );
}
assert.match(airportScene, /preloadAirportAssets\(this\)/);
assert.match(airportScene, /releaseAirportTextures\(this\)/);

const airportLineCount = airportScene.split(/\r?\n/).length;
assert.ok(
  airportLineCount <= 700,
  `AirportScene exceeds its 700-line split threshold (${airportLineCount}).`,
);
assert.match(airportControls, /keydown-ESC/);
assert.match(airportControls, /keydown-SPACE/);
assert.match(airportControls, /keydown-ENTER/);
assert.match(airportControls, /pointerupoutside/);
assert.match(
  airportControls,
  /if \(isFinished\(\) \|\| pointer\.active\) return;/,
  "A second touch must not replace the active Airport pointer owner.",
);
assert.match(airportControls, /tryClaimPointer\(pointer, inputPointer\.id\)/);
assert.match(
  airportControls,
  /releaseClaimedPointer\(pointer, inputPointer\.id\)/,
);
assert.match(
  airportControls,
  /getPointerWorldPoint\([\s\S]*?inputPointer/,
  "Airport touch targets must use logical world coordinates at every render scale.",
);
assert.doesNotMatch(
  airportControls,
  /Phaser\.Math\.Clamp\(\s*inputPointer\.(?:x|y)/,
  "Airport movement must not compare render-buffer pointer coordinates with logical bounds.",
);
assert.match(
  airportPlayer,
  /DATA_FLIGHT_CONFIG\.playerSpeed \* \(deltaMs \/ 1000\)/,
);
assert.match(airportPlayer, /DATA_FLIGHT_CONFIG\.playerBounds\.minX/);
assert.match(airportPlayer, /DATA_FLIGHT_CONFIG\.playerBounds\.maxY/);
assert.doesNotMatch(airportView, /\.ellipse\(18, 39, 92, 22/);
assert.match(airportView, /const playerShadowBack = scene\.add/);
assert.match(airportView, /const playerShadowNear = scene\.add/);
assert.match(airportView, /\.image\(5, 2, "airport-midi"\)/);
assert.match(airportView, /setTintMode\(Phaser\.TintModes\.FILL\)/);

assert.match(airportScene, /getDifficultyTier\(this\.difficultyScore\)/);
assert.match(
  airportScene,
  /getObstacleSpawnIntervalBounds\(\s*this\.difficultyScore,\s*\)/,
);
assert.match(airportScene, /this\.score \+= points/);
assert.match(airportScene, /this\.difficultyScore \+= difficultyPoints/);
assert.match(airportScene, /getCollectedDifficultyPoints\(\)/);
assert.match(airportScene, /this\.spawnFeverFormation\(\)/);
assert.match(airportScene, /DATA_FLIGHT_CONFIG\.feverFormationIntervalMs/);
assert.match(airportFeverFormation, /createTwoRowFormation/);
assert.match(airportFeverFormation, /createXFormation/);
assert.match(airportFeverFormation, /createHeartFormation/);
assert.match(airportFeverFormation, /createWaveFormation/);
assert.match(airportFeverFormation, /createDiamondFormation/);
assert.match(airportFeverFormation, /ITEMS_PER_GROUP = 5/);
assert.match(airportFeverFormation, /slice\(0, 4\)/);
assert.match(airportScene, /this\.score >= DATA_FLIGHT_CONFIG\.firstQuestionScore/);
assert.match(airportScene, /DATA_FLIGHT_CONFIG\.feverMagnetVerticalRadius/);
assert.match(airportObjects, /BAD_DATA_QUALIFIERS/);
assert.match(airportObjects, /airport-bad-data-\$\{dataKind\}/);
assert.match(airportObjects, /const dangerColor = 0xff0000/);
assert.match(airportObjects, /필요하지 않은/);
assert.match(airportObjects, /출처가 없는/);
assert.match(airportObjects, /airport-public-data-\$\{publicMeta\.kind\}/);
assert.match(airportObjects, /과학기술 공공데이터/);
assert.match(airportObjects, /환경 공공데이터/);
assert.match(airportObjects, /airport-corrupted-data-cloud-top/);
assert.match(airportObjects, /airport-corrupted-data-vortex-bottom/);
assert.match(airportObjects, /collisionRadiusY: 112/);
assert.match(airportObjects, /horizontalBobSpeed: bobSpeed \* 0\.55/);
assert.match(airportScene, /updateAirportObstacleMotion\(object, this\.elapsedMs\)/);
assert.match(airportObjectMotion, /nextHorizontalOffset - \(object\.horizontalBobOffset \?\? 0\)/);

const randomSource = `${airportScene}\n${airportObjects}\n${airportEffects}`;
const count = (pattern) => randomSource.match(pattern)?.length ?? 0;
assert.equal(count(/Phaser\.Utils\.Array\.Shuffle\(/g), 2);
assert.equal(count(/Phaser\.Utils\.Array\.GetRandom\(/g), 6);
assert.equal(count(/Phaser\.Math\.FloatBetween\(/g), 5);
assert.equal(count(/Phaser\.Math\.Between\(/g), 18);

const orderedSceneMarkers = [
  "Phaser.Utils.Array.Shuffle([...FLIGHT_QUESTIONS])",
  "Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS)",
  "Phaser.Math.Between(135, 615)",
  "Phaser.Math.FloatBetween(0, 1)",
  "Phaser.Utils.Array.Shuffle([...FLIGHT_DATA_KINDS])",
  "Phaser.Math.Between(\n            intervalBounds.min",
];

let previousIndex = -1;
for (const marker of orderedSceneMarkers) {
  const markerIndex = airportScene.indexOf(marker);
  assert.ok(markerIndex > previousIndex, `RNG marker moved or disappeared: ${marker}`);
  previousIndex = markerIndex;
}

const orderedObjectMarkers = [
  "Phaser.Utils.Array.GetRandom(PUBLIC_DATA_META)",
  "Phaser.Math.FloatBetween(-10, 10)",
  "const dataKind = Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS)",
  "const qualifier = Phaser.Utils.Array.GetRandom([...BAD_DATA_QUALIFIERS])",
  "Phaser.Math.Between(220, 520)",
  "Phaser.Math.Between(\n    DATA_FLIGHT_CONFIG.obstacleAmplitude.min",
  "Phaser.Math.FloatBetween(\n    DATA_FLIGHT_CONFIG.obstacleBobSpeed.min",
  "Phaser.Math.FloatBetween(0, Math.PI * 2)",
  "Phaser.Math.FloatBetween(0, 1)",
  'Phaser.Utils.Array.GetRandom(["top", "bottom"] as const)',
];
previousIndex = -1;
for (const marker of orderedObjectMarkers) {
  const markerIndex = airportObjects.indexOf(marker);
  assert.ok(
    markerIndex > previousIndex,
    `Airport object RNG marker moved or disappeared: ${marker}`,
  );
  previousIndex = markerIndex;
}

console.log("Data Flight structure checks passed.");

assert.doesNotMatch(
  composition,
  /class AiWorkshopScene/,
  "AiWorkshopScene must stay in its feature-owned module.",
);
assert.match(
  sceneRegistry,
  /import \{ AiWorkshopScene \} from "\.\/features\/ai-workshop\/scene";/,
);
assert.equal(
  sceneRegistry.match(/new AiWorkshopScene\(renderScale\)/g)?.length,
  1,
  "AiWorkshopScene must be registered exactly once.",
);
assert.match(workshopScene, /super\(SCENE_KEYS\.aiWorkshop\)/);
assert.match(workshopScene, /showWorkshopItemPanel\(this, this\.itemPanel/);
assert.match(workshopView, /customerShadow/);
assert.match(workshopView, /workshop-dialogue-bubble/);
assert.match(workshopView, /\.image\(/);
assert.doesNotMatch(workshopView, /\.nineslice\(/);
assert.doesNotMatch(workshopView, /setTintMode\(Phaser\.TintModes\.FILL\)/);
assert.match(
  workshopCustomerVisual,
  /WORKSHOP_CUSTOMER_TARGET_VISIBLE_HEIGHT = 523/,
);
assert.match(
  workshopCustomerVisual,
  /WORKSHOP_CUSTOMER_TARGET_OPAQUE_AREA = 70_000/,
);
assert.match(
  workshopCustomerVisual,
  /Math\.sqrt\(\s*heightScale \* Math\.max\(heightScale, perceivedAreaScale\)/,
);
assert.match(workshopCustomerVisual, /CUSTOMER_SOURCE_FOOT_Y = 642/);
assert.match(workshopCustomerVisual, /applyWorkshopCustomerVisualTransform/);
assert.match(workshopCustomerVisual, /applyWorkshopCustomerRequestVisual/);
assert.match(workshopScene, /applyWorkshopCustomerRequestVisual/);
assert.match(
  workshopRandomFiles[3],
  /applyWorkshopCustomerVisualTransform/,
);
assert.match(workshopView, /workshop-customer-nameplate/);
assert.match(workshopView, /syncWorkshopDialoguePanel/);
assert.match(workshopView, /DIALOGUE_BUBBLE\.top/);
assert.match(workshopView, /DIALOGUE_BUBBLE\.middle/);
assert.match(workshopView, /DIALOGUE_BUBBLE\.bottomSlice/);
assert.match(workshopView, /middleCount = lineCount - 2/);
assert.match(workshopView, /minWidth: 292/);
assert.match(workshopView, /width: 360/);
assert.match(workshopView, /verticalScale: 380 \/ 420/);
assert.match(workshopView, /dialogue-bottom-tail/);
assert.match(workshopView, /longestLineWidth/);
assert.match(workshopView, /layoutDialogueBottomSlice/);
assert.match(workshopView, /left: 22/);
assert.match(workshopView, /right: 22/);
assert.match(workshopView, /top: 20/);
assert.match(workshopView, /bottom: 20/);
assert.match(workshopView, /intrinsicTextTop: 12/);
assert.match(workshopView, /plateY: 160/);
assert.match(workshopView, /textY: 164/);
assert.match(workshopDialogue, /balanceWorkshopDialogueLines/);
assert.match(workshopDialogue, /maxWidth \*\* 2 \* 4/);
assert.match(workshopDialogue, /dialogue-layout-text/);
assert.match(
  workshopCustomerVisual,
  /syncWorkshopNormalizedCustomerShadow\(/,
);
assert.match(workshopScene, /returnWorkshopProductToPanel/);
assert.match(workshopScene, /carriedOrigins/);
assert.doesNotMatch(workshopScene, /order\.requests\[0\]\.readyDialogue/);
assert.doesNotMatch(workshopScene, /맞아요, 바로 그거예요/);
assert.match(
  workshopScene,
  /this\.spawnProductChoices\(\);\s*this\.typeDialogue\(firstRequest\.dialogue\)/,
);
assert.match(
  workshopScene,
  /customerContainer\?\.setVisible\(false\);\s*syncWorkshopDialoguePanel\(this\.dialoguePanel, this\.dialogueText\?\.setText\(""\)\)/,
);
assert.doesNotMatch(workshopScene, /기계에서 반짝이는 빛이 나요/);
assert.doesNotMatch(workshopScene, /workshop-hanger/);
assert.match(workshopRandomFiles[0], /workshop-item-panel-4/);
assert.match(workshopRandomFiles[0], /workshop-item-panel-5/);
assert.match(workshopRandomFiles[0], /customerNumber >= 4 \? 5 : 4/);
assert.match(workshopRandomFiles[0], /availableLabelWidth/);
assert.doesNotMatch(workshopRandomFiles[0], /maxLines: 2/);
assert.match(workshopRandomFiles[0], /createWorkshopCarriedIcon/);
assert.doesNotMatch(workshopRandomFiles[0], /workshop-carried-product-card/);
assert.doesNotMatch(workshopRandomFiles[0], /repeat: -1/);
assert.match(workshopRandomFiles[2], /"상품 제작 중"/);
assert.match(workshopRandomFiles[2], /workshop-crafting-panel/);
assert.match(workshopRandomFiles[2], /WORKSHOP_STAR_CATCH_TUNING/);
assert.match(workshopRandomFiles[2], /성공 횟수 0/);
assert.doesNotMatch(workshopRandomFiles[2], /STAR CATCH/);
assert.doesNotMatch(workshopControls, /createFloatingJoystick/);
assert.match(workshopControls, /scene\.input\.on\("pointerdown"/);
assert.match(workshopControls, /scene\.input\.on\("pointermove"/);
assert.match(workshopControls, /scene\.input\.on\("pointerupoutside"/);
assert.match(workshopControls, /Scenes\.Events\.SHUTDOWN/);
assert.match(workshopControls, /stopPropagation: true/);
assert.match(workshopControls, /getPointerWorldPoint\(scene, pointer/);
assert.match(workshopControls, /updateTouchDirection/);
assert.doesNotMatch(workshopControls, /pointer\.x > 1_090/);
assert.match(workshopLayout, /playerBounds: \{ left: 300, right: 1180/);
assert.match(
  workshopLayout,
  /\{ x: 400, radiusX: 34, bumpY: 20 \}/,
  "Workshop planter collision must remain a compact smooth ceiling bump.",
);
assert.match(
  workshopPlayer,
  /return projectWorkshopPointToWalkableArea\(desiredX, desiredY, out\)/,
  "Workshop slope movement must project onto the curved floor boundary.",
);
assert.doesNotMatch(
  workshopPlayer,
  /const canMove[XY]/,
  "Workshop slope movement must not reintroduce zero-distance axis stalls.",
);
assert.match(workshopStatus, /actionButton\?\.setVisible\(false\)/);
assert.match(workshopStatus, /findNearestWorkshopProductOrigin/);
assert.match(workshopStatus, /"돌려놓기"/);
assert.match(
  workshopStatus,
  /container\.x,\s*container\.y,\s*\) < 240/s,
  "Workshop product pickup must preserve the reachable 240px center-distance rule.",
);
const workshopLineCount = workshopScene.split(/\r?\n/).length;
assert.ok(
  workshopLineCount <= 800,
  `AiWorkshopScene exceeds its 800-line split threshold (${workshopLineCount}).`,
);

const workshopRandomSource = [workshopScene, ...workshopRandomFiles].join("\n");
const countWorkshop = (pattern) =>
  workshopRandomSource.match(pattern)?.length ?? 0;
assert.equal(countWorkshop(/Phaser\.Utils\.Array\.Shuffle\(/g), 5);
assert.equal(countWorkshop(/Phaser\.Utils\.Array\.GetRandom\(/g), 1);
assert.equal(countWorkshop(/Phaser\.Math\.FloatBetween\(/g), 1);
assert.equal(countWorkshop(/Phaser\.Math\.Between\(/g), 11);

const orderedWorkshopSceneMarkers = [
  "Phaser.Utils.Array.Shuffle([\n      ...WORKSHOP_REQUESTS",
  "Phaser.Utils.Array.Shuffle([\n      ...this.sessionRequests",
  "Phaser.Utils.Array.Shuffle([\n        ...this.sessionRequests",
  "Phaser.Utils.Array.GetRandom(firstRequest.wrongReplies)",
];
previousIndex = -1;
for (const marker of orderedWorkshopSceneMarkers) {
  const markerIndex = workshopScene.indexOf(marker);
  assert.ok(markerIndex > previousIndex, `RNG marker moved or disappeared: ${marker}`);
  previousIndex = markerIndex;
}

console.log("AI Workshop structure checks passed.");

assert.doesNotMatch(
  composition,
  /class CoreKitchenScene/,
  "CoreKitchenScene must stay in its feature-owned module.",
);
assert.doesNotMatch(
  `${composition}\n${sceneRegistry}`,
  /CoreKitchenScene/,
  "Dormant CoreKitchenScene must not be imported or registered implicitly.",
);
assert.match(
  coreKitchenScene,
  /super\(SCENE_KEYS\.coreKitchen\)/,
  "Core Kitchen must use its unique dormant scene key.",
);
assert.match(sceneRegistry, /id: "core-kitchen",[\s\S]*?status: "dormant"/);
const coreKitchenLineCount = coreKitchenScene.split(/\r?\n/).length;
assert.ok(
  coreKitchenLineCount <= 800,
  `CoreKitchenScene exceeds its 800-line split threshold (${coreKitchenLineCount}).`,
);

const coreKitchenRandomSource = `${coreKitchenScene}\n${coreKitchenEffects}`;
const countCoreKitchen = (pattern) =>
  coreKitchenRandomSource.match(pattern)?.length ?? 0;
assert.equal(countCoreKitchen(/Phaser\.Utils\.Array\.Shuffle\(/g), 3);
assert.equal(countCoreKitchen(/Phaser\.Utils\.Array\.GetRandom\(/g), 0);
assert.equal(countCoreKitchen(/Phaser\.Math\.FloatBetween\(/g), 0);
assert.equal(countCoreKitchen(/Phaser\.Math\.Between\(/g), 9);

const orderedCoreKitchenSceneMarkers = [
  "Phaser.Utils.Array.Shuffle([...KITCHEN_ORDERS])",
  "Phaser.Utils.Array.Shuffle(\n        AI_CORES.filter(",
  "Phaser.Utils.Array.Shuffle([correct, ...distractors])",
];
previousIndex = -1;
for (const marker of orderedCoreKitchenSceneMarkers) {
  const markerIndex = coreKitchenScene.indexOf(marker);
  assert.ok(
    markerIndex > previousIndex,
    `Core Kitchen RNG marker moved or disappeared: ${marker}`,
  );
  previousIndex = markerIndex;
}

console.log("Core Kitchen structure checks passed.");

assert.doesNotMatch(
  composition,
  /class ShopScene|generateAiToolTextures/,
  "AI Service Shop must stay in its feature-owned modules.",
);
assert.doesNotMatch(
  `${composition}\n${sceneRegistry}`,
  /ShopScene/,
  "Dormant ShopScene must not be imported or registered implicitly.",
);
const registeredSceneMarkers = [
  "new IntroScene(onReady, renderScale)",
  "new WorldScene(renderScale)",
  "new AiWorkshopScene(renderScale)",
  "new AirportScene(renderScale)",
  "new EthicsReviewScene(renderScale)",
];
previousIndex = -1;
for (const marker of registeredSceneMarkers) {
  const markerIndex = sceneRegistry.indexOf(marker);
  assert.ok(
    markerIndex > previousIndex,
    `Registered scene order changed or disappeared: ${marker}`,
  );
  previousIndex = markerIndex;
}
assert.match(
  serviceShopScene,
  /super\(SCENE_KEYS\.aiServiceShop\)/,
  "AI Service Shop must use its unique dormant scene key.",
);
assert.match(sceneRegistry, /id: "ai-service-shop",[\s\S]*?status: "dormant"/);
const serviceShopLineCount = serviceShopScene.split(/\r?\n/).length;
assert.ok(
  serviceShopLineCount <= 800,
  `ShopScene exceeds its 800-line split threshold (${serviceShopLineCount}).`,
);

const serviceShopRandomSource = `${serviceShopScene}\n${serviceShopEffects}`;
const countServiceShop = (pattern) =>
  serviceShopRandomSource.match(pattern)?.length ?? 0;
assert.equal(countServiceShop(/Phaser\.Utils\.Array\.Shuffle\(/g), 3);
assert.equal(countServiceShop(/Phaser\.Utils\.Array\.GetRandom\(/g), 0);
assert.equal(countServiceShop(/Phaser\.Math\.FloatBetween\(/g), 0);
assert.equal(countServiceShop(/Phaser\.Math\.Between\(/g), 9);
assert.match(serviceShopToolTextures, /scene\.textures\.exists\(textureKey\)/);
assert.match(serviceShopToolTextures, /g\.generateTexture\(textureKey, 128, 128\)/);
assert.match(serviceShopToolTextures, /g\.destroy\(\)/);
assert.doesNotMatch(
  `${serviceShopScene}\n${coreKitchenScene}`,
  /textures\.remove\("ai-shop-interior"\)/,
  "Dormant shop scenes must preserve their shared texture lifetime contract.",
);

const orderedServiceShopSceneMarkers = [
  "Phaser.Utils.Array.Shuffle([\n      ...AI_SERVICE_QUESTIONS",
  "Phaser.Utils.Array.Shuffle(\n      question.choiceIds",
  "Phaser.Utils.Array.Shuffle([answer, ...distractors])",
];
previousIndex = -1;
for (const marker of orderedServiceShopSceneMarkers) {
  const markerIndex = serviceShopScene.indexOf(marker);
  assert.ok(
    markerIndex > previousIndex,
    `AI Service Shop RNG marker moved or disappeared: ${marker}`,
  );
  previousIndex = markerIndex;
}

console.log("AI Service Shop structure checks passed.");
