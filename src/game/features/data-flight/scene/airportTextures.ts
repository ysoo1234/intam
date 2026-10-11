import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";

export function preloadAirportAssets(scene: Phaser.Scene) {
  scene.load.image("airport-sky", GAME_ASSETS.airport.sky);
  scene.load.image("airport-city", GAME_ASSETS.airport.city);
  scene.load.image("airport-ground", GAME_ASSETS.airport.ground);
  scene.load.image("airport-midi", GAME_ASSETS.characters.player.fly);
  scene.load.image("airport-midi-1", GAME_ASSETS.characters.player.fly);
  scene.load.image("airport-midi-fever", GAME_ASSETS.characters.player.flyFever);
  scene.load.image("airport-midi-ouch", GAME_ASSETS.characters.player.flyOuch);
  scene.load.image("airport-data-doc", GAME_ASSETS.airport.data.doc);
  scene.load.image("airport-data-image", GAME_ASSETS.airport.data.image);
  scene.load.image("airport-data-sound", GAME_ASSETS.airport.data.sound);
  scene.load.image("airport-data-video", GAME_ASSETS.airport.data.video);
  scene.load.image("airport-bad-data-doc", GAME_ASSETS.airport.badData.doc);
  scene.load.image("airport-bad-data-image", GAME_ASSETS.airport.badData.image);
  scene.load.image("airport-bad-data-sound", GAME_ASSETS.airport.badData.sound);
  scene.load.image("airport-bad-data-video", GAME_ASSETS.airport.badData.video);
  scene.load.image(
    "airport-public-data-science-technology",
    GAME_ASSETS.airport.publicData.scienceTechnology,
  );
  scene.load.image(
    "airport-public-data-education",
    GAME_ASSETS.airport.publicData.education,
  );
  scene.load.image(
    "airport-public-data-transport",
    GAME_ASSETS.airport.publicData.transport,
  );
  scene.load.image(
    "airport-public-data-law",
    GAME_ASSETS.airport.publicData.law,
  );
  scene.load.image(
    "airport-public-data-industry",
    GAME_ASSETS.airport.publicData.industry,
  );
  scene.load.image(
    "airport-public-data-medical",
    GAME_ASSETS.airport.publicData.medical,
  );
  scene.load.image(
    "airport-public-data-safety",
    GAME_ASSETS.airport.publicData.safety,
  );
  scene.load.image(
    "airport-public-data-environment",
    GAME_ASSETS.airport.publicData.environment,
  );
  scene.load.image(
    "airport-corrupted-data-cloud-top",
    GAME_ASSETS.airport.corruptedDataCloudTop,
  );
  scene.load.image(
    "airport-corrupted-data-vortex-bottom",
    GAME_ASSETS.airport.corruptedDataVortexBottom,
  );
}

export function releaseAirportTextures(scene: Phaser.Scene) {
  [
    "airport-sky",
    "airport-city",
    "airport-ground",
    "airport-midi",
    "airport-midi-1",
    "airport-midi-fever",
    "airport-midi-ouch",
    "airport-data-doc",
    "airport-data-image",
    "airport-data-sound",
    "airport-data-video",
    "airport-bad-data-doc",
    "airport-bad-data-image",
    "airport-bad-data-sound",
    "airport-bad-data-video",
    "airport-public-data-science-technology",
    "airport-public-data-education",
    "airport-public-data-transport",
    "airport-public-data-law",
    "airport-public-data-industry",
    "airport-public-data-medical",
    "airport-public-data-safety",
    "airport-public-data-environment",
    "airport-corrupted-data-cloud-top",
    "airport-corrupted-data-vortex-bottom",
  ].forEach((key) => scene.textures.remove(key));
}
