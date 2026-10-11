/**
 * Words of the ending (textbook pp.102-103 epilogue, retold for the village):
 * Midi's lines, the certificate text and the nine textbook gems. Pure data.
 */
export type EndingMood = "idle" | "happy" | "surprised";

export type EndingLine = Readonly<{ text: string; mood: EndingMood }>;

export const ENDING_LINES = {
  starsAwake: { text: "우리가 모은 별이야! 이제 AI 월드에 빛을 돌려주자.", mood: "surprised" },
  villageShines: { text: "마을 전체가 빛나고 있어!", mood: "happy" },
  doorOpen: { text: "너희 세계로 가는 문이 열렸어!", mood: "surprised" },
  guide1: { text: "이제 너는 현실 세계의 AI 길잡이야.", mood: "idle" },
  guide2: { text: "AI가 사람을 돕도록 지켜 줄 거지?", mood: "idle" },
  thanks: { text: "고마워! 가기 전에 우리 기념사진 찍자!", mood: "happy" },
  farewell: { text: "정말 고마웠어. 안녕!", mood: "happy" },
} as const satisfies Record<string, EndingLine>;

export const ENDING_PROMISE_LABEL = "약속해요!";

export const ENDING_CERTIFICATE = {
  book: "초6 · 신나는 인공지능과 윤리 탐험",
  title: "AI 월드 탐험가 증명서",
  nameLabel: "탐험가",
  name: "AI 월드 탐험가",
  gemsLabel: "교재에서 모은 보석 9개",
  starsLabel: "배움마을에서 모은 별",
  statement: [
    "위 탐험가는 「신나는 인공지능과 윤리 탐험」을 끝까지 잘 마치고",
    "AI 월드의 빛을 되찾았기에 이 증명서를 드립니다.",
  ],
  fileName: "AI월드탐험가증명서.png",
} as const;

/** The nine gems of the textbook's board (p.101), in board order. */
export const ENDING_GEMS = [
  { name: "공공", color: "#5fc98a" },
  { name: "편리", color: "#62c3ea" },
  { name: "생활", color: "#f2667a" },
  { name: "완성", color: "#f59b3a" },
  { name: "보호", color: "#b9c1cf" },
  { name: "약속", color: "#f4cf3e" },
  { name: "책임", color: "#6f9ce8" },
  { name: "분류", color: "#9ad04f" },
  { name: "소통", color: "#9a72d8" },
] as const;

/** Captions under the certificate while taking the photo (Midi's voice). */
export const ENDING_PHOTO_CAPTIONS = {
  intro: "카메라를 켜면 미디와 함께 사진을 찍을 수 있어요. 사진은 이 기기에만 남아요.",
  asking: "위에 뜬 창에서 '허용'을 눌러 주세요.",
  preview: "준비되면 찰칵! 버튼을 눌러요.",
  noCamera: "카메라를 쓸 수 없어서 미디 그림으로 만들었어요.",
  done: "증명서 완성! 저장하면 이 기기에 사진으로 남아요.",
  saved: "저장했어요!",
} as const;

export const ENDING_FINALE = {
  title: "AI 월드가 빛을 되찾았어요!",
  midi: "또 만나자!",
  returnToVillage: "마을로 돌아가기",
  showPhoto: "사진 확인하기",
} as const;
