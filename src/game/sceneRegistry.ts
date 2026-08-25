import type Phaser from "phaser";
import type { SceneKey } from "./core/scenes/sceneKeys";
import { SCENE_KEYS } from "./core/scenes/sceneKeys";
import { AirportScene } from "./features/data-flight/scene";
import { AiWorkshopScene } from "./features/ai-workshop/scene";
import { EthicsReviewScene } from "./features/ethics-review/scene";
import { IntroScene } from "./features/intro/scene";
import { WorldScene } from "./features/world/scene";

export type GameSceneId =
  | "intro"
  | "world"
  | "ai-workshop"
  | "data-flight"
  | "ethics-review"
  | "core-kitchen"
  | "ai-service-shop";

export type SceneAssetScope =
  | "intro"
  | "world"
  | "player"
  | "player-flight"
  | "ai-workshop"
  | "ai-workshop-customers"
  | "data-flight"
  | "ethics-review"
  | "legacy-ai-shop"
  | "legacy-ai-tools"
  | "legacy-customers";

export type SceneFactoryContext = Readonly<{
  onReady: () => void;
  renderScale: number;
}>;

type SceneFactory = (context: SceneFactoryContext) => Phaser.Scene;

type SceneRegistrationBase = Readonly<{
  id: GameSceneId;
  sceneKey: SceneKey;
  assetScopes: readonly SceneAssetScope[];
}>;

export type ActiveSceneRegistration = SceneRegistrationBase &
  Readonly<{
    status: "active";
    create: SceneFactory;
  }>;

export type DormantSceneRegistration = SceneRegistrationBase &
  Readonly<{
    status: "dormant";
    activationNote: string;
  }>;

export type SceneRegistration =
  | ActiveSceneRegistration
  | DormantSceneRegistration;

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
    status: "active",
    assetScopes: ["intro", "world", "player"],
    create: ({ onReady, renderScale }) =>
      new IntroScene(onReady, renderScale),
  },
  {
    id: "world",
    sceneKey: SCENE_KEYS.world,
    status: "active",
    assetScopes: ["world", "player"],
    create: ({ renderScale }) => new WorldScene(renderScale),
  },
  {
    id: "ai-workshop",
    sceneKey: SCENE_KEYS.aiWorkshop,
    status: "active",
    assetScopes: ["ai-workshop", "ai-workshop-customers", "player"],
    create: ({ renderScale }) => new AiWorkshopScene(renderScale),
  },
  {
    id: "data-flight",
    sceneKey: SCENE_KEYS.airport,
    status: "active",
    assetScopes: ["data-flight", "player-flight"],
    create: ({ renderScale }) => new AirportScene(renderScale),
  },
  {
    id: "ethics-review",
    sceneKey: SCENE_KEYS.ethicsReview,
    status: "active",
    assetScopes: ["ethics-review", "player"],
    create: ({ renderScale }) => new EthicsReviewScene(renderScale),
  },
  {
    id: "core-kitchen",
    sceneKey: SCENE_KEYS.coreKitchen,
    status: "dormant",
    assetScopes: ["legacy-ai-shop"],
    activationNote: "고유 월드 입구와 학습 정책이 승인되면 활성화합니다.",
  },
  {
    id: "ai-service-shop",
    sceneKey: SCENE_KEYS.aiServiceShop,
    status: "dormant",
    assetScopes: ["legacy-ai-shop", "legacy-ai-tools", "legacy-customers"],
    activationNote: "고유 월드 입구와 콘텐츠 정책이 승인되면 활성화합니다.",
  },
]);

export function createRegisteredScenes(
  context: SceneFactoryContext,
): Phaser.Scene[] {
  return GAME_SCENE_REGISTRY.flatMap((registration) =>
    registration.status === "active" ? [registration.create(context)] : [],
  );
}
