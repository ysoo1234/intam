/**
 * Which first-play tutorials this browser has finished. Kept apart from the
 * star progress so clearing stars does not replay every tutorial.
 * `?tutorial` in the address bar replays them all (classroom demos, testing).
 */
export const TUTORIAL_PROGRESS_STORAGE_KEY = "intam:tutorials-seen:v1";

export type TutorialId = "village" | "ai-workshop";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readSeen(target: StorageLike): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(target.getItem(TUTORIAL_PROGRESS_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function isTutorialReplayRequested() {
  try {
    return (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("tutorial")
    );
  } catch {
    return false;
  }
}

export function shouldPlayTutorial(id: TutorialId, storage?: StorageLike) {
  if (!storage && isTutorialReplayRequested()) return true;
  const target = resolveStorage(storage);
  // Without storage there is no record, so the tutorial plays.
  if (!target) return true;
  return readSeen(target)[id] !== true;
}

export function markTutorialSeen(id: TutorialId, storage?: StorageLike) {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(
      TUTORIAL_PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...readSeen(target), [id]: true }),
    );
  } catch {
    // Storage may be blocked; the tutorial simply plays again next time.
  }
}
