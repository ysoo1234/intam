import Phaser from "phaser";
import { FONT_FAMILY } from "../../../core/visual/theme";
import {
  FLIGHT_DATA_KINDS,
  FLIGHT_DATA_META,
  type FlightDataKind,
} from "../../../content/dataFlight";
import {
  DATA_FLIGHT_CONFIG,
  getObstacleAmplitudeMax,
  getObstacleBobSpeedMax,
  getObstacleHorizontalAmplitudeMax,
  shouldSpawnDoubleEdgeObstacle,
  type PublicDataKind,
} from "../model";
import type { FlightObject } from "./flightObject";

const PUBLIC_DATA_META: Readonly<{
  kind: PublicDataKind;
  label: string;
  color: number;
}>[] = [
  { kind: "science-technology", label: "과학기술 공공데이터", color: 0xa55bff },
  { kind: "education", label: "교육 공공데이터", color: 0x38bdf8 },
  { kind: "transport", label: "교통 공공데이터", color: 0xff9d35 },
  { kind: "law", label: "법률 공공데이터", color: 0x4b7cff },
  { kind: "industry", label: "산업 공공데이터", color: 0xff8a33 },
  { kind: "medical", label: "의료 공공데이터", color: 0x32d7c4 },
  { kind: "safety", label: "안전 공공데이터", color: 0xff5d4d },
  { kind: "environment", label: "환경 공공데이터", color: 0x61d94b },
] as const;

const BAD_DATA_QUALIFIERS = [
  "필요하지 않은",
  "오래된",
  "잘못된",
  "한쪽으로 치우친",
  "일부가 빠진",
  "중복된",
  "출처가 없는",
] as const;

type DataObjectOptions = Readonly<{
  dataKind?: FlightDataKind;
  x?: number;
  y?: number;
  questionChoice?: boolean;
  publicData?: boolean;
  publicDataKind?: PublicDataKind;
  showLabel?: boolean;
}>;

export function createAirportDataObject(
  scene: Phaser.Scene,
  options: DataObjectOptions = {},
): FlightObject {
  const dataKind =
    options.dataKind ?? Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS);
  const x = options.x ?? 1350;
  const y = options.y ?? Phaser.Math.Between(135, 615);
  const questionChoice = options.questionChoice ?? false;
  const publicMeta = options.publicDataKind
    ? PUBLIC_DATA_META.find(({ kind }) => kind === options.publicDataKind)
    : options.publicData
      ? Phaser.Utils.Array.GetRandom(PUBLIC_DATA_META)
      : undefined;
  const meta = FLIGHT_DATA_META[dataKind];
  const color = publicMeta?.color ?? meta.color;
  const container = scene.add.container(x, y).setDepth(15);
  const textureKey = publicMeta
    ? `airport-public-data-${publicMeta.kind}`
    : `airport-data-${dataKind}`;
  const imageY = publicMeta ? -4 : -3;
  const imageSize = questionChoice || publicMeta ? 96 : 74;
  const neonOuter = scene.add
    .image(0, imageY, textureKey)
    .setDisplaySize(imageSize * 1.32, imageSize * 1.32)
    .setTint(color)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.13)
    .setBlendMode(Phaser.BlendModes.ADD);
  const neonInner = scene.add
    .image(0, imageY, textureKey)
    .setDisplaySize(imageSize * 1.15, imageSize * 1.15)
    .setTint(color)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.28)
    .setBlendMode(Phaser.BlendModes.ADD);
  const neonRim = scene.add
    .image(0, imageY, textureKey)
    .setDisplaySize(imageSize + 7, imageSize + 7)
    .setTint(color)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.55)
    .setBlendMode(Phaser.BlendModes.ADD);
  const outerScaleX = neonOuter.scaleX;
  const outerScaleY = neonOuter.scaleY;
  const innerScaleX = neonInner.scaleX;
  const innerScaleY = neonInner.scaleY;
  const image = scene.add
    .image(0, imageY, textureKey)
    .setDisplaySize(imageSize, imageSize);
  const label = scene.add
    .text(0, questionChoice ? 57 : publicMeta ? 47 : 44, publicMeta?.label ?? meta.label, {
      color: "#173f43",
      backgroundColor: "#fff9e8e8",
      fontFamily: FONT_FAMILY,
      fontSize: questionChoice ? "17px" : publicMeta ? "12px" : "13px",
      fontStyle: "bold",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5)
    .setVisible(options.showLabel ?? true);
  container.add([neonOuter, neonInner, neonRim, image, label]);
  scene.tweens.add({
    targets: neonOuter,
    scaleX: { from: outerScaleX * 0.88, to: outerScaleX * 1.12 },
    scaleY: { from: outerScaleY * 0.88, to: outerScaleY * 1.12 },
    alpha: { from: 0.2, to: 0.04 },
    duration: 820,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: neonInner,
    scaleX: { from: innerScaleX * 0.94, to: innerScaleX * 1.08 },
    scaleY: { from: innerScaleY * 0.94, to: innerScaleY * 1.08 },
    alpha: { from: 0.36, to: 0.12 },
    duration: 660,
    delay: 160,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return {
    kind: questionChoice ? "question" : "data",
    container,
    radius: questionChoice ? 43 : publicMeta ? 40 : 34,
    dataKind,
    publicDataKind: publicMeta?.kind,
    spin: Phaser.Math.FloatBetween(-10, 10),
  };
}

export function createAirportMovingObstacle(
  scene: Phaser.Scene,
  score: number,
): FlightObject {
  const dataKind = Phaser.Utils.Array.GetRandom(FLIGHT_DATA_KINDS);
  const qualifier = Phaser.Utils.Array.GetRandom([...BAD_DATA_QUALIFIERS]);
  const dataLabel = `${qualifier}\n${FLIGHT_DATA_META[dataKind].label}`;
  const y = Phaser.Math.Between(220, 520);
  const bobAmplitude = Phaser.Math.Between(
    DATA_FLIGHT_CONFIG.obstacleAmplitude.min,
    getObstacleAmplitudeMax(score),
  );
  const bobSpeed = Phaser.Math.FloatBetween(
    DATA_FLIGHT_CONFIG.obstacleBobSpeed.min,
    getObstacleBobSpeedMax(score),
  );
  const bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const horizontalBobAmplitude = Math.min(
    getObstacleHorizontalAmplitudeMax(score),
    Math.round(bobAmplitude * 0.45),
  );
  const container = scene.add.container(1360, y).setDepth(16);
  const dangerColor = 0xff0000;
  const imageSize = 74;
  const warningAuraOuter = scene.add
    .image(0, -8, `airport-bad-data-${dataKind}`)
    .setDisplaySize(imageSize * 1.32, imageSize * 1.32)
    .setTint(dangerColor)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.22);
  const warningAuraInner = scene.add
    .image(0, -8, `airport-bad-data-${dataKind}`)
    .setDisplaySize(imageSize * 1.15, imageSize * 1.15)
    .setTint(dangerColor)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.45);
  const warningRim = scene.add
    .image(0, -8, `airport-bad-data-${dataKind}`)
    .setDisplaySize(imageSize + 7, imageSize + 7)
    .setTint(dangerColor)
    .setTintMode(Phaser.TintModes.FILL)
    .setAlpha(0.55);
  const outerScaleX = warningAuraOuter.scaleX;
  const outerScaleY = warningAuraOuter.scaleY;
  const innerScaleX = warningAuraInner.scaleX;
  const innerScaleY = warningAuraInner.scaleY;
  const image = scene.add
    .image(0, -8, `airport-bad-data-${dataKind}`)
    .setDisplaySize(imageSize, imageSize);
  const label = scene.add
    .text(0, 43, dataLabel, {
      color: "#fff9e8",
      backgroundColor: "#651c3ee8",
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      fontStyle: "bold",
      stroke: "#3b1026",
      strokeThickness: 2,
      align: "center",
      lineSpacing: 1,
      padding: { x: 7, y: 3 },
    })
    .setOrigin(0.5);
  container.add([
    warningAuraOuter,
    warningAuraInner,
    warningRim,
    image,
    label,
  ]);
  scene.tweens.add({
    targets: warningAuraOuter,
    scaleX: { from: outerScaleX * 0.88, to: outerScaleX * 1.12 },
    scaleY: { from: outerScaleY * 0.88, to: outerScaleY * 1.12 },
    alpha: { from: 0.34, to: 0.08 },
    duration: 820,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  scene.tweens.add({
    targets: warningAuraInner,
    scaleX: { from: innerScaleX * 0.94, to: innerScaleX * 1.08 },
    scaleY: { from: innerScaleY * 0.94, to: innerScaleY * 1.08 },
    alpha: { from: 0.58, to: 0.22 },
    duration: 660,
    delay: 160,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  return {
    kind: "obstacle",
    container,
    radius: 34,
    spin: 0,
    baseY: y,
    bobAmplitude,
    bobSpeed,
    bobPhase,
    horizontalBobAmplitude,
    horizontalBobSpeed: bobSpeed * 0.55,
    horizontalBobOffset: 0,
  };
}

export function createAirportEdgeObstacles(
  scene: Phaser.Scene,
  score: number,
): FlightObject[] {
  const doubleObstacle = shouldSpawnDoubleEdgeObstacle(
    score,
    Phaser.Math.FloatBetween(0, 1),
  );
  const sides: readonly ("top" | "bottom")[] = doubleObstacle
    ? ["top", "bottom"]
    : [Phaser.Utils.Array.GetRandom(["top", "bottom"] as const)];

  return sides.map((side) => {
    const top = side === "top";
    const y = top ? 142.5 : 577.5;
    const container = scene.add.container(1360, y).setDepth(16);
    const texture = top
      ? "airport-corrupted-data-cloud-top"
      : "airport-corrupted-data-vortex-bottom";
    const image = scene.add
      .image(0, 0, texture)
      .setDisplaySize(155, 285);
    container.add(image);
    return {
      kind: "obstacle",
      container,
      radius: 50,
      collisionRadiusX: 54,
      collisionRadiusY: 118,
      spin: 0,
    };
  });
}
