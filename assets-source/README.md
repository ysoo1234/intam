# 편집용 게임 에셋 원본

이 폴더는 현재 배포 에셋(`public/assets`)을 다시 만들 수 있는 원본만 보존하며, 웹 배포 대상이 아닙니다. `public/assets`에는 게임이 실제로 읽는 최적화 결과(WebP)만 둡니다.

## 작업 흐름

1. 이 폴더의 원본을 편집하거나 교체합니다.
2. `npm run assets:optimize`를 실행해 WebP를 다시 만듭니다. (`node scripts/optimize-game-assets.mjs --list`로 등록된 원본 목록을 볼 수 있습니다.)
3. `npm run verify`로 에셋 규격과 게임 빌드를 함께 검증합니다. `npm run assets:audit`는 등록되지 않은 파일이 `public/assets`에 들어오는 것을 오류로 처리합니다.

원본과 배포 결과는 가능한 한 같은 상대 경로와 파일명 줄기를 사용합니다. 이름이 다르면 `scripts/optimize-game-assets.mjs`의 `output` 항목이 배포 경로를 명시합니다.

## 폴더별 현재 원본

- `world/`: 배움마을. 바닥 `village_garden_raw_v2.png` → `village-ground-v8.png`(2x), 건물 `village-ai-shop-v3.png`, `village-airport-v3.png`, `village-ethics-office-v3.png`, 별빛 졸업길 태블릿 `village-tablet-gate-v4.png`, 분수 `village-fountain-v3.png`와 물 프레임 `village-fountain-water-frames-v1.png`.
  - 걸을 수 있는 영역: `build_garden_walkable_mask_v8.py`가 `village-walkable-mask-v9.png`를 만들고, `node scripts/generate-village-collision-mask.mjs`가 그것을 코드로 바꿉니다.
- `characters/midi-v2/`: 교재 미디. 원본 시트 `characters/midi_v2_*.png`를 `build_front_frames.py`가 프레임으로 잘라 둡니다.
- `shop/`: AI 제작소 배경·작업대·패널, 상품 원화 26개(`products-v2/`).
- `customers/v3-game/`: 손님 `<request-id>-worried.png` / `-happy.png`. 요청 ID는 `src/game/content/aiWorkshop.ts`와 일치해야 하며, 윤리 심사소도 같은 손님 그림을 씁니다.
- `ethics-review/`: 심사 창구 배경·확인서·도장·심사 기준 패널.
- `airport/`: 데이터 비행장 배경(가로 반복), 데이터·나쁜 데이터·공공데이터 아이템, 장애물.
- `intro/`: 첫 화면 보석판·제목·입장 버튼, 이야기 장면의 마을 사진(`story-village-snapshot-v3.png`)과 문틀.
- `ui/`: 공통 패널·버튼, 튜토리얼 화살표 `coach-arrow-v1.png`.

## 안 쓰는 원본

게임을 만드는 데 더 이상 쓰이지 않는 원본·시안·프롬프트·옛 빌드 스크립트는 프로젝트 루트의 `_unused/`로 옮겨 두었습니다(원래 경로 그대로 `_unused/assets-source/...`). 이 폴더는 git에 올라가지 않으며, 필요 없으면 통째로 지워도 됩니다.
