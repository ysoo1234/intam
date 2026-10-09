# Game module

`createLearningGame.ts`는 렌더 설정만 소유하는 얇은 조립 지점이다. 등록 장면과 생성 순서, 고유 키, 에셋 범위는 `sceneRegistry.ts`가 관리한다. 새 맵이나 미니게임 구현을 이 두 파일에 직접 누적하지 않는다.

새 기능은 다음 경계를 따른다.

```text
features/<name>/
  model/       Phaser와 무관한 규칙, 상태, seed 기반 로직
  content/     해당 기능의 데이터와 validation
  scene/       Phaser 오브젝트, 입력, 애니메이션
  tests/       규칙 및 씬 계약 회귀
```

공통 입력, 씬 전환, 렌더 설정은 `core`; 배포 파일 경로와 로딩 정책은 `assets`; 계측은 `telemetry`가 소유한다. 기능은 다른 기능의 내부 파일을 직접 import하지 않는다.

## 새 장면 등록 순서

1. `features/<name>/`에 모델과 장면을 만든다.
2. `core/scenes/sceneKeys.ts`에 중복되지 않는 키를 추가한다.
3. 월드 입구와 제품 정책이 승인된 뒤에 `sceneRegistry.ts`에 사용하는 에셋 범위와 생성 함수를 함께 등록한다.
4. `npm run verify`로 중복 키, 등록 순서, 에셋과 기존 게임 동작을 확인한다.

승인 전 기능은 레지스트리에 기록하지 않는다. 등록된 장면만 import되므로 승인 전 기능이 초기 번들에 포함되지 않는다.
