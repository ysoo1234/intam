import type { FeatureId } from "./featureDestination";

export const WORLD_ACTIVITY_IDS = [
  "ai-workshop",
  "data-flight",
  "ethics-review",
] as const satisfies readonly FeatureId[];

export type WorldActivityId = (typeof WORLD_ACTIVITY_IDS)[number];
export type WorldActivityStars = 0 | 1 | 2 | 3;

export type WorldProgressSnapshot = Readonly<
  Record<WorldActivityId, WorldActivityStars>
>;

export type WorldActivityResult = Readonly<{
  featureId: WorldActivityId;
  stars: WorldActivityStars;
}>;

export type WorldExitState =
  | Readonly<{
      kind: "locked";
      totalStars: number;
      requiredStars: typeof WORLD_EXIT_REQUIRED_STARS;
      missingStars: number;
    }>
  | Readonly<{
      kind: "active";
      totalStars: typeof WORLD_EXIT_REQUIRED_STARS;
      requiredStars: typeof WORLD_EXIT_REQUIRED_STARS;
      completionEvent: typeof WORLD_COMPLETION_READY_EVENT;
    }>;

export const WORLD_PROGRESS_REGISTRY_KEY = "world:activity-stars";
// Three places offer up to nine stars; seven open the graduation path, so a
// student can miss a couple and still finish.
export const WORLD_EXIT_REQUIRED_STARS = 7 as const;
export const WORLD_COMPLETION_READY_EVENT =
  "world:starlight-graduation-path-ready" as const;

export const EMPTY_WORLD_PROGRESS: WorldProgressSnapshot = Object.freeze({
  "ai-workshop": 0,
  "data-flight": 0,
  "ethics-review": 0,
});

export function normalizeWorldActivityStars(value: number): WorldActivityStars {
  if (!Number.isFinite(value)) return 0;
  return Math.min(3, Math.max(0, Math.round(value))) as WorldActivityStars;
}

export function readWorldProgressSnapshot(
  value: unknown,
): WorldProgressSnapshot {
  if (!value || typeof value !== "object") return EMPTY_WORLD_PROGRESS;
  const candidate = value as Partial<Record<WorldActivityId, unknown>>;
  return Object.freeze(
    Object.fromEntries(
      WORLD_ACTIVITY_IDS.map((featureId) => [
        featureId,
        normalizeWorldActivityStars(Number(candidate[featureId] ?? 0)),
      ]),
    ) as Record<WorldActivityId, WorldActivityStars>,
  );
}

export function mergeWorldActivityResult(
  current: WorldProgressSnapshot,
  result: WorldActivityResult,
): WorldProgressSnapshot {
  return Object.freeze({
    ...current,
    [result.featureId]: Math.max(
      current[result.featureId],
      result.stars,
    ) as WorldActivityStars,
  });
}

export function getWorldTotalStars(progress: WorldProgressSnapshot) {
  return WORLD_ACTIVITY_IDS.reduce(
    (total, featureId) => total + progress[featureId],
    0,
  );
}

export function getWorldExitState(
  progress: WorldProgressSnapshot,
): WorldExitState {
  const totalStars = getWorldTotalStars(progress);
  if (totalStars >= WORLD_EXIT_REQUIRED_STARS) {
    return {
      kind: "active",
      totalStars: WORLD_EXIT_REQUIRED_STARS,
      requiredStars: WORLD_EXIT_REQUIRED_STARS,
      completionEvent: WORLD_COMPLETION_READY_EVENT,
    };
  }
  return {
    kind: "locked",
    totalStars,
    requiredStars: WORLD_EXIT_REQUIRED_STARS,
    missingStars: WORLD_EXIT_REQUIRED_STARS - totalStars,
  };
}

export function createWorldCompletionReadyDetail(
  progress: WorldProgressSnapshot,
) {
  return Object.freeze({
    kind: "starlight-graduation-path-ready" as const,
    progress,
    totalStars: WORLD_EXIT_REQUIRED_STARS,
  });
}
