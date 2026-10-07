# 윤리 심사소 간소화 이미지 생성 기록

- 날짜: 2026-09-05
- 방식: built-in `image_gen.imagegen`, `precise-object-edit` (기존 인탐 그림을 참조한 편집)
- 목적: 배경 소품과 대기 인원을 줄여 서류 한 장과 도장 두 개에 시선 집중.
- 이전 원화와 생성 실험은 그대로 보존한다. 한글과 버튼 상태는 게임에서 선명하게 표시한다.
- 실행용 파일: `public/assets/ethics-review/*-simple-v1.webp`
- 재생성: `npm run assets:optimize -- simple-v1`
- 실행용 크기: 방 1672×941, 여자 손님 608×426, 남자 손님 608×425. WebP 품질 96, 세 파일 합계 240,192바이트.
- 게임 안에서는 손님을 304×240 크기로 곡선 창구에 맞춰 표시한다. 한글은 별도 텍스트이므로 이미지 확대에 따라 뭉개지지 않는다.

## inspection-booth-simple-v1.png

- 입력: `assets-source/ethics-review/inspection-booth-v2.png`
- 선택된 최종 원화: `assets-source/ethics-review/inspection-booth-simple-v1.png`

### 정확한 생성 프롬프트

Use case: precise-object-edit. Simplify this exact Intam inspection booth illustration for a sixth-grade game. Keep the camera, 16:9 composition, precise outer geometry and coordinates of the left service window, narrow clerk aisle and large wooden foreground desk. Keep the warm cream, teal and honey wood illustrated style, crisp closed outlines and clean gentle cel shading. REMOVE visual clutter: remove the wall clock; remove the desk bell, ink bottle, pencil cup, paperclip dish, tied paper bundles, ALL plants and waiting ropes; replace the many detailed filing cabinets across the top with ONE short plain shelf holding ONLY THREE large muted cream/teal folders at the upper center. Keep ONE simple teal wall lamp at the upper right. Make the left cabinet front under the window a single plain cream panel with one thin teal perimeter line, no inset moulding or knob. Simplify the desk front to a plain wood face with two discreet teal handles. Keep the desktop completely clear and visually quiet. Reduce fine wood grain and floor grout detail; use broad calm surfaces, restrained contrast in background details, and sharply defined furniture silhouettes. The clerk aisle stays at logical y=275..315 and the desk front edge stays at y=640 on a 1280x720 canvas. The left window opening remains x64..391,y96..325. Do not draw any characters, paperwork, stamps, text, numbers or UI. Do not blur anything. This is a clean friendly game setting with just a window, desk, one shelf and one lamp, not a room full of decoration.

## inspection-window-girl-simple-v1.png

- 입력: `assets-source/ethics-review/inspection-window-girl-v1.png`
- 선택된 최종 원화: `assets-source/ethics-review/inspection-window-girl-simple-v1.png`

### 정확한 생성 프롬프트

Use case: precise-object-edit. Simplify this Intam illustration to ONE visitor. REMOVE both boys completely. Keep only the same bob-haired girl with gold hair clip, cream shirt, teal overalls and cream folder. Recenter her horizontally. Show her head and upper body holding the folder, a friendly little smile. Keep her original character identity, face, clothing colors, crisp blue-gray outlines and simple cel shading. Background is one quiet cream wall with a single muted teal lower panel, no corridor perspective, no windows or ceiling details. Full-bleed opaque landscape image, ratio 10:7, no border, no transparency, no checkers, no text. One large clearly readable person and a very simple background. Every contour, finger, eye and folder edge is crisp; no painterly or smeared shading.

## inspection-window-boy-simple-v1.png

- 입력: `assets-source/ethics-review/inspection-window-boy-v1.png`
- 선택된 최종 원화: `assets-source/ethics-review/inspection-window-boy-simple-v1.png`

### 정확한 생성 프롬프트

Use case: precise-object-edit. Simplify this Intam illustration to ONE visitor. REMOVE the girl and the smaller boy completely. Keep only the same boy with wavy dark hair, round teal glasses, coral hoodie and yellow folder. Recenter him horizontally. Show his head and upper body holding the folder, a friendly little smile. Keep his original character identity, face, clothing colors, crisp blue-gray outlines and simple cel shading. Background is one quiet cream wall with a single muted teal lower panel, no corridor perspective, no windows or ceiling details. Full-bleed opaque landscape image, ratio 10:7, no border, no transparency, no checkers, no text. One large clearly readable person and a very simple background. Every contour, finger, eye and folder edge is crisp; no painterly or smeared shading.
