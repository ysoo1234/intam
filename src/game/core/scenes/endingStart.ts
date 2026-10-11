import {
  readWorldProgressSnapshot,
  type WorldProgressSnapshot,
} from "../navigation/worldProgress";

/**
 * Contract between the village and the ending: entering the open starlight
 * gate starts the ending with the stars earned and where Midi stood, so the
 * ending begins on the same picture (features never import each other).
 */
export type EndingStart = Readonly<{
  progress: WorldProgressSnapshot;
  /** Midi's spot in village map pixels (the player's feet). */
  midi: Readonly<{ x: number; y: number }>;
}>;

const ENDING_START_FLAG = "endingStart";

export function createEndingStart(start: EndingStart) {
  return { [ENDING_START_FLAG]: start } as const;
}

export function readEndingStart(data: unknown): EndingStart | undefined {
  if (!data || typeof data !== "object") return undefined;
  const candidate = (data as Record<string, unknown>)[ENDING_START_FLAG];
  if (!candidate || typeof candidate !== "object") return undefined;
  const { progress, midi } = candidate as Partial<Record<keyof EndingStart, unknown>>;
  const spot = midi as Partial<Record<"x" | "y", unknown>> | undefined;
  if (typeof spot?.x !== "number" || typeof spot.y !== "number") return undefined;
  return { progress: readWorldProgressSnapshot(progress), midi: { x: spot.x, y: spot.y } };
}
