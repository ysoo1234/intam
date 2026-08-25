export const GAME_ASSETS = {
  intro: {
    board: "/assets/intro/gem-board.webp",
  },
  world: {
    ground: "/assets/world/village-ground.webp",
    shop: "/assets/world/village-ai-shop.webp",
    airport: "/assets/world/village-airport.webp",
    ethicsOffice: "/assets/world/village-ethics-office.webp",
    aiWorldGate: "/assets/world/village-ai-world-gate.webp",
    fountain: "/assets/world/village-fountain.webp",
  },
  characters: {
    player: {
      front: "/assets/characters/midi_front_game.png",
      back: "/assets/characters/midi_back_game.png",
      left: "/assets/characters/midi_left_game.png",
      right: "/assets/characters/midi_right_game.png",
      fly: "/assets/characters/midi_fly.webp",
    },
  },
  shop: {
    interior: "/assets/shop/ai-shop-interior.png",
    workshop: "/assets/shop/ai-workshop-interior-v6.webp",
    workbench: "/assets/shop/ai-workbench-foreground-v2.webp",
    itemPanel4: "/assets/shop/workshop-item-panel-4.webp",
    itemPanel5: "/assets/shop/workshop-item-panel-5.webp",
  },
  airport: {
    sky: "/assets/airport/bg_sky.webp",
    city: "/assets/airport/bg_city.webp",
    ground: "/assets/airport/bg_ground.webp",
    data: {
      doc: "/assets/airport/data_doc.webp",
      image: "/assets/airport/data_image.webp",
      sound: "/assets/airport/data_sound.webp",
      video: "/assets/airport/data_video.webp",
    },
    badData: {
      doc: "/assets/airport/bad_data_doc.webp",
      image: "/assets/airport/bad_data_image.webp",
      sound: "/assets/airport/bad_data_sound.webp",
      video: "/assets/airport/bad_data_video.webp",
    },
    corruptedDataTower: "/assets/airport/corrupted-data-tower-v1.webp",
    publicData: {
      scienceTechnology:
        "/assets/airport/public_data_science_technology.webp",
      education: "/assets/airport/public_data_education.webp",
      transport: "/assets/airport/public_data_transport.webp",
      law: "/assets/airport/public_data_law.webp",
      industry: "/assets/airport/public_data_industry.webp",
      medical: "/assets/airport/public_data_medical.webp",
      safety: "/assets/airport/public_data_safety.webp",
      environment: "/assets/airport/public_data_environment.webp",
    },
  },
  ethicsReview: {
    office: "/assets/ethics-review/office-v2.webp",
    briefingDossier: "/assets/ethics-review/briefing-sheet-v2.webp",
    caseDossier: "/assets/ethics-review/case-file-v2.webp",
  },
} as const;

export const GAME_SIZE = {
  width: 1280,
  height: 720,
} as const;
