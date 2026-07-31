export type FlightDataKind = "doc" | "image" | "sound" | "video";

export type FlightQuestion = {
  id: string;
  category: string;
  prompt: string;
  answer: FlightDataKind;
  explanation: string;
};

export const FLIGHT_DATA_META: Record<
  FlightDataKind,
  { label: string; color: number }
> = {
  doc: { label: "문자 데이터", color: 0x60cbd7 },
  image: { label: "이미지 데이터", color: 0xf3a565 },
  sound: { label: "소리 데이터", color: 0xb493e5 },
  video: { label: "영상 데이터", color: 0xf17768 },
};

export const FLIGHT_DATA_KINDS: FlightDataKind[] = [
  "doc",
  "image",
  "sound",
  "video",
];

export const FLIGHT_QUESTIONS: FlightQuestion[] = [
  {
    id: "kind-doc",
    category: "데이터 종류",
    prompt: "글자, 숫자, 기호로 이루어진 데이터는?",
    answer: "doc",
    explanation: "문자 데이터에는 글자, 숫자, 기호가 들어 있어요.",
  },
  {
    id: "kind-image",
    category: "데이터 종류",
    prompt: "사진과 그림으로 이루어진 데이터는?",
    answer: "image",
    explanation: "사진과 그림은 이미지 데이터예요.",
  },
  {
    id: "kind-sound",
    category: "데이터 종류",
    prompt: "목소리와 여러 소리로 이루어진 데이터는?",
    answer: "sound",
    explanation: "목소리와 음악은 소리 데이터예요.",
  },
  {
    id: "kind-video",
    category: "데이터 종류",
    prompt: "움직이는 장면이 이어진 데이터는?",
    answer: "video",
    explanation: "연속된 장면은 영상 데이터예요.",
  },
  {
    id: "face-ai",
    category: "AI에 필요한 데이터",
    prompt: "사람의 얼굴을 구분하는 AI에 가장 필요한 데이터는?",
    answer: "image",
    explanation: "얼굴을 구분하려면 다양한 얼굴 사진이 필요해요.",
  },
  {
    id: "voice-ai",
    category: "AI에 필요한 데이터",
    prompt: "사람의 말을 알아듣는 AI에 가장 필요한 데이터는?",
    answer: "sound",
    explanation: "말을 알아들으려면 다양한 사람의 목소리가 필요해요.",
  },
  {
    id: "writing-ai",
    category: "AI에 필요한 데이터",
    prompt: "맞춤법을 고쳐 주는 AI에 가장 필요한 데이터는?",
    answer: "doc",
    explanation: "맞춤법을 배우려면 많은 문장과 낱말이 필요해요.",
  },
  {
    id: "sports-ai",
    category: "AI에 필요한 데이터",
    prompt: "축구 경기의 움직임을 분석하는 AI에 가장 필요한 데이터는?",
    answer: "video",
    explanation: "움직임을 분석하려면 경기 영상이 필요해요.",
  },
  {
    id: "plant-ai",
    category: "AI에 필요한 데이터",
    prompt: "꽃의 종류를 찾아 주는 AI에 가장 필요한 데이터는?",
    answer: "image",
    explanation: "꽃의 모양과 색을 배우려면 꽃 사진이 필요해요.",
  },
  {
    id: "music-ai",
    category: "AI에 필요한 데이터",
    prompt: "노래를 듣고 제목을 찾아 주는 AI에 가장 필요한 데이터는?",
    answer: "sound",
    explanation: "노래를 구분하려면 다양한 음악 소리가 필요해요.",
  },
  {
    id: "summary-ai",
    category: "AI에 필요한 데이터",
    prompt: "긴 글을 짧게 요약하는 AI에 가장 필요한 데이터는?",
    answer: "doc",
    explanation: "글을 이해하고 요약하려면 많은 문장이 필요해요.",
  },
  {
    id: "traffic-ai",
    category: "AI에 필요한 데이터",
    prompt: "도로 위 자동차의 흐름을 분석하는 AI에 가장 필요한 데이터는?",
    answer: "video",
    explanation: "교통 흐름을 살피려면 이어지는 도로 영상이 필요해요.",
  },
];
