import Phaser from "phaser";

/**
 * A top-to-bottom colour gradient as an image, optionally fading out left or
 * right. Graphics gradients (fillGradientStyle) draw only in WebGL; this is
 * painted once into a canvas texture, so it looks the same in the light
 * (Canvas) mode used on computers without graphics acceleration.
 */
export function addGradientImage(
  scene: Phaser.Scene,
  area: Readonly<{ x: number; y: number; width: number; height: number }>,
  colors: Readonly<{ top: number; bottom: number; alphaLeft?: number; alphaRight?: number }>,
) {
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));
  const alphaLeft = colors.alphaLeft ?? 1;
  const alphaRight = colors.alphaRight ?? 1;
  const key = `gradient-${colors.top.toString(16)}-${colors.bottom.toString(16)}-${width}x${height}-${alphaLeft}-${alphaRight}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, width, height);
    const context = texture?.getContext();
    if (texture && context) {
      const css = (color: number, alpha = 1) =>
        `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha})`;
      const vertical = context.createLinearGradient(0, 0, 0, height);
      vertical.addColorStop(0, css(colors.top));
      vertical.addColorStop(1, css(colors.bottom));
      context.fillStyle = vertical;
      context.fillRect(0, 0, width, height);
      if (alphaLeft !== 1 || alphaRight !== 1) {
        const across = context.createLinearGradient(0, 0, width, 0);
        across.addColorStop(0, `rgba(0, 0, 0, ${alphaLeft})`);
        across.addColorStop(1, `rgba(0, 0, 0, ${alphaRight})`);
        context.globalCompositeOperation = "destination-in";
        context.fillStyle = across;
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = "source-over";
      }
      texture.refresh();
    }
  }
  return scene.add.image(area.x, area.y, key).setOrigin(0, 0).setDisplaySize(area.width, area.height);
}
