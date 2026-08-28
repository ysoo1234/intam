import Phaser from "phaser";

export type AirportBackground = {
  sky: Phaser.GameObjects.TileSprite;
  city: Phaser.GameObjects.TileSprite;
  ground: Phaser.GameObjects.TileSprite;
};

export const AIRPORT_BACKGROUND_TEXTURE_CONTRACT = {
  viewportWidth: 1280,
  viewportHeight: 720,
  logicalTileWidth: 1600,
  logicalTileHeight: 720,
  targetTextureWidth: 3200,
  targetTextureHeight: 1440,
} as const;

export type AirportPlayerView = {
  player: Phaser.GameObjects.Container;
  playerArt: Phaser.GameObjects.Image;
  playerAura: Phaser.GameObjects.Ellipse;
};

function createAirportBackgroundLayer(
  scene: Phaser.Scene,
  textureKey: string,
  depth: number,
) {
  const frame = scene.textures.getFrame(textureKey);
  const textureWidth =
    frame?.width ?? AIRPORT_BACKGROUND_TEXTURE_CONTRACT.targetTextureWidth;
  const textureHeight =
    frame?.height ?? AIRPORT_BACKGROUND_TEXTURE_CONTRACT.targetTextureHeight;

  return scene.add
    .tileSprite(
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.viewportWidth / 2,
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.viewportHeight / 2,
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.viewportWidth,
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.viewportHeight,
      textureKey,
    )
    .setTileScale(
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.logicalTileWidth / textureWidth,
      AIRPORT_BACKGROUND_TEXTURE_CONTRACT.logicalTileHeight / textureHeight,
    )
    .setDepth(depth);
}

export function advanceAirportBackgroundTile(
  layer: Phaser.GameObjects.TileSprite,
  logicalDistance: number,
) {
  // Phaser scales tilePosition with the texture, so keep movement in logical pixels.
  layer.tilePositionX += logicalDistance / layer.tileScaleX;
}

export function createAirportBackground(scene: Phaser.Scene): AirportBackground {
  const sky = createAirportBackgroundLayer(scene, "airport-sky", 0);
  const city = createAirportBackgroundLayer(scene, "airport-city", 1);
  const ground = createAirportBackgroundLayer(scene, "airport-ground", 2);
  return { sky, city, ground };
}

export function createAirportPlayer(scene: Phaser.Scene): AirportPlayerView {
  const playerShadowBack = scene.add
    .image(5, 2, "airport-midi")
    .setOrigin(0.72, 0.5)
    .setDisplaySize(194, 90)
    .setTint(0x263d46)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.07)
    .setBlendMode(Phaser.BlendModes.MULTIPLY);
  const playerShadowMiddle = scene.add
    .image(3, 1, "airport-midi")
    .setOrigin(0.72, 0.5)
    .setDisplaySize(192, 89)
    .setTint(0x263d46)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.11)
    .setBlendMode(Phaser.BlendModes.MULTIPLY);
  const playerShadowNear = scene.add
    .image(2, 1, "airport-midi")
    .setOrigin(0.72, 0.5)
    .setDisplaySize(190, 88)
    .setTint(0x263d46)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.16)
    .setBlendMode(Phaser.BlendModes.MULTIPLY);
  const playerAura = scene.add
    .ellipse(18, 0, 160, 104, 0x77edff, 0)
    .setBlendMode(Phaser.BlendModes.ADD);
  const playerArt = scene.add
    .image(0, 0, "airport-midi")
    .setOrigin(0.72, 0.5)
    .setDisplaySize(188, 87);
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

  return { player, playerArt, playerAura };
}
