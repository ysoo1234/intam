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
  productId: string;
  dialogue: string;
  thanks: string;
  wrongReplies: string[];
};

export const WORKSHOP_PRODUCTS: WorkshopProduct[] = [
  {
    id: "smart-band",
    label: "스마트밴드",
    emoji: "⌚",
    color: 0x64cbd5,
    description: "심박수와 걸음 수를 확인해 건강 관리를 도와요.",
  },
  {
    id: "ai-speaker",
    label: "AI 스피커",
    emoji: "🔊",
    color: 0x8ab7e8,
    description: "말을 알아듣고 필요한 정보를 소리로 알려 줘요.",
  },
  {
    id: "photo-translator",
    label: "사진 번역기",
    emoji: "📷",
    color: 0xf5b85d,
    description: "사진 속 글자를 읽어 우리말로 번역해 줘요.",
  },
  {
    id: "robot-vacuum",
    label: "로봇 청소기",
    emoji: "🧹",
    color: 0xe98973,
    description: "주변을 살피며 바닥을 스스로 청소해요.",
  },
  {
    id: "smart-fridge",
    label: "스마트 냉장고",
    emoji: "🧊",
    color: 0x78d4bb,
    description: "남은 재료를 살펴 만들 수 있는 음식을 알려 줘요.",
  },
  {
    id: "study-helper",
    label: "AI 학습 도우미",
    emoji: "📚",
    color: 0xb293df,
    description: "틀린 문제와 어려운 내용을 알맞게 설명해 줘요.",
  },
  {
    id: "plant-camera",
    label: "식물 찾기 카메라",
    emoji: "🌼",
    color: 0x8acb68,
    description: "사진 속 식물의 모습을 알아보고 이름을 찾아 줘요.",
  },
  {
    id: "smart-home",
    label: "스마트홈 조절기",
    emoji: "🏠",
    color: 0x65c9ad,
    description: "온도와 습도에 맞춰 집 안 기기를 조절해요.",
  },
  {
    id: "medical-reader",
    label: "의료 영상 판독기",
    emoji: "🩻",
    color: 0x6faee7,
    description: "의사가 의료 영상의 이상한 부분을 살피도록 도와요.",
  },
  {
    id: "auto-parking",
    label: "AI 자동 주차 장치",
    emoji: "🚗",
    color: 0xf19a61,
    description: "빈 공간을 살피고 안전하게 주차하도록 도와요.",
  },
  {
    id: "crop-drone",
    label: "병해충 탐지 드론",
    emoji: "🚁",
    color: 0x81c06d,
    description: "농작물 사진을 살펴 병든 곳을 찾아 알려 줘요.",
  },
  {
    id: "performance-interpreter",
    label: "AI 공연 통역기",
    emoji: "🎭",
    color: 0xee9473,
    description: "공연 속 배우의 말을 다른 나라 말로 알려 줘요.",
  },
  {
    id: "ai-art",
    label: "AI 그림 만들기",
    emoji: "🎨",
    color: 0xe591bd,
    description: "글로 설명한 모습을 새로운 그림으로 만들어요.",
  },
  {
    id: "pet-care",
    label: "반려동물 돌봄 로봇",
    emoji: "🐶",
    color: 0xf0b35f,
    description: "집을 비운 동안 반려동물을 살피고 돌봐 줘요.",
  },
  {
    id: "smart-air",
    label: "스마트 공기청정기",
    emoji: "🍃",
    color: 0x6fc9c0,
    description: "공기 상태가 나빠지면 스스로 공기를 깨끗하게 해요.",
  },
];

export const WORKSHOP_REQUESTS: WorkshopRequest[] = [
  {
    id: "walking-grandparent",
    customerRole: "운동을 즐기는 어르신",
    customerEmoji: "🚶",
    productId: "smart-band",
    dialogue:
      "산책은 제가 할 테니, 심박수랑 걸음 수 계산은 기계에게 맡기고 싶어요.",
    thanks: "이제 만 보를 채웠는지 손가락으로 셀 필요가 없겠군요!",
    wrongReplies: [
      "이걸 손목에 차면 조금 무거울 것 같은데요?",
      "제 걸음 수를 세어 줄 물건을 부탁했답니다.",
    ],
  },
  {
    id: "rain-student",
    customerRole: "등교 준비가 바쁜 학생",
    customerEmoji: "🎒",
    productId: "ai-speaker",
    dialogue:
      "양말 신으면서 오늘 비가 오는지 말로 물어볼 수 있으면 좋겠어요!",
    thanks: "우산도 챙기고 지각도 피했어요. 완벽한 아침이에요!",
    wrongReplies: [
      "앗, 이건 제 질문에 말로 대답하기 어려워 보여요.",
      "손을 쓰지 않고 물어볼 수 있는 기계를 찾고 있어요!",
    ],
  },
  {
    id: "hungry-traveler",
    customerRole: "메뉴판 앞에서 배고픈 여행객",
    customerEmoji: "🧳",
    productId: "photo-translator",
    dialogue:
      "메뉴판은 멋진데 한 글자도 모르겠어요. 사진만 찍으면 번역되는 건 없나요?",
    thanks: "드디어 주문할 수 있겠어요! 제 배가 먼저 감사하대요.",
    wrongReplies: [
      "이걸로 메뉴판을 찍어도 번역은 안 될 것 같아요.",
      "제가 필요한 건 사진 속 글자를 번역하는 기계예요!",
    ],
  },
  {
    id: "busy-cleaner",
    customerRole: "청소할 시간이 없는 직장인",
    customerEmoji: "💼",
    productId: "robot-vacuum",
    dialogue:
      "퇴근하면 저도 바닥처럼 누워 버려요. 대신 먼지를 찾아다닐 친구가 필요해요.",
    thanks: "집에 가면 바닥과 숨바꼭질하던 먼지가 사라져 있겠네요!",
    wrongReplies: [
      "좋은 물건이지만 바닥을 돌아다니지는 못하겠네요.",
      "스스로 움직이며 청소하는 기계를 부탁했어요.",
    ],
  },
  {
    id: "fridge-parent",
    customerRole: "저녁 메뉴를 고민하는 보호자",
    customerEmoji: "🍳",
    productId: "smart-fridge",
    dialogue:
      "냉장고 문을 열 때마다 재료들이 저한테 메뉴를 물어봐요. 반대였으면 좋겠어요!",
    thanks: "오늘 저녁 메뉴 회의는 냉장고가 진행하겠군요!",
    wrongReplies: [
      "이 물건은 냉장고 속 재료를 살펴보지는 못할 것 같아요.",
      "남은 재료로 요리를 추천해 주는 냉장고를 찾고 있어요.",
    ],
  },
  {
    id: "math-student",
    customerRole: "수학 문제와 씨름하는 학생",
    customerEmoji: "📐",
    productId: "study-helper",
    dialogue:
      "문제가 자꾸 저를 이겨요. 제가 왜 틀렸는지 차근차근 설명해 줄 친구가 필요해요.",
    thanks: "이번에는 제가 문제를 이길 차례예요!",
    wrongReplies: [
      "이 기계도 똑똑하지만 제 오답을 설명해 주진 않겠어요.",
      "공부를 도와주고 문제를 설명하는 AI를 부탁했어요.",
    ],
  },
  {
    id: "flower-student",
    customerRole: "꽃 이름이 궁금한 학생",
    customerEmoji: "🌷",
    productId: "plant-camera",
    dialogue:
      "꽃에게 이름을 물어봤는데 대답이 없어요. 사진으로 찾아 주는 카메라가 필요해요!",
    thanks: "이제 길가의 꽃들과 제대로 인사할 수 있겠어요!",
    wrongReplies: [
      "이걸 꽃에게 보여 줘도 이름은 알려 주지 않을 것 같아요.",
      "사진 속 식물의 이름을 찾아 주는 카메라를 부탁했어요.",
    ],
  },
  {
    id: "hot-student",
    customerRole: "더운 방에서 공부하는 학생",
    customerEmoji: "🥵",
    productId: "smart-home",
    dialogue:
      "공부보다 에어컨 리모컨 찾기가 더 어려워요. 방을 알아서 시원하게 해 주세요!",
    thanks: "이제 집중력도 온도도 딱 알맞겠어요!",
    wrongReplies: [
      "이 물건은 방의 온도와 습도를 조절하지 못하겠네요.",
      "집 안 기기를 알아서 조절하는 장치가 필요해요.",
    ],
  },
  {
    id: "careful-doctor",
    customerRole: "꼼꼼한 의사",
    customerEmoji: "🧑‍⚕️",
    productId: "medical-reader",
    dialogue:
      "영상에서 살펴볼 부분을 빠르게 표시해 주면, 제가 더 꼼꼼히 판단할 수 있겠어요.",
    thanks: "좋아요. 진단은 제가, 빠른 확인은 이 장치가 도와주겠군요!",
    wrongReplies: [
      "이건 환자의 영상을 살펴보는 데 쓰는 장치가 아니에요.",
      "의료 영상에서 확인할 부분을 표시해 주는 도구가 필요합니다.",
    ],
  },
  {
    id: "parking-driver",
    customerRole: "주차만 하면 긴장하는 운전자",
    customerEmoji: "🚙",
    productId: "auto-parking",
    dialogue:
      "주차선이 저만 보면 좁아지는 것 같아요. 빈 공간을 찾아 안전하게 세워 주세요!",
    thanks: "이제 주차장에서도 어깨에 힘을 뺄 수 있겠어요!",
    wrongReplies: [
      "차를 안전하게 세워 주는 물건은 아닌 것 같아요.",
      "주변을 살피며 자동으로 주차해 주는 장치를 찾고 있어요.",
    ],
  },
  {
    id: "field-farmer",
    customerRole: "넓은 밭을 돌보는 농부",
    customerEmoji: "🧑‍🌾",
    productId: "crop-drone",
    dialogue:
      "밭이 너무 넓어서 제 두 눈이 야근 중이에요. 하늘에서 병든 곳을 찾아 주세요!",
    thanks: "이제 제 눈도 퇴근 시간을 지킬 수 있겠군요!",
    wrongReplies: [
      "이 물건은 하늘에서 밭을 살펴보기 어렵겠어요.",
      "농작물을 찍어 병든 곳을 찾는 드론을 부탁했어요.",
    ],
  },
  {
    id: "theater-traveler",
    customerRole: "한국 공연을 보고 싶은 외국인",
    customerEmoji: "🎟️",
    productId: "performance-interpreter",
    dialogue:
      "배우의 표정은 이해했는데 대사는 놓쳤어요. 공연을 바로 통역해 주세요!",
    thanks: "이제 웃어야 할 장면에서 제대로 웃을 수 있겠어요!",
    wrongReplies: [
      "이 기계로는 배우의 말을 바로 알아듣기 어렵겠네요.",
      "공연 중 대사를 실시간으로 통역하는 장치가 필요해요.",
    ],
  },
  {
    id: "poster-student",
    customerRole: "상상력이 넘치는 학생",
    customerEmoji: "🖼️",
    productId: "ai-art",
    dialogue:
      "머릿속에는 멋진 그림이 있는데 손이 못 따라와요. 설명대로 그려 주는 AI가 필요해요!",
    thanks: "제 상상이 드디어 화면 밖으로 나왔어요!",
    wrongReplies: [
      "이건 제가 설명한 그림을 만들어 주는 도구가 아니에요.",
      "글로 설명한 모습을 그림으로 만드는 AI를 부탁했어요.",
    ],
  },
  {
    id: "pet-owner",
    customerRole: "강아지가 걱정되는 보호자",
    customerEmoji: "🐕",
    productId: "pet-care",
    dialogue:
      "제가 없는 동안 강아지가 소파를 지키는지, 소파를 먹는지 살펴봐 주세요!",
    thanks: "이제 외출해도 우리 강아지 소식을 바로 알 수 있겠어요!",
    wrongReplies: [
      "이 물건은 집에 있는 강아지를 돌봐 주기 어렵겠어요.",
      "반려동물을 살피고 돌봐 주는 로봇이 필요해요.",
    ],
  },
  {
    id: "fresh-air-resident",
    customerRole: "맑은 공기를 원하는 주민",
    customerEmoji: "😷",
    productId: "smart-air",
    dialogue:
      "공기가 답답해지기 전에 알아서 눈치채고 깨끗하게 해 주면 좋겠어요.",
    thanks: "좋은 공기는 티가 안 나서 더 좋죠. 숨이 벌써 가벼워졌어요!",
    wrongReplies: [
      "이 기계는 공기 상태를 살펴 깨끗하게 하지는 못하겠어요.",
      "공기가 나빠지면 스스로 작동하는 기계를 찾고 있어요.",
    ],
  },
];

export const WORKSHOP_PRODUCT_BY_ID = new Map(
  WORKSHOP_PRODUCTS.map((product) => [product.id, product]),
);
