# 인탐 아키텍처

인탐은 **기능별 vertical slice**와 **얇은 공통 런타임**을 기본 구조로 사용한다.
맵, 미니게임, 이미지 작업이 늘어나도 한 기능의 변경이 다른 기능 파일과 충돌하지 않게 만드는 것이 목적이다.

## 목표 구조

```text
src/
  app/                    Next.js 라우트와 서버/클라이언트 경계
  components/             여러 기능이 공유하는 React UI
  game/
    sceneRegistry.ts       등록 장면, 고유 키, 에셋 범위와 생성 순서
    core/                 Phaser 생성, 씬 전환, 입력, 공통 수명주기
    features/
      world/              월드 맵과 건물 진입
      data-flight/        데이터 비행 미니게임
      ai-workshop/        AI 공방 미니게임
      ethics-review/      윤리 심사소 사례 판단 게임
      ending/             별 7개 이후 엔딩(교재 102~103쪽 에필로그)과 탐험가 증명서
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

현재 `src/game/createLearningGame.ts`는 렌더 설정과 `sceneRegistry.ts` 호출만 담당하는 얇은 조립 파일이다. 장면 등록 순서, 고유 씬 키와 에셋 범위는 선언형 장면 레지스트리가 관리하며 중복 ID와 중복 키를 시작 전에 거부한다. 새 기능은 이 두 파일에 구현하지 않는다.

공통 입력·카메라·씬 키·시각 primitive는 `game/core`로, `IntroScene`은 `features/intro/scene`으로 분리되었다. `WorldScene`도 `features/world/scene`으로 분리되어 `features/world/model`의 선언형 맵 레지스트리를 좌표·포털·충돌의 단일 데이터 원천으로 사용한다. 마을 충돌은 길·잔디를 걷게 그린 4px 비트 마스크(`villageCollisionMask.ts`, 원본 `assets-source/world/village-walkable-mask-v10.png`; 생성 스크립트가 150칸 미만의 작은 섬(꽃밭·덤불)은 지워 숲 가장자리와 하늘만 남긴다)에 건물·분수가 땅에 닿는 바닥 외곽선(`villageBuildingShapes.ts`, `scripts/generate-village-building-shapes.mjs`가 그림 알파에서 앞쪽 바닥선과 열마다의 윗선·아랫선을 재고 뒤쪽은 상자·타원·판 모양으로 잇는다; `villageMap.ts`의 `villageBuildingShape(...)`가 배치표 위치·좌우 반전에 맞춰 놓는다)을 더한 것이다. 미디의 발 밑 타원(`playerBody.footRadiusX/Y`, 몸 폭만큼)이 바닥 외곽선에 닿으면 막혀 벽 옆에서도 팔·몸이 벽에 박히지 않고, 건물 뒤 땅은 건물 그림이 미디 몸의 어느 세로줄이든 `maxHiddenBehindBuilding`(기본 0.4) 넘게 가리기 전까지 걸을 수 있어 옆에서 반쪽만 가려지는 일 없이 아랫몸만 살짝 숨는다. 앞뒤 그리기는 `villageScenery.ts`가 `isPlayerBehindBuilding`으로 미디 발이 바닥 외곽선의 앞뒤 중간선보다 위인지로 정한다(외곽선이 없는 장식만 `groundLine`). 분수와 별빛 졸업길은 얇은 물체라 `maxHiddenBehind: 1`로 뒤쪽을 끝까지 지나갈 수 있다. 입장 버튼은 포털의 앞마당 타원 안에서 뜨되, 미디가 `frontOf` 건물 뒤로 넘어가면(`isPlayerBehindBuilding`) 뜨지 않는다. 막혔을 때의 미끄러짐은 `villageMovement.ts`의 `findSlide`가 입력에서 조금씩 튼 후보들 중 앞이 가장 오래 열린 쪽을 고르며(덤불 모서리의 오목한 칸에서 빠져나오기 위해 살짝 뒤로 가는 후보도 허용), 터치 이동(`worldTouchDirection.ts`)은 그 우회 동안 포기하지 않도록 비개선 프레임 한도를 넉넉히 둔다. Data Flight는 규칙 상수와 순수 계산을 `features/data-flight/model`이 소유하고, `features/data-flight/scene`이 AirportScene과 표현 모듈을 소유한다. AI Workshop도 `features/ai-workshop/model`에 주문·보상·난이도 규칙을, `features/ai-workshop/scene`에 씬·조작·상품·제작 연출·결과 표현을 분리했다. Ethics Review는 40개 상황의 균형 잡힌 덱, 시간 제한 없는 연습, 도장 한 번으로 끝나는 단일 판정, 120초 연속 시간과 오답 자동 진행, 손님 교대, 정확도·점수·콤보·별 규칙을 `features/ethics-review/model`이 소유한다. 손님은 학년별 키로 맞춘 학생 24명(`public/assets/ethics-review/students/`, 고객과 같은 454×680·발 중심 캔버스)이며 교대마다 섞인 방문 순서(`visitorOrder`, `createEthicsVisitorOrder`)를 따라 한 바퀴를 다 돌기 전엔 같은 학생이 다시 오지 않는다. 장면은 페이퍼 플리즈처럼 두 칸이다: 왼쪽 창구 칸(`ethics-booth-panel-v1` 위에 학생, 그 앞에 창 구멍을 뚫은 `ethics-booth-front-v1`(창틀·창구 턱), 맨 앞에 미디 뒷모습)과 오른쪽 위에서 내려다본 책상 칸(`ethics-desk-panel-v1`). 맞힌 개수로 단계가 오르며(`config.stages`) 2·3단계 확인서에는 첨부 서류가 1·2장 붙는다(`content/attachedCases.ts`, 책상 칸 첨부 카드 완성 전까지 `ETHICS_ATTACHMENTS_ON_DESK`로 꺼 둠). 창구와 책상을 오가는 확인서(사례 문장만 적힌다), 도장 2개, 공통 상태 크롬으로 구성하며 좌표는 `scene/layout.ts`가 단일 원천이다. 심사 기준 패널과 안내 문구는 없고, 첫 플레이(또는 시작 카드의 ? 버튼)에만 연습 사례가 `scene/ethicsReviewTutorial.ts`의 카드·화살표와 함께 나온다(`createEthicsDeliveryState(deck, practice)`). 각 기능의 RNG 호출 순서와 Phaser 진행 상태는 기능 소유 씬 계층에서 보존한다.

별 진행도는 `core/navigation/worldProgress`(규칙)와 `core/navigation/worldProgressStorage`(브라우저 저장)가 소유한다. `WorldScene`은 진입 때 레지스트리와 저장본을 합쳐 최고 별을 쓰고, 활동 결과를 합친 뒤 두 곳에 다시 저장한다. 마을 안내(첫 방문: 미디의 마을 소개 대사 → 별빛 졸업길·별 7개·세 건물 소개 → AI 제작소 강조와 "확인" 카드 → 문 앞 입장 카드, 이후 복귀 대사와 획득 알림)는 `features/world/scene/villageTutorial.ts`가 담당하고, 미디 말풍선은 `villageMidiBubble.ts`, 말할 때의 입 모양·표정은 `villageMidiFace.ts`, 건물 이름표와 졸업길 별 개수는 `villageNameTags.ts`가 담당한다. 미디 정면 얼굴·포즈 프레임은 인트로와 마을이 함께 쓰도록 `core/player/midiFrames.ts`가 소유한다. 인트로 이야기의 마법판 문 안 마을은 저장된 사진이 아니라 `features/world/scene/villagePreview.ts`가 실제 마을 배치로 그때그때 그린 그림이며, 둘은 `core/scenes/villagePreview.ts` 계약으로만 연결되고 `sceneRegistry.ts`가 그 그리기 기능을 `IntroScene`에 넘긴다. 문으로 들어갈 때 마을 그림은 정확히 화면 크기까지 커지고 미디는 마을 시작 자리에 같은 크기로 내려앉으므로, 마을 장면은 `createVillageDoorArrival()` 데이터를 받으면 페이드인 없이 바로 이어진다. 미니게임 시작 화면은 `core/visual/gameStartOverlay.ts`가 그리며, `steps` 옵션은 카드형, `controls` 옵션은 간단형(제목·설명·조작 줄·시작 버튼)이다. 각 기능은 자기 시작 문구만 소유한다(`workshopStart.ts`, `airportOverlays.ts`의 `DATA_FLIGHT_START`, `EthicsReviewScene`의 `ETHICS_START`). 단계별 튜토리얼 부품(다음 버튼 카드, 화살표, 3·2·1 카운트다운)은 `core/visual/coachGuide.ts`, 튜토리얼 완료 기록은 `core/navigation/tutorialProgressStorage.ts`(`?tutorial`로 다시 보기)가 소유한다. AI 제작소는 첫 손님을 `scene/workshopTutorial.ts`로 안내한 뒤 카운트다운 후 본 게임을 시작하고, 데이터 비행장은 첫 비행을 `scene/airportTutorial.ts`(위아래 비행 → 데이터 3개 → 망가진 데이터 피하기 → 퀴즈 1문제, 시계와 하트는 멈춤)로 안내한 뒤 같은 카운트다운으로 본 비행을 시작하며 퀴즈 카드·문제 띠는 `scene/airportQuestionView.ts`가 그린다. 세 미니게임의 시작 카드는 모두 제목·설명·시작 버튼뿐이고 ? 버튼으로 튜토리얼을 다시 볼 수 있다. 별 맞추기 제작은 `scene/workshopStarCatch.ts`가 담당하고, 성공하면 `scene/workshopProductReveal.ts`가 완성품을 빛살·후광·이름 리본과 함께 화면 가운데 띄웠다가 미디 손으로 날려 보낸다. 손님 말풍선은 이미지가 아니라 `workshopView.ts`의 `drawWorkshopDialogueBubble`이 얇은 윤곽선과 얼굴 쪽으로 휘는 꼬리로 직접 그린다. AI 제작소의 주 조작은 터치다: 선반 상품·빈 칸(또는 들고 있는 상품)·작업대·손님을 누르면 `scene/workshopTapTargets.ts`가 `workshopControls.ts`의 `walkTo`로 미디를 그 앞까지 걸어가게 한 뒤 집기·되돌리기·놓기·전달을 실행하고, 제작 패널은 큰 멈춤 버튼과 화면 아무 곳 터치로 멈춘다. 방향키와 Space는 보조로 그대로 동작한다(별도 집기 버튼은 없다).

엔딩은 `features/ending/scene`이 소유한다. 열린 별빛 졸업길에 들어가면 `WorldScene`이 `core/scenes/endingStart.ts` 계약(`createEndingStart`: 별 진행도와 미디 위치)으로 `EndingScene`을 페이드 없이 시작하고, 엔딩은 인트로처럼 레지스트리가 넘긴 `WORLD_VILLAGE_PREVIEW`로 같은 마을을 그린다. 계약의 `landmarks`(세 건물의 지붕 별, 분수 꼭대기, 졸업길 화면과 별 개수 위치)는 마을 배치에서 계산되므로 건물을 옮기면 엔딩의 빛도 따라간다. 흐름은 1막 별이 깨어나 미디 주위를 돌고(`endingVillage.ts`) → 2막 별이 건물마다 불을 켜고 분수 위 큰 별로 모임 → 3막 큰 별이 졸업길로 들어가 학교 도서관(교재 프롤로그의 출발지, `public/assets/ending/story-library-v1.webp`)으로 가는 문이 열리고 제작소 손님 12명이 양옆에서 한꺼번에 걸어 나와 배웅하며 "약속해요!" 버튼(`endingPortal.ts`) → 4막 탐험가 증명서 사진(`endingCertificateView.ts`) → 5막 문으로 빨려 들어가 첫 화면의 짝인 마지막 화면(`endingFinale.ts`)이다. 영상 부분은 약 40초이고 건너뛰기(또는 Esc)는 4막으로 바로 간다. 미디 대사 패널과 입 모양은 `endingDialogue.ts`가 `core/player/midiTalker.ts`(인트로와 공유)로 그리며, 대사·증명서 문구·보석 9개는 `content/endingStory.ts`가 소유한다. 증명서는 교재를 끝까지 마친 것을 인증하며 `endingCertificate.ts`가 캔버스 한 장(1600×1130)에 그리므로 화면에 보이는 그림이 그대로 저장된다. 카메라(`endingCamera.ts`)는 버튼을 누를 때만 권한을 묻고, 미리보기는 사진 칸 위에 맞춘 `<video>`이며, 찍는 순간과 장면 종료·탭 숨김 때 바로 끈다. 거부되거나 카메라가 없으면 마을 그림과 미디 그림으로 채운다. 사진은 서버·브라우저 저장소에 남기지 않고 `endingSave.ts`가 터치 기기에선 공유 시트(이미지 저장), 컴퓨터에선 내려받기로만 저장한다(카메라는 https 또는 localhost에서만 동작). `?ending`을 붙이면 저장된 별(7개 미만이면 시연용 8개)로 엔딩을 바로 연다.

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
