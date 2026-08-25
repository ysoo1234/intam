# 편집용 게임 에셋 원본

이 폴더는 PNG 원본, 구버전, 생성 중간본을 보존하는 곳이며 웹 배포 대상이 아닙니다. `public/assets`에는 게임이 실제로 읽는 최적화 결과만 둡니다.

## 작업 흐름

1. 이 폴더의 원본을 편집하거나 교체합니다.
2. `npm run assets:optimize`를 실행해 스크립트에 등록된 배포용 WebP 79개를 생성합니다.
3. `npm run verify`로 에셋 규격과 게임 빌드를 함께 검증합니다.

원본과 배포 결과는 가능한 한 같은 상대 경로와 파일명 줄기를 사용합니다. 예를 들어 `assets-source/world/village-ground.png`는 `public/assets/world/village-ground.webp`가 됩니다.

배움마을 홈의 활성 원화는 `world/village-ground.png`, `village-ai-shop.png`, `village-airport.png`, `village-ethics-office.png`, `village-ai-world-gate.png`, `village-fountain.png`입니다. 배경을 제외한 오브젝트는 투명 여백을 제거한 뒤 화면 배치 크기에 맞는 WebP로 파생합니다.

윤리 심사소의 현재 원화는 `office-v2.png`, `briefing-sheet-v2.png`, `case-file-v2.png`입니다. 이전 시안과 `verdict-consoles.png`도 비교·복구를 위해 보존하며 최적화 스크립트는 모두 재생성할 수 있습니다.

데이터 비행 공항의 활성 나쁜 데이터 원화는 `bad_data_doc.png`, `bad_data_image.png`, `bad_data_sound.png`, `bad_data_video.png`입니다. 피버용 공공데이터 원화는 `public_data_science_technology.png`, `public_data_education.png`, `public_data_transport.png`, `public_data_law.png`, `public_data_industry.png`, `public_data_medical.png`, `public_data_safety.png`, `public_data_environment.png` 8종입니다. 이전 통합 시안 `bad-data-obstacles-v1.png`와 `public-data-collectibles-v1.png`는 비교·복구용으로 보존하며 더 이상 런타임 파일을 생성하지 않습니다. `corrupted-data-tower-v1.png`는 상하 고정 장애물의 편집 기준입니다.

공항의 `bg_sky.png`, `bg_city.png`, `bg_ground.png`는 가로 반복 경계를 맞춘 원본이며 1600×720 WebP로 파생합니다. `data_doc.png`, `data_image.png`, `data_sound.png`, `data_video.png`는 정사각형 아이콘이므로 256×256 비율을 유지합니다. 2026-08-17 교체 전 원본은 `airport/archive/2026-08-17-before-seamless-refresh/`에 보존합니다.

AI 공방 고객 원본은 `customers/v3-game/<request-id>-worried.png`와 `*-happy.png` 형식을 사용합니다. 요청 ID는 `src/game/content/aiWorkshop.ts`와 일치해야 합니다.

AI 공방의 활성 원화는 `shop/ai-workshop-interior-v6.png`, `shop/ai-workbench-foreground-v2.png`, `shop/workshop-item-panel-4.png`, `shop/workshop-item-panel-5.png`입니다. 투명 여백이 있는 작업대와 아이템 창은 최적화 과정에서 자동으로 잘라 WebP로 파생합니다.

방향별 캐릭터 `public/assets/characters/midi_*_game.png` 4개는 현재 자동 생성 대상이 아닙니다. 교체할 때는 네 방향을 함께 갱신하고 `npm run assets:audit`로 176×226 규격을 확인합니다. 보관 씬 배경 `public/assets/shop/ai-shop-interior.png`도 해당 씬의 활성화 정책이 정해질 때까지 자동 생성 대상에서 제외합니다.
