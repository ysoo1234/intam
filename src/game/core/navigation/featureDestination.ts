import { SCENE_KEYS } from "../scenes/sceneKeys";

export type FeatureSceneKey =
  | typeof SCENE_KEYS.airport
  | typeof SCENE_KEYS.aiWorkshop
  | typeof SCENE_KEYS.ethicsReview;

export const KNOWN_FEATURE_IDS = [
  "data-flight",
  "ai-workshop",
  "ethics-review",
] as const;

export type FeatureId = (typeof KNOWN_FEATURE_IDS)[number];

export type FeatureDestination = Readonly<{
  kind: "feature";
  featureId: FeatureId;
}>;

export type FeatureDestinationCatalog = Readonly<
  Record<FeatureId, FeatureSceneKey>
>;

export const FEATURE_DESTINATION_CATALOG = {
  "data-flight": SCENE_KEYS.airport,
  "ai-workshop": SCENE_KEYS.aiWorkshop,
  "ethics-review": SCENE_KEYS.ethicsReview,
} as const satisfies FeatureDestinationCatalog;

export function isKnownFeatureId(featureId: string): featureId is FeatureId {
  return KNOWN_FEATURE_IDS.some((knownFeatureId) => knownFeatureId === featureId);
}

export function resolveFeatureSceneKey<const TFeatureId extends FeatureId>(
  featureId: TFeatureId,
): (typeof FEATURE_DESTINATION_CATALOG)[TFeatureId] {
  return FEATURE_DESTINATION_CATALOG[featureId];
}
