import {
  EMPTY_WORLD_PROGRESS,
  mergeWorldActivityResult,
  readWorldProgressSnapshot,
  WORLD_ACTIVITY_IDS,
  type WorldProgressSnapshot,
} from "./worldProgress";

/**
 * Stars survive a page reload. The browser copy is a plain object keyed by
 * activity id, versioned so a future layout change can migrate or discard it.
 */
export const WORLD_PROGRESS_STORAGE_KEY = "intam:world-progress:v1";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    // Privacy modes can throw on access; the registry still keeps the session alive.
    return undefined;
  }
}

export function loadStoredWorldProgress(storage?: StorageLike): WorldProgressSnapshot {
  const target = resolveStorage(storage);
  if (!target) return EMPTY_WORLD_PROGRESS;
  try {
    const raw = target.getItem(WORLD_PROGRESS_STORAGE_KEY);
    if (!raw) return EMPTY_WORLD_PROGRESS;
    return readWorldProgressSnapshot(JSON.parse(raw));
  } catch {
    return EMPTY_WORLD_PROGRESS;
  }
}

export function saveStoredWorldProgress(progress: WorldProgressSnapshot, storage?: StorageLike): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(WORLD_PROGRESS_STORAGE_KEY, JSON.stringify(readWorldProgressSnapshot(progress)));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredWorldProgress(storage?: StorageLike) {
  const target = resolveStorage(storage);
  try {
    target?.removeItem(WORLD_PROGRESS_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Keeps the best stars from both the live registry and the saved copy. */
export function mergeWorldProgressSnapshots(
  first: WorldProgressSnapshot,
  second: WorldProgressSnapshot,
): WorldProgressSnapshot {
  return WORLD_ACTIVITY_IDS.reduce(
    (merged, featureId) => mergeWorldActivityResult(merged, { featureId, stars: second[featureId] }),
    first,
  );
}
