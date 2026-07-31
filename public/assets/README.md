# 배움마을 PNG 교체 규격

같은 파일명으로 덮어쓰면 코드 수정 없이 게임에 반영됩니다.

## 월드

- `world/world-map.png`: 16:9, 권장 2560×1440px
- 현재 파일은 프로토타입용 배경입니다.
- 출입 좌표를 바꾸지 않으려면 분수는 중앙, 문은 좌상단 `(23%, 31%)`,
  좌하단 `(21%, 78%)`, 우상단 `(74%, 31%)` 부근에 배치하세요.

## 캐릭터

- `characters/player.png`: 투명 PNG, 권장 512×640px
- 발이 이미지 가로 중앙에 오고, 사방에 5% 이상 여백을 두세요.
- 한 장만으로도 움직입니다. 추후 걷기 스프라이트 시트로 확장할 수 있습니다.

## 손님

- `customers/traveler.png`
- `customers/farmer.png`
- `customers/doctor.png`
- `customers/driver.png`
- `customers/librarian.png`
- `customers/grandparent.png`
- `customers/teacher.png`
- `customers/shopkeeper.png`
- `customers/parent.png`
- `customers/farm-manager.png`
- `customers/factory-manager.png`
- `customers/student.png`

모두 투명 PNG, 권장 640×640px입니다. 파일이 없을 때는 역할에 맞는 이모지
손님이 표시됩니다.

## 생활 속 AI 기능 아이콘

- `ai-tools/voice-recognition.png`
- `ai-tools/image-recognition.png`
- `ai-tools/translation.png`
- `ai-tools/recommendation.png`
- `ai-tools/self-driving.png`
- `ai-tools/ai-speaker.png`
- `ai-tools/chatbot.png`
- `ai-tools/medical-analysis.png`
- `ai-tools/robot-vacuum.png`
- `ai-tools/smart-farm.png`

모두 투명 PNG, 권장 512×512px입니다. 파일이 없으면 자동으로 이모지 임시
그림이 표시됩니다. 배경을 제외한 오브젝트는 그림자 없이 내보내면 게임
쪽에서 선택 효과와 그림자를 일관되게 붙일 수 있습니다. PNG는 sRGB, 투명
배경, 2배 해상도로 내보내는 것을 권장합니다.

## AI 가게

- `shop/ai-shop-interior.png`: 16:9, 권장 2560×1440px

가게 배경에는 중앙 손님 공간과 카운터의 원형 진열대 5개를 유지하세요.
대사, 선택 테두리, 도구, 손님, 상황 변화는 Phaser가 위에 올립니다.
