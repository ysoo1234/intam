# 미디의 윤리 도장 — 원화와 생성 기록

- 방식: built-in `image_gen.imagegen`, 새 배경 생성 (`stylized-concept`).
- 스타일 참조: `public/assets/shop/ai-workshop-interior-v6.webp`. 구도는 새 도장 게임에 맞춰 별도로 설계했다.
- 선택된 생성 원화: `assets-source/ethics-review/stamp-stage-v1.png`.
- 실행용 배경: `public/assets/ethics-review/stamp-stage-v1.webp`, 1672×941.
- 도장 원화: 기존 `inspection-approve-stamp-v2.png`, `inspection-return-stamp-v2.png`. 새 실행용 파일은 `stamp-approve-v1.webp` (440×543), `stamp-reject-v1.webp` (440×526).
- 미디 원화: `assets-source/characters/midi_front.png`, `midi_left.png`, `midi_right.png`. 작은 게임용 PNG를 확대하지 않고 원본에서 460×590 / 459×590 / 460×590 WebP를 새로 파생했다.
- 미디 실행용 파일: `public/assets/ethics-review/stamp-midi-{front,left,right}-v1.webp`.
- 여섯 실행용 파일 합계 452,090바이트. 품질 96, 알파 품질 100. 배경·버튼·미디만 이 기능에서 로드한다.
- 카드, 한글, 승인·거절 판정 자국은 게임 안에서 고해상도로 그린다. 효과음은 짧은 음을 로컬에서 합성하며 음소거·볼륨 설정을 따른다.
- 이전 창구·손님 원본과 생성 실험은 모두 보존했다.
- 재생성: `npm run assets:optimize -- stamp-`.

## 정확한 배경 생성 프롬프트

Use case: stylized-concept. Create a production background illustration for the Intam children's AI ethics stamping game, using the supplied workshop image ONLY as a style and palette reference, not its room composition. This must be a NEW clean close-up play stage, perfectly symmetrical and readable, landscape 16:9 at high resolution. Friendly hand-drawn game illustration with crisp blue-gray contour lines, warm cream, gentle mint teal and honey wood, restrained clean cel shading matching the reference. Composition on a logical 1280x720 canvas: the entire upper 57 percent is a quiet flat warm ivory wall, softly lit with no visible objects. At y=405 a single gently curved honey-colored wooden desktop begins and fills the entire lower 44 percent, viewed slightly from above with a natural shallow perspective, a simple narrow teal front lip along y=685. Broad smooth surfaces with only 2 or 3 very subtle woodgrain curves at the extreme edges, never in the central play area. Quiet corners, no detail noise. The stage will receive ONE big character centered at x640 feet y610, one wide cream situation card centered x640 y250 and two stamp buttons at x260/y555 and x1020/y555, added separately in the game, so leave those areas unobstructed. Do not render any of these character/card/buttons yourself. No service window, visitors, doors, shelves, folders, drawers, handles, lamps, plants, clocks, borders, text, symbols, paper, stamps or UI. No photorealism, no blurry shading, no grunge. Aim for polished warm children's game scenery, clear and beautiful like a quiet toy tabletop, not a detailed room.
