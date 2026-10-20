import { WORKSHOP_PRODUCT_DIALOGUES } from "./aiWorkshopDialogues";

export type WorkshopProduct = {
  id: string;
  label: string;
  emoji: string;
  color: number;
  description: string;
};

export type WorkshopRequest = {
  id: string;
  customerRole: string;
  customerEmoji: string;
  customerImage: string;
  customerHappyImage: string;
  productId: string;
  dialogue: string;
  readyDialogue: string;
  thanks: string;
  wrongReplies: string[];
};

export const WORKSHOP_PRODUCTS: WorkshopProduct[] = [
  {
    id: "ai-speaker",
    label: "AI 스피커",
    emoji: "🔊",
    color: 0x73bde2,
    description: "말을 알아듣고 필요한 정보를 찾아 음성으로 알려 줘요.",
  },
  {
    id: "call-translator",
    label: "통화 번역 AI",
    emoji: "📞",
    color: 0xef7d7d,
    description: "통화 중인 두 사람의 말을 바로 번역해 들려줘요.",
  },
  {
    id: "photo-translator",
    label: "사진 번역 AI",
    emoji: "📷",
    color: 0xf0bc55,
    description: "사진 속 글자를 읽고 원하는 언어로 번역해 줘요.",
  },
  {
    id: "plant-camera",
    label: "식물 찾기 AI",
    emoji: "🌼",
    color: 0x86c96a,
    description: "식물 사진을 살펴보고 이름과 특징을 찾아 줘요.",
  },
  {
    id: "face-lock",
    label: "얼굴 인식 AI",
    emoji: "🙂",
    color: 0xe99ab6,
    description: "등록된 얼굴인지 확인한 뒤 안전하게 잠금을 풀어 줘요.",
  },
  {
    id: "spell-checker",
    label: "맞춤법 도우미 AI",
    emoji: "✏️",
    color: 0x7aaee5,
    description: "쓴 글을 읽고 맞춤법이 틀린 곳을 찾아 알려 줘요.",
  },
  {
    id: "smart-fridge",
    label: "스마트 냉장고",
    emoji: "🧊",
    color: 0x6fcab7,
    description: "보관된 재료를 살펴보고 만들 수 있는 음식을 추천해 줘요.",
  },
  {
    id: "robot-vacuum",
    label: "로봇 청소기",
    emoji: "🧹",
    color: 0xea8d73,
    description: "주변을 살피며 스스로 이동해 바닥을 청소해요.",
  },
  {
    id: "pet-care-robot",
    label: "반려동물 돌봄 AI",
    emoji: "🐶",
    color: 0x78c99a,
    description: "보호자가 없는 동안 반려동물 곁에서 돌봐 줘요.",
  },
  {
    id: "security-camera",
    label: "AI 보안 카메라",
    emoji: "📹",
    color: 0x8d9fd7,
    description: "낯선 사람이나 위험한 움직임을 찾아 바로 알려 줘요.",
  },
  {
    id: "smart-air-purifier",
    label: "스마트 공기청정기",
    emoji: "🌬️",
    color: 0x6bc6cd,
    description: "공기 상태를 확인하고 스스로 알맞게 깨끗하게 해요.",
  },
  {
    id: "smart-washer",
    label: "스마트 세탁기",
    emoji: "🫧",
    color: 0x789fe0,
    description: "옷감과 오염 상태를 살펴 알맞은 방법으로 세탁해요.",
  },
  {
    id: "study-helper",
    label: "AI 학습 도우미",
    emoji: "📚",
    color: 0x9e8ad8,
    description: "문제를 푼 과정을 살펴보고 틀린 이유를 쉽게 설명해 줘요.",
  },
  {
    id: "nutrition-kiosk",
    label: "영양 분석 키오스크",
    emoji: "🥗",
    color: 0xef9c75,
    description: "음식 사진을 분석해 어떤 영양소가 들었는지 알려 줘요.",
  },
  {
    id: "medical-reader",
    label: "엑스레이 판독 AI",
    emoji: "🩻",
    color: 0x6faee7,
    description: "의료 영상에서 이상이 의심되는 부분을 빠르게 표시해 줘요.",
  },
  {
    id: "smart-band",
    label: "스마트밴드",
    emoji: "⌚",
    color: 0x74c5b0,
    description: "심박수와 걸음 수 같은 움직임 정보를 계속 확인해 줘요.",
  },
  {
    id: "ai-wheelchair",
    label: "AI 휠체어",
    emoji: "♿",
    color: 0x779bd6,
    description: "주변을 살피고 안전한 길을 찾아 원하는 곳까지 이동해요.",
  },
  {
    id: "road-safety-cctv",
    label: "도로 안전 CCTV",
    emoji: "🚦",
    color: 0x6dadd6,
    description: "도로 영상을 분석해 위험한 상황을 빠르게 찾아 알려 줘요.",
  },
  {
    id: "autonomous-car",
    label: "자율주행 자동차",
    emoji: "🚗",
    color: 0x8c9edb,
    description: "차 주변과 도로를 살피며 목적지까지 안전하게 운전해요.",
  },
  {
    id: "delivery-robot",
    label: "자율주행 배달 로봇",
    emoji: "📦",
    color: 0xe67e6b,
    description: "골목과 보행로를 살피며 물건을 집 앞까지 배달해요.",
  },
  {
    id: "drone-taxi",
    label: "드론 택시",
    emoji: "🚁",
    color: 0x65b9c4,
    description: "하늘길을 이용해 목적지까지 빠르게 이동해요.",
  },
  {
    id: "crop-drone",
    label: "병해충 탐지 드론",
    emoji: "🛸",
    color: 0x82bf67,
    description: "넓은 밭을 촬영하고 병해충이 의심되는 작물을 찾아 줘요.",
  },
  {
    id: "harvest-robot",
    label: "AI 수확 로봇",
    emoji: "🍎",
    color: 0xe89166,
    description: "과일의 익은 정도를 살펴 잘 익은 과일만 골라 수확해요.",
  },
  {
    id: "greenhouse-computer",
    label: "온실 조절 AI",
    emoji: "🌡️",
    color: 0x66c4a6,
    description: "온도와 습도, 햇빛의 양을 작물에 알맞게 조절해요.",
  },
  {
    id: "smart-watering",
    label: "스마트 물주기 AI",
    emoji: "💧",
    color: 0x65aeda,
    description: "흙과 작물 상태를 살펴 필요한 만큼만 물을 줘요.",
  },
  {
    id: "performance-interpreter",
    label: "AI 공연 통역기",
    emoji: "🎭",
    color: 0x8e79d0,
    description: "공연 속 배우의 말을 관객이 원하는 언어로 바로 통역해 줘요.",
  },
];

type WorkshopRequestSeed = Omit<
  WorkshopRequest,
  | "customerImage"
  | "customerHappyImage"
  | "readyDialogue"
  | "thanks"
  | "wrongReplies"
> & {
  thanks?: string;
  wrongReplies?: string[];
};

const makeWorkshopRequest = (request: WorkshopRequestSeed): WorkshopRequest => {
  const productLabel =
    WORKSHOP_PRODUCTS.find((product) => product.id === request.productId)?.label ??
    "이 물건";
  const productDialogue = WORKSHOP_PRODUCT_DIALOGUES[request.productId];

  return {
    ...request,
    customerImage: `/assets/customers/v3-game/${request.id}-worried.webp`,
    customerHappyImage: `/assets/customers/v3-game/${request.id}-happy.webp`,
    readyDialogue:
      productDialogue?.ready ?? `${productLabel}가 완성됐군요!`,
    thanks:
      request.thanks ??
      productDialogue?.thanks ??
      `${productLabel}, 바로 제가 찾던 물건이에요!`,
    wrongReplies: request.wrongReplies ?? [
      "제가 말한 어려움과는 조금 다른 물건 같아요. 부탁을 다시 들어 봐 주세요.",
      "이 물건으로는 문제가 해결되지 않을 것 같아요. 다른 상품을 골라 주세요.",
    ],
  };
};

export const WORKSHOP_REQUESTS: WorkshopRequest[] = [
  makeWorkshopRequest({
    id: "school-prep-student",
    customerRole: "등교 준비를 하는 학생",
    customerEmoji: "🎒",
    productId: "ai-speaker",
    dialogue: "하늘이 수상해요. 집을 나가면서 우산을 챙겨야 하는지 말로 물어보고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "foreign-call-student",
    customerRole: "외국인 친구와 통화하는 학생",
    customerEmoji: "📱",
    productId: "call-translator",
    dialogue:
      "외국인 친구와 수다를 떨고 싶은데 친구의 말을 바로 우리말로 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "foreign-restaurant-traveler",
    customerRole: "외국 식당에 간 여행객",
    customerEmoji: "🧳",
    productId: "photo-translator",
    dialogue:
      "맛있는 냄새는 나는데 메뉴판을 못 읽겠어요. 찍어서 우리말로 보고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "science-homework-student",
    customerRole: "과학 숙제를 하는 학생",
    customerEmoji: "🌼",
    productId: "plant-camera",
    dialogue:
      "예쁜 꽃을 찾았는데 이름표가 없어요. 사진을 찍어 이름을 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "phone-parent",
    customerRole: "휴대 전화를 사용하는 보호자",
    customerEmoji: "🔐",
    productId: "face-lock",
    dialogue:
      "오늘도 비밀번호를 잊어버렸어요. 이제는 제 얼굴로 잠금을 풀고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "diary-student",
    customerRole: "일기를 쓰는 학생",
    customerEmoji: "📔",
    productId: "spell-checker",
    dialogue:
      "일기는 멋지게 썼는데 맞춤법이 걱정돼요. 틀린 곳을 찾아 바르게 고치고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "dinner-parent",
    customerRole: "저녁을 준비하는 보호자",
    customerEmoji: "🍳",
    productId: "smart-fridge",
    dialogue:
      "냉장고에는 재료가 가득한데 메뉴가 떠오르지 않아요. 만들 수 있는 음식을 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "busy-cleaner",
    customerRole: "청소할 시간이 없는 사람",
    customerEmoji: "🧹",
    productId: "robot-vacuum",
    dialogue:
      "먼지는 매일 쌓여 가는데 청소할 시간이 부족해요. 청소를 도와주는 기기가 필요해요.",
  }),
  makeWorkshopRequest({
    id: "pet-owner",
    customerRole: "반려견을 키우는 사람",
    customerEmoji: "🐕",
    productId: "pet-care-robot",
    dialogue:
      "제가 나가면 강아지가 심심할까 걱정돼요. 곁에서 돌봐 줄 로봇이 필요해요.",
  }),
  makeWorkshopRequest({
    id: "elderly-home-alone",
    customerRole: "혼자 사는 어르신",
    customerEmoji: "🏠",
    productId: "security-camera",
    dialogue:
      "낯선 손님은 반갑지 않아요. 모르는 사람이 들어오면 바로 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "stuffy-air-resident",
    customerRole: "공기가 답답한 집의 주민",
    customerEmoji: "🌬️",
    productId: "smart-air-purifier",
    dialogue:
      "집 안 공기가 답답해서 숨을 크게 쉬기 어려워요. 스스로 공기를 좋게 만들어주면 좋겠어요.",
  }),
  makeWorkshopRequest({
    id: "frequent-laundry-person",
    customerRole: "세탁을 자주 하는 사람",
    customerEmoji: "👕",
    productId: "smart-washer",
    dialogue:
      "옷마다 세탁법이 달라 시험 문제를 푸는 것 같아요. 세탁을 도와주면 좋겠어요.",
  }),
  makeWorkshopRequest({
    id: "wrong-answer-student",
    customerRole: "문제를 틀린 학생",
    customerEmoji: "📝",
    productId: "study-helper",
    dialogue:
      "답을 틀렸는데 이유를 잘 모르겠어요. 어디서 잘못했는지 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "cafeteria-student",
    customerRole: "급식을 먹는 학생",
    customerEmoji: "🍱",
    productId: "nutrition-kiosk",
    dialogue:
      "오늘 급식이 맛있는데 어떤 영양소가 들었는지 급식판을 찍어 알고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "xray-doctor",
    customerRole: "엑스레이를 보는 의사",
    customerEmoji: "🧑‍⚕️",
    productId: "medical-reader",
    dialogue:
      "엑스레이 사진 속 작은 이상도 놓치고 싶지 않아요. 도움을 받아 찾아보고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "exercising-elderly",
    customerRole: "운동하는 어르신",
    customerEmoji: "🚶",
    productId: "smart-band",
    dialogue:
      "오늘은 제가 얼마나 씩씩하게 움직였는지 심박수와 걸음 수로 확인하고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "mobility-patient",
    customerRole: "혼자 이동하기 힘든 환자",
    customerEmoji: "♿",
    productId: "ai-wheelchair",
    dialogue:
      "병원 복도가 미로처럼 느껴져요. 가고 싶은 곳까지 도움을 받아 이동하고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "crosswalk-police",
    customerRole: "횡단보도를 관리하는 경찰",
    customerEmoji: "👮",
    productId: "road-safety-cctv",
    dialogue:
      "횡단보도에서는 작은 위험도 놓치면 안 돼요. 위험한 상황을 알아차리고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "novice-driver",
    customerRole: "운전이 서툰 사람",
    customerEmoji: "🚗",
    productId: "autonomous-car",
    dialogue:
      "운전이 아직 서툴러서 앞과 옆, 뒤를 한꺼번에 살피기 어려워요. 자동차가 스스로 주변을 살피며 안전하게 운전해 주면 좋겠어요.",
  }),
  makeWorkshopRequest({
    id: "courier",
    customerRole: "택배 기사",
    customerEmoji: "📦",
    productId: "delivery-robot",
    dialogue:
      "좁은 골목만 만나면 너무 떨려요. 집 앞까지 택배를 쉽게 배송하고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "long-distance-traveler",
    customerRole: "멀리 이동하려는 사람",
    customerEmoji: "🧳",
    productId: "drone-taxi",
    dialogue:
      "도로 위 차들이 거북이처럼 움직여요. 하늘로 빠르게 이동하고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "wide-field-farmer",
    customerRole: "넓은 밭을 관리하는 농부",
    customerEmoji: "🧑‍🌾",
    productId: "crop-drone",
    dialogue:
      "밭이 너무 넓어 병든 작물이 숨으면 찾기 어려워요. 하늘에서 찍어 찾고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "orchard-farmer",
    customerRole: "과수원을 운영하는 농부",
    customerEmoji: "🍎",
    productId: "harvest-robot",
    dialogue:
      "과일마다 익는 속도가 달라 눈이 빙글빙글해요. 잘 익은 과일만 따고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "greenhouse-farmer",
    customerRole: "온실을 운영하는 농부",
    customerEmoji: "🌱",
    productId: "greenhouse-computer",
    dialogue:
      "온실 날씨가 자꾸 변덕을 부려요. 온도와 습도, 햇빛의 양을 알맞게 맞추고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "water-saving-farmer",
    customerRole: "물을 아껴 쓰고 싶은 농부",
    customerEmoji: "💧",
    productId: "smart-watering",
    dialogue:
      "작물은 목마른 만큼만 물을 마셔야 해요. 흙을 살펴 필요한 만큼만 주고 싶어요.",
  }),
  makeWorkshopRequest({
    id: "foreign-theatergoer",
    customerRole: "한국 공연을 보는 외국인",
    customerEmoji: "🎭",
    productId: "performance-interpreter",
    dialogue:
      "배우의 표정은 알겠는데 대사는 모르겠어요. 우리나라 말로 바로 듣고 싶어요.",
  }),
];

export const WORKSHOP_PRODUCT_BY_ID = new Map(
  WORKSHOP_PRODUCTS.map((product) => [product.id, product]),
);
