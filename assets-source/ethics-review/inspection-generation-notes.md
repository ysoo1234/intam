# 윤리 심사 창구 이미지 생성 기록

도구: 내장 ImageGen (CLI/API 미사용). 2026-09-05.

최종 원본은 이 문서와 같은 폴더에 저장했다. 게임용 WebP는 `public/assets/ethics-review`에 별도 생성한다. 한글과 도장 판정 글씨는 코드에서 선명하게 렌더링한다.

## 사용한 원본

- `inspection-booth-v2.png`: 좁은 창구, 서류장, 책상. 탁상 면적을 넓힌 최종본.
- `inspection-form-v2.png`: 실제 알파가 있는 빈 서류.
- `inspection-approve-stamp-v2.png`, `inspection-return-stamp-v2.png`: 실제 알파가 있는 민트·코랄 도장.
- `inspection-window-girl-v1.png`, `inspection-window-boy-v1.png`: 창구 안의 학생 대기열. 원본의 얼굴·손·문서 테두리를 유지하면서 불투명 실내 배경으로 마감했다.

원화는 작은 화면에서 읽히는 단순한 면과 선을 사용한다. WebP 품질은 96, 투명 소품의 알파 품질은 100이다. 작은 원본을 오프라인 확대하지 않는다.

## 보존한 실험

이전 배달 시안과 `inspection-visitor-*` 인물 컷아웃은 보존했다. 체크무늬가 실제 RGB 배경에 들어 있거나 넓은 반투명 번짐이 남는 결과는 최종 장면에서 사용하지 않는다. 일부 개발 확인용 WebP도 보존하며 현재 프리로드 대상에서 제외했다.

## 프롬프트 기록

### 1. inspection-booth-v1.png

Mode: built-in generation with style references

```text
Use case: stylized-concept.
Asset type: final 16:9 background for the Intam AI ethics inspection game. NEW composition, references are STYLE ONLY: image 1 establishes precise closed outlines and Midi's warm cream/teal drawn world; image 2 establishes clean illustrated materials, not its layout.
Create a cozy, tightly framed paperwork inspection booth, with the satisfying occupied counter arrangement of a document-checking game. NOT a large room or workshop. Camera front-facing cutaway, slightly looking down, crisp hand-drawn cel animation, high-resolution 2560x1440 if possible.
Layout on logical 1280x720: left 30 percent is a service window and little waiting hall, right 70 percent is the inspector's narrow booth and desk. Top 0..90 stays quiet for HUD. LEFT: large teal-framed rectangular ticket window bounds x35..355,y105..375, cream arched opening inside, shallow counter sill at y355; beyond is a small warm hallway, doorway, two queue rope posts, no people. The lower-left x35..355,y400..680 is a neat cream office cabinet front, mostly plain and available for an illustrated rulebook overlay.
RIGHT: filing shelves along the upper wall, neatly closed folders in muted teal/coral/cream, a small analog clock without numerals, a hanging task lamp. Their bottom ends around y215. A narrow honey tiled clerk aisle spans x420..1220,y230..335, only 100px deep; a small robot will walk here later, do not draw it. The large inspection desk occupies x390..1280,y350..720, filling the right foreground. Its WIDE calm honey wood desktop is seen from slightly above; front edge only near y695. No empty floor in foreground! Entire desktop x405..1240,y370..675 must be clear for separately rendered paper forms and stamps. Only small tidy stationery near far corners: ink bottle and pencil cup, tied archive bundles at far left rear, round desk bell at rear center, tiny paper-clip dish far right rear. Detailed but readable desk drawer trim at bottom edge. Functional paper office atmosphere with warm diffused top-left light. Dense framing with large clean readable forms, not tiny clutter.
Crisp completely closed desaturated blue-gray outlines, clean edges, restrained internal cel shading, warm ivory and pale wood, teal technical trim, small coral/gold details. No smeared or watercolor edges, no blur, no painterly patches, no glossy realistic 3D. No writing, letters, labels, numbers, logos, watermarks, signs or characters. NO wall-sized display board, NO three separate podiums, NO central empty room floor. Desk and small inspection window are the main subjects.
```

### 2. inspection-booth-v2.png

Mode: built-in precise-object-edit

```text
Use case: precise-object-edit. Image 1 is the edit target. Preserve the exact Intam inspection booth drawing: window, architecture, folders, lamp, clerk's narrow aisle, bell, stationery, palette, crisp linework and camera. Change only the foreground desk proportions to make more usable tabletop. EXTEND the wooden tabletop DOWNWARD so the front edge is at 92 percent of image height (logical y=662 on a 1280x720 screen), instead of the current 78 percent. The desk drawers should occupy only the last 8 percent of the image. The desk rear edge and clerk aisle stay exactly where they are. The lower-left corner of the desk extends toward the bottom at x about 320/1280. Center tabletop x550..1100,y350..650 must remain completely blank and calm for a large paper document. No new objects, no paper on the desk, no text or people. Keep every contour crisp and fully closed. No blur, smudged outlines, watercolor edges or unsharp upscale. Preserve high native detail in folder corners, stationery and wood boundaries. Render high resolution 2560x1440 if possible, same 16:9 composition.
```

### 3. inspection-form-v1.png

Mode: built-in generation with style reference

```text
Use case: stylized-concept. NEW illustrated game prop. Reference image 1 is style only: warm clean Intam linework and paper material. A single blank official application form on a thin kraft file backing, landscape aspect ratio about 1.75:1, frontal flat view, zero tilt. Genuine transparent background. Warm ivory rectangular paper with crisp thin blue-gray closed outer line, minimally rounded 8px corners, short stacked paper edges at bottom, a tiny teal file tab extending from the upper-left edge and a small polished brass paper clip at top. A very thin muted-teal double-line perimeter border, inset well away from the edges. The entire inside is completely blank light ivory with NO printed boxes, no divider lines, no writing, no checkmarks, stamps or symbols. Large quiet blank area for a code-rendered visitor name and two lines of Korean situation text. Unlike a pill-shaped UI card, this should look like an actual neat document resting on an inspector's desk. Every edge clean and precise, soft gentle cel shading strictly within contours. Entire object visible with 5% transparent margin. No checkerboard painting, background, cast ground shadow, blur, watercolor, paper noise, photoreal texture, logo or watermark. High native resolution, crisp at 560x320 display size.
```

### 4. inspection-approve-stamp-v2.png

Mode: built-in background-extraction

```text
Use case: background-extraction. Image 1 is the edit target. REMOVE the white and gray checkerboard background around the stamp entirely. Output a cutout PNG with TRUE ALPHA TRANSPARENCY (transparent pixels, alpha=0), not an illustration of a transparency grid. Keep the exact existing stamp, its cream plaque, colors, clean outlines, silhouette and all its internal details unchanged. Do not add any background, shadow, checker pattern, white backdrop, extra object or text. Only the rubber stamp and its label base should have opaque pixels. Maintain original full object and generous padding. This must composite cleanly over a wooden game desk without a rectangle around it.
```

### 5. inspection-visitor-girl-v1.png

Mode: built-in generation with style reference

```text
Create a transparent PNG character sprite for Intam. A friendly Korean sixth-grade girl with short dark bob hair, a little gold hair clip, warm peach skin, a cream shirt under muted teal overalls and coral sneakers. She holds a neat cream application folder against her chest with both hands. Full body, front-facing, standing neutrally, confident gentle smile. New character, not Midi. Match the attached Intam style reference: crisp closed blue-gray outlines, clean cel shading inside outlines, warm cream/teal palette, rounded big readable forms. Slightly big head in the same friendly educational game proportions. Isolated character only on genuinely transparent alpha background; entire silhouette and feet visible with 8% empty transparent padding. No scenery, no ground shadow, no text. Ensure hands, eyes, hair, folder edges and shoes are precise and not smudged. Tall 2:3 sprite image, high native detail.
```

### 6. inspection-form-v2.png

Mode: built-in background-extraction

```text
Use case: background-extraction. Edit the attached blank application form. Erase every white/gray checker square outside the paper and its file tab. Return a TRUE transparent RGBA PNG: the background pixels have alpha 0. Preserve the exact illustrated blank form and brass clip; no change to colors, contours or blank writing area. No visible background, checker pattern, white rectangle, shadow or new writing. Keep all edges crisp so the result can be composited cleanly over a wooden desk.
```

### 7. inspection-visitor-boy-v2.png

Mode: built-in background-extraction

```text
Use case: background-extraction. Image 1 is the target. Remove all white and gray checkerboard background, including between the legs and around hair, glasses and shoes. Return TRUE transparent RGBA PNG, background alpha=0. Keep the boy, face, hands, folder, clothes, colors, clean blue-gray contours and entire silhouette exactly as drawn. No added shadow, halo, glow, vignette, white background or checker grid. The cutout must have clean antialiased edges that composite directly over a warm room. Keep the whole person visible.
```

### 8. inspection-return-stamp-v2.png

Mode: built-in background-extraction

```text
Background removal only. Extract the coral rubber stamp from the attached image onto a transparent background. Use actual alpha transparency. Erase ALL gray and white checkerboard squares outside the stamp. The checkerboard is part of the unwanted background, not part of the stamp. Keep only the stamp's original colored opaque silhouette with crisp antialiased contours. No shadow or floor. Output a transparent PNG cutout ready for a game. Preserve exact original artwork, shape, cream blank label and coral color.
```

### 9. inspection-visitor-boy-v3.png

Mode: built-in background-extraction

```text
Background removal only. Extract the boy character onto a transparent background. Use actual alpha transparency in the output PNG. Every light gray and white checkerboard square in the attached image must be removed, including between the legs. Keep only the original opaque boy holding his folder, with crisp antialiased contours. No white backdrop, no checkerboard, no halo, no shadow or ground. Preserve all original colors and details of the boy. Return a transparent PNG sprite.
```

### 10. inspection-visitor-girl-v3.png

Mode: built-in background-extraction

```text
Background removal only. Extract the girl character onto a transparent background. Use actual alpha transparency in the output PNG. Every gray and white checkerboard square in the attached image must be removed, including between the legs. Keep only the original opaque girl holding her folder, with crisp antialiased contours. No white backdrop, no checkerboard, no halo, no shadow or ground. Preserve all original colors and details of the girl. Return a transparent PNG sprite.
```

### 11. inspection-visitor-boy-v4.png

Mode: built-in background-extraction

```text
이 이미지의 배경을 제거해서 누끼를 따줘. 회색과 흰색 체크무늬는 전부 배경이야. 체크무늬를 그리지 말고 투명 배경 PNG 파일로 만들어줘. 인물은 그대로 유지해줘.
```

### 12. inspection-visitor-girl-v4.png

Mode: built-in background-extraction

```text
이 인물 이미지의 누끼를 깔끔하게 따줘. 사람 바깥에 남은 회청색 그림자, 뿌연 번짐과 잔여 배경은 모두 제거해줘. 사람 안의 원래 그림은 그대로 유지하고 인물 테두리 바깥과 다리 사이만 완전히 투명한 PNG 파일로 만들어줘. 체크무늬나 배경색을 새로 그리지 마.
```

### 13. inspection-window-girl-v1.png

Mode: built-in generation with character references

```text
Create a finished illustrated game background for the INSIDE of a small service window. Landscape ratio 10:7, native high detail. The illustration will occupy a 327 by 229 area in a warm cream and teal inspection office. Match the supplied Intam boy and girl: crisp clean dark blue-gray contours, rounded friendly educational game art, restrained cel shading, cream, muted teal and coral colors. Interior backdrop is a softly sunlit mint corridor with very simple wall panels. Completely opaque image, full bleed all the way to each edge. NO transparency, no checkerboard, no vignette or blurry gradients, no border or window frame, no writing, no signs. Show a queue of students who have brought paper forms: close up waist-up FRONT STUDENT fills the RIGHT TWO THIRDS of the composition with a large clearly readable face; two smaller students wait behind to the left. Folder and hands visible at bottom, bodies naturally cropped at bottom edge. Keep all facial features, fingers, folder edges and hair contours distinct and precise; absolutely no smudged or painterly details. FRONT STUDENT is the bob-haired Korean girl from image 1, gold hair clip, cream shirt and teal overalls, holding a cream folder. Her head reaches near the top and her waist is cropped at the bottom. The boy with round teal glasses and coral hoodie from image 2 waits to the left, with one additional smaller student behind him. Friendly small smiles, quietly waiting.
```

### 14. inspection-window-boy-v1.png

Mode: built-in generation with character references

```text
Create a finished illustrated game background for the INSIDE of a small service window. Landscape ratio 10:7, native high detail. The illustration will occupy a 327 by 229 area in a warm cream and teal inspection office. Match the supplied Intam boy and girl: crisp clean dark blue-gray contours, rounded friendly educational game art, restrained cel shading, cream, muted teal and coral colors. Interior backdrop is a softly sunlit mint corridor with very simple wall panels. Completely opaque image, full bleed all the way to each edge. NO transparency, no checkerboard, no vignette or blurry gradients, no border or window frame, no writing, no signs. Show a queue of students who have brought paper forms: close up waist-up FRONT STUDENT fills the RIGHT TWO THIRDS of the composition with a large clearly readable face; two smaller students wait behind to the left. Folder and hands visible at bottom, bodies naturally cropped at bottom edge. Keep all facial features, fingers, folder edges and hair contours distinct and precise; absolutely no smudged or painterly details. FRONT STUDENT is the Korean boy from image 2, wavy dark hair, round teal glasses, coral hoodie, holding his yellow folder. His head reaches near the top and his waist is cropped at the bottom. The bob-haired girl with gold hair clip, cream shirt and teal overalls from image 1 waits to the left, with one additional smaller student behind her. Friendly small smiles, quietly waiting.
```


작은 운반 서류와 쌓인 서류는 미세한 이미지 가장자리가 축소 시 거칠게 보이지 않도록 게임 내부의 단순한 선·면 소품으로 표시한다. 큰 확인서와 도장 소품에는 위의 생성 원화를 사용한다.
