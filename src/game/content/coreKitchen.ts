export type CoreKind = "input" | "process" | "output";

export type AiCore = {
  id: string;
  kind: CoreKind;
  label: string;
  emoji: string;
  description: string;
};

export type KitchenOrder = {
  id: string;
  field: string;
  customerRole: string;
  dialogue: string;
  solutionLabel: string;
  explanation: string;
  customerEmoji: string;
  customerTone: number;
  problemIcon: string;
  solvedIcon: string;
  recipe: Record<CoreKind, string>;
};

export const CORE_KIND_META: Record<
  CoreKind,
  { label: string; shortLabel: string; color: number }
> = {
  input: { label: "무엇을 느낄까?", shortLabel: "감각", color: 0x70c6d5 },
  process: { label: "어떻게 생각할까?", shortLabel: "생각", color: 0xb69be7 },
  output: { label: "무엇을 해 줄까?", shortLabel: "행동", color: 0x70cfaa },
};

export const AI_CORES: AiCore[] = [
  {
    id: "speech",
    kind: "input",
    label: "말소리",
    emoji: "🎙️",
    description: "사람이 말하는 소리를 받아요.",
  },
  {
    id: "photo",
    kind: "input",
    label: "사진·영상",
    emoji: "📷",
    description: "카메라로 사진이나 영상을 받아요.",
  },
  {
    id: "text",
    kind: "input",
    label: "글",
    emoji: "📝",
    description: "문장이나 낱말을 받아요.",
  },
  {
    id: "sensor",
    kind: "input",
    label: "센서 정보",
    emoji: "📡",
    description: "온도, 움직임, 심박수 같은 정보를 받아요.",
  },
  {
    id: "preference",
    kind: "input",
    label: "사용 기록",
    emoji: "🗂️",
    description: "사용자가 좋아한 것과 이용 기록을 살펴요.",
  },
  {
    id: "location",
    kind: "input",
    label: "위치·도로",
    emoji: "🗺️",
    description: "현재 위치와 주변 길의 정보를 받아요.",
  },
  {
    id: "recognize",
    kind: "process",
    label: "인식",
    emoji: "🔍",
    description: "들어온 정보가 무엇인지 알아봐요.",
  },
  {
    id: "translate",
    kind: "process",
    label: "번역",
    emoji: "🌐",
    description: "한 언어를 다른 언어로 바꿔요.",
  },
  {
    id: "recommend",
    kind: "process",
    label: "추천",
    emoji: "✨",
    description: "사용자에게 알맞은 것을 골라요.",
  },
  {
    id: "monitor",
    kind: "process",
    label: "분석·확인",
    emoji: "📊",
    description: "정보의 변화나 이상한 부분을 살펴요.",
  },
  {
    id: "plan",
    kind: "process",
    label: "경로 계획",
    emoji: "🧭",
    description: "안전하고 알맞은 이동 경로를 정해요.",
  },
  {
    id: "generate",
    kind: "process",
    label: "새로 만들기",
    emoji: "🪄",
    description: "글이나 그림 같은 새로운 결과를 만들어요.",
  },
  {
    id: "control",
    kind: "process",
    label: "자동 조절",
    emoji: "⚙️",
    description: "상태에 맞춰 기기를 자동으로 조절해요.",
  },
  {
    id: "screen",
    kind: "output",
    label: "화면 표시",
    emoji: "🖥️",
    description: "결과를 글이나 그림으로 보여줘요.",
  },
  {
    id: "voice-answer",
    kind: "output",
    label: "말로 답하기",
    emoji: "🔊",
    description: "찾은 결과를 소리로 알려 줘요.",
  },
  {
    id: "alert",
    kind: "output",
    label: "알림 보내기",
    emoji: "🔔",
    description: "중요한 변화가 생기면 바로 알려 줘요.",
  },
  {
    id: "move",
    kind: "output",
    label: "움직여 작업",
    emoji: "🦾",
    description: "기계가 움직여 실제 작업을 해요.",
  },
  {
    id: "device-control",
    kind: "output",
    label: "기기 제어",
    emoji: "🎛️",
    description: "연결된 기기를 켜고 끄거나 조절해요.",
  },
  {
    id: "create-content",
    kind: "output",
    label: "결과물 만들기",
    emoji: "🎨",
    description: "새로운 글이나 그림을 완성해요.",
  },
];

export const KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: "rain-speaker",
    field: "말·글·이미지",
    customerRole: "등교 준비를 하는 학생",
    dialogue: "오늘 비가 오는지 말로 물어보고 싶어요.",
    solutionLabel: "AI 스피커",
    explanation: "AI 스피커는 말소리를 인식하고 필요한 정보를 찾아 말로 답해 줍니다.",
    customerEmoji: "🎒",
    customerTone: 0x70c6d5,
    problemIcon: "☔❓",
    solvedIcon: "🔊☔",
    recipe: {
      input: "speech",
      process: "recognize",
      output: "voice-answer",
    },
  },
  {
    id: "menu-photo",
    field: "말·글·이미지",
    customerRole: "외국 식당에 간 여행객",
    dialogue: "메뉴판을 찍어서 우리말로 보고 싶어요.",
    solutionLabel: "사진 번역기",
    explanation: "사진 번역기는 사진 속 글자를 읽고 번역하여 화면에 보여 줍니다.",
    customerEmoji: "🧳",
    customerTone: 0xf5bd46,
    problemIcon: "📜🌐",
    solvedIcon: "📱✅",
    recipe: {
      input: "photo",
      process: "translate",
      output: "screen",
    },
  },
  {
    id: "plant-camera",
    field: "말·글·이미지",
    customerRole: "과학 숙제를 하는 학생",
    dialogue: "사진 속 꽃의 이름을 알고 싶어요.",
    solutionLabel: "식물 찾기 카메라",
    explanation: "식물 찾기 카메라는 사진을 인식하여 식물의 이름을 화면에 보여 줍니다.",
    customerEmoji: "🌼",
    customerTone: 0x70cfaa,
    problemIcon: "🌺❓",
    solvedIcon: "🌺🔍",
    recipe: {
      input: "photo",
      process: "recognize",
      output: "screen",
    },
  },
  {
    id: "robot-vacuum",
    field: "가정",
    customerRole: "청소할 시간이 없는 사람",
    dialogue: "바닥의 먼지를 스스로 찾아서 청소해 주세요.",
    solutionLabel: "로봇 청소기",
    explanation: "로봇 청소기는 센서로 주변을 살피고 이동 경로를 계획하여 청소합니다.",
    customerEmoji: "🧹",
    customerTone: 0xf39cb2,
    problemIcon: "🏠💨",
    solvedIcon: "🤖✨",
    recipe: {
      input: "sensor",
      process: "plan",
      output: "move",
    },
  },
  {
    id: "smart-home",
    field: "가정",
    customerRole: "더운 방에 있는 학생",
    dialogue: "방의 온도와 습도를 알맞게 맞추고 싶어요.",
    solutionLabel: "스마트홈 조절기",
    explanation: "스마트홈 조절기는 센서 정보를 살펴 집 안 기기를 자동으로 조절합니다.",
    customerEmoji: "🥵",
    customerTone: 0xf0a565,
    problemIcon: "🌡️💧",
    solvedIcon: "🏠🍃",
    recipe: {
      input: "sensor",
      process: "control",
      output: "device-control",
    },
  },
  {
    id: "study-recommend",
    field: "교육",
    customerRole: "수학 공부를 하는 학생",
    dialogue: "제가 푼 문제와 비슷한 문제를 더 풀고 싶어요.",
    solutionLabel: "AI 학습 추천기",
    explanation: "AI 학습 추천기는 학습 기록을 살펴 학생에게 알맞은 문제를 추천합니다.",
    customerEmoji: "📐",
    customerTone: 0xb69be7,
    problemIcon: "📘🤔",
    solvedIcon: "📚✨",
    recipe: {
      input: "preference",
      process: "recommend",
      output: "screen",
    },
  },
  {
    id: "smart-band",
    field: "건강·의료",
    customerRole: "운동하는 어르신",
    dialogue: "제 심박수와 걸음 수를 계속 확인하고 싶어요.",
    solutionLabel: "스마트밴드",
    explanation: "스마트밴드는 센서로 심박수와 걸음 수를 확인하고 변화를 알려 줍니다.",
    customerEmoji: "🚶",
    customerTone: 0x7ed7c4,
    problemIcon: "❤️👣",
    solvedIcon: "⌚✅",
    recipe: {
      input: "sensor",
      process: "monitor",
      output: "alert",
    },
  },
  {
    id: "medical-image",
    field: "건강·의료",
    customerRole: "엑스레이를 보는 의사",
    dialogue: "사진 속 이상한 부분을 빨리 찾을 수 있게 도와주세요.",
    solutionLabel: "의료 영상 판독기",
    explanation: "의료 영상 판독기는 살펴볼 부분을 표시하여 의사의 판단을 돕습니다.",
    customerEmoji: "🧑‍⚕️",
    customerTone: 0x70c6d5,
    problemIcon: "🩻❓",
    solvedIcon: "🩻✨",
    recipe: {
      input: "photo",
      process: "monitor",
      output: "screen",
    },
  },
  {
    id: "auto-parking",
    field: "교통·자동차",
    customerRole: "주차가 어려운 운전자",
    dialogue: "빈 주차 공간을 찾고 차를 안전하게 세워 주세요.",
    solutionLabel: "AI 자동 주차 장치",
    explanation: "AI 자동 주차 장치는 주변 위치를 살피고 경로를 계획하여 차를 제어합니다.",
    customerEmoji: "🚙",
    customerTone: 0x75aee4,
    problemIcon: "🅿️❓",
    solvedIcon: "🚗✅",
    recipe: {
      input: "location",
      process: "plan",
      output: "device-control",
    },
  },
  {
    id: "crop-drone",
    field: "농업",
    customerRole: "넓은 밭을 관리하는 농부",
    dialogue: "하늘에서 농작물을 찍어 병든 곳을 찾아 주세요.",
    solutionLabel: "병해충 탐지 드론",
    explanation: "병해충 탐지 드론은 농작물 사진을 분석하여 살펴볼 곳을 알려 줍니다.",
    customerEmoji: "🧑‍🌾",
    customerTone: 0x91c75b,
    problemIcon: "🌾📷",
    solvedIcon: "🚁🔍",
    recipe: {
      input: "photo",
      process: "monitor",
      output: "alert",
    },
  },
  {
    id: "performance-translation",
    field: "문화·예술",
    customerRole: "한국 공연을 보는 외국인",
    dialogue: "배우의 말을 제 나라 말로 바로 알고 싶어요.",
    solutionLabel: "AI 공연 통역기",
    explanation: "AI 공연 통역기는 배우의 말소리를 번역하여 관람객에게 알려 줍니다.",
    customerEmoji: "🎭",
    customerTone: 0xe89858,
    problemIcon: "🎤🌐",
    solvedIcon: "🎭✅",
    recipe: {
      input: "speech",
      process: "translate",
      output: "voice-answer",
    },
  },
  {
    id: "poster-art",
    field: "말·글·이미지",
    customerRole: "포스터를 만드는 학생",
    dialogue: "제가 설명한 모습대로 그림을 만들어 주세요.",
    solutionLabel: "AI 그림 만들기",
    explanation: "AI 그림 만들기는 글로 설명한 내용을 바탕으로 새로운 그림을 만듭니다.",
    customerEmoji: "🖼️",
    customerTone: 0xf3a7b9,
    problemIcon: "📝🎨",
    solvedIcon: "🖼️✨",
    recipe: {
      input: "text",
      process: "generate",
      output: "create-content",
    },
  },
];

export const KITCHEN_ROUND_COUNT = 5;
