import type Phaser from "phaser";
import type { WorldActivityId } from "../navigation/worldProgress";

type Point = Readonly<{ x: number; y: number }>;

/**
 * Where the ending's light goes in the village (all in village map pixels):
 * each activity building with its roof stars, the fountain's top tier, and
 * the starlight gate with its screen and star counter.
 */
export type VillageLandmarks = Readonly<{
  activities: Readonly<Record<WorldActivityId, Readonly<{ center: Point; stars: Point }>>>;
  fountainTop: Point;
  gate: Readonly<{ center: Point; screen: Point; counter: Point }>;
}>;

/**
 * Contract between the intro story and the village: the intro shows the real
 * village through its magic door, drawn from the village's own layout, then
 * grows it until it exactly fills the screen, so the cut to the village scene
 * is invisible. The village feature provides the painter; the scene registry
 * hands it to the intro (features never import each other).
 */
export type VillagePreview = Readonly<{
  /** The village map size in game pixels (it fills the screen). */
  size: Readonly<{ width: number; height: number }>;
  /** Where Midi stands when the village starts. */
  spawn: Readonly<{ x: number; y: number }>;
  /** Midi's drawn body in the village: its height and how far its bottom is below `spawn`. */
  midiBody: Readonly<{ height: number; bottomBelowSpawn: number }>;
  /** Buildings, fountain and gate positions, from the same layout. */
  landmarks: VillageLandmarks;
  /** Loads the art the painter needs. */
  preload: (scene: Phaser.Scene) => void;
  /**
   * Paints the village as it looks on arrival (buildings, fountain, gate and
   * roof stars; no Midi or UI) into texture `key`. Returns false when its art
   * is not loaded, so the caller can fall back.
   */
  paint: (scene: Phaser.Scene, key: string, renderScale: number) => boolean;
  /**
   * Adds the starlight gate's moving portal on top of a painted village (a
   * still picture can't move), in village map pixels at `depth`.
   */
  addLivePortal?: (scene: Phaser.Scene, depth: number) => void;
}>;

const DOOR_ARRIVAL_FLAG = "arrivedThroughDoor";

/** Scene data for starting the village right after the intro's door zoom. */
export function createVillageDoorArrival() {
  return { [DOOR_ARRIVAL_FLAG]: true } as const;
}

/** True when the village starts straight out of the intro's door (no fade-in then). */
export function isVillageDoorArrival(data: unknown) {
  return Boolean(
    data && typeof data === "object" && (data as Record<string, unknown>)[DOOR_ARRIVAL_FLAG] === true,
  );
}
