import {
  isKnownFeatureId,
  type FeatureId,
} from "./featureDestination";
import {
  normalizeWorldActivityStars,
  type WorldActivityResult,
} from "./worldProgress";

export type WorldReturnRequest = Readonly<{
  kind: "feature-return";
  sourceFeatureId: FeatureId;
  result?: WorldActivityResult;
}>;

export type WorldSceneData = Readonly<{
  worldReturn?: WorldReturnRequest;
}>;

export function createWorldReturnSceneData(
  sourceFeatureId: FeatureId,
  stars?: number,
): WorldSceneData {
  const result =
    stars === undefined
      ? undefined
      : {
          featureId: sourceFeatureId,
          stars: normalizeWorldActivityStars(stars),
        };
  return {
    worldReturn: {
      kind: "feature-return",
      sourceFeatureId,
      result,
    },
  };
}

export function readWorldReturnRequest(value: unknown): WorldReturnRequest | null {
  if (!value || typeof value !== "object") return null;
  const data = value as { worldReturn?: unknown };
  if (!data.worldReturn || typeof data.worldReturn !== "object") return null;
  const candidate = data.worldReturn as {
    kind?: unknown;
    sourceFeatureId?: unknown;
    result?: unknown;
  };
  if (
    candidate.kind !== "feature-return" ||
    typeof candidate.sourceFeatureId !== "string" ||
    !isKnownFeatureId(candidate.sourceFeatureId)
  ) {
    return null;
  }

  let result: WorldActivityResult | undefined;
  if (candidate.result && typeof candidate.result === "object") {
    const rawResult = candidate.result as {
      featureId?: unknown;
      stars?: unknown;
    };
    if (
      rawResult.featureId === candidate.sourceFeatureId &&
      typeof rawResult.stars === "number"
    ) {
      result = {
        featureId: candidate.sourceFeatureId,
        stars: normalizeWorldActivityStars(rawResult.stars),
      };
    }
  }

  return {
    kind: "feature-return",
    sourceFeatureId: candidate.sourceFeatureId,
    result,
  };
}
