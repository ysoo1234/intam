export const SCENE_KEYS = {
  intro: "intro",
  world: "world",
  airport: "airport",
  aiWorkshop: "shop-workshop",
  ethicsReview: "ethics-review",
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
