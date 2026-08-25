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
