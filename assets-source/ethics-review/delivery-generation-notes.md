# 윤리 심사소 배달 게임 이미지 제작

2026-09-05. Built-in image_gen 사용. 기존 미디 스타일 보드와 AI 공방 실내를 그림체 기준으로 사용했다. 게임 내 글자는 Phaser로 별도 표시한다.

실사용: `delivery-room-final-v1.png`, `delivery-card-panel-v1.png`. 기존 공방 행동 버튼과 미디 방향별 그림은 재사용했다.
중간 원본: `delivery-room-v1.png`, `delivery-approve-counter-v1.png`, `delivery-review-counter-v1.png`. 도장대 단독 시안에는 체크무늬가 구워져 있어 게임에서 사용하지 않고 최종 배경에 합성했다. 원본은 보존했다.
실행 이미지: `npm run assets:optimize -- ethics-review/delivery-`로 public/assets/ethics-review에 WebP를 생성했다.

## delivery-room-v1.png

모드: 신규 생성 / 스타일 참조

프롬프트:

Use case: stylized-concept. Create a NEW production background for the Korean Intam educational game, same drawn style as the two reference images. References are style references only, NOT an edit target: image 1 establishes Midi's clean closed blue-gray outlines, cream and teal toy materials; image 2 establishes the warm hand-drawn animated interior and floor perspective. Asset: a welcoming AI ethics review mailroom interior, landscape 16:9, 1536x864 or larger same ratio. Camera is fixed front view slightly looking down, as the workshop reference, with floor visible. IMPORTANT COMPOSITION: the back wall occupies only the top 38 percent; the lower 62 percent is a broad unobstructed pale honey-cream tiled floor for a character to walk across. Gentle tile perspective, low contrast. Left rear edge has a teal-framed window and small plant, far right rear edge a low shelf with a few cream folders and a plant, all furniture behind y=36 percent. Center back wall is calm cream plaster with an arched teal architectural trim, no busy details. Entire walking floor below y=38 percent is empty. NO desks, counters, stations, signboards, characters, UI, letters, numbers, symbols or text. Cream stucco and muted teal trim, tiny warm coral and gold accents, precise clean fully enclosed desaturated blue-gray outlines, soft cel shading strictly inside outlines, warm diffuse upper-left lighting, restrained depth without glassy shine or realistic rendering. Match existing illustrated Intam assets. Not watercolor, not blurry, not sketchy, no strong glossy 3D, no central emblem.

## delivery-approve-counter-v1.png

모드: 신규 생성 / 스타일 참조

프롬프트:

Use case: stylized-concept. NEW transparent game prop for Intam, same clean hand-drawn animated art as reference images (style only). A friendly child-height AI mailroom approval stamping counter. Isolated single full prop, genuine transparent background, landscape 4:3 canvas. Fixed frontal camera slightly looking down, aligned symmetrically, no isometric side angle. Cream rounded cabinet body with muted teal edges and tidy closed desaturated blue-gray outlines; pale honey wood flat desktop; left side of top has one chunky cream and teal hand stamp with broad rounded handle; right side has a shallow paper receiving tray with two blank cream cards. Front cabinet has a large flat cream plaque completely blank for code-rendered Korean label. No lettering, no numbers, no logos, no check mark or status symbol. The cabinet fills the central 85 percent of frame, its entire base visible with 6 percent transparent padding. Warm upper-left cel shading restricted inside crisp outlines, subtle gentle depth, no photoreal textures, no glossy 3D plastic or metal. The furniture must look at home in the reference workshop and next to reference Midi. Small golden hardware accent. No environment, no character, no large ground shadow. This is the left teal station; make the form simple, readable at 240 px wide.

## delivery-review-counter-v1.png

모드: 이미지 편집 / 색상 변형

프롬프트:

Use case: precise-object-edit. Edit the supplied Intam teal stamping counter asset into its matching coral review counter variant. Keep EXACTLY the silhouette, front-facing camera angle, layout, blank front plaque, cream cabinet, wooden desktop, paper tray, outline style and shading. Change ONLY the teal colored stamp handle, tray and cabinet trim to a muted warm coral #cf8574, with dark blue-gray outlines preserved. Tiny existing gold hardware stays gold. Background must be genuinely transparent alpha, no painted checkerboard. No text, lettering, logos, new symbols, extra objects, environment or ground shadow. Full prop completely visible with identical transparent margins. This matching right-side station must pair with the original left-side station in the same game scene.

## delivery-card-panel-v1.png

모드: 신규 생성 / 스타일 참조

프롬프트:

Use case: stylized-concept. Create a NEW single blank case card panel for the Intam illustrated educational game using the reference only for matching style. Genuine transparent background. Wide horizontal paper card, overall 3:1 aspect ratio. A substantial warm cream paper rectangle with softly rounded corners, closed crisp blue-gray outlines, a tiny muted teal binder clip at the top left, one subtle turned-up bottom-right paper corner, thin teal backing visible around edges, and very shallow soft shadow immediately behind the paper. The inside is completely blank, calm and light ivory, with room for a square illustration on the left and two lines of large Korean text to its right, BUT do not draw any inset boxes or lines or text. Small tasteful golden paper fastener optional. Symmetric straight-on view, no tilt or perspective, entire panel visible with 4 percent transparent margins. Precise clean cel-shaded drawing like the reference, not flat primitive shapes, no glossy 3D, no watercolor, no lettering, no icons, no logo, no watermark. Game asset to remain legible at 840 by 230 game pixels.

## delivery-room-final-v1.png

모드: 이미지 편집 / 공간과 가구 합성

프롬프트:

Use case: compositing. Edit image 1 (empty Intam mailroom) into the FINAL playable room background, landscape 16:9. Images 2 and 3 are reference furniture only: do NOT copy their checkerboard backgrounds. Preserve the room architecture, warm lighting, linework and teal/cream style. Add exactly three SMALL counters along the back edge of the floor and a large BLANK cream paper display on the upper center wall. Very important game layout using a logical 1280x720 canvas: (A) teal stamp counter from image 2, centered x=215, complete bounding box x=80..350 and y=305..480. (B) coral stamp counter from image 3, centered x=1065, complete bounding box x=930..1200 and y=305..480. Each has a blank front name plaque centered at y=430 for code labels. (C) a smaller neutral cream and teal reception card dispenser centered x=640, bounding box x=540..740,y=360..460. It is a simple small cabinet with a shallow empty tray on top, no stamp, a blank front plaque centered y=422. Keep all three counter bases ABOVE y=480. The broad floor from y=490 to the bottom MUST remain totally empty and walkable. Above the cabinets, a wide horizontal cream paper display on the center back wall, bounds x=260..1020,y=96..290, rounded paper corners with neat teal backing, a tiny binder clip, completely blank inside. This is integrated interior scenery, NOT text UI. Leave the top y=0..90 clear of new objects for a separate HUD. Maintain existing perspective and the exact drawn Intam style; furniture should not be large in the foreground. No people, no robots, NO text, NO writing or labels, no status icons, no checkerboards anywhere, no watermarks. Furniture and panel positions are crucial. Soft illustrated cel-shading, not photorealistic, no excessive glossy depth.

