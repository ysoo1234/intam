export type WorkshopProductDialogue = Readonly<{
  ready: string;
  thanks: string;
}>;

export const WORKSHOP_PRODUCT_DIALOGUES: Readonly<
  Record<string, WorkshopProductDialogue>
> = {
  "ai-speaker": {
    ready: "AI 스피커가 완성됐군요! 내일 날씨를 바로 물어볼래요.",
    thanks: "이제 날씨를 확인하고 우산도 빠뜨리지 않겠어요!",
  },
  "call-translator": {
    ready: "통화 번역기가 준비됐네요! 외국 친구 목소리가 곧바로 들리겠어요.",
    thanks: "이제 외국 친구와 마음껏 수다를 떨 수 있겠어요!",
  },
  "photo-translator": {
    ready: "사진 번역기가 완성됐어요! 메뉴판부터 찍어 볼래요.",
    thanks: "이제 메뉴를 읽고 먹고 싶은 음식을 자신 있게 고를게요!",
  },
  "plant-camera": {
    ready: "꽃을 알아보는 카메라군요! 이 꽃의 이름이 정말 궁금해요.",
    thanks: "과학 숙제에 꽃 이름과 특징을 또박또박 적을 수 있겠어요!",
  },
  "face-lock": {
    ready: "제 얼굴을 알아보는 잠금 장치가 완성됐네요!",
    thanks: "비밀번호를 깜빡해도 제 휴대 전화를 안전하게 열 수 있겠어요!",
  },
  "spell-checker": {
    ready: "맞춤법 도우미가 준비됐군요! 제 일기를 함께 살펴봐 주세요.",
    thanks: "틀린 곳을 고쳐서 오늘 일기를 자신 있게 보여 줄게요!",
  },
  "smart-fridge": {
    ready: "재료를 알아보는 냉장고가 완성됐네요! 오늘 메뉴를 추천해 주세요.",
    thanks: "냉장고 속 재료로 맛있는 저녁을 바로 만들 수 있겠어요!",
  },
  "robot-vacuum": {
    ready: "스스로 움직이는 청소기가 준비됐어요! 먼지를 잘 찾아낼 것 같아요.",
    thanks: "바쁜 날에도 바닥을 깨끗하게 지킬 수 있겠어요!",
  },
  "pet-care-robot": {
    ready: "강아지 곁을 지켜 줄 로봇이 완성됐군요!",
    thanks: "제가 외출해도 강아지가 덜 외롭고 안전하겠어요!",
  },
  "security-camera": {
    ready: "낯선 움직임을 알아보는 카메라가 준비됐네요!",
    thanks: "혼자 있을 때도 위험한 방문을 바로 알 수 있어 든든해요!",
  },
  "smart-air-purifier": {
    ready: "공기 상태를 스스로 살피는 기계가 완성됐어요!",
    thanks: "이제 집 안에서 맑은 공기를 마음껏 마실 수 있겠어요!",
  },
  "smart-washer": {
    ready: "옷감을 알아보는 세탁기가 준비됐군요! 옷을 맡겨 볼게요.",
    thanks: "옷마다 알맞은 방법으로 세탁할 수 있어 마음이 놓여요!",
  },
  "study-helper": {
    ready: "풀이 과정을 살펴보는 학습 도우미가 완성됐네요!",
    thanks: "어디서 틀렸는지 이해하고 다음 문제는 스스로 풀어 볼게요!",
  },
  "nutrition-kiosk": {
    ready: "급식판을 알아보는 영양 키오스크가 준비됐어요!",
    thanks: "오늘 먹은 음식의 영양소를 알고 골고루 먹을 수 있겠어요!",
  },
  "medical-reader": {
    ready: "작은 이상도 표시해 주는 판독기가 완성됐군요!",
    thanks: "엑스레이를 더 꼼꼼히 살피고 환자를 빠르게 도울 수 있겠어요!",
  },
  "smart-band": {
    ready: "심박수와 걸음 수를 재는 밴드가 준비됐네요!",
    thanks: "오늘 얼마나 건강하게 움직였는지 매일 확인하겠어요!",
  },
  "ai-wheelchair": {
    ready: "안전한 길을 찾는 휠체어가 완성됐어요! 병원 복도로 가 볼까요?",
    thanks: "이제 원하는 곳까지 더 편안하고 안전하게 이동할 수 있겠어요!",
  },
  "road-safety-cctv": {
    ready: "도로의 위험을 찾는 CCTV가 준비됐군요! 횡단보도를 잘 지켜봐 주세요.",
    thanks: "위험한 순간을 빠르게 알아차려 시민들을 지킬 수 있겠어요!",
  },
  "autonomous-car": {
    ready: "차 주변을 스스로 살피는 자동차가 완성됐네요!",
    thanks: "도로와 장애물을 함께 살펴 주니 훨씬 안전하게 운전하겠어요!",
  },
  "delivery-robot": {
    ready: "골목을 달릴 배달 로봇이 준비됐어요! 첫 소포를 실어 볼게요.",
    thanks: "좁은 길 끝의 집까지도 물건을 빠르게 전할 수 있겠어요!",
  },
  "drone-taxi": {
    ready: "하늘길을 달릴 드론 택시가 완성됐군요!",
    thanks: "막히는 도로를 지나 멀리까지 빠르게 갈 수 있겠어요!",
  },
  "crop-drone": {
    ready: "넓은 밭을 살펴볼 드론이 준비됐네요! 위에서 꼼꼼히 찍어 주세요.",
    thanks: "숨어 있는 병해충을 일찍 찾아 작물을 지킬 수 있겠어요!",
  },
  "harvest-robot": {
    ready: "잘 익은 과일을 고르는 로봇이 완성됐어요!",
    thanks: "과수원의 맛있는 과일만 알맞은 때에 수확할 수 있겠어요!",
  },
  "greenhouse-computer": {
    ready: "온실의 날씨를 돌볼 컴퓨터가 준비됐군요!",
    thanks: "온도와 습도, 햇빛을 맞춰 작물이 튼튼하게 자라겠어요!",
  },
  "smart-watering": {
    ready: "흙의 목마름을 알아보는 물주기 장치가 완성됐네요!",
    thanks: "작물에 꼭 필요한 만큼만 물을 주고 물도 아낄 수 있겠어요!",
  },
  "performance-interpreter": {
    ready: "배우의 말을 바로 옮겨 줄 공연 통역기가 준비됐어요!",
    thanks: "이제 배우의 대사를 우리나라 말로 들으며 공연을 즐길게요!",
  },
};
