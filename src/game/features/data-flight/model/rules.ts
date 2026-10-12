import { DATA_FLIGHT_CONFIG } from "./config";
import type { FlightObjectKind, FlightResult } from "./types";

export function getDifficultyTier(score: number) {
  const rawTier = Math.floor(
    Math.max(0, score) / DATA_FLIGHT_CONFIG.obstacleSpawnInterval.scoreStep,
  );
  return Math.min(DATA_FLIGHT_CONFIG.difficultyTiers.length - 1, rawTier);
}

export function getDifficultyProfile(score: number) {
  return DATA_FLIGHT_CONFIG.difficultyTiers[getDifficultyTier(score)];
}

export function getObjectBaseSpeed(
  kind: FlightObjectKind,
  score: number,
) {
  if (kind === "question") return DATA_FLIGHT_CONFIG.questionChoiceSpeed;
  if (kind === "obstacle") return getDifficultyProfile(score).obstacleSpeed;
  return DATA_FLIGHT_CONFIG.dataSpeed;
}

export function getObstacleAmplitudeMax(score: number) {
  return getDifficultyProfile(score).obstacleAmplitudeMax;
}

export function getObstacleBobSpeedMax(score: number) {
  return getDifficultyProfile(score).obstacleBobSpeedMax;
}

export function getObstacleHorizontalAmplitudeMax(score: number) {
  return getDifficultyProfile(score).obstacleHorizontalAmplitudeMax;
}

export function getObstacleSpawnIntervalBounds(score: number) {
  const profile = getDifficultyProfile(score);
  return {
    min: profile.obstacleIntervalMinMs,
    max: profile.obstacleIntervalMaxMs,
  } as const;
}

export function shouldSpawnEdgeObstacle(score: number, roll: number) {
  return roll < getDifficultyProfile(score).edgeObstacleChance;
}

export function shouldSpawnDoubleEdgeObstacle(score: number, roll: number) {
  return roll < getDifficultyProfile(score).doubleEdgeChance;
}

export function getCollectedDataScore(feverActive: boolean): 10 | 30 {
  return feverActive
    ? DATA_FLIGHT_CONFIG.feverDataScore
    : DATA_FLIGHT_CONFIG.dataScore;
}

export function getCollectedDifficultyPoints(): 10 {
  return DATA_FLIGHT_CONFIG.dataScore;
}

export function decrementHeart(hearts: number) {
  return Math.max(0, hearts - 1);
}

export function isFeverActive(elapsedMs: number, feverUntilMs: number) {
  return feverUntilMs > elapsedMs;
}

export function clampFrameDelta(deltaMs: number) {
  return Math.min(deltaMs, DATA_FLIGHT_CONFIG.maxFrameDeltaMs);
}

export function createFlightResult(
  completed: boolean,
  score: number,
  collected: number,
  correctAnswers: number,
  remainingHearts: number,
): FlightResult {
  return {
    completed,
    score,
    collected,
    correctAnswers,
    remainingHearts,
  };
}

export function getDataFlightStars(score: number): 0 | 1 | 2 | 3 {
  const thresholds = DATA_FLIGHT_CONFIG.starThresholds;
  if (score >= thresholds.threeStars) return 3;
  if (score >= thresholds.twoStars) return 2;
  return score >= thresholds.oneStar ? 1 : 0;
}
