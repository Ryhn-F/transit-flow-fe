import { describe, it, expect } from "vitest";
import { computeDetourSet } from "./compute-detours";
import { DETOUR_ROUTES, WALKWAY_GRAPH, UNDERPASSES } from "@/infrastructure/mock/fixtures/weather-fixtures";
import type { UnderpassFlood } from "@/entities/weather";

function flood(id: string, depthCm: number | null, verified = true): UnderpassFlood {
  const base = UNDERPASSES.find((u) => u.id === id)!;
  return { ...base, depthCm, verified };
}

describe("compute-detours", () => {
  it("returns all routes when no flooding", () => {
    const set = computeDetourSet(
      [flood("UP-1", 12), flood("UP-2", 5)],
      WALKWAY_GRAPH,
      DETOUR_ROUTES,
    );
    expect(set).toHaveLength(3);
    expect(set[0].id).toBe("ROUTE-A");
  });

  it("excludes a route when an edge's underpass floods at threshold", () => {
    // UP-4 is on ROUTE-A (edge E-09); 41cm >= 30cm threshold
    const set = computeDetourSet([flood("UP-4", 41)], WALKWAY_GRAPH, DETOUR_ROUTES);
    expect(set.some((r) => r.id === "ROUTE-A")).toBe(false);
    expect(set.map((r) => r.id)).toEqual(["ROUTE-B", "ROUTE-C"]);
  });

  it("excludes route B when its underpass floods (UP-3 on E-10)", () => {
    const set = computeDetourSet([flood("UP-3", 30)], WALKWAY_GRAPH, DETOUR_ROUTES);
    expect(set.some((r) => r.id === "ROUTE-B")).toBe(false);
  });

  it("keeps covered route C when both A and B are excluded", () => {
    const set = computeDetourSet(
      [flood("UP-3", 30), flood("UP-4", 41)],
      WALKWAY_GRAPH,
      DETOUR_ROUTES,
    );
    expect(set.map((r) => r.id)).toEqual(["ROUTE-C"]);
    const c = set[0];
    expect(c.edgeState).toMatchObject({
      "E-11": "covered",
      "E-12": "covered",
    });
  });

  it("ignores floods below the 30cm threshold", () => {
    const set = computeDetourSet(
      [flood("UP-4", 12), flood("UP-3", 25)],
      WALKWAY_GRAPH,
      DETOUR_ROUTES,
    );
    expect(set).toHaveLength(3);
  });

  it("returns empty set when no covered alternative exists", () => {
    // flood all three routes' critical underpasses
    const set = computeDetourSet(
      [flood("UP-4", 41), flood("UP-3", 30), flood("UP-2", 35), flood("UP-5", 41), flood("UP-6", 41)],
      WALKWAY_GRAPH,
      DETOUR_ROUTES,
    );
    expect(set).toHaveLength(0);
  });
});
