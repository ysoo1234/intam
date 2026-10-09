# Black Han Sans (subset)

Display font for textbook-style titles and big buttons (첫 화면 "AI 월드 마법판", "배움마을 입장하기").
Chosen because its heavy, square, rounded-corner strokes match the textbook page-1 title lettering.

- Source: https://github.com/google/fonts/tree/main/ofl/blackhansans (SIL Open Font License 1.1, see `OFL.txt`).
- `BlackHanSans-ks.woff` keeps ASCII and the 2,350 common Hangul syllables (KS X 1001), about 250 KB.
- Regenerate: `pyftsubset BlackHanSans-Regular.ttf --text-file=chars.txt --flavor=woff --output-file=BlackHanSans-ks.woff --layout-features='*'`
- Loaded by `@font-face` in `src/app/globals.css` and awaited by `src/game/core/visual/fonts.ts` before the game boots.
