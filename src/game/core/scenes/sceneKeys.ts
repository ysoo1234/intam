export const SCENE_KEYS = {
  intro: "intro",
  world: "world",
  airport: "airport",
  aiWorkshop: "shop-workshop",
  ethicsReview: "ethics-review",
  ending: "ending",
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
