import Phaser from "phaser";
import type { FlightDataKind } from "../../../content/dataFlight";
import type { FlightObjectKind, PublicDataKind } from "../model";

export type FlightObject = {
  kind: FlightObjectKind;
  container: Phaser.GameObjects.Container;
  radius: number;
  dataKind?: FlightDataKind;
  publicDataKind?: PublicDataKind;
  spin: number;
  collisionRadiusX?: number;
  collisionRadiusY?: number;
  baseY?: number;
  bobAmplitude?: number;
  bobSpeed?: number;
  bobPhase?: number;
  horizontalBobAmplitude?: number;
  horizontalBobSpeed?: number;
  horizontalBobOffset?: number;
  horizontalBobStartedAtMs?: number;
};
