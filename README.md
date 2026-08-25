# 배움마을

Next.js와 Phaser로 만든 교육용 웹 게임 프로토타입입니다.

## 현재 구현

- 키보드 방향키/WASD와 터치 조이스틱으로 월드 이동
- 중앙 분수대 시작
- 3개 건물의 근접 상호작용
- 좌측 상단 `생활 속 AI 가게`에서 AI 제작소 미니게임 실행
- 26가지 생활 속 문제와 AI 상품을 세션마다 무작위 구성
- 공항의 데이터 분류 비행 미니게임
- 윤리 심사소에서 학생 프로필이 담긴 사건 파일을 읽고 승인·보완 콘솔을 한 번 선택한 뒤 도장·근거 스캔 피드백을 받는 미니게임
- 도구 전달·문제 해결 전후 연출, 부드러운 오답 학습 피드백
- 신뢰 점수, 연속 판정 콤보, 핵심 근거 피드백과 별 결과
- 원본 PNG와 배포용 WebP를 분리한 에셋 파이프라인

## 콘텐츠 수정

AI 제작소 상품과 손님 요청은 `src/game/content/aiWorkshop.ts`에서 바꿉니다.
편집 원본은 `assets-source/`, 게임이 읽는 최적화 결과는 `public/assets/`에 둡니다. 그림 교체와 생성 흐름은 각 폴더의 `README.md`에 정리되어 있습니다.

## 프로젝트 운영

- 구조 기준: `docs/architecture/README.md`
- 전문가 역할: `docs/team/roles.md`
- 성능 예산: `docs/performance/budgets.md`

원본 이미지를 바꾼 뒤 `npm run assets:optimize`로 런타임 WebP를 만들고,
`npm run verify`로 에셋·콘텐츠·코드·production build를 한 번에 검증합니다.

## 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.
