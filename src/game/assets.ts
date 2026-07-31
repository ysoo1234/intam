export const GAME_ASSETS = {
  intro: {
    board: "/assets/intro/gem-board.png",
  },
  world: {
    map: "/assets/world/world-map.png",
  },
  characters: {
    player: {
      front: "/assets/characters/midi_front_game.png",
      back: "/assets/characters/midi_back_game.png",
      left: "/assets/characters/midi_left_game.png",
      right: "/assets/characters/midi_right_game.png",
      fly: "/assets/characters/midi_fly.png",
    },
  },
  shop: {
    interior: "/assets/shop/ai-shop-interior.png",
    workshop: "/assets/shop/ai-workshop-interior-v5.png",
    workbench: "/assets/shop/ai-workbench-foreground.png",
    hanger: "/assets/shop/workshop-hanger-v2.png",
  },
  airport: {
    sky: "/assets/airport/bg_sky.png",
    city: "/assets/airport/bg_city.png",
    ground: "/assets/airport/bg_ground.png",
    data: {
      doc: "/assets/airport/data_doc.png",
      image: "/assets/airport/data_image.png",
      sound: "/assets/airport/data_sound.png",
      video: "/assets/airport/data_video.png",
    },
  },
} as const;

export const GAME_SIZE = {
  width: 1280,
  height: 720,
} as const;
