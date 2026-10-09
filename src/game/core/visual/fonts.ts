/** Display face for textbook-style titles and large buttons (see public/fonts/black-han-sans). */
export const DISPLAY_FONT_FAMILY = '"Black Han Sans", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/**
 * Phaser draws text onto a canvas once, so a web font must be ready before the
 * first scene renders or the fallback face gets baked in. Waits at most
 * `timeoutMs`; on a slow or blocked network the game still boots with the fallback.
 */
export async function loadGameFonts(timeoutMs = 2_500) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const load = document.fonts.load('66px "Black Han Sans"', "AI 월드 마법판 배움마을 입장하기").catch(() => []);
  await Promise.race([load, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}
