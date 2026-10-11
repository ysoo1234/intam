import type Phaser from "phaser";
import type { SceneKey } from "./core/scenes/sceneKeys";
import { SCENE_KEYS } from "./core/scenes/sceneKeys";
import { AirportScene } from "./features/data-flight/scene";
import { AiWorkshopScene } from "./features/ai-workshop/scene";
import { EndingScene } from "./features/ending/scene";
import { EthicsReviewScene } from "./features/ethics-review/scene";
import { IntroScene } from "./features/intro/scene";
import { WORLD_VILLAGE_PREVIEW, WorldScene } from "./features/world/scene";

export type GameSceneId =
  | "intro"
  | "world"
  | "ai-workshop"
  | "data-flight"
  | "ethics-review"
  | "ending";

export type SceneAssetScope =
  | "intro"
  | "world"
  | "player"
  | "player-flight"
  | "ai-workshop"
  | "ai-workshop-customers"
  | "data-flight"
  | "ethics-review"
  | "ending";

export type SceneFactoryContext = Readonly<{
  onReady: () => void;
  renderScale: number;
}>;

type SceneFactory = (context: SceneFactoryContext) => Phaser.Scene;

export type SceneRegistration = Readonly<{
  id: GameSceneId;
  sceneKey: SceneKey;
  assetScopes: readonly SceneAssetScope[];
  create: SceneFactory;
}>;

export type SceneRegistryValidationIssue = Readonly<{
  code: "duplicate-scene-id" | "duplicate-scene-key";
  message: string;
  sceneId: GameSceneId;
  sceneKey: SceneKey;
}>;

export function validateSceneRegistry(
  registrations: readonly SceneRegistration[],
): readonly SceneRegistryValidationIssue[] {
  const issues: SceneRegistryValidationIssue[] = [];
  const sceneIds = new Set<GameSceneId>();
  const sceneKeys = new Set<SceneKey>();

  for (const registration of registrations) {
    if (sceneIds.has(registration.id)) {
      issues.push({
        code: "duplicate-scene-id",
        sceneId: registration.id,
        sceneKey: registration.sceneKey,
        message: `Duplicate scene id: ${registration.id}`,
      });
    } else {
      sceneIds.add(registration.id);
    }

    if (sceneKeys.has(registration.sceneKey)) {
      issues.push({
        code: "duplicate-scene-key",
        sceneId: registration.id,
        sceneKey: registration.sceneKey,
        message: `Duplicate scene key: ${registration.sceneKey}`,
      });
    } else {
      sceneKeys.add(registration.sceneKey);
    }
  }

  return issues;
}

export function defineSceneRegistry(
  registrations: readonly SceneRegistration[],
): readonly SceneRegistration[] {
  const issues = validateSceneRegistry(registrations);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join("\n"));
  }

  return Object.freeze([...registrations]);
}

export const GAME_SCENE_REGISTRY = defineSceneRegistry([
  {
    id: "intro",
    sceneKey: SCENE_KEYS.intro,
    assetScopes: ["intro", "world", "player"],
    create: ({ onReady, renderScale }) =>
      // The intro's magic door shows the real village (painted by the village feature).
      new IntroScene(onReady, renderScale, WORLD_VILLAGE_PREVIEW),
  },
  {
    id: "world",
    sceneKey: SCENE_KEYS.world,
    assetScopes: ["world", "player"],
    create: ({ renderScale }) => new WorldScene(renderScale),
  },
  {
    id: "ai-workshop",
    sceneKey: SCENE_KEYS.aiWorkshop,
    assetScopes: ["ai-workshop", "ai-workshop-customers", "player"],
    create: ({ renderScale }) => new AiWorkshopScene(renderScale),
  },
  {
    id: "data-flight",
    sceneKey: SCENE_KEYS.airport,
    assetScopes: ["data-flight", "player-flight"],
    create: ({ renderScale }) => new AirportScene(renderScale),
  },
  {
    id: "ethics-review",
    sceneKey: SCENE_KEYS.ethicsReview,
    assetScopes: ["ethics-review", "player"],
    create: ({ renderScale }) => new EthicsReviewScene(renderScale),
  },
  {
    id: "ending",
    sceneKey: SCENE_KEYS.ending,
    assetScopes: ["ending", "world", "intro", "player"],
    create: ({ renderScale }) =>
      // The ending plays over the real village (painted by the village feature).
      new EndingScene(renderScale, WORLD_VILLAGE_PREVIEW),
  },
]);

export function createRegisteredScenes(
  context: SceneFactoryContext,
): Phaser.Scene[] {
  return GAME_SCENE_REGISTRY.map((registration) =>
    registration.create(context),
  );
}
