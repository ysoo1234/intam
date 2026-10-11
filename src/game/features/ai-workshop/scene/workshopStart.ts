import type { GameStartOverlayConfig } from "../../../core/visual/gameStartOverlay";

/** Start-overlay copy for the workshop; the first customer teaches the rest. */
export const AI_WORKSHOP_START = {
  placeName: "생활 속 AI 제작소",
  playDescription: "손님의 이야기를 듣고\n꼭 맞는 AI 상품을 만들어 전해요.",
  keyboardHint: "방향키와 Space 키로도 조작할 수 있어요",
} as const satisfies GameStartOverlayConfig;
