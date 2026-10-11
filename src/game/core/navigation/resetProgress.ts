/**
 * Wipes everything this browser remembers about the game (stars, seen
 * tutorials, the intro story, the dev scene) and reloads, so the game starts
 * again from the first screen exactly like a first visit.
 */
const GAME_STORAGE_PREFIX = "intam:";

function clearGameKeys(storage: Storage | undefined) {
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(GAME_STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage may be blocked; there is then nothing saved to clear.
  }
}

function getStorage(kind: "localStorage" | "sessionStorage") {
  try {
    return typeof window === "undefined" ? undefined : window[kind];
  } catch {
    return undefined;
  }
}

export function resetAllGameProgress() {
  if (typeof window === "undefined") return;
  clearGameKeys(getStorage("localStorage"));
  clearGameKeys(getStorage("sessionStorage"));
  // Drop ?tutorial and similar flags so the page opens on the first screen.
  window.location.replace(window.location.pathname);
}
