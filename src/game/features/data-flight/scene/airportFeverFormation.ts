import Phaser from "phaser";
import {
  PUBLIC_DATA_KINDS,
  type PublicDataKind,
} from "../model";

export type AirportFeverFormationItem = Readonly<{
  publicDataKind: PublicDataKind;
  x: number;
  y: number;
  showLabel: boolean;
}>;

type FormationPoint = Readonly<{ x: number; y: number }>;

const START_X = 1_350;
const ITEMS_PER_GROUP = 5;
const FORMATION_PATTERN_COUNT = 5;

function selectFormationKinds() {
  return Phaser.Utils.Array.Shuffle([...PUBLIC_DATA_KINDS]).slice(0, 4);
}

function labelFormationPath(
  points: readonly FormationPoint[],
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  return points.map(({ x, y }, index) => ({
    publicDataKind: kinds[Math.floor(index / ITEMS_PER_GROUP)],
    x,
    y,
    showLabel: index % ITEMS_PER_GROUP === 2,
  }));
}

function createTwoRowFormation(
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  const points = [230, 490].flatMap((y) =>
    Array.from({ length: 10 }, (_, column) => ({
      x: START_X + column * 100,
      y,
    })),
  );
  return labelFormationPath(points, kinds);
}

function createXFormation(
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  return Array.from({ length: 10 }, (_, column) => {
    const descendingKind = kinds[Math.floor(column / ITEMS_PER_GROUP)];
    const ascendingKind = kinds[2 + Math.floor(column / ITEMS_PER_GROUP)];
    const showLabel = column % ITEMS_PER_GROUP === 2;
    const x = START_X + column * 100;
    return [
      {
        publicDataKind: descendingKind,
        x,
        y: 170 + column * 42,
        showLabel,
      },
      {
        publicDataKind: ascendingKind,
        x,
        y: 548 - column * 42,
        showLabel,
      },
    ];
  }).flat();
}

function createHeartFormation(
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  const points = Array.from({ length: 20 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 20;
    const heartX = 16 * Math.sin(angle) ** 3;
    const heartY =
      13 * Math.cos(angle) -
      5 * Math.cos(angle * 2) -
      2 * Math.cos(angle * 3) -
      Math.cos(angle * 4);
    return {
      x: 1_820 + heartX * 28,
      y: 350 - heartY * 11,
    };
  });
  return labelFormationPath(points, kinds);
}

function createWaveFormation(
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  const points = Array.from({ length: 20 }, (_, index) => {
    const progress = index / 19;
    return {
      x: START_X + index * 62,
      y: 360 + Math.sin(progress * Math.PI * 2) * 170,
    };
  });
  return labelFormationPath(points, kinds);
}

function createDiamondFormation(
  kinds: readonly PublicDataKind[],
): AirportFeverFormationItem[] {
  const vertices = [
    { x: 1_820, y: 150 },
    { x: 2_300, y: 360 },
    { x: 1_820, y: 570 },
    { x: 1_340, y: 360 },
    { x: 1_820, y: 150 },
  ] as const;
  const points = Array.from({ length: 20 }, (_, index) => {
    const edge = Math.floor(index / ITEMS_PER_GROUP);
    const progress = (index % ITEMS_PER_GROUP) / ITEMS_PER_GROUP;
    return {
      x: Phaser.Math.Linear(vertices[edge].x, vertices[edge + 1].x, progress),
      y: Phaser.Math.Linear(vertices[edge].y, vertices[edge + 1].y, progress),
    };
  });
  return labelFormationPath(points, kinds);
}

export function createAirportFeverFormation(
  formationIndex: number,
): AirportFeverFormationItem[] {
  const kinds = selectFormationKinds();
  switch (formationIndex % FORMATION_PATTERN_COUNT) {
    case 0:
      return createTwoRowFormation(kinds);
    case 1:
      return createXFormation(kinds);
    case 2:
      return createHeartFormation(kinds);
    case 3:
      return createWaveFormation(kinds);
    default:
      return createDiamondFormation(kinds);
  }
}
