# 인탐 아키텍처

인탐은 **기능별 vertical slice**와 **얇은 공통 런타임**을 기본 구조로 사용한다.
맵, 미니게임, 이미지 작업이 늘어나도 한 기능의 변경이 다른 기능 파일과 충돌하지 않게 만드는 것이 목적이다.

## 목표 구조

```text
src/
  app/                    Next.js 라우트와 서버/클라이언트 경계
  components/             여러 기능이 공유하는 React UI
  game/
    sceneRegistry.ts       활성·보관 장면, 고유 키, 에셋 범위와 생성 순서
    core/                 Phaser 생성, 씬 전환, 입력, 공통 수명주기
    features/
      world/              월드 맵과 건물 진입
      data-flight/        데이터 비행 미니게임
      ai-workshop/        AI 공방 미니게임
      ethics-review/      윤리 심사소 사례 판단 게임
      core-kitchen/       코어 주방 미니게임
      ai-service-shop/    생활 속 AI 도구 선택 미니게임
    content/              순수 콘텐츠와 검증 가능한 스키마
    assets/               배포 에셋 manifest와 로딩 정책
    telemetry/            로딩·프레임·메모리 계측
public/assets/            실제 게임이 읽는 배포용 파생 에셋만
assets-source/            편집 원본·구버전 저장소(배포 대상 아님)
scripts/                  에셋 생성·감사·검증 도구
validation/               작은 fixture와 성능 결과 요약
docs/
  architecture/           살아 있는 구조 기준
  team/                   역할과 소유권
  performance/            예산과 측정 결과
  adr/                    중요한 기술 결정 기록
```

현재 `src/game/createLearningGame.ts`는 렌더 설정과 `sceneRegistry.ts` 호출만 담당하는 얇은 조립 파일이다. 장면 등록 순서, 활성·보관 상태, 고유 씬 키와 에셋 범위는 선언형 장면 레지스트리가 관리하며 중복 ID와 중복 키를 시작 전에 거부한다. 새 기능은 이 두 파일에 구현하지 않는다.

공통 입력·카메라·씬 키·시각 primitive는 `game/core`로, `IntroScene`은 `features/intro/scene`으로 분리되었다. `WorldScene`도 `features/world/scene`으로 분리되어 `features/world/model`의 선언형 맵 레지스트리를 좌표·포털·충돌의 단일 데이터 원천으로 사용한다. Data Flight는 규칙 상수와 순수 계산을 `features/data-flight/model`이 소유하고, `features/data-flight/scene`이 AirportScene과 표현 모듈을 소유한다. AI Workshop도 `features/ai-workshop/model`에 주문·보상·난이도 규칙을, `features/ai-workshop/scene`에 씬·조작·상품·제작 연출·결과 표현을 분리했다. Ethics Review는 40개 상황의 균형 잡힌 덱, 시간 제한 없는 연습, 도장 한 번으로 끝나는 단일 판정, 120초 연속 시간과 오답 자동 진행, 손님 교대, 정확도·점수·콤보·별 규칙을 `features/ethics-review/model`이 소유한다. 장면은 창구 사무실 배경 위에 마스크로 잘린 손님 대기열, 책상 뒤의 미디, 창구와 책상을 오가는 확인서, 도장 2개, 심사 기준 패널, 공통 상태 크롬으로 구성하며 좌표는 `scene/layout.ts`가 단일 원천이다. Core Kitchen은 `features/core-kitchen/model`에 레인·거리·이동 규칙을, `features/core-kitchen/scene`에 씬·표현·연출을 분리했다. AI Service Shop은 `features/ai-service-shop/model`에 선택지·패드·보상 규칙을, `features/ai-service-shop/scene`에 씬·도구 텍스처·조작·연출을 분리했다. Core Kitchen과 AI Service Shop은 각각 `core-kitchen`, `ai-service-shop` 고유 키를 받았지만 월드 입구와 제품 정책이 승인될 때까지 보관 상태로 유지한다. 각 기능의 RNG 호출 순서와 Phaser 진행 상태는 기능 소유 씬 계층에서 보존한다.

별 진행도는 `core/navigation/worldProgress`(규칙)와 `core/navigation/worldProgressStorage`(브라우저 저장)가 소유한다. `WorldScene`은 진입 때 레지스트리와 저장본을 합쳐 최고 별을 쓰고, 활동 결과를 합친 뒤 두 곳에 다시 저장한다. 마을 안내(첫 방문 두 단계 안내·건물 이름표·별 카운터·획득 알림)는 `features/world/scene/villageTutorial.ts`가, 미니게임 시작 튜토리얼 카드는 `core/visual/gameStartOverlay.ts`의 `steps` 옵션이 담당하며 각 기능은 자기 시작 문구만 소유한다(`workshopStart.ts`, `airportOverlays.ts`의 `DATA_FLIGHT_START`, `EthicsReviewScene`의 `ETHICS_START`).

## 의존 방향

```text
app -> game/core -> game/features -> game/content
                       |
                       +-----------> game/assets
```

- `content`는 Phaser, React, 브라우저 API를 import하지 않는다.
- `features`끼리는 직접 import하지 않고 `core`의 씬 계약이나 명시적 이벤트를 사용한다.
- `assets`는 원본 파일이 아니라 런타임용 파생 파일만 노출한다.
- Next.js Client Component 경계는 게임 셸처럼 브라우저 API가 필요한 가장 작은 지점에 둔다.
- 서버 기능이 추가되면 인증·권한은 클라이언트 인자를 신뢰하지 않고 서버 세션에서 다시 계산한다.

## 기능 완료 기준

1. 기능 소유 폴더와 공개 계약이 분명하다.
2. 동일 seed에서 핵심 게임 결과가 유지된다.
3. 씬 진입 시 필요한 에셋만 로드한다.
4. 성능 예산과 lint, typecheck, build를 통과한다.
5. 구현자가 아닌 검증 담당자가 회귀 결과를 확인한다.
