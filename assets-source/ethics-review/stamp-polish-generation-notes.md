# 윤리 도장 품질 보강 — 2026-09-09

기본 구성(큰 미디, 짧은 카드, 승인·거절, 2분)을 유지하고 주제 삽화와 책상 재질을 보강했다.

- 생성 방식: built-in `image_gen.imagegen`.
- 공통 스타일 참조: `assets-source/ethics-review/inspection-approve-stamp-v2.png`.
- 선택 원화: `stamp-stage-v2.png`, `stamp-topic-permission-v2.png`, `stamp-topic-privacy-v1.png`, `stamp-topic-checking-v1.png`, `stamp-topic-honesty-v1.png`, `stamp-topic-respect-v1.png` (모두 이 문서와 같은 폴더).
- 실행용 파생본: `public/assets/ethics-review/`의 같은 이름 WebP. 이미지 원본을 보존하고 `npm run assets:optimize -- stamp-`로 생성한다. 삽화는 알파 투명도를 보존하며 2배 해상도·품질 96으로 만든다.
- 카메라 첫 생성과 배경 제거 실험은 바둑판이 실제 픽셀로 남아 채택하지 않았다. `stamp-topic-permission-v1.png`는 실험 보존본이며, 실행용에는 알파가 확인된 v2만 포함한다.
- 카테고리당 같은 그림을 승인·거절 사례 양쪽에 사용한다. 그림 자체로 정답이 드러나지 않는다.

## 첫 주제 삽화 5개 — 정확한 프롬프트

### permission

Use case: stylized-concept. Asset type: one isolated topic illustration for Intam children's ethics stamping game. Input image is ONLY the style reference: match its warm hand-drawn game illustration, crisp blue-gray contour, simple cel shading, rounded dimensional objects, honey gold, muted teal and creamy ivory. Create a single clear composed illustration on a genuinely transparent alpha background, square 1024x1024. Large subject filling 78 percent, generous clear margins; friendly premium educational game art, readable at 140px. No letters, text, numbers, checkmarks, crosses, badges, border, circular backing, UI, people, faces, extra props or watermark. Not photorealistic or 3D render; no blurry tiny details. The image identifies a topic and MUST NOT indicate whether a choice is right or wrong. Subject: a warm ivory and teal compact camera with a clear blue round lens, beside one small honey-colored microphone. A cohesive two-object still life about photos and voices.

### privacy

Use case: stylized-concept. Asset type: one isolated topic illustration for Intam children's ethics stamping game. Input image is ONLY the style reference: match its warm hand-drawn game illustration, crisp blue-gray contour, simple cel shading, rounded dimensional objects, honey gold, muted teal and creamy ivory. Create a single clear composed illustration on a genuinely transparent alpha background, square 1024x1024. Large subject filling 78 percent, generous clear margins; friendly premium educational game art, readable at 140px. No letters, text, numbers, checkmarks, crosses, badges, border, circular backing, UI, people, faces, extra props or watermark. Not photorealistic or 3D render; no blurry tiny details. The image identifies a topic and MUST NOT indicate whether a choice is right or wrong. Subject: one closed ivory personal folder with a small teal padlock resting in front; simple visible keyhole, no writing. A cohesive still life about personal information.

### checking

Use case: stylized-concept. Asset type: one isolated topic illustration for Intam children's ethics stamping game. Input image is ONLY the style reference: match its warm hand-drawn game illustration, crisp blue-gray contour, simple cel shading, rounded dimensional objects, honey gold, muted teal and creamy ivory. Create a single clear composed illustration on a genuinely transparent alpha background, square 1024x1024. Large subject filling 78 percent, generous clear margins; friendly premium educational game art, readable at 140px. No letters, text, numbers, checkmarks, crosses, badges, border, circular backing, UI, people, faces, extra props or watermark. Not photorealistic or 3D render; no blurry tiny details. The image identifies a topic and MUST NOT indicate whether a choice is right or wrong. Subject: an open creamy book with blue-gray page lines and one honey-gold magnifying glass laid diagonally in front. The lens has a clean transparent pale blue tint, no symbols. A cohesive still life about checking information.

### honesty

Use case: stylized-concept. Asset type: one isolated topic illustration for Intam children's ethics stamping game. Input image is ONLY the style reference: match its warm hand-drawn game illustration, crisp blue-gray contour, simple cel shading, rounded dimensional objects, honey gold, muted teal and creamy ivory. Create a single clear composed illustration on a genuinely transparent alpha background, square 1024x1024. Large subject filling 78 percent, generous clear margins; friendly premium educational game art, readable at 140px. No letters, text, numbers, checkmarks, crosses, badges, border, circular backing, UI, people, faces, extra props or watermark. Not photorealistic or 3D render; no blurry tiny details. The image identifies a topic and MUST NOT indicate whether a choice is right or wrong. Subject: a small creamy sheet with a folded upper corner and a honey-gold pencil resting diagonally across it, with three simple short blue-gray strokes on the sheet that are not actual letters. A cohesive still life about creating and acknowledging work.

### respect

Use case: stylized-concept. Asset type: one isolated topic illustration for Intam children's ethics stamping game. Input image is ONLY the style reference: match its warm hand-drawn game illustration, crisp blue-gray contour, simple cel shading, rounded dimensional objects, honey gold, muted teal and creamy ivory. Create a single clear composed illustration on a genuinely transparent alpha background, square 1024x1024. Large subject filling 78 percent, generous clear margins; friendly premium educational game art, readable at 140px. No letters, text, numbers, checkmarks, crosses, badges, border, circular backing, UI, people, faces, extra props or watermark. Not photorealistic or 3D render; no blurry tiny details. The image identifies a topic and MUST NOT indicate whether a choice is right or wrong. Subject: two rounded dimensional speech bubbles, one creamy ivory and one muted teal, overlapping gently. A small honey-gold heart floats between them. One clean cohesive illustration about speaking kindly.

## 배경 및 알파 편집 — 정확한 프롬프트

### permissionFixed

참조: C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-964492ac-3bd9-439c-bbc3-28e28ec3f5ac.png

Use case: background-extraction. Remove ONLY the entire gray checkerboard backdrop from this camera and microphone illustration. Output a PNG with genuinely transparent alpha pixels outside the camera and microphone, NOT a drawn checkerboard. Preserve the exact camera, microphone, composition, dark outlines, colors, lens, highlights and sharp edges. Do not add any backdrop, shadow, text or new objects. Keep a little transparent margin around all edges.

### stageV2

참조: C:/Users/dkssu/Desktop/dev/intam/assets-source/ethics-review/stamp-stage-v1.png

Use case: precise-object-edit. Refine this exact background for Intam children's stamp game. Preserve the landscape 16:9 composition, quiet creamy empty wall, curved honey wooden desktop, and teal front lip. Add just ONE broad muted pale mint-teal desk mat on the wooden tabletop: it spans horizontal 8% to 92% of canvas, starts at 67% height and ends at 92% height, gently rounded corners and shallow perspective, a single thin honey-gold stitched inset edge, clean illustrated material, restrained contact shadow. Keep its surface very quiet and light enough for dark teal button labels to remain readable. The rest of the wood remains visible around it. Improve the tactile beveled wood edge and add very subtle warm daylight at the extreme wall corners; the central wall remains empty for a question card. Match existing warm hand-drawn game background with crisp illustrated contours and smooth cel shading. Do not add any characters, stamps, paper, writing, symbols, visitors, service window, desk objects, plants, shelves, clocks, busy texture, dust or UI. This must still look like this exact clean simple game stage, with richer crafted materials. High resolution, sharp edges, no smeared details.

## 최종 카메라 삽화 재생성 — 정확한 프롬프트

참조: `assets-source/ethics-review/stamp-topic-privacy-v1.png`.

Use case: stylized-concept. Create a NEW matching Intam game illustration in exactly the style of this folder icon: crisp navy contours, gentle cel shading, ivory, teal, honey gold. Subject is a compact ivory and teal camera with a large blue lens beside a small honey-gold and teal microphone, arranged as one cohesive simple topic illustration. Center the group, keep clear margins, no words, no extra objects. This is a cutout game sprite: use actual transparent alpha pixels for ALL empty background, as in the supplied transparent folder illustration. Output transparent PNG. Do not paint any checkerboard or solid background. The illustration will be placed over a light cream game card. High resolution and sharp edges.

## 생성 도구 출력 경로

- permission 최초 선택: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-1e602823-428f-4f62-9371-8480eb61325f.png`
- privacy 최초 선택: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-0c9e2e13-4d4f-4bd0-a119-518a7e086905.png`
- checking 최초 선택: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-155dbf8a-7c08-41b4-bfa6-81ce95cb40a3.png`
- honesty 최초 선택: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-b5878e52-077a-4ba7-8325-b14332882006.png`
- respect 최초 선택: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-de7b1314-e7a1-454b-bc00-652de64b5edc.png`
- 최종 permission v2: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-d27429e5-55e1-40f6-afb8-81702d7a9215.png`
- stage v2: `C:/Users/dkssu/.codex/generated_images/01a07046-0603-7973-99ec-689b640dafbf/exec-8eb8d1f6-11fb-4b5c-a754-d4e87bd72bf0.png`

