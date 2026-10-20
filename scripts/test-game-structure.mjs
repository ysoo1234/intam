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
const endingScene = await readFile(
  "src/game/features/ending/scene/EndingScene.ts",
  "utf8",
);
const endingCamera = await readFile(
  "src/game/features/ending/scene/endingCamera.ts",
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
const collisionMaskScript = await readFile(
  "scripts/generate-village-collision-mask.mjs",
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
const workshopEffects = await readFile("src/game/features/ai-workshop/scene/workshopEffects.ts", "utf8");
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
const ethicsTutorial = await readFile(
  "src/game/features/ethics-review/scene/ethicsReviewTutorial.ts",
  "utf8",
);
const ethicsDeliveryState = await readFile(
  "src/game/features/ethics-review/model/deliveryState.ts",
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
const airportQuestionView = await readFile(
  "src/game/features/data-flight/scene/airportQuestionView.ts",
  "utf8",
);
const airportTutorial = await readFile(
  "src/game/features/data-flight/scene/airportTutorial.ts",
  "utf8",
);
const airportOverlays = await readFile(
  "src/game/features/data-flight/scene/airportOverlays.ts",
  "utf8",
);
const tutorialProgress = await readFile(
  "src/game/core/navigation/tutorialProgressStorage.ts",
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
    "workshopStarCatchView.ts",
    "workshopEffects.ts",
  ].map((file) =>
    readFile(`src/game/features/ai-workshop/scene/${file}`, "utf8"),
  ),
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
assert.equal(declaredSceneKeyValues.length, 6);
assert.equal(
  new Set(declaredSceneKeyValues).size,
  declaredSceneKeyValues.length,
  "Every scene key must be unique.",
);
const registeredSceneIds = [
  ...sceneRegistry.matchAll(/^\s+id: "([^"]+)",$/gmu),
].map((match) => match[1]);
assert.equal(registeredSceneIds.length, 6);
assert.equal(
  new Set(registeredSceneIds).size,
  registeredSceneIds.length,
  "Every registry id must be unique.",
);
const registeredSceneKeyNames = [
  ...sceneRegistry.matchAll(/^\s+sceneKey: SCENE_KEYS\.(\w+),$/gmu),
].map((match) => match[1]);
assert.equal(registeredSceneKeyNames.length, 6);
assert.equal(
  new Set(registeredSceneKeyNames).size,
  registeredSceneKeyNames.length,
  "Every registry entry must use a unique declared scene key.",
);
assert.match(introScene, /super\(SCENE_KEYS\.intro\)/);
assert.match(worldScene, /super\(SCENE_KEYS\.world\)/);
assert.match(endingScene, /super\(SCENE_KEYS\.ending\)/);
assert.match(
  worldScene,
  /this\.scene\.start\(SCENE_KEYS\.ending, createEndingStart\(/,
  "The open starlight gate starts the ending with the earned stars.",
);
assert.match(
  endingCamera,
  /getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/,
  "The certificate camera must switch off when it is not needed.",
);
assert.doesNotMatch(
  endingCamera,
  /fetch\(|XMLHttpRequest|localStorage|indexedDB/,
  "Certificate photos stay on the device: no upload or storage.",
);
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
  /villageBuildingShape\("fountain"/,
  "The fountain collision must follow its editable grid placement.",
);
assert.doesNotMatch(villageMap, /northwest-garden|northeast-garden|southwest-garden/);
assert.doesNotMatch(villageMap, /maskWalkableOverrides/);
assert.match(
  villageMap,
  /villageBuildingShape\("ethics-office"\)/,
  "The Ethics Review collision must block the ground it stands on.",
);
assert.match(villageMap, /curvedMovementGuides: \[\]/, "No stale slide guides: the mask and building outlines are the whole collision.");
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
assert.match(villageMap, /groundLine: 0\.99/, "Scenery carries the ground line its depth sorting uses.");
for (const buildingId of ["ai-shop", "airport", "ai-world-gate"]) {
  assert.match(villageMap, new RegExp(`villageBuildingShape\\(${JSON.stringify(buildingId)}`), `${buildingId} blocks the ground it stands on.`);
}
assert.match(villageLayoutGrid, /VILLAGE_BUILDING_SHAPES\[id\]/, "Building outlines come from the measured pictures.");
assert.match(villageMap, /maxHiddenBehindBuilding: 0\.\d+/, "How far Midi may go behind a building stays one tunable number.");
assert.match(villageMovement, /function findSlide\(/, "Blocked steps slide around mask corners instead of wedging.");
assert.match(collisionMaskScript, /removeSmallIslands\(/, "Bushes and flower beds in the mask are walkable.");
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
assert.match(worldScene, /isPlayerBehindBuildingWall\(WORLD_MAP\.collision, portal\.frontOf/, "Entry buttons never show from behind their building.");
assert.equal(villageMap.match(/frontOf: "/g)?.length, 4, "Every village entrance names its building.");
assert.match(villageScenery, /isPlayerBehindBuilding/, "Depth sorting compares Midi's feet with each building's ground outline.");
assert.match(villageScenery, /updateVillageSceneryDepths/);
assert.match(villageScenery, /AI_WORLD_PORTAL_CANVAS/);
assert.match(villageScenery, /createAiWorldPortal/);
assert.match(villageScenery, /depthBackdrops/);
assert.match(villageScenery, /export function createAiWorldPortalView/, "The ending can lay the live portal over its painted village.");
assert.doesNotMatch(villageScenery, /AI_WORLD_PORTAL_ANIMATION/);
assert.doesNotMatch(villageScenery, /AI_WORLD_PORTAL_FRAME_COUNT/);
assert.match(villageScenery, /const AI_WORLD_PORTAL_SCREEN = \[/);
assert.match(villageScenery, /screen\.corners\.map/);
assert.match(villageScenery, /PORTAL_SWIRL\.arms/, "The gate shows a calm, turning whirlpool.");
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
  /방향키를 누르거나 화면을 터치해서\\n미디를 움직일 수 있어요\./,
  "World onboarding must explain keyboard and touch movement toward the first building.",
);
assert.match(villageTutorial, /여기가 배움마을이야![\s\S]*먼저 \$\{toTarget\} 가 볼까\?/, "Midi welcomes the player, then says where to go first.");
assert.match(villageTutorial, /createVillageMidiBubble\(scene,/, "Midi says the tutorial lines in her own speech bubble.");
assert.match(villageTutorial, /firstVisit\s*\?\s*"ai-workshop"/, "The first visit must light up the AI workshop first.");
assert.match(villageTutorial, /입장하기 버튼을 터치하거나,\\nSpace 키를 눌러 건물에 들어갈 수 있어요\./, "At a door a card must explain how to enter.");
assert.match(worldScene, /markTutorialSeen\("village"\)/, "Entering a building must finish the village tutorial.");
const workshopTutorial = await readFile(
  "src/game/features/ai-workshop/scene/workshopTutorial.ts",
  "utf8",
);
for (const event of ["choosing", "picked", "crafting", "delivery", "served"]) {
  assert.match(workshopTutorial, new RegExp(`case "${event}"`), `The workshop tutorial must handle "${event}".`);
}
assert.match(workshopScene, /shouldPlayTutorial\("ai-workshop"\)/, "The workshop tutorial plays on the first visit only.");
assert.match(workshopScene, /playCoachCountdown\(this, \(\) => this\.beginRealGame\(\)\)/, "The real game starts after a 3-2-1 countdown.");
assert.match(workshopScene, /if \(this\.timerRunning\) this\.remainingMs/, "The clock must not run during the tutorial.");
assert.match(worldScene, /createVillageTutorial\(this,/, "World must mount the village tutorial.");
assert.match(worldScene, /loadStoredWorldProgress\(\)/, "Stars must be restored from browser storage.");
assert.match(worldScene, /saveStoredWorldProgress\(this\.progress\)/, "Stars must be saved to browser storage.");
assert.match(introScene, /intro-title/, "The intro shows the textbook-style title artwork.");
assert.match(
  pointerCoordinates,
  /getWorldPoint\(pointer\.x, pointer\.y, output\)/,
  "Pointer input must be translated through the active camera before gameplay uses it.",
);
assert.match(worldTouchDirection, /pointerdown/);
assert.match(worldTouchDirection, /pointermove/);
assert.match(worldTouchDirection, /pointerupoutside/);
assert.match(worldTouchDirection, /Scenes\.Events\.SHUTDOWN/);
assert.match(worldTouchDirection, /getPointerWorldPoint\(scene, pointer/);
assert.match(worldTouchDirection, /hasTarget/);
assert.match(worldTouchDirection, /cancel/);
assert.match(worldTouchDirection, /nonImprovingFrames >= 40/, "Skirting a bush takes a moment; a tap must not give up at once.");
assert.match(worldScene, /WORLD_ENTRY_LABEL = "입장하기"/, "Every building's button just says 입장하기.");
assert.match(worldScene, /createVillageNameTags\(this,/, "Each building shows its name tag when Midi reaches its door.");
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
  /id: "shop",[\s\S]*?position: offsetVillagePoint\("ai-shop", \{ x: 366, y: 289 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 156, height: 140[\s\S]*?frontOf: "ai-shop"/,
  "The AI shop must activate in the front yard around its door steps.",
);
assert.match(
  villageMap,
  /id: "workshop",[\s\S]*?position: offsetVillagePoint\("ethics-office", \{ x: 318, y: 665 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 228, height: 146/,
  "The Ethics Review office must activate only on its front paved approach.",
);
assert.match(villageScenery, /function getAiWorldPortalScreen/);
assert.match(
  villageScenery,
  /screen\.top \+ screen\.height \/ 2/,
  "The AI-world portal swirl must be centred on the gate's screen.",
);
assert.match(
  villageMap,
  /id: "library",[\s\S]*?position: offsetVillagePoint\("airport", \{ x: 895, y: 271 \}\)[\s\S]*?kind: "ellipse"[\s\S]*?width: 204, height: 110[\s\S]*?frontOf: "airport"/,
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
assert.doesNotMatch(gameResultOverlay, /gameResultRetryButton|gameResultReturnButton/, "The result buttons are drawn in code.");
assert.match(gameResultOverlay, /"마을로 돌아가기", "quiet"/, "Going back is the quiet button on the left.");
assert.match(gameResultOverlay, /config\.retryLabel, "bold"/, "Replay is the one bold button.");
assert.doesNotMatch(gameResultOverlay, /"🏆"/);
assert.match(gameResultOverlay, /titleY: -172/);
assert.match(gameResultOverlay, /buttonsY: 152/);
assert.match(gameResultOverlay, /RESULT_FONT_FAMILY = FONT_FAMILY/, "The result card uses the same face as the start screen.");
assert.match(gameResultOverlay, /villageActivityStarFilled/, "The result card shows the village's star art.");
assert.doesNotMatch(workshopControls, /workshop-action-button/, "The workshop has no action button: things are tapped directly.");
assert.match(workshopControls, /walkTo/, "A tap on a product, the workbench or the customer walks Midi there and acts.");
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
assert.match(gameAssets, /ethics-review\/students\/\$\{id\}-worried\.webp/, "Ethics visitors are the 24 review students.");
assert.match(gameAssets, /ethics-booth-front-v8\.webp/, "The booth frame and counter are drawn in front of the student.");
assert.match(gameAssets, /inspection-form-v4\.webp/, "Forms use the art with the printed stamp circle.");
assert.match(workshopScene, /playWorkshopProductReveal\(this, order\.products\[0\]/, "A finished product is shown off before Midi carries it.");
assert.doesNotMatch(ethicsOffice, /createEthicsRulebook/, "The rule panel is gone: the office shows only the form and the two stamps.");
assert.doesNotMatch(ethicsView, /applicant|topicLabel/, "The form carries only the case sentence.");
assert.match(ethicsScene, /shouldPlayTutorial\("ethics-review"\)/);
assert.match(ethicsScene, /markTutorialSeen\("ethics-review"\)/);
assert.match(ethicsScene, /help: \{ question: "튜토리얼을 다시 볼까요\?" \}/);
assert.match(ethicsScene, /wasCorrect && this\.replayingPractice\) \{\s*this\.scene\.restart\(\)/, "A practice watched again from ? ends back on the start screen.");
assert.match(ethicsScene, /createEthicsReviewTutorial\(this, this\.stations\)/);
assert.doesNotMatch(ethicsScene, /steps:/, "The start card is plain; the practice case teaches the stamps.");
assert.match(ethicsTutorial, /createCoachPointer\(scene, station\.button\.x/);
assert.match(ethicsDeliveryState, /practice = true/);
assert.doesNotMatch(ethicsVisitor, /addMask\(/, "The booth front layer hides the student below the window; no mask needed.");
assert.match(ethicsVisitor, /Scenes\.Events\.SHUTDOWN/);
assert.match(ethicsView, /playEthicsFormArrival/);
assert.match(ethicsView, /playEthicsFormDeparture/);
assert.match(ethicsPlayer, /greet:/, "Midi must glance toward each arriving visitor.");
assert.match(ethicsEffects, /playEthicsVerdictStamp/);
assert.match(ethicsScene, /createGameStatusHud\(/, "Ethics Review must use the shared status chrome.");
assert.match(ethicsScene, /createGamePauseMenu\(/, "Ethics Review must use the shared pause menu (멈춤 → 이어하기·처음부터·마을로).");
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
assert.doesNotMatch(airportControls, /keydown-ESC/, "ESC belongs to the shared pause menu, not the controls.");
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
assert.match(airportView, /const playerShadowBack = shadow\(5, 2,/);
assert.match(airportView, /const playerShadowNear = shadow\(2, 1,/);
assert.match(airportView, /const AIRPORT_MIDI_FLY = "airport-midi-1";/);
assert.match(airportView, /react: \(reaction: AirportPlayerReaction\) =>/);
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
assert.match(airportQuestionView, /\.text\(0, -128, "데이터 퀴즈"/);
assert.match(airportQuestionView, /createAirportCardPanel\(scene, 820, 380\)/, "The quiz uses the start card's cream panel.");
assert.match(airportQuestionView, /createAirportCapsulePanel\(scene, 820, 64\)/, "The question banner uses the status-bar capsule.");
assert.doesNotMatch(airportQuestionView, /곧 데이터 4개가/, "The tutorial now teaches what happens next.");
assert.doesNotMatch(airportQuestionView, /DATA QUIZ/);
assert.doesNotMatch(airportQuestionView, /revealGlow|revealMotes/);
assert.match(airportQuestionView, /targets: readingFill/);
assert.match(airportScene, /createAirportQuestionOverlay\(this, question, readingMs\)/);
assert.match(airportScene, /createAirportMissionBanner\(this, active\.question\.prompt\)/);
// First-play lesson: the start card is plain, the ? button replays, the clock waits.
assert.match(airportOverlays, /placeName: "데이터 비행장"/);
assert.doesNotMatch(airportOverlays, /steps:/, "The start card no longer carries tutorial cards.");
assert.match(airportScene, /help: \{ question: "튜토리얼을 다시 볼까요\?" \}/);
assert.match(airportScene, /if \(replaying\) \{ this\.scene\.restart\(\); return; \}/, "A tutorial watched again from ? ends back on the start screen.");
assert.match(workshopScene, /if \(replaying\) \{\s*this\.scene\.restart\(\)/, "A tutorial watched again from ? ends back on the start screen.");
assert.match(airportScene, /shouldPlayTutorial\("data-flight"\)/);
assert.match(airportScene, /markTutorialSeen\("data-flight"\)/);
assert.match(airportScene, /isGameStartOverlayOpen\(this\) \|\| isCoachCardOpen\(this\)/);
assert.match(airportScene, /this\.tutorial\?\.notify\("collected"\)/);
assert.match(airportScene, /this\.tutorial\?\.notify\("obstacle-passed"\)/);
assert.match(airportScene, /this\.tutorial\.notify\("obstacle-hit"\)/);
assert.match(airportTutorial, /createCoachCard\(scene,/);
assert.match(airportTutorial, /showCoachPraise\(scene,/);
assert.match(airportTutorial, /"question-missed"/);
assert.match(airportTutorial, /OBSTACLE_TARGET = 3/, "The lesson waits until three untrustworthy pieces have gone by.");
assert.match(airportTutorial, /obstaclesPassed \+ obstaclesInFlight >= OBSTACLE_TARGET/, "No fourth obstacle once three are on their way.");
assert.match(airportTutorial, /resendChoices\(QUIZ_QUESTION\)/, "A wrong or missed answer sends the four answers again.");
assert.match(airportTutorial, /keepObjects: true/, "The answer card pauses the answers where they are.");
assert.doesNotMatch(airportTutorial, /가끔/, "The quiz is the heart of the flight, not an occasional extra.");
assert.match(workshopResult, /recordBestScore\("ai-workshop"/, "The workshop result shows the best score so far.");
assert.doesNotMatch(workshopCustomerVisual, /setFlipX\(hasTexture\)/, "Customer art already faces Midi; it is not mirrored.");
assert.match(workshopCustomerVisual, /WORKSHOP_CUSTOMER_DISPLAY_SCALE = 1\.2;/);
assert.doesNotMatch(villageTutorial, /저장되었어요/, "No star toast on return: the stars light up over the building.");
assert.match(tutorialProgress, /"village" \| "ai-workshop" \| "data-flight"/);
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
assert.match(workshopView, /drawWorkshopDialogueBubble/, "The speech bubble is drawn in code with a thin outline and a curved tail.");
assert.match(workshopView, /\.image\(/);
assert.doesNotMatch(workshopView, /\.nineslice\(/);
assert.doesNotMatch(workshopView, /setTintMode\(Phaser\.TintModes\.FILL\)/);
assert.match(workshopCustomerVisual, /CUSTOMER_ART_METRICS/, "Customer art is pre-sized and centred on the feet; only head top and stance width are recorded.");
assert.match(workshopEffects, /WORKSHOP_COIN_TEXTURE = "workshop-coin"/, "Coins use the AI coin artwork.");
assert.match(gameAssets, /workshop-coin-v1\.webp/);
assert.match(workshopView, /headGap: 16/, "The speech bubble keeps clear of the customer's head.");
assert.match(workshopCustomerVisual, /CUSTOMER_SOURCE_FOOT_Y = 642/);
assert.match(workshopCustomerVisual, /applyWorkshopCustomerVisualTransform/);
assert.match(workshopCustomerVisual, /applyWorkshopCustomerRequestVisual/);
assert.match(workshopScene, /applyWorkshopCustomerRequestVisual/);
assert.match(
  workshopRandomFiles[2],
  /applyWorkshopCustomerVisualTransform/,
);
assert.match(workshopView, /workshop-customer-nameplate/);
assert.match(workshopView, /syncWorkshopDialoguePanel/);
assert.match(workshopView, /minWidth: 292/);
assert.match(workshopView, /width: 360/);
assert.match(workshopView, /outline: \{ width: 2\.5/);
assert.match(workshopView, /QuadraticBezier/);
assert.match(workshopView, /longestLineWidth/);
assert.match(workshopView, /left: 22/);
assert.match(workshopView, /right: 22/);
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
assert.match(workshopRandomFiles[1], /상품 제작 중  ·  성공/, "The crafting title row carries the success count.");
assert.match(workshopRandomFiles[1], /workshop-crafting-panel/);
assert.match(workshopRandomFiles[1], /WORKSHOP_STAR_CATCH_TUNING/);
assert.match(workshopRandomFiles[1], /"멈춤!"/, "A big 멈춤 button sits on the crafting panel.");
assert.match(workshopRandomFiles[1], /shade[\s\S]*?\.setInteractive\(\)/, "A tap anywhere on the crafting screen stops the star.");
assert.doesNotMatch(workshopRandomFiles[1], /STAR CATCH/);
assert.doesNotMatch(workshopControls, /createFloatingJoystick/);
assert.match(workshopControls, /scene\.input\.on\("pointerdown"/);
assert.match(workshopControls, /scene\.input\.on\("pointermove"/);
assert.match(workshopControls, /scene\.input\.on\("pointerupoutside"/);
assert.match(workshopControls, /Scenes\.Events\.SHUTDOWN/);
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
assert.match(workshopStatus, /isWorkshopPlayerAtWorkbench/);
assert.match(workshopStatus, /findNearestWorkshopProductOrigin/);
assert.match(workshopStatus, /WORKSHOP_TAP_SPOTS/);
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
assert.equal(countWorkshop(/Phaser\.Math\.Between\(/g), 30);

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

const registeredSceneMarkers = [
  "new IntroScene(onReady, renderScale, WORLD_VILLAGE_PREVIEW)",
  "new WorldScene(renderScale)",
  "new AiWorkshopScene(renderScale)",
  "new AirportScene(renderScale)",
  "new EthicsReviewScene(renderScale)",
  "new EndingScene(renderScale, WORLD_VILLAGE_PREVIEW)",
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

console.log("Scene registry structure checks passed.");
