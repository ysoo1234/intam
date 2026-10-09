export const GAME_ASSETS = {
  ui: {
    villageReturnButton: "/assets/ui/game-return-button-house-v2.webp",
    statusPanel: "/assets/ui/game-status-panel-blank-v1.webp",
    gameStartPanel: "/assets/ui/game-start-panel-v1.webp",
    gameStartButton: "/assets/ui/game-start-button-v1.webp",
    gameResultPanel: "/assets/ui/game-result-panel-v1.webp",
    gameResultRetryButton: "/assets/ui/game-result-retry-button-v1.webp",
    gameResultReturnButton: "/assets/ui/game-result-return-button-v1.webp",
    villageEntryButton: "/assets/ui/village-entry-button-v1.webp",
    /** Tutorial arrow, drawn pointing right. */
    coachArrow: "/assets/ui/coach-arrow-v1.webp",
    villageActivityStarEmpty:
      "/assets/ui/village-activity-star-empty-v1.webp",
    villageActivityStarFilled:
      "/assets/ui/village-activity-star-filled-v1.webp",
  },
  intro: {
    board: "/assets/intro/gem-board.webp",
    title: "/assets/intro/intro-title-ai-world-v1.webp",
    enterButton: "/assets/intro/intro-entry-button-v3.webp",
    // Clean snapshot of the real village map (no UI, Midi or stars), seen through the story door.
    storyVillage: "/assets/intro/story-village-v5.webp",
    // Generated door frame around the story's view into the village.
    storyFrame: "/assets/intro/story-portal-frame-v1.webp",
  },
  world: {
    // v8: garden village (lawns, stone paths, forest edge and far hills).
    ground: "/assets/world/village-ground-v8.webp",
    shop: "/assets/world/village-ai-shop.webp",
    airport: "/assets/world/village-airport.webp",
    ethicsOffice: "/assets/world/village-ethics-office.webp",
    // Starlight gate: an open tablet whose screen shows the portal.
    aiWorldGate: "/assets/world/village-tablet-gate-v4.webp",
    aiWorldPortalNight:
      "/assets/world/village-ai-world-portal-night-v4.webp",
    fountain: "/assets/world/village-fountain.webp",
    fountainWaterFrames:
      "/assets/world/village-fountain-water-frames-v1.webp",
  },
  characters: {
    // The player in the village and workshop: textbook Midi (v2) at 2x of the
    // 113 px village height. Left/right moving frames lean into the walk.
    player: {
      front: "/assets/characters/midi-v2/player-front.webp",
      blink: "/assets/characters/midi-v2/player-blink.webp",
      back: "/assets/characters/midi-v2/player-back.webp",
      left: "/assets/characters/midi-v2/player-left.webp",
      right: "/assets/characters/midi-v2/player-right.webp",
      moveLeft: "/assets/characters/midi-v2/player-move-left.webp",
      moveRight: "/assets/characters/midi-v2/player-move-right.webp",
      glideFront: "/assets/characters/midi-v2/player-glide-front.webp",
      glideBack: "/assets/characters/midi-v2/player-glide-back.webp",
      // Data flight: one flying pose (moved in code), a hit face and a fever face, on one canvas.
      fly: "/assets/characters/midi-v2/fly-1.webp",
      // Fever: sparkling eyes set into the flying pose.
      flyFever: "/assets/characters/midi-v2/fly-fever.webp",
      flyOuch: "/assets/characters/midi-v2/fly-ouch.webp",
    },
    // Textbook Midi (v2). Front frames share one body; only the face screen changes.
    midi: {
      front: {
        idle: "/assets/characters/midi-v2/front-idle.webp",
        blink: "/assets/characters/midi-v2/front-blink.webp",
        talkSmall: "/assets/characters/midi-v2/front-talk-small.webp",
        talkBig: "/assets/characters/midi-v2/front-talk-big.webp",
        talkO: "/assets/characters/midi-v2/front-talk-o.webp",
        happy: "/assets/characters/midi-v2/front-happy.webp",
        happyRest: "/assets/characters/midi-v2/front-happy-rest.webp",
        happyTalkSmall: "/assets/characters/midi-v2/front-happy-talk-small.webp",
        happyTalkO: "/assets/characters/midi-v2/front-happy-talk-o.webp",
        surprised: "/assets/characters/midi-v2/front-surprised.webp",
        surprisedTalkSmall: "/assets/characters/midi-v2/front-surprised-talk-small.webp",
        surprisedTalkBig: "/assets/characters/midi-v2/front-surprised-talk-big.webp",
        worried: "/assets/characters/midi-v2/front-worried.webp",
        worriedTalkO: "/assets/characters/midi-v2/front-worried-talk-o.webp",
      },
      pose: {
        wave: "/assets/characters/midi-v2/pose-wave.webp",
        cheer: "/assets/characters/midi-v2/pose-cheer.webp",
        flyRight: "/assets/characters/midi-v2/pose-fly-right.webp",
      },
    },
  },
  shop: {
    workshop: "/assets/shop/ai-workshop-interior-v6.webp",
    workbench: "/assets/shop/ai-workbench-foreground-v2.webp",
    craftingMachine: "/assets/shop/workshop-crafting-machine-v1.webp",
    craftingPanel: "/assets/shop/workshop-crafting-panel-v2.webp",
    actionButton: "/assets/shop/workshop-action-button-v4.webp",
    craftingDustCenter: "/assets/shop/workshop-dust-center-v1.webp",
    craftingDustDiagonal: "/assets/shop/workshop-dust-diagonal-v1.webp",
    craftingDustSweep: "/assets/shop/workshop-dust-sweep-v1.webp",
    craftingDustRise: "/assets/shop/workshop-dust-rise-v1.webp",
    craftingDustLow: "/assets/shop/workshop-dust-low-v1.webp",
    craftingToolHammer: "/assets/shop/workshop-tool-hammer-v1.webp",
    craftingToolScrew: "/assets/shop/workshop-tool-screw-v1.webp",
    craftingToolNut: "/assets/shop/workshop-tool-nut-v1.webp",
    craftingToolGear: "/assets/shop/workshop-tool-gear-v1.webp",
    itemPanel4: "/assets/shop/workshop-item-panel-4.webp",
    itemPanel5: "/assets/shop/workshop-item-panel-5.webp",
    customerNameplate: "/assets/shop/workshop-customer-nameplate-v4.webp",
    dialogueBubble: "/assets/shop/workshop-dialogue-bubble-v2.webp",
    products: {
      "ai-speaker": "/assets/shop/products-v2/ai-speaker.webp",
      "call-translator": "/assets/shop/products-v2/call-translator.webp",
      "photo-translator": "/assets/shop/products-v2/photo-translator.webp",
      "plant-camera": "/assets/shop/products-v2/plant-camera.webp",
      "face-lock": "/assets/shop/products-v2/face-lock.webp",
      "spell-checker": "/assets/shop/products-v2/spell-checker.webp",
      "smart-fridge": "/assets/shop/products-v2/smart-fridge.webp",
      "robot-vacuum": "/assets/shop/products-v2/robot-vacuum.webp",
      "pet-care-robot": "/assets/shop/products-v2/pet-care-robot.webp",
      "security-camera": "/assets/shop/products-v2/security-camera.webp",
      "smart-air-purifier": "/assets/shop/products-v2/smart-air-purifier.webp",
      "smart-washer": "/assets/shop/products-v2/smart-washer.webp",
      "study-helper": "/assets/shop/products-v2/study-helper.webp",
      "nutrition-kiosk": "/assets/shop/products-v2/nutrition-kiosk.webp",
      "medical-reader": "/assets/shop/products-v2/medical-reader.webp",
      "smart-band": "/assets/shop/products-v2/smart-band.webp",
      "ai-wheelchair": "/assets/shop/products-v2/ai-wheelchair.webp",
      "road-safety-cctv": "/assets/shop/products-v2/road-safety-cctv.webp",
      "autonomous-car": "/assets/shop/products-v2/autonomous-car.webp",
      "delivery-robot": "/assets/shop/products-v2/delivery-robot.webp",
      "drone-taxi": "/assets/shop/products-v2/drone-taxi.webp",
      "crop-drone": "/assets/shop/products-v2/crop-drone.webp",
      "harvest-robot": "/assets/shop/products-v2/harvest-robot.webp",
      "greenhouse-computer": "/assets/shop/products-v2/greenhouse-computer.webp",
      "smart-watering": "/assets/shop/products-v2/smart-watering.webp",
      "performance-interpreter":
        "/assets/shop/products-v2/performance-interpreter.webp",
    },
  },
  airport: {
    sky: "/assets/airport/bg_sky.webp",
    city: "/assets/airport/bg_city.webp",
    ground: "/assets/airport/bg_ground.webp",
    quizCard: "/assets/airport/data-flight-quiz-card-v1.webp",
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
    corruptedDataCloudTop:
      "/assets/airport/corrupted-data-cloud-top-v1.webp",
    corruptedDataVortexBottom:
      "/assets/airport/corrupted-data-vortex-bottom-v1.webp",
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
    // Office scene: the inspection booth with its service window and desk.
    booth: "/assets/ethics-review/inspection-booth-v2.webp",
    form: "/assets/ethics-review/inspection-form-v2.webp",
    // Students at the window reuse the workshop's storybook customer art so
    // both village activities share one cast and one drawing style.
    visitors: Object.fromEntries(
      [
        "school-prep-student", "diary-student", "science-homework-student",
        "cafeteria-student", "wrong-answer-student", "foreign-call-student",
      ].map((id) => [id, {
        waiting: `/assets/customers/v3-game/${id}-worried.webp`,
        happy: `/assets/customers/v3-game/${id}-happy.webp`,
      }]),
    ) as Readonly<Record<string, Readonly<{ waiting: string; happy: string }>>>,
    stampApprove: "/assets/ethics-review/stamp-tool-approve-v1.webp",
    stampReject: "/assets/ethics-review/stamp-tool-reject-v1.webp",
    // Textbook Midi (v2), all at the front frames' scale so they swap cleanly.
    midiFront: "/assets/characters/midi-v2/front-idle.webp",
    midiLeft: "/assets/characters/midi-v2/pose-side-left.webp",
    midiRight: "/assets/characters/midi-v2/pose-side-right.webp",
    midiHappy: "/assets/characters/midi-v2/front-happy.webp",
    midiWorried: "/assets/characters/midi-v2/front-worried.webp",
    topics: {
      permission: "/assets/ethics-review/stamp-topic-permission-v2.webp",
      privacy: "/assets/ethics-review/stamp-topic-privacy-v1.webp",
      checking: "/assets/ethics-review/stamp-topic-checking-v1.webp",
      honesty: "/assets/ethics-review/stamp-topic-honesty-v1.webp",
      respect: "/assets/ethics-review/stamp-topic-respect-v1.webp",
    },
    office: "/assets/ethics-review/office-v2.webp",
  },
} as const;

export const GAME_SIZE = {
  width: 1280,
  height: 720,
} as const;
