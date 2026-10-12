/**
 * Once the ending has been watched, entering the open gate again goes
 * straight to its last screen. "전체 초기화" (it clears every intam: key) and
 * the test menu's "엔딩 초기화" bring the full story back.
 */
export const ENDING_SEEN_STORAGE_KEY = "intam:ending-seen:v1";

export function hasSeenEnding() {
  try {
    return window.localStorage.getItem(ENDING_SEEN_STORAGE_KEY) === "seen";
  } catch {
    return false;
  }
}

export function markEndingSeen() {
  try {
    window.localStorage.setItem(ENDING_SEEN_STORAGE_KEY, "seen");
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
