# 편집용 게임 에셋 원본

이 폴더는 현재 배포 에셋을 다시 만들 수 있는 PNG 원본만 보존하며 웹 배포 대상이 아닙니다. `public/assets`에는 게임이 실제로 읽는 최적화 결과만 둡니다.

## 작업 흐름

1. 이 폴더의 원본을 편집하거나 교체합니다.
2. `npm run assets:optimize`를 실행해 고정 WebP 75개와 고객 WebP 52개를 생성합니다.
3. `npm run verify`로 에셋 규격과 게임 빌드를 함께 검증합니다.

원본과 배포 결과는 가능한 한 같은 상대 경로와 파일명 줄기를 사용합니다. 이름이 다른 경우에는 `scripts/optimize-game-assets.mjs`의 `output` 항목이 배포 경로를 명시합니다.

배움마을 홈의 활성 원화는 `world/ai-village-main-background-v3.png`와 `village-ai-shop-v3.png`, `village-airport-v3.png`, `village-ethics-office-v3.png`, `village-ai-world-gate-v3.png`, `village-fountain-v3.png`입니다. 분수의 물 효과는 `village-fountain-water-overlay-v1.png`와 `village-fountain-water-frames-v1.png`를 사용합니다.

윤리 심사소의 현재 원화는 `office-v2.png`, `briefing-sheet-v2.png`, `case-file-v2.png`입니다.

데이터 비행 공항의 활성 나쁜 데이터 원화는 `bad_data_doc.png`, `bad_data_image.png`, `bad_data_sound.png`, `bad_data_video.png`입니다. 피버용 공공데이터 원화는 `public_data_science_technology.png`, `public_data_education.png`, `public_data_transport.png`, `public_data_law.png`, `public_data_industry.png`, `public_data_medical.png`, `public_data_safety.png`, `public_data_environment.png` 8종입니다. 상하 고정 장애물은 `corrupted-data-cloud-top-v1.png`와 `corrupted-data-vortex-bottom-v1.png`를 사용합니다.

공항의 `bg_sky.png`, `bg_city.png`, `bg_ground.png`는 가로 반복 경계를 맞춘 원본이며 3200×1440 WebP로 파생합니다. `data_doc.png`, `data_image.png`, `data_sound.png`, `data_video.png`는 256×256 비율을 유지합니다.

AI 공방 고객 원본은 `customers/v3-game/<request-id>-worried.png`와 `*-happy.png` 형식을 사용합니다. 요청 ID는 `src/game/content/aiWorkshop.ts`와 일치해야 합니다.

AI 공방의 활성 원화는 `shop/ai-workshop-interior-v6.png`, `shop/ai-workbench-foreground-v2.png`, `shop/itembox4.png`, `shop/itembox5.png`, `shop/workshop-crafting-machine-v1.png`, `shop/workshop-crafting-panel-v2.png`, `shop/workshop-customer-nameplate-v4.png`, `shop/workshop-dialogue-bubble-v2.png`입니다. 상품 원화 26개는 `shop/products-v2/`에 둡니다.

방향별 캐릭터 `public/assets/characters/midi_*_game.png` 4개는 현재 자동 생성 대상이 아닙니다. 교체할 때는 네 방향을 함께 갱신하고 `npm run assets:audit`로 176×226 규격을 확인합니다. `npm run assets:audit`는 등록되지 않은 파일이 `public/assets`에 다시 들어오는 것도 오류로 처리합니다.
