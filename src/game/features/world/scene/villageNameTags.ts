import Phaser from "phaser";
import type { WorldActivityId } from "../../../core/navigation";
import { COLORS, FONT_FAMILY } from "../../../core/visual/theme";
import type { MapDefinition } from "../model/mapDefinition";
import { DISPLAY_FONT_FAMILY } from "../../../core/visual/fonts";
import { VILLAGE_STAR_TEXTURES } from "./villageProgressPresentation";
import { VILLAGE_UI_DEPTH, type VillageSceneryLayer } from "./villageScenery";

/** Above the village and Midi, below the tutorial tips. */
export const VILLAGE_NAME_TAG_DEPTH = VILLAGE_UI_DEPTH + 5;
/** Keeps tags on the top row of buildings fully on screen. */
const MIN_TAG_Y = 34;

/** Short name and colour of each place, matched to its building artwork. */
export const VILLAGE_PLACE_TAGS = {
  "ai-workshop": { name: "AI 제작소", color: 0xd9544a },
  "data-flight": { name: "데이터 비행장", color: 0x2f86c9 },
  "ethics-review": { name: "윤리 심사소", color: 0xc98a16 },
  "starlight-exit": { name: "별빛 졸업길", color: 0x23875f },
} as const satisfies Record<WorldActivityId | "starlight-exit", { name: string; color: number }>;
export type VillagePlaceId = keyof typeof VILLAGE_PLACE_TAGS;

/** A rounded name tag (white bold text on the place's colour). */
export function createVillageNameTag(scene: Phaser.Scene, placeId: VillagePlaceId) {
  const { name, color } = VILLAGE_PLACE_TAGS[placeId];
  const label = scene.add
    .text(0, 0, name, { color: "#ffffff", fontFamily: FONT_FAMILY, fontSize: "21px", fontStyle: "bold" })
    .setOrigin(0.5)
    .setResolution(3);
  const width = label.width + 40;
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 0.25).fillRoundedRect(-width / 2 + 2, -20, width, 44, 22);
  g.fillStyle(color, 1).fillRoundedRect(-width / 2, -23, width, 44, 22);
  g.lineStyle(3, 0xffffff, 1).strokeRoundedRect(-width / 2, -23, width, 44, 22);
  return scene.add
    .container(0, 0, [g, label])
    .setDepth(VILLAGE_NAME_TAG_DEPTH)
    .setAlpha(0)
    .setData("width", width);
}

/** Gap between the top of a roof's middle star and the bottom of the name tag. */
const TAG_ABOVE_STAR = 54;
/**
 * Where each building looks centred, as a fraction of its picture's width from
 * the left (the weight of the drawn building, before any mirroring). The tag
 * sits over this point, not over the stars, so it reads as the building's sign.
 */
const VISUAL_CENTER_X: Partial<Record<VillagePlaceId, number>> = {
  "ai-workshop": 0.514,
  "data-flight": 0.503,
  "ethics-review": 0.506,
};

/**
 * Where a place's tag sits: right above the middle star of its roof (so no
 * star is covered), or above the top of the building when it has no stars.
 */
export function getVillageNameTagPosition(layer: VillageSceneryLayer) {
  const { position, displaySize, progressMarker, flipX } = layer.definition;
  if (progressMarker?.kind === "activity-stars") {
    const centre = VISUAL_CENTER_X[progressMarker.featureId] ?? 0.5;
    const offset = (centre - 0.5) * displaySize.width * (flipX ? -1 : 1);
    return { x: position.x + offset, y: Math.max(MIN_TAG_Y, progressMarker.position.y - TAG_ABOVE_STAR) };
  }
  return { x: position.x, y: Math.max(MIN_TAG_Y, position.y - displaySize.height / 2 - 6) };
}

/**
 * Where the gate's "(star) 0 / 7" sits, as a fraction of the gate's size from
 * its centre (y grows downward). x -0.03 puts it on the tablet's hinge (the
 * brown spine sits at 47% of the picture's width).
 */
const GATE_COUNT_SPOT = { x: -0.03, y: 0 } as const;
/** At the gate's door the count sits beside the gate's name tag, this far apart. */
const GATE_COUNT_GAP = 6;
const GATE_COUNT_SCALE = 0.82;

/** "(star) 0 / 7" on the middle of the starlight gate, with the roofs' star art. */
export function createVillageGateCount(
  scene: Phaser.Scene,
  layer: VillageSceneryLayer,
  stars: number,
  required: number,
  depth = VILLAGE_NAME_TAG_DEPTH,
) {
  const star = scene.add.image(0, 0, VILLAGE_STAR_TEXTURES.filled).setDisplaySize(40, 40);
  const label = scene.add
    .text(0, -1, `${Math.min(stars, required)} / ${required}`, {
      fontFamily: DISPLAY_FONT_FAMILY, fontSize: "32px", color: "#ffe27a",
      stroke: "#3b2d6b", strokeThickness: 7,
    })
    .setOrigin(0, 0.5)
    .setResolution(2);
  const gap = 8;
  const contentWidth = 40 + gap + label.width;
  star.setX(-contentWidth / 2 + 20);
  label.setX(-contentWidth / 2 + 40 + gap);
  const width = contentWidth + 34;
  const plate = scene.add.graphics();
  plate.fillStyle(0x2b2457, 0.85).fillRoundedRect(-width / 2, -30, width, 60, 30);
  plate.lineStyle(3, 0xffe27a, 1).strokeRoundedRect(-width / 2, -30, width, 60, 30);
  const { position, displaySize } = layer.definition;
  return scene.add
    .container(
      position.x + displaySize.width * GATE_COUNT_SPOT.x * (layer.definition.flipX ? -1 : 1),
      position.y + displaySize.height * GATE_COUNT_SPOT.y,
      [plate, star, label],
    )
    .setData("width", width)
    .setDepth(depth)
    .setAlpha(0);
}

/** The building artwork that belongs to a place. */
export function findVillagePlaceLayer(layers: readonly VillageSceneryLayer[], placeId: VillagePlaceId) {
  return layers.find(({ definition }) => {
    const marker = definition.progressMarker;
    if (!marker) return false;
    if (placeId === "starlight-exit") return marker.kind === "starlight-exit";
    return marker.kind === "activity-stars" && marker.featureId === placeId;
  });
}

type Portal = MapDefinition["portals"][number];
function getPortalPlaceId(portal: Portal): VillagePlaceId | undefined {
  if (portal.destination.kind === "feature") return portal.destination.featureId as WorldActivityId;
  if (portal.destination.kind === "world-completion-placeholder") return "starlight-exit";
  return undefined;
}

/**
 * Shows a building's name above its roof while Midi stands at its door.
 * Call `update` every frame with the portal whose entry button is showing.
 */
export function createVillageNameTags(
  scene: Phaser.Scene,
  mapDefinition: MapDefinition,
  layers: readonly VillageSceneryLayer[],
  gateStars: Readonly<{ stars: number; required: number }>,
) {
  const tags = new Map<string, Phaser.GameObjects.Container[]>();
  for (const portal of mapDefinition.portals) {
    const placeId = getPortalPlaceId(portal);
    const layer = placeId && findVillagePlaceLayer(layers, placeId);
    if (!placeId || !layer) continue;
    const tag = createVillageNameTag(scene, placeId);
    const { x, y } = getVillageNameTagPosition(layer);
    tag.setPosition(x, y).setVisible(false);
    const shown = [tag];
    // At the gate, the star count shows too ("0 / 7"): name tag on the left,
    // count on the right, the pair centred over the gate (clear of Midi's
    // entry button, which sits lower).
    if (placeId === "starlight-exit") {
      const count = createVillageGateCount(scene, layer, gateStars.stars, gateStars.required).setVisible(false);
      const tagWidth = Number(tag.getData("width"));
      const countWidth = Number(count.getData("width")) * GATE_COUNT_SCALE;
      const total = tagWidth + GATE_COUNT_GAP + countWidth;
      tag.setX(x - total / 2 + tagWidth / 2);
      count.setPosition(x + total / 2 - countWidth / 2, y - 1).setScale(GATE_COUNT_SCALE);
      shown.push(count);
    }
    tags.set(portal.id, shown);
  }
  let shownId: string | undefined;
  const fade = (group: readonly Phaser.GameObjects.Container[], show: boolean) => {
    for (const tag of group) {
      scene.tweens.killTweensOf(tag);
      if (show) tag.setVisible(true);
      scene.tweens.add({
        targets: tag, alpha: show ? 1 : 0, duration: show ? 200 : 160,
        onComplete: () => { if (!show) tag.setVisible(false); },
      });
    }
  };
  return {
    update: (portalId: string | undefined) => {
      if (portalId === shownId) return;
      const previous = shownId && tags.get(shownId);
      if (previous) fade(previous, false);
      shownId = portalId && tags.has(portalId) ? portalId : undefined;
      const next = shownId && tags.get(shownId);
      if (next) fade(next, true);
    },
  };
}
