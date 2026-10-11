import Phaser from "phaser";

/**
 * The nine collected gems on the board "power up" one by one: a copy of each
 * gem is cut from the board art (so it lines up exactly), and on its turn it
 * beats once, flashes white in its own hexagon shape, a diagonal shine sweeps
 * across it, a small star twinkles on its corner, and its hexagon rim keeps a
 * soft glow in the gem's colour. At the end all nine beat together.
 */

// Gem centres on the board art, as a fraction of the board's width and height
// from its centre (art is 1448 x 1086), fitted to each gem's white outline.
export const GEM_SPOTS = [
  [0.0017, -0.2444], [-0.1601, -0.1355], [0.1656, -0.136],
  [0.002, -0.0208], [-0.1601, 0.0832], [0.1656, 0.0828],
  [0.002, 0.197], [-0.1601, 0.2984], [0.166, 0.2975],
] as const;
/** Each gem's half height in board-art pixels (the outline fit; all are 146 wide). */
const GEM_HALF_HEIGHTS = [118.5, 115.5, 115.5, 112.5, 112, 111, 112, 111.5, 111] as const;
/** Each gem's own colour, in GEM_SPOTS order (green, cyan, red, orange, yellow, silver, blue, lime, purple). */
export const GEM_TINTS = [0x4fe0a0, 0x5fd8ff, 0xff6b7a, 0xffb347, 0xffe45c, 0xdfe9f2, 0x5aa8ff, 0xc8f04a, 0xc28cff] as const;

/** A flat-topped hexagon in board-art pixels: half width (point to point) and half height. */
const HEX = { halfWidth: 146, halfHeight: 114 } as const;
const PAD = 34;
const TEX_W = HEX.halfWidth * 2 + PAD * 2;
const TEX_H = HEX.halfHeight * 2 + PAD * 2;
const SWEEP_FRAMES = 14;
const KEYS = {
  gem: (index: number) => `intro-gem-${index}`,
  flash: "intro-gem-flash",
  rim: "intro-gem-rim",
  sweep: "intro-gem-sweep",
} as const;
/** Motion timings (ms). */
export const GEM_LIGHT_MOTION = {
  beatMs: 150, flashMs: 420, sweepMs: 460, starMs: 620, rimInMs: 360,
  /** While the line waits: a soft shimmer runs over the gems, one after another. */
  shimmerEveryMs: 1_700, shimmerStepMs: 90,
  /** The first shimmer follows the all-together beat almost at once. */
  shimmerFirstMs: 700,
} as const;

function hexPath(ctx: CanvasRenderingContext2D, inset = 0, halfHeight: number = HEX.halfHeight) {
  const cx = TEX_W / 2;
  const cy = TEX_H / 2;
  const r = HEX.halfWidth - inset;
  const h = halfHeight - inset * 0.87;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx - r / 2, cy - h);
  ctx.lineTo(cx + r / 2, cy - h);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r / 2, cy + h);
  ctx.lineTo(cx - r / 2, cy + h);
  ctx.closePath();
}

function makeCanvas(scene: Phaser.Scene, key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return undefined;
  draw(texture.getContext());
  texture.refresh();
  return texture;
}

function ensureGemTextures(scene: Phaser.Scene, boardKey: string) {
  const source = scene.textures.get(boardKey).getSourceImage() as CanvasImageSource & { width: number; height: number };
  GEM_SPOTS.forEach(([sx, sy], index) => {
    makeCanvas(scene, KEYS.gem(index), TEX_W, TEX_H, (ctx) => {
      const cx = source.width / 2 + sx * source.width;
      const cy = source.height / 2 + sy * source.height;
      ctx.drawImage(source, cx - TEX_W / 2, cy - TEX_H / 2, TEX_W, TEX_H, 0, 0, TEX_W, TEX_H);
      // Keep the gem and its white outline with a soft edge, nothing of the board.
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.filter = "blur(1.5px)";
      ctx.fillStyle = "#ffffff";
      hexPath(ctx, -3, GEM_HALF_HEIGHTS[index]);
      ctx.fill();
      ctx.restore();
    });
  });
  // White hexagon, brightest in the middle: the gem "lighting up" over its colours.
  makeCanvas(scene, KEYS.flash, TEX_W, TEX_H, (ctx) => {
    const g = ctx.createRadialGradient(TEX_W / 2, TEX_H / 2, 0, TEX_W / 2, TEX_H / 2, HEX.halfWidth);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.7, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0.55)");
    hexPath(ctx, 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
  // A soft glowing hexagon rim (white, tinted per gem).
  makeCanvas(scene, KEYS.rim, TEX_W, TEX_H, (ctx) => {
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.shadowColor = "rgba(255,255,255,1)";
    ctx.lineJoin = "round";
    for (const [width, blur] of [[10, 26], [6, 14], [3, 4]] as const) {
      ctx.lineWidth = width;
      ctx.shadowBlur = blur;
      hexPath(ctx, -2);
      ctx.stroke();
    }
  });
  // The diagonal shine, one frame per step, clipped to the hexagon.
  const sweep = makeCanvas(scene, KEYS.sweep, TEX_W * SWEEP_FRAMES, TEX_H, (ctx) => {
    for (let frame = 0; frame < SWEEP_FRAMES; frame += 1) {
      const t = frame / (SWEEP_FRAMES - 1);
      const offset = frame * TEX_W;
      ctx.save();
      ctx.translate(offset, 0);
      hexPath(ctx, 4);
      ctx.clip();
      // The band runs from the top-left corner to the bottom-right, tilted.
      const along = -0.35 + t * 1.7;
      const x = along * TEX_W;
      const band = ctx.createLinearGradient(x - 70, 0, x + 70, 0);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.42, "rgba(255,255,255,0.55)");
      band.addColorStop(0.5, "rgba(255,255,255,0.95)");
      band.addColorStop(0.58, "rgba(255,255,255,0.55)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      ctx.translate(TEX_W / 2, TEX_H / 2);
      ctx.transform(1, 0, -0.55, 1, 0, 0);
      ctx.translate(-TEX_W / 2, -TEX_H / 2);
      ctx.fillStyle = band;
      ctx.fillRect(-TEX_W, -TEX_H, TEX_W * 3, TEX_H * 3);
      ctx.restore();
    }
  });
  if (sweep && !sweep.has("0")) {
    for (let frame = 0; frame < SWEEP_FRAMES; frame += 1) sweep.add(String(frame), 0, frame * TEX_W, 0, TEX_W, TEX_H);
  }
}

export type GemLightsOptions = Readonly<{
  board: Phaser.GameObjects.Image;
  /** Where the board's centre ends up (it rises when the story starts). */
  boardY: number;
  depth: number;
  calm: boolean;
  /** Called with every object made, so the story can clean them up. */
  track: <T extends Phaser.GameObjects.GameObject>(object: T) => T;
  /** Spark texture for the corner star. */
  sparkleKey: string;
}>;

export function createGemLights(scene: Phaser.Scene, options: GemLightsOptions) {
  const { board, calm, track } = options;
  ensureGemTextures(scene, board.texture.key);
  const scale = board.displayWidth / board.width;
  let stopped = false;

  const gems = GEM_SPOTS.map(([sx, sy], index) => {
    const x = board.x + sx * board.displayWidth;
    const y = options.boardY + sy * board.displayHeight;
    const tint = GEM_TINTS[index];
    // The shared light shapes are 114 high; stretch them to this gem.
    const fitY = GEM_HALF_HEIGHTS[index] / HEX.halfHeight;
    const rim = scene.add.image(0, 0, KEYS.rim).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const art = scene.add.image(0, 0, KEYS.gem(index));
    const flash = scene.add.image(0, 0, KEYS.flash).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const sweep = scene.add.image(0, 0, KEYS.sweep, "0").setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    for (const light of [rim, flash, sweep]) light.setScale(1, fitY);
    // Hidden until its turn: the board already shows the same gem underneath.
    const container = track(scene.add.container(x, y, [rim, art, flash, sweep]))
      .setScale(scale).setDepth(options.depth).setVisible(false);
    const starX = x + (HEX.halfWidth * 0.5 - 6) * scale;
    const starY = y - (GEM_HALF_HEIGHTS[index] - 6) * scale;
    return { x, y, tint, container, rim, flash, sweep, starX, starY };
  });

  const beat = (gem: (typeof gems)[number], strength = 1) => {
    scene.tweens.add({
      targets: gem.container, scale: scale * (1 + 0.1 * strength),
      duration: GEM_LIGHT_MOTION.beatMs, yoyo: true, ease: "Sine.easeOut",
    });
    scene.tweens.add({
      targets: gem.flash, alpha: { from: 0.85 * strength, to: 0 },
      duration: GEM_LIGHT_MOTION.flashMs, ease: "Cubic.easeOut",
    });
  };

  const sweepAcross = (gem: (typeof gems)[number]) => {
    gem.sweep.setVisible(true);
    const step = { frame: 0 };
    scene.tweens.add({
      targets: step, frame: SWEEP_FRAMES - 1, duration: GEM_LIGHT_MOTION.sweepMs, ease: "Sine.easeInOut",
      onUpdate: () => gem.sweep.setFrame(String(Math.round(step.frame))),
      onComplete: () => gem.sweep.setVisible(false),
    });
  };

  const twinkle = (gem: (typeof gems)[number], size = 0.62) => {
    const star = track(scene.add.image(gem.starX, gem.starY, options.sparkleKey))
      .setDepth(options.depth + 0.1).setBlendMode(Phaser.BlendModes.ADD).setScale(0).setAngle(-20);
    scene.tweens.add({
      targets: star, scale: size, angle: 25, duration: GEM_LIGHT_MOTION.starMs / 2, yoyo: true, ease: "Sine.easeOut",
      onComplete: () => star.destroy(),
    });
  };

  return {
    /** All gem objects (for fading out with the board). */
    objects: gems.map(gem => gem.container),
    /** Lights gem `index` after `delay` ms. */
    light(index: number, delay: number) {
      const gem = gems[index];
      if (!gem) return;
      scene.time.delayedCall(delay, () => {
        if (stopped) return;
        gem.container.setVisible(true);
        scene.tweens.add({ targets: gem.rim, alpha: 0.75, duration: GEM_LIGHT_MOTION.rimInMs, ease: "Sine.easeOut" });
        if (calm) return;
        beat(gem);
        sweepAcross(gem);
        twinkle(gem);
        // The rim keeps breathing softly: this gem is on.
        scene.tweens.add({
          targets: gem.rim, alpha: { from: 0.75, to: 0.45 }, delay: GEM_LIGHT_MOTION.rimInMs,
          duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
        });
      });
    },
    /**
     * All nine beat together once after `delay` ms; then, for as long as the
     * line stays up, a soft shimmer keeps running over them one by one.
     */
    beatAll(delay: number) {
      if (calm) return;
      scene.time.delayedCall(delay, () => {
        if (stopped) return;
        for (const gem of gems) {
          beat(gem, 0.7);
          sweepAcross(gem);
        }
        const shimmer = scene.time.addEvent({
          startAt: GEM_LIGHT_MOTION.shimmerEveryMs - GEM_LIGHT_MOTION.shimmerFirstMs,
          delay: GEM_LIGHT_MOTION.shimmerEveryMs,
          loop: true,
          callback: () => {
            if (stopped) {
              shimmer.remove(false);
              return;
            }
            gems.forEach((gem, index) => {
              scene.time.delayedCall(index * GEM_LIGHT_MOTION.shimmerStepMs, () => {
                if (stopped) return;
                sweepAcross(gem);
                scene.tweens.add({ targets: gem.flash, alpha: { from: 0.28, to: 0 }, duration: GEM_LIGHT_MOTION.flashMs });
                if (index % 3 === 1) twinkle(gem, 0.45);
              });
            });
          },
        });
      });
    },
    stop() {
      stopped = true;
    },
  };
}
