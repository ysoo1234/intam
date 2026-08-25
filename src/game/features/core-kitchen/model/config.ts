import type { CoreKind } from "../../../content/coreKitchen";

export const CORE_KINDS: readonly CoreKind[] = [
  "input",
  "process",
  "output",
];

export const CORE_LANE_Y: Readonly<Record<CoreKind, number>> = {
  input: 455,
  process: 535,
  output: 615,
};

export const CORE_KITCHEN_RULES = {
  machineInteractionDistance: 155,
  corePickupDistance: 82,
  playerSpeed: 205,
  conveyorWrapMinX: 235,
  conveyorWrapMaxX: 850,
} as const;
