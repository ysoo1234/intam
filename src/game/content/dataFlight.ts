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
    explanation: "글자, 숫자, 기호로 이루어진 것은 문자 데이터예요.",
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
    explanation: "목소리와 여러 소리는 소리 데이터예요.",
  },
  {
    id: "kind-video",
    category: "데이터 종류",
    prompt: "움직이는 장면이 이어진 데이터는?",
    answer: "video",
    explanation: "움직이는 장면이 이어지면 영상 데이터예요.",
  },
  {
    id: "spelling-ai",
    category: "AI에 필요한 데이터",
    prompt: "틀린 맞춤법을 고쳐 주는 AI에 필요한 데이터는?",
    answer: "doc",
    explanation: "올바른 문장과 단어로 된 문자 데이터가 필요해요.",
  },
  {
    id: "next-word-ai",
    category: "AI에 필요한 데이터",
    prompt: "다음에 올 단어를 추천하는 AI에 필요한 데이터는?",
    answer: "doc",
    explanation: "많은 문장을 배워야 이어질 단어를 추천할 수 있어요.",
  },
  {
    id: "kind-words-ai",
    category: "AI에 필요한 데이터",
    prompt: "글이 고운 말인지 살펴 주는 AI에 필요한 데이터는?",
    answer: "doc",
    explanation: "바르고 고운 표현이 담긴 글이 필요해요.",
  },
  {
    id: "text-translate-ai",
    category: "AI에 필요한 데이터",
    prompt: "글로 쓴 문장을 영어로 바꿔 주는 AI에 필요한 데이터는?",
    answer: "doc",
    explanation: "글로 쓴 문장을 바꾸려면 문자 데이터가 필요해요.",
  },
  {
    id: "face-ai",
    category: "AI에 필요한 데이터",
    prompt: "학생 얼굴을 알아보는 AI에 필요한 데이터는?",
    answer: "image",
    explanation: "여러 표정과 방향에서 찍은 얼굴 사진이 필요해요.",
  },
  {
    id: "nutrition-ai",
    category: "AI에 필요한 데이터",
    prompt: "급식 식판의 영양을 알려 주는 AI에 필요한 데이터는?",
    answer: "image",
    explanation: "다양한 음식 사진이 있어야 영양을 분석해요.",
  },
  {
    id: "egg-ai",
    category: "AI에 필요한 데이터",
    prompt: "계란을 찍어 품질을 평가하는 AI에 필요한 데이터는?",
    answer: "image",
    explanation: "좋은 계란과 나쁜 계란의 사진이 필요해요.",
  },
  {
    id: "flower-search",
    category: "AI에 필요한 데이터",
    prompt: "꽃을 찍어 이름을 찾아 주는 AI에 필요한 데이터는?",
    answer: "image",
    explanation: "꽃의 모양과 색을 배우려면 꽃 사진이 필요해요.",
  },
  {
    id: "speaker-ai",
    category: "AI에 필요한 데이터",
    prompt: "말을 알아듣고 음악을 틀어 주는 AI 스피커에 필요한 데이터는?",
    answer: "sound",
    explanation: "다양한 사람의 목소리가 필요해요.",
  },
  {
    id: "pronunciation-ai",
    category: "AI에 필요한 데이터",
    prompt: "영어 발음을 듣고 도와주는 AI에 필요한 데이터는?",
    answer: "sound",
    explanation: "정확한 발음이 담긴 소리 데이터가 필요해요.",
  },
  {
    id: "call-translate-ai",
    category: "AI에 필요한 데이터",
    prompt: "통화를 번역하는 AI가 먼저 알아들어야 할 데이터는?",
    answer: "sound",
    explanation: "번역하기 전에 상대의 목소리를 먼저 알아들어요.",
  },
  {
    id: "voice-search",
    category: "AI에 필요한 데이터",
    prompt: "'오늘의 날씨'라고 말해서 찾을 때 쓰는 데이터는?",
    answer: "sound",
    explanation: "목소리로 찾는 음성 검색이에요.",
  },
  {
    id: "sports-ai",
    category: "AI에 필요한 데이터",
    prompt: "선수와 공의 움직임을 따라가는 AI에 필요한 데이터는?",
    answer: "video",
    explanation: "연속된 장면이 담긴 경기 영상이 필요해요.",
  },
  {
    id: "pet-camera-ai",
    category: "AI에 필요한 데이터",
    prompt: "집에 있는 강아지의 움직임을 살피는 AI에 필요한 데이터는?",
    answer: "video",
    explanation: "강아지가 움직이는 모습이 담긴 영상이 필요해요.",
  },
  {
    id: "security-ai",
    category: "AI에 필요한 데이터",
    prompt: "동네의 수상한 움직임을 찾는 AI에 필요한 데이터는?",
    answer: "video",
    explanation: "움직임을 살피려면 이어지는 영상이 필요해요.",
  },
  {
    id: "traffic-ai",
    category: "AI에 필요한 데이터",
    prompt: "차들의 움직임을 살펴 신호를 바꾸는 AI에 필요한 데이터는?",
    answer: "video",
    explanation: "차가 움직이는 도로 영상이 필요해요.",
  },
];
