import type { FlightObject } from "./flightObject";

export function updateAirportObstacleMotion(
  object: FlightObject,
  elapsedMs: number,
) {
  if (
    object.kind !== "obstacle" ||
    object.baseY === undefined ||
    object.bobAmplitude === undefined ||
    object.bobSpeed === undefined
  ) {
    return;
  }

  object.container.y =
    object.baseY +
    Math.sin(elapsedMs * object.bobSpeed + (object.bobPhase ?? 0)) *
      object.bobAmplitude;

  if (
    object.horizontalBobAmplitude === undefined ||
    object.horizontalBobAmplitude <= 0 ||
    object.horizontalBobSpeed === undefined
  ) {
    return;
  }

  object.horizontalBobStartedAtMs ??= elapsedMs;
  const nextHorizontalOffset =
    Math.sin(
      (elapsedMs - object.horizontalBobStartedAtMs) *
        object.horizontalBobSpeed,
    ) * object.horizontalBobAmplitude;
  object.container.x +=
    nextHorizontalOffset - (object.horizontalBobOffset ?? 0);
  object.horizontalBobOffset = nextHorizontalOffset;
}
