# 배포용 게임 에셋

이 폴더에는 브라우저가 실제로 읽는 최적화 결과만 둡니다. 편집 가능한 PNG 원본과 구버전은 프로젝트 루트의 `assets-source/`에 보관합니다.

- 배포 에셋을 직접 편집하지 않습니다.
- 원본을 바꾼 뒤 `npm run assets:optimize`로 스크립트에 등록된 WebP를 다시 만듭니다.
- `npm run assets:audit`로 누락, 이미지 규격, 파일 수와 배포 용량을 확인합니다.
- AI 공방 고객 파일명은 `src/game/content/aiWorkshop.ts`의 요청 ID와 정확히 일치해야 합니다.

현재 원본과 배포 파일의 상대 경로는 같습니다. 예를 들어 `assets-source/world/village-ground.png`에서 `public/assets/world/village-ground.webp`를 생성합니다.

배움마을 홈은 바닥 `village-ground.webp` 위에 상점·공항·윤리심사소·AI WORLD 게이트·분수 WebP를 독립 오브젝트로 배치합니다. 각 오브젝트의 화면 깊이는 미디의 발 위치와 비교해 앞뒤가 바뀝니다.

생활 속 AI 제작소는 `ai-workshop-interior-v6.webp`, `ai-workbench-foreground-v2.webp`, `workshop-item-panel-4.webp`, `workshop-item-panel-5.webp`를 사용합니다. 1~3번째 손님은 4칸 창, 4번째 손님부터는 5칸 창을 장면에서 선택해 불러옵니다.

윤리 심사소는 현재 `office-v2.webp`, `briefing-sheet-v2.webp`, `case-file-v2.webp`를 사용합니다. 이전 시안과 판정 장치 WebP는 비교·복구용으로 남아 있지만 실행 중에는 불러오지 않습니다.

데이터 비행 공항은 나쁜 데이터 4종 `bad_data_*.webp`, 분야별 공공데이터 8종 `public_data_*.webp`, `corrupted-data-tower-v1.webp`를 공항 장면에서만 불러옵니다.

공항의 하늘·도시·지면은 반복 경계가 덜 보이도록 1600×720으로 파생하고, 문서·이미지·소리·영상 데이터 아이콘은 256×256 정사각형 WebP로 사용합니다.

방향별 캐릭터 `characters/midi_*_game.png` 4개는 현재 수동으로 준비하는 배포 파일이라 이 명령이 만들지 않습니다. 또한 `shop/ai-shop-interior.png`는 아직 등록되지 않은 보관 씬의 동작을 보존하기 위해 임시로 남겨 둔 예외이며, 해당 씬을 활성화할 때 WebP 전환 여부를 함께 결정합니다.
