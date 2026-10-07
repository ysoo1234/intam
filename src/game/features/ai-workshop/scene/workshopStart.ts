import type { GameStartOverlayConfig } from "../../../core/visual/gameStartOverlay";

/** Start-overlay copy and tutorial cards for the workshop. */
export const AI_WORKSHOP_START = {
  placeName: "생활 속 AI 제작소",
  playDescription: "손님에게 꼭 맞는 AI 상품을 만들어 전해요.",
  steps: [
    { icon: "player-front", iconSize: 80, title: "이야기를 들어요", text: "손님이 어떤 도움이\n필요한지 읽어요." },
    { icon: "workshop-product-ai-speaker", title: "상품을 골라요", text: "선반에서 알맞은\nAI 상품을 집어요." },
    { icon: "workshop-tool-hammer", title: "만들어서 전해요", text: "작업대에서 제작한 뒤\n손님에게 가져다줘요." },
  ],
  controlsHint: "방향키 · WASD · 화면 터치로 이동  ·  Space 집기/전달",
} as const satisfies GameStartOverlayConfig;
