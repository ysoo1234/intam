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
const villageProgressPresentation = await readFile(
  "src/game/features/world/scene/villageProgressPresentation.ts",
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
const gameResultOverlay = await readFile(
  "src/game/core/visual/gameResultOverlay.ts",
  "utf8",
);
const villageMap = await readFile(
  "src/game/features/world/model/villageMap.ts",
  "utf8",
);
const villageLayoutGrid = await readFile(
  "src/game/features/world/model/villageLayoutGrid.ts",
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
const gameAssets = await readFile("src/game/assets.ts", "utf8");
const ethicsVisitor = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewVisitor.ts",
  "utf8",
);
const ethicsView = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewView.ts",
  "utf8",
);
const ethicsOffice = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewOffice.ts",
  "utf8",
);
const ethicsEffects = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewEffects.ts",
  "utf8",
);
const ethicsOverlays = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewOverlays.ts",
  "utf8",
);
const airportScene = await readFile(
  "src/game/features/data-flight/scene/AirportScene.ts",
  "utf8",
);
const airportResult = await readFile(
  "src/game/features/data-flight/scene/airportResult.ts",
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
const workshopResult = await readFile(
  "src/game/features/ai-workshop/scene/workshopResult.ts",
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
  /id: "fountain",[\s\S]*?center: offsetVillagePoint\("fountain", \{ x: 636, y: 372 \}\),[\s\S]*?offsetVillageSize\("fountain", \{[\s\S]*?width: 166, height: 122,[\s\S]*?boundary: "inclusive"/,
  "The fountain collision must follow its editable grid placement.",
);
assert.match(villageMap, /id: "ethics-office-footprint"/);
assert.doesNotMatch(villageMap, /northwest-garden|northeast-garden|southwest-garden/);
assert.doesNotMatch(villageMap, /maskWalkableOverrides/);
assert.match(
  villageMap,
  /id: "ethics-office-building",[\s\S]*?offsetVillagePoints\("ethics-office", \[[\s\S]*?\{ x: 149, y: 455 \}/,
  "The Ethics Review collision must block the wall below its roof overlap.",
);
assert.match(villageLayoutGrid, /VILLAGE_LAYOUT_GRID_MAX = 1_000/);
assert.match(villageLayoutGrid, /VILLAGE_STAR_GRID/);
assert.match(villageMap, /position: getVillageStarPosition\("ai-shop"\)/);
assert.match(villageMap, /position: getVillageStarPosition\("airport"\)/);
assert.match(villageMap, /position: getVillageStarPosition\("ethics-office"\)/);
for (const buildingId of [
  "ai-shop",
  "airport",
  "ethics-office",
  "ai-world-gate",
  "fountain",
]) {
  assert.match(
    villageLayoutGrid,
    new RegExp(`${JSON.stringify(buildingId)}: \\{ x: -?\\d+, y: -?\\d+, width: \\d+, height: \\d+ \\}`),
    `The ${buildingId} placement must stay editable as a 1000-grid rectangle.`,
  );
}
assert.match(villageMap, /position: getVillageBuildingPosition\("ai-shop"\)/);
assert.match(villageMap, /displaySize: getVillageBuildingSize\("airport"\)/);
assert.match(villageMap, /occlusionArea: offsetVillageBounds\("ethics-office"/);
assert.match(
  villageMap,
  /occlusionArea: offsetVillageBounds\("ethics-office", \{[\s\S]*?minX: 105, maxX: 510, minY: 350, maxY: 590/,
  "The Ethics Review office must occlude the player through its visible base.",
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
assert.match(villageScenery, /AI_WORLD_PORTAL_TEXTURE/);
assert.match(villageScenery, /createAiWorldPortal/);
assert.match(villageScenery, /depthBackdrops/);
assert.match(villageScenery, /GAME_ASSETS\.world\.aiWorldPortalNight/);
assert.doesNotMatch(villageScenery, /AI_WORLD_PORTAL_ANIMATION/);
assert.doesNotMatch(villageScenery, /AI_WORLD_PORTAL_FRAME_COUNT/);
assert.match(villageScenery, /point\(76, 192\)/);
assert.match(villageScenery, /\[188, 207\]/);
assert.match(villageScenery, /duration: 42_000/);
assert.match(villageScenery, /stars\.fillStyle\(0xffffff/);
assert.match(villageScenery, /renderer\.type === Phaser\.CANVAS/);
assert.match(villageScenery, /openingMask\.createGeometryMask\(\)/);
assert.match(villageScenery, /target\.setMask/);
assert.match(villageScenery, /filters\?\.external\.addMask/);
assert.match(
  villageProgressPresentation,
  /exitLayer\.image\.clearTint\(\)\.setAlpha\(1\)/,
  "The locked world gate must remain opaque.",
);
assert.match(worldScene, /updateVillageSceneryDepths\(this\.sceneryLayers/);
assert.match(worldScene, /clampVillageFrameDelta\(delta\)/);
assert.match(worldScene, /resolveVillageMovement\(/);
assert.match(worldScene, /WORLD_CURVED_MOVEMENT_GUIDES/);
assert.match(worldScene, /projectToBoundary: false/);
assert.match(worldScene, /lastSafePosition/);
assert.match(worldScene, /createWorldTouchDirection\(this/);
const villageTutorial = await readFile(
  "src/game/features/world/scene/villageTutorial.ts",
  "utf8",
);
assert.match(
  villageTutorial,
  /방향키 또는 화면을 터치해서 미디를 움직여 보세요!/,
  "World onboarding must explain keyboard and touch movement without arrow clutter.",
);
assert.match(villageTutorial, /건물 앞으로 가면 입장 버튼이 나와요/, "The second tip must point to the buildings.");
assert.match(worldScene, /createVillageTutorial\(this,/, "World must mount the village tutorial.");
assert.match(worldScene, /loadStoredWorldProgress\(\)/, "Stars must be restored from browser storage.");
assert.match(worldScene, /saveStoredWorldProgress\(this\.progress\)/, "Stars must be saved to browser storage.");
assert.match(introScene, /AI 월드 마법판/, "The intro mirrors textbook page 1.");
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
  /id: "shop",[\s\S]*?position: offsetVillagePoint\("ai-shop", \{ x: 318, y: 236 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 205, height: 115/,
  "The AI shop must activate throughout its marked approach ellipse.",
);
assert.match(
  villageMap,
  /id: "workshop",[\s\S]*?position: offsetVillagePoint\("ethics-office", \{ x: 318, y: 665 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 183, height: 130/,
  "The Ethics Review office must activate only on its front paved approach.",
);
assert.match(villageScenery, /const AI_WORLD_PORTAL_OFFSET_X_PX = -?\d+/);
assert.match(villageScenery, /const AI_WORLD_PORTAL_OFFSET_Y_PX = -?\d+/);
assert.match(
  villageScenery,
  /const portalCenterY = y \+ AI_WORLD_PORTAL_OFFSET_Y_PX/,
  "The AI-world portal center must expose a direct game-pixel Y offset.",
);
assert.match(
  villageMap,
  /id: "library",[\s\S]*?position: offsetVillagePoint\("airport", \{ x: 950, y: 227 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 208, height: 110/,
  "The data airport must activate throughout its marked approach ellipse.",
);
assert.doesNotMatch(
  ethicsScene,
  /setInterval|GAME_DURATION|WRONG_PENALTY/,
  "Ethics Review must not bring back the React timer loop or time penalty.",
);
for (const activeScene of [workshopScene, airportScene, ethicsScene]) {
  assert.match(
    activeScene,
    /preloadGameResultOverlayAssets\(this\)/,
    "Every active village activity must preload the shared result artwork.",
  );
}
for (const resultView of [workshopResult, airportResult, ethicsOverlays]) {
  assert.match(
    resultView,
    /createGameResultOverlay\(scene,/,
    "Every active village activity must use the shared result layout.",
  );
}
assert.match(gameResultOverlay, /GAME_ASSETS\.ui\.gameResultPanel/);
assert.match(gameResultOverlay, /GAME_ASSETS\.ui\.gameResultRetryButton/);
assert.match(gameResultOverlay, /GAME_ASSETS\.ui\.gameResultReturnButton/);
assert.match(gameResultOverlay, /"마을로 돌아가기"/);
assert.doesNotMatch(gameResultOverlay, /"🏆"/);
assert.match(gameResultOverlay, /titleY: -169/);
assert.match(gameResultOverlay, /starsY: -97/);
assert.match(gameResultOverlay, /summaryY: -22/);
assert.match(gameResultOverlay, /retryButtonY: 72/);
assert.match(gameResultOverlay, /returnButtonY: 152/);
assert.match(gameResultOverlay, /\.text\(0, 3, label,/);
assert.match(gameResultOverlay, /summary: "#2a6570"/);
assert.match(gameResultOverlay, /button: "#102d37"/);
assert.match(gameResultOverlay, /RESULT_FONT_FAMILY =[\s\S]*?"Malgun Gothic"/);
assert.match(gameResultOverlay, /\.setResolution\(4\)/);
assert.match(gameResultOverlay, /fontSize: "23px"/);
assert.match(workshopControls, /\.setDepth\(90\)/);
assert.match(
  ethicsScene,
  /create\(\) \{\s*this\.resetSceneState\(\);/,
  "Ethics Review must reset all state whenever its scene is re-entered.",
);
assert.match(ethicsControls, /keydown-LEFT/);
assert.match(ethicsControls, /keydown-RIGHT/);
assert.match(ethicsControls, /if \(pending \|\| !canMove\(\)/);
assert.match(ethicsControls, /Scenes\.Events\.SHUTDOWN/);
assert.match(ethicsOverlays, /createGameResultOverlay/);
assert.match(ethicsOffice, /GAME_ASSETS\.ethicsReview/);
assert.match(ethicsOffice, /source\.booth/, "The office must load the inspection booth artwork.");
assert.match(ethicsOffice, /source\.visitors/, "Visitors come from the shared assets manifest.");
assert.match(gameAssets, /customers\/v3-game\/\$\{id\}-worried\.webp/, "Ethics visitors reuse the workshop customer cast.");
assert.match(ethicsOffice, /createEthicsRulebook/);
assert.match(ethicsVisitor, /external\.addMask\(/, "Visitors must be clipped to the window opening (WebGL mask filter).");
assert.match(ethicsVisitor, /createGeometryMask/, "Canvas fallback keeps the geometry mask.");
assert.match(ethicsVisitor, /Scenes\.Events\.SHUTDOWN/);
assert.match(ethicsView, /playEthicsFormArrival/);
assert.match(ethicsView, /playEthicsFormDeparture/);
assert.match(ethicsPlayer, /greet:/, "Midi must glance toward each arriving visitor.");
assert.match(ethicsEffects, /playEthicsVerdictStamp/);
assert.match(ethicsScene, /createGameStatusHud\(/, "Ethics Review must use the shared status chrome.");
assert.match(ethicsScene, /createVillageReturnButton\(/);
assert.doesNotMatch(ethicsScene, /console\.log/);
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
assert.match(airportFeverFormation, /createStarFormation/);
assert.match(airportFeverFormation, /createAiFormation/);
assert.match(airportFeverFormation, /Phaser\.Math\.Between\(0, FORMATION_PATTERN_COUNT - 1\)/);
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
assert.match(airportObjects, /collisionRadiusY: 118/);
assert.match(airportScene, /Phaser\.Math\.Between\(\s*DATA_FLIGHT_CONFIG\.dataSpawnInterval\.minMs/);
assert.match(airportScene, /\.text\(0, -172, "데이터 퀴즈"/);
assert.match(airportScene, /fontSize: "24px"/);
assert.match(airportScene, /fillRoundedRect\(-236, 153, 472, 20, 10\)/);
assert.doesNotMatch(airportScene, /DATA QUIZ/);
assert.doesNotMatch(airportScene, /revealGlow|revealMotes/);
assert.match(airportScene, /targets: readingFill/);
assert.match(airportObjects, /horizontalBobSpeed: bobSpeed \* 0\.55/);
assert.match(airportScene, /updateAirportObstacleMotion\(object, this\.elapsedMs\)/);
assert.match(airportObjectMotion, /nextHorizontalOffset - \(object\.horizontalBobOffset \?\? 0\)/);

const randomSource = `${airportScene}\n${airportObjects}\n${airportEffects}`;
const count = (pattern) => randomSource.match(pattern)?.length ?? 0;
assert.equal(count(/Phaser\.Utils\.Array\.Shuffle\(/g), 2);
assert.equal(count(/Phaser\.Utils\.Array\.GetRandom\(/g), 6);
assert.equal(count(/Phaser\.Math\.FloatBetween\(/g), 5);
assert.equal(count(/Phaser\.Math\.Between\(/g), 19);

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
assert.match(workshopControls, /image\(0, 0, "workshop-action-button"\)/);
assert.match(workshopControls, /event\.stopPropagation\(\)/);
assert.match(workshopControls, /UI_MOTION\.pressedScale/);
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
assert.equal(countWorkshop(/Phaser\.Math\.Between\(/g), 29);

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
