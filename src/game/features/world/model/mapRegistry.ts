import { isKnownFeatureId } from "../../../core/navigation";
import type { MapDefinition, MapId } from "./mapDefinition";
import { VILLAGE_MAP } from "./villageMap";

export type MapRegistryValidationIssue = Readonly<{
  code: "duplicate-map-id" | "duplicate-portal-id" | "unknown-feature";
  message: string;
  mapId: MapId;
  portalId?: string;
  featureId?: string;
}>;

export type MapRegistry<TMap extends MapDefinition = MapDefinition> = Readonly<{
  definitions: readonly TMap[];
  get(mapId: MapId): TMap | undefined;
  has(mapId: MapId): boolean;
}>;

export function validateMapRegistry(
  definitions: readonly MapDefinition[],
): readonly MapRegistryValidationIssue[] {
  const issues: MapRegistryValidationIssue[] = [];
  const knownMapIds = new Set<MapId>();

  for (const definition of definitions) {
    if (knownMapIds.has(definition.id)) {
      issues.push({
        code: "duplicate-map-id",
        mapId: definition.id,
        message: `Duplicate map id: ${definition.id}`,
      });
    } else {
      knownMapIds.add(definition.id);
    }

    const knownPortalIds = new Set<string>();
    for (const portal of definition.portals) {
      if (knownPortalIds.has(portal.id)) {
        issues.push({
          code: "duplicate-portal-id",
          mapId: definition.id,
          portalId: portal.id,
          message: `Duplicate portal id in map ${definition.id}: ${portal.id}`,
        });
      } else {
        knownPortalIds.add(portal.id);
      }

      if (
        portal.destination.kind === "feature" &&
        !isKnownFeatureId(portal.destination.featureId)
      ) {
        issues.push({
          code: "unknown-feature",
          mapId: definition.id,
          portalId: portal.id,
          featureId: portal.destination.featureId,
          message:
            `Unknown feature id in map ${definition.id}, ` +
            `portal ${portal.id}: ${portal.destination.featureId}`,
        });
      }
    }
  }

  return issues;
}

export function createMapRegistry<const TMap extends MapDefinition>(
  definitions: readonly TMap[],
): MapRegistry<TMap> {
  const issues = validateMapRegistry(definitions);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join("\n"));
  }

  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return Object.freeze({
    definitions: Object.freeze([...definitions]),
    get: (mapId: MapId) => definitionsById.get(mapId),
    has: (mapId: MapId) => definitionsById.has(mapId),
  });
}

export const mapRegistry = createMapRegistry([VILLAGE_MAP]);
