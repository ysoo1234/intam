/**
 * Once the ending has been watched, entering the open gate again goes
 * straight to its last screen — unless more stars have been collected since
 * (7 then 8 or 9): the whole story then plays again with the new stars, so
 * collecting them is worth it. "전체 초기화" (it clears every intam: key) and
 * the test menu's "엔딩 초기화" bring the full story back.
 */
export const ENDING_SEEN_STORAGE_KEY = "intam:ending-seen:v1";
/** Saved before the star count was kept: taken as the fewest stars that open the gate. */
const LEGACY_SEEN_STARS = 7;

/** How many stars the ending was last watched with (undefined: never watched). */
export function getEndingSeenStars(): number | undefined {
  try {
    const saved = window.localStorage.getItem(ENDING_SEEN_STORAGE_KEY);
    if (saved === null) return undefined;
    if (saved === "seen") return LEGACY_SEEN_STARS;
    const stars = Number(saved);
    return Number.isFinite(stars) ? stars : LEGACY_SEEN_STARS;
  } catch {
    return undefined;
  }
}

/** True when the story was already watched with at least `stars` stars. */
export function hasSeenEndingWith(stars: number) {
  const seen = getEndingSeenStars();
  return seen !== undefined && stars <= seen;
}

export function markEndingSeen(stars: number) {
  try {
    window.localStorage.setItem(ENDING_SEEN_STORAGE_KEY, String(stars));
  } catch {
    // Storage may be blocked; the story then simply plays again next time.
  }
}

export function clearEndingSeen() {
  try {
    window.localStorage.removeItem(ENDING_SEEN_STORAGE_KEY);
  } catch {
    // Nothing saved to clear.
  }
}
