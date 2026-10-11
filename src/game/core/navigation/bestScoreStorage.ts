/**
 * Each activity's best score in this browser, kept apart from the star
 * progress. A score only replaces the record when it is higher.
 */
export const BEST_SCORE_STORAGE_KEY = "intam:best-scores:v1";

export type BestScoreId = "ai-workshop" | "data-flight" | "ethics-review";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readScores(target: StorageLike): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(target.getItem(BEST_SCORE_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export type BestScoreRecord = Readonly<{ best: number; isNew: boolean }>;

/** Saves `score` if it beats the record and returns the (new) best. */
export function recordBestScore(id: BestScoreId, score: number, storage?: StorageLike): BestScoreRecord {
  const target = resolveStorage(storage);
  if (!target) return { best: score, isNew: false };
  const scores = readScores(target);
  const previous = Number.isFinite(scores[id]) ? scores[id] : undefined;
  if (previous !== undefined && previous >= score) return { best: previous, isNew: false };
  try {
    target.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify({ ...scores, [id]: score }));
  } catch {
    // Storage may be blocked; the record simply is not kept.
  }
  // A first play is a record only when it scored something.
  return { best: score, isNew: score > 0 };
}
