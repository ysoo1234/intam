import Phaser from "phaser";

export type AirportBackground = {
  sky: Phaser.GameObjects.TileSprite;
  city: Phaser.GameObjects.TileSprite;
  ground: Phaser.GameObjects.TileSprite;
};

export type AirportPlayerView = {
  player: Phaser.GameObjects.Container;
  playerArt: Phaser.GameObjects.Image;
  playerAura: Phaser.GameObjects.Ellipse;
};

export function createAirportBackground(scene: Phaser.Scene): AirportBackground {
  const sky = scene.add
    .tileSprite(640, 360, 1280, 720, "airport-sky")
    .setDepth(0);
  const city = scene.add
    .tileSprite(640, 360, 1280, 720, "airport-city")
    .setDepth(1);
  const ground = scene.add
    .tileSprite(640, 360, 1280, 720, "airport-ground")
    .setDepth(2);
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
