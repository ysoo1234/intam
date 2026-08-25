# 성능 예산

성능은 한 번의 점수가 아니라 기능별 비용의 합으로 관리한다.

## 현재 기준선 (2026-08-11)

- Next.js production build: 성공, `/` 정적 생성
- ESLint: 오류 0, 경고 0
- `src/game/createLearningGame.ts`: 약 1.2KB, 44줄
- `src/game/sceneRegistry.ts`: 약 4.7KB, 172줄. 활성 5개·보관 2개의 고유 키와 에셋 범위를 선언하고 보관 장면은 import하지 않음
- `features/data-flight/scene/AirportScene.ts`: 659줄, 점수 단계·표현·입력·플레이어 이동·에셋 수명주기·피드백 보조 모듈로 분리. 생성 오브젝트 192줄은 `airportObjects.ts`가 소유
- `features/ai-workshop/scene/AiWorkshopScene.ts`: 799줄, 모델·표현·조작 보조 모듈 15개로 분리
- `features/core-kitchen/scene/CoreKitchenScene.ts`: 681줄, 모델·표현·조작·연출 보조 모듈로 분리(제품 등록은 보류)
- `features/ai-service-shop/scene/ShopScene.ts`: 737줄, 모델·도구 텍스처·표현·조작·연출 보조 모듈로 분리(제품 등록은 보류)
- `features/ethics-review/scene/EthicsReviewScene.ts`: 328줄, 사건 파일 뷰 554줄·브리핑/결과 189줄·판정 효과 264줄·단일 선택 조작·플레이어·12개 사례·순수 규칙으로 분리
- Data Flight, AI Workshop, Core Kitchen, AI Service Shop 순수 규칙은 `npm run test:models`에서 경계값을 검증
- `public/assets`: 92개, 5.97MB(편집 원본·구버전 이동 전 122.55MB)
- `assets-source`: 225개, 165.81MB의 편집 원본·구버전 보존 위치(웹 배포 대상 아님)
- 실제 참조되는 런타임 에셋 전체: 3.33MB, 장면별 지연 로드
- 윤리 심사소의 현재 저밀도 원화 3종은 배경·시작 서류·사건 기록철 WebP 3개(합계 약 0.15MB)로 파생하며 장면 진입 때만 로드
- 이전 윤리 심사소 시안은 비교·복구를 위해 보존하지만 현재 매니페스트에서는 불러오지 않습니다.
- 공항의 새 반복형 배경 3종과 정사각형 데이터 아이콘 4종은 원래 비율을 유지한 WebP 7개(합계 약 0.16MB)로 파생
- 공항의 나쁜 데이터 4종·분야별 공공데이터 8종·상하 고정 장애물 원화 약 17.27MB -> WebP 약 0.47MB, 공항 진입 때만 로드
- AI 공방 고객 PNG 52개 7.38MB -> WebP 파생본 약 1.64MB, 한 세션은 12명(24장)만 preload
- AI 공방의 새 1280×720 배경·작업대·4칸/5칸 아이템 창은 원본 투명 여백을 제거한 WebP 4개로 파생하며 공방 진입 때만 로드
- 공항 데이터 아이콘 GPU 추정치: 약 83.6MB -> 약 0.56MB
- 배움마을 홈은 1280×720 바닥과 화면 크기에 맞춘 독립 오브젝트 WebP 5개를 월드 진입 때만 불러오며, 원화 약 6.55MB를 런타임 약 0.35MB로 파생

## 관문

- 초기 화면에서 Phaser 코드는 별도 비동기 청크로 유지한다.
- 한 런타임 에셋은 2MB를 넘지 않는다.
- 실제 참조되는 런타임 에셋은 20MB 이하, `public/assets` 전체는 35MB 이하를 목표로 한다. 원본·실험본은 이 예산에 넣지 않는다.
- 새 씬은 자신의 에셋만 preload하고 다른 씬 에셋을 일괄 preload하지 않는다.
- 새 단일 소스 파일은 500줄을 목표 상한으로 하며 800줄을 넘으면 분리 계획이 필요하다.
- lint 오류 0, TypeScript 오류 0, production build 성공을 유지한다.

## 측정 명령

```bash
npm run assets:audit
npm run lint
npm run typecheck
npm run build
```

`assets:audit` 실패는 원본/중간 이미지가 `public/assets`에 섞였거나 새 파일이 예산을 넘겼다는 뜻이다. 삭제 전에 참조 여부와 원본 보존 위치를 확인한다. 원본을 수정한 뒤에는 `assets-source`에서 배포용 WebP를 다시 생성한다.
