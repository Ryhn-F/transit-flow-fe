import type {
  DetourRoute,
  UnderpassFlood,
  WalkwayEdge,
} from "@/entities/weather";
import { FLOOD_DEPTH_THRESHOLD_CM } from "@/entities/weather";
import { DETOUR_ROUTES } from "@/infrastructure/mock/fixtures/weather-fixtures";

/**
 * Pure fixture router: an edge is "flooded" when its underpass has a verified
 * depth >= threshold. Flooded edges are excluded; routes are ranked by
 * time delta, and each route's per-edge state is computed deterministically.
 */
export function computeDetourSet(
  floods: UnderpassFlood[],
  graph: WalkwayEdge[],
  baseRoutes: typeof DETOUR_ROUTES = DETOUR_ROUTES,
): DetourRoute[] {
  const floodedUnderpassIds = new Set(
    floods
      .filter((f) => f.depthCm != null && f.depthCm >= FLOOD_DEPTH_THRESHOLD_CM)
      .map((f) => f.id),
  );

  const edgeByUnderpass = new Map<string, WalkwayEdge[]>();
  for (const edge of graph) {
    if (edge.underpassId) {
      const list = edgeByUnderpass.get(edge.underpassId) ?? [];
      list.push(edge);
      edgeByUnderpass.set(edge.underpassId, list);
    }
  }

  const routes: DetourRoute[] = [];
  for (const route of baseRoutes) {
    const edgeState: Record<string, "open" | "covered" | "flooded"> = {};
    let flooded = false;
    for (const edgeId of route.edgeIds) {
      const edge = graph.find((e) => e.id === edgeId);
      if (!edge) {
        edgeState[edgeId] = "open";
        continue;
      }
      const isFlooded =
        edge.underpassId != null && floodedUnderpassIds.has(edge.underpassId);
      if (isFlooded) flooded = true;
      edgeState[edgeId] = isFlooded
        ? "flooded"
        : edge.covered
          ? "covered"
          : "open";
    }
    if (flooded) continue;
    routes.push({ ...route, edgeState });
  }

  return routes.sort((a, b) => a.timeDeltaMin - b.timeDeltaMin);
}
