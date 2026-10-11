import Phaser from "phaser";

/** Soft light textures for the ending, drawn once on a canvas (real blur, not outlines). */
export const ENDING_LIGHT = { dot: "ending-light-dot", glow: "ending-light-glow", sparkle: "ending-light-sparkle" } as const;

export function ensureEndingLights(scene: Phaser.Scene) {
  const make = (key: string, size: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, size, size);
    if (!texture) return;
    draw(texture.getContext());
    texture.refresh();
  };
  make(ENDING_LIGHT.dot, 48, (ctx) => {
    const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 48, 48);
  });
  make(ENDING_LIGHT.glow, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,248,220,0.75)");
    gradient.addColorStop(0.6, "rgba(255,236,190,0.22)");
    gradient.addColorStop(1, "rgba(255,236,190,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  });
  // A four-point sparkle (thin cross with a bright core).
  make(ENDING_LIGHT.sparkle, 96, (ctx) => {
    const c = 48;
    const arm = (len: number, width: number, alpha: number) => {
      const g = ctx.createLinearGradient(c - len, c, c + len, c);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(c - len, c - width / 2, len * 2, width);
    };
    const rotated = (angle: number, draw: () => void) => {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle);
      ctx.translate(-c, -c);
      draw();
      ctx.restore();
    };
    arm(46, 6, 1);
    rotated(Math.PI / 2, () => arm(46, 6, 1));
    rotated(Math.PI / 4, () => arm(22, 3, 0.7));
    rotated(-Math.PI / 4, () => arm(22, 3, 0.7));
    const core = ctx.createRadialGradient(c, c, 0, c, c, 12);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, 96, 96);
  });
}

/** A one-off burst of light motes (nothing when motion is reduced). */
export function burstLight(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: Readonly<{ tint?: readonly number[]; count?: number; depth: number; speed?: number; calm: boolean }>,
) {
  if (options.calm) return;
  const speed = options.speed ?? 160;
  const emitter = scene.add.particles(x, y, ENDING_LIGHT.dot, {
    emitting: false,
    blendMode: Phaser.BlendModes.ADD,
    lifespan: { min: 420, max: 820 },
    speed: { min: speed * 0.3, max: speed },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [...(options.tint ?? [0xffffff, 0xfff2b0])],
  }).setDepth(options.depth);
  emitter.explode(options.count ?? 14);
  scene.time.delayedCall(1_000, () => emitter.destroy());
}

/** Quadratic curve point (for stars flying in an arc). */
export function arcPoint(
  from: Readonly<{ x: number; y: number }>,
  to: Readonly<{ x: number; y: number }>,
  lift: number,
  t: number,
) {
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}
