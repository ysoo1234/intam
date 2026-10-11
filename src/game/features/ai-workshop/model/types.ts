import type {
  WorkshopProduct,
  WorkshopRequest,
} from "../../../content/aiWorkshop";

export type WorkshopPhase =
  | "request"
  | "choosing"
  | "crafting"
  | "delivery"
  | "transition"
  /** The customer pays and leaves: Midi may walk, but nothing can be used. */
  | "settling"
  | "finished";

export type WorkshopOrder = {
  requests: WorkshopRequest[];
  products: WorkshopProduct[];
  requiredStarHits: number;
};

export type StarCatchDifficulty = {
  speed: number;
  zoneWidth: number;
};
