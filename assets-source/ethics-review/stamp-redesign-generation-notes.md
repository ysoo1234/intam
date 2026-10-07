# 윤리 도장 재디자인 (2026-09-09)

생성 방식: 내장 image_gen 도구. 원본 PNG는 실제 alpha 채널을 검증했다. 배포 WebP는 `npm run assets:optimize -- stamp-tool-`로 생성한다.

최종 선택: 디지털·AI 세계와 미디의 색상에 맞춘 아이보리 몸체, 하늘색 납작한 손잡이, 직사각 고무 밑면. 승인 청록 ✓ / 거절 산호색 X. 폭 156px, 높이 최대 144px, 밑면 (300,558)/(980,558)에 배치한다.

## 최종 원본과 생성 결과

- `assets-source/ethics-review/stamp-tool-approve-v1.png` ← `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-09acdc89-5d9f-4ad4-b7ea-67a38b379f7e.png`
- `assets-source/ethics-review/stamp-tool-reject-v1.png` ← `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-5c5d9cb4-2650-416e-b27e-e20972aece1b.png`
- 배포: `public/assets/ethics-review/stamp-tool-{approve,reject}-v1.webp`

## 승인 최종 프롬프트

Use case: precise-object-edit.
Asset type: single transparent PNG approval rubber stamp sprite for Intam, a friendly AI educational game.
Input image 1: structural edit target. KEEP the unmistakable compact rectangular rubber stamp shape, short flattened oval grip, short neck, broad rectangular printing block, thin rubber printing sole, perspective and proportions.
Input image 2: supporting COLOR AND MATERIAL reference ONLY, the game's robot Midi. Do not depict a robot, face or body.
Primary request: REDESIGN THE MATERIALS of image 1 so this is a modern digital-world office stamp, NOT a wooden vintage stamp. Replace ALL golden wood and woodgrain with smooth warm ivory ceramic/plastic casing like Midi. The short flat grip is soft sky-blue with an ivory edge, and the short neck is ivory. The rectangular block has ivory housing with one clean teal inset displaying the existing bold ivory checkmark. Keep its very thin dark teal rubber printing layer at the bottom, clearly showing this is a physical rubber stamp. Restrained navy outlines, crisp cel-shaded highlights, softly rounded safe edges, simple high-quality cute game illustration, legible at 150 pixels wide.
Avoid wood, woodgrain, brown or gold material, joystick, tall shaft, ball knob, round base, stand, separate pedestal, screw heads, control buttons, neon glow, circuitry decoration, extra props or text.
Output a real RGBA PNG with fully transparent alpha pixels OUTSIDE the single stamp silhouette. Preserve transparency; do NOT paint a checkerboard, grid, background color or cast shadow. Fully framed object with transparent margins.

## 거절 변형 프롬프트

Use case: precise-object-edit.
Asset type: rejection version of the provided modern ivory-and-blue rubber office stamp, transparent PNG game sprite.
Edit ONLY the teal rectangular front inset and thin teal rubber sole to muted warm coral red. Replace the ivory checkmark with one clean ivory X (two simple rounded diagonal strokes).
Keep the sky-blue flattened oval grip, ivory trim, short ivory neck, ivory rectangular block, navy outline, highlights, perspective, proportions, position and all other materials EXACTLY the same as the reference. No wood, no new details, no extra objects, no text.
CRITICAL: output real RGBA PNG with fully transparent alpha pixels outside the single stamp silhouette. Keep the actual transparency of the input. Do NOT paint any checkerboard, gray grid, background color or cast shadow. Crisp anti-aliased edges with alpha, fully framed object with transparent margins.

## 거절 배경 투명화 프롬프트

Use case: background-extraction.
Edit target: the provided modern ivory-and-blue rejection rubber stamp.
Remove the entire gray checkerboard backdrop. Keep ONLY the stamp object exactly as it is: sky-blue grip, ivory housing, red inset with cream X, thin red rubber sole, crisp navy edge. Preserve every part of the stamp, perspective, color and proportions.
The output MUST have actual transparency: an RGBA PNG with alpha=0 outside the stamp. The gray checkerboard is unwanted image content to remove, not part of the design. Do not draw any replacement checkerboard, any grid, white backdrop, shadow or other background. Return a clean isolated stamp cutout on a truly transparent background, with sharp intact antialiased edges.

## 구조 탐색용 목제 시안 (미사용, 보존)

사용자 피드백에 따라 목재는 최종 디자인에서 제외했다. 이전 도장 원화와 배포본, 아래 시안들은 삭제하지 않았다.

승인 시안: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-a29bc7ee-b771-4c11-8fe6-a7c461f830ea.png`

Use case: stylized-concept.
Asset type: a single transparent PNG game sprite for a cute Korean educational game, Intam.
Input image 1 is ONLY a visual style reference: match its confident clean dark-navy outlines, warm ivory/honey colors, restrained teal accents, crisp cel-shaded cartoon surfaces and polished highlights. Do not depict a folder or lock.
Primary request: an unmistakable traditional hand-operated rectangular RUBBER OFFICE STAMP, standing upright on its rubber printing sole. Compact squat silhouette, total width about 1.25 times total height. A short wide flattened-oval honey-colored wooden grip, a short tapered wooden neck, and a WIDE horizontal rectangular wooden stamping block, with a clearly visible THIN dark teal rubber printing layer along the very bottom. The block IS the stamp, there is no separate stand. The wooden handle is light honey wood, not a round ball or joystick. The front face of the rectangular block has a simple muted teal inset with ONE clean ivory checkmark (no letters). A subtle wood grain line or two, broad rounded safe edges. Slight three-quarter view from above, mostly front-facing, show a little top surface and right edge. The lower contact edge should read as nearly horizontal and flat, so it can rest on a desktop.
Scene/backdrop: genuinely transparent background with alpha, no ground plane and no external cast shadow. One isolated object only, fully in frame, centered with clear transparent margin.
Style: polished hand-drawn game prop, clean and sharp even at 150 px wide, simple solid shapes, moderate highlights, no noise, no blur, no tiny detailing.
Avoid: joystick, control stick, spherical knob, tall shaft, circular base, metal plate, pedestal, nameplate stand, screws, buttons, separate ink pad, papers, extra props, gradients on background, text, letters, watermark.

거절 시안: `exec-4f6b52b5-1779-44e7-9841-502592fcb1fe.png` (체커보드가 포함되어 미사용)

Use case: precise-object-edit.
Asset type: transparent PNG rejection rubber-stamp game sprite, matching the provided approval stamp exactly.
Edit target: the provided wooden rectangular rubber office stamp.
Change ONLY the teal front inset and thin teal rubber sole to a warm muted coral red, and replace the ivory checkmark with one clean ivory X (two simple rounded diagonal strokes). Keep every other feature the same: compact squat silhouette, short flattened honey-wood grip and neck, wooden rectangular block, navy outlines, shape proportions, wood color, broad highlights, perspective, camera angle, scale and position. Do not add a separate pedestal or ink pad. Preserve all crisp edges. Keep the background genuinely transparent with alpha and no cast shadow, no ground plane, no extra objects, no letters or text.

거절 투명 시안: `exec-d6b18807-cd56-4018-aa71-a06c40c26c98.png`

Use case: precise-object-edit.
Make a REJECTION version of this wooden rubber stamp game sprite. Keep the reference shape, proportions, perspective, wood, navy outline, and position identical. Change the teal rectangular front inset and thin teal rubber sole to warm coral red; change the ivory checkmark to a clean ivory X symbol.
CRITICAL OUTPUT: a real RGBA PNG with a fully transparent alpha channel OUTSIDE the single stamp silhouette. The reference has actual transparent pixels; preserve this actual transparency. Do NOT draw a checkerboard pattern, do NOT draw any gray/white grid, and do NOT fill the background with a color. Background pixels must be alpha=0. No shadow outside the stamp, no table, no text, no extra objects. Crisp anti-aliased silhouette edges with alpha. One isolated compact wood-handled rectangular rubber office stamp only.

디지털 거절 중간 시안 `exec-01b69877-b3be-4a07-a90a-d6a0982ee2c5.png`에는 체커보드가 포함되어 배경 투명화를 다시 생성했다.

