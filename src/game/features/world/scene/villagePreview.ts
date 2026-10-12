import type Phaser from "phaser";
import { loadStoredWorldProgress } from "../../../core/navigation/worldProgressStorage";
import type { WorldActivityId } from "../../../core/navigation/worldProgress";
import type { VillageLandmarks, VillagePreview } from "../../../core/scenes/villagePreview";
import type { SceneryDefinition } from "../model/mapDefinition";
import { getWorldMapDefinition } from "../model/mapRegistry";
import {
  createVillageProgressPresentation,
  preloadVillageProgressPresentationAssets,
} from "./villageProgressPresentation";
import {
  createAiWorldPortalView,
  createVillageScenery,
  getAiWorldPortalScreen,
  preloadVillageScenery,
  updateVillageSceneryDepths,
} from "./villageScenery";

const WORLD_MAP = getWorldMapDefinition();

/** Midi stands 113 px tall in the village (her whole frame). */
export const VILLAGE_PLAYER_DISPLAY_HEIGHT = 113;
// Village frames are 226 px tall: the body is 220 px with 3 px clear below it,
// the pivot sits 33 px above the frame's bottom, and the sprite rests 3 px up.
const PLAYER_FRAME = { height: 226, body: 220, padBelow: 3, feetBelowPivot: 33, restLift: 3 } as const;
const frameScale = VILLAGE_PLAYER_DISPLAY_HEIGHT / PLAYER_FRAME.height;

/** The ending's light targets, read from the same scenery the village draws. */
function getVillageLandmarks(): VillageLandmarks {
  const byId = (id: string): SceneryDefinition => {
    const scenery: SceneryDefinition | undefined = WORLD_MAP.scenery.find((entry) => entry.id === id);
    if (!scenery) throw new Error(`Village scenery missing: ${id}`);
    return scenery;
  };
  const activity = (id: string, featureId: WorldActivityId) => {
    const scenery = byId(id);
    const marker = scenery.progressMarker;
    const stars = marker?.kind === "activity-stars" && marker.featureId === featureId
      ? marker.position
      : { x: scenery.position.x, y: scenery.position.y - scenery.displaySize.height / 2 };
    return { center: scenery.position, stars };
  };
  const fountain = byId("fountain");
  const gate = byId("ai-world-gate");
  const screen = getAiWorldPortalScreen(gate);
  const counter = gate.progressMarker?.kind === "starlight-exit" ? gate.progressMarker.position : gate.position;
  return {
    activities: {
      "ai-workshop": activity("ai-shop", "ai-workshop"),
      "data-flight": activity("airport", "data-flight"),
      "ethics-review": activity("ethics-office", "ethics-review"),
    },
    // The top tier sits about a third of the way down the fountain picture.
    fountainTop: { x: fountain.position.x, y: fountain.position.y - fountain.displaySize.height * 0.3 },
    gate: {
      center: gate.position,
      screen: { x: screen.left + screen.width / 2, y: screen.top + screen.height / 2 },
      counter,
    },
  };
}

type Destroyable = Phaser.GameObjects.GameObject & { depth?: number; list?: Phaser.GameObjects.GameObject[] };

function stopTweensDeep(scene: Phaser.Scene, object: Destroyable) {
  scene.tweens.killTweensOf(object);
  object.list?.forEach((child) => stopTweensDeep(scene, child as Destroyable));
}

/**
 * The real village, painted once into a texture for the intro's magic door:
 * the same ground, buildings, fountain, gate and roof stars the village scene
 * builds, from the same layout, so moving a building moves it in the door too.
 */
export const WORLD_VILLAGE_PREVIEW: VillagePreview = {
  size: WORLD_MAP.size,
  spawn: WORLD_MAP.defaultSpawn.position,
  midiBody: {
    height: PLAYER_FRAME.body * frameScale,
    bottomBelowSpawn: (PLAYER_FRAME.feetBelowPivot - PLAYER_FRAME.padBelow) * frameScale - PLAYER_FRAME.restLift,
  },
  landmarks: getVillageLandmarks(),
  preload: (scene) => {
    preloadVillageScenery(scene, WORLD_MAP);
    preloadVillageProgressPresentationAssets(scene);
  },
  paint: (scene, key, renderScale, emptyRoofs) => {
    const art = [WORLD_MAP.background, ...WORLD_MAP.scenery];
    if (!art.every(({ assetKey }) => scene.textures.exists(assetKey))) return false;
    const before = new Set(scene.children.list);
    // Built exactly as the village scene builds them, then drawn once and removed.
    const layers = createVillageScenery(scene, WORLD_MAP);
    // The ending flies its own stars off the roofs, so there the roofs stay bare.
    if (!emptyRoofs) createVillageProgressPresentation(scene, WORLD_MAP, layers, loadStoredWorldProgress());
    updateVillageSceneryDepths(layers, WORLD_MAP.defaultSpawn.position, WORLD_MAP.collision);
    const created = scene.children.list
      .filter((object) => !before.has(object))
      .map((object, index) => ({ object: object as Destroyable, index }))
      .sort((a, b) => (a.object.depth ?? 0) - (b.object.depth ?? 0) || a.index - b.index)
      .map(({ object }) => object);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const { width, height } = WORLD_MAP.size;
    const texture = scene.textures.addDynamicTexture(key, width * renderScale, height * renderScale);
    if (texture) {
      texture.camera.setZoom(renderScale);
      texture.camera.centerOn(width / 2, height / 2);
      texture.draw(created);
      texture.render();
    }
    for (const object of created) {
      stopTweensDeep(scene, object);
      object.destroy();
    }
    return Boolean(texture);
  },
  addLivePortal: (scene, depth) => {
    const gate = WORLD_MAP.scenery.find((entry) => entry.id === "ai-world-gate");
    if (!gate) return;
    // Like in the village: the swirl runs a little past the screen hole and the
    // gate is drawn again over it, so its frame hides the edges (no gaps).
    createAiWorldPortalView(scene, gate)?.setDepth(depth);
    scene.add
      .image(gate.position.x, gate.position.y, gate.assetKey)
      .setDisplaySize(gate.displaySize.width, gate.displaySize.height)
      .setFlipX(gate.flipX === true)
      .setDepth(depth + 0.01);
  },
};
