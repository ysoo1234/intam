import Phaser from "phaser";

/**
 * One scrolling backdrop layer: two copies of the picture side by side,
 * slid left and wrapped. (A TileSprite refilled a full-screen pattern for
 * each layer every frame, which cost about 5 ms a layer without graphics
 * acceleration; two plain images cost a fraction of that.)
 */
export type AirportBackgroundLayer = Readonly<{
  /** Scrolls by this many logical pixels (the 1600-wide tile's own pixels). */
  advance: (logicalDistance: number) => void;
  setDepth: (depth: number) => void;
}>;

export type AirportBackground = {
  sky: AirportBackgroundLayer;
  city: AirportBackgroundLayer;
  ground: AirportBackgroundLayer;
};

export const AIRPORT_BACKGROUND_TEXTURE_CONTRACT = {
  viewportWidth: 1280,
  viewportHeight: 720,
  logicalTileWidth: 1600,
  logicalTileHeight: 720,
  targetTextureWidth: 3200,
  targetTextureHeight: 1440,
} as const;

/** ouch: a hit or a wrong answer. (No smile on pickups: data comes too often.) */
export type AirportPlayerReaction = "ouch";

export type AirportPlayerView = {
  player: Phaser.GameObjects.Container;
  playerArt: Phaser.GameObjects.Image;
  playerAura: Phaser.GameObjects.Ellipse;
  /** Shows a short reaction face, then goes back to the flying pose. */
  react: (reaction: AirportPlayerReaction) => void;
  /** Fever time: sparkling eyes with little twinkles; safe to call every frame. */
  setFever: (active: boolean) => void;
};

// One flying pose, moved smoothly in code: swapping several generated frames made
// the outline "boil" (each drawing differs slightly), so it read as jittery.
// Reactions share the pose's 340 x 340 canvas, lined up on the body.
const AIRPORT_MIDI_FLY = "airport-midi-1";
const AIRPORT_MIDI_FEVER = "airport-midi-fever";
const AIRPORT_MIDI_REACTION = {
  ouch: { texture: "airport-midi-ouch", ms: 820 },
} as const;
// Twinkles around the face during fever, relative to the flying sprite.
const AIRPORT_FEVER_TWINKLES = [[32, -31, 8], [49, -7, 5], [7, -42, 5]] as const;
// 340 px canvas shown at 140 px.
const AIRPORT_MIDI_SIZE = 140;

function createAirportBackgroundLayer(
  scene: Phaser.Scene,
  textureKey: string,
  depth: number,
): AirportBackgroundLayer {
  const { logicalTileWidth: width, logicalTileHeight: height } = AIRPORT_BACKGROUND_TEXTURE_CONTRACT;
  const copies = [0, 1].map((index) =>
    scene.add.image(index * width, 0, textureKey).setOrigin(0, 0).setDisplaySize(width, height).setDepth(depth));
  let offset = 0;
  const place = () => {
    // Whole pixels, so the seam between the two copies never shows a hairline.
    const shift = Math.round(offset);
    copies[0].setX(-shift);
    copies[1].setX(width - shift);
  };
  return {
    advance: (logicalDistance) => {
      offset = (offset + logicalDistance) % width;
      if (offset < 0) offset += width;
      place();
    },
    setDepth: (value) => copies.forEach((copy) => copy.setDepth(value)),
  };
}

export function advanceAirportBackgroundTile(
  layer: AirportBackgroundLayer,
  logicalDistance: number,
) {
  layer.advance(logicalDistance);
}

export function createAirportBackground(scene: Phaser.Scene): AirportBackground {
  const sky = createAirportBackgroundLayer(scene, "airport-sky", 0);
  const city = createAirportBackgroundLayer(scene, "airport-city", 1);
  const ground = createAirportBackgroundLayer(scene, "airport-ground", 2);
  return { sky, city, ground };
}

export function createAirportPlayer(scene: Phaser.Scene): AirportPlayerView {
  const shadow = (x: number, y: number, size: number, alpha: number) => scene.add
    .image(x, y, AIRPORT_MIDI_FLY)
    .setOrigin(0.5, 0.62)
    .setDisplaySize(size, size)
    .setTint(0x263d46)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.MULTIPLY);
  const playerShadowBack = shadow(5, 2, AIRPORT_MIDI_SIZE + 5, 0.07);
  const playerShadowMiddle = shadow(3, 1, AIRPORT_MIDI_SIZE + 3, 0.11);
  const playerShadowNear = shadow(2, 1, AIRPORT_MIDI_SIZE + 2, 0.16);
  const playerAura = scene.add
    .ellipse(18, 0, 160, 104, 0x77edff, 0)
    .setBlendMode(Phaser.BlendModes.ADD);
  const playerArt = scene.add
    .image(0, 0, AIRPORT_MIDI_FLY)
    .setOrigin(0.5, 0.62)
    .setDisplaySize(AIRPORT_MIDI_SIZE, AIRPORT_MIDI_SIZE);
  const playerSprite = scene.add.container(0, 0, [
    playerShadowBack,
    playerShadowMiddle,
    playerShadowNear,
    playerArt,
  ]);
  const player = scene.add
    .container(220, 360, [playerAura, playerSprite])
    .setDepth(20);

  scene.tweens.add({
    targets: playerSprite,
    y: { from: -3, to: 3 },
    angle: { from: -1.2, to: 1.2 },
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // A soft wing-beat: the body stretches and settles a little, never a frame swap.
  scene.tweens.add({
    targets: playerSprite,
    scaleX: { from: 1, to: 1.025 },
    scaleY: { from: 1, to: 0.975 },
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // A reaction face briefly replaces the flying face.
  const layers = [playerShadowBack, playerShadowMiddle, playerShadowNear, playerArt];
  const show = (texture: string) => {
    for (const layer of layers) {
      if (layer.active && layer.texture.key !== texture) layer.setTexture(texture);
    }
  };
  let base: string = AIRPORT_MIDI_FLY;
  let reactionTimer: Phaser.Time.TimerEvent | undefined;
  let reacting = false;
  player.once(Phaser.GameObjects.Events.DESTROY, () => reactionTimer?.remove(false));
  const react = (reaction: AirportPlayerReaction) => {
    const { texture, ms } = AIRPORT_MIDI_REACTION[reaction];
    reacting = true;
    show(texture);
    reactionTimer?.remove(false);
    reactionTimer = scene.time.delayedCall(ms, () => {
      reacting = false;
      show(base);
    });
    // A hit also flickers red for the invulnerable moment.
    scene.tweens.killTweensOf(playerArt);
    scene.tweens.add({
      targets: playerArt,
      tint: 0xff786c,
      alpha: 0.35,
      duration: 110,
      yoyo: true,
      repeat: 4,
      onComplete: () => playerArt.clearTint().setAlpha(1),
    });
  };

  // Fever: sparkling "found a gem" eyes and a few twinkles beside the face.
  const twinkles = AIRPORT_FEVER_TWINKLES.map(([x, y, size], index) => {
    const twinkle = scene.add
      .star(x, y, 4, size * 0.22, size, 0xffffff, 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    scene.tweens.add({
      targets: twinkle, scale: { from: 0.3, to: 1.1 }, alpha: { from: 0.2, to: 1 }, angle: 45,
      duration: 380, delay: index * 140, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    return twinkle;
  });
  playerSprite.add(twinkles);
  let feverOn = false;
  const setFever = (active: boolean) => {
    if (active === feverOn) return;
    feverOn = active;
    base = active ? AIRPORT_MIDI_FEVER : AIRPORT_MIDI_FLY;
    if (!reacting) show(base);
    for (const twinkle of twinkles) twinkle.setVisible(active);
  };

  return { player, playerArt, playerAura, react, setFever };
}
