import { describe, it, expect } from "vitest";
import { rainfallAt, radarGrid } from "@/infrastructure/mock/fixtures/weather-fixtures";
import {
  weatherReadingSchema,
  underpassFloodSchema,
  floodPhotoSchema,
  detourRouteSchema,
} from "./weather-schemas";
import { UNDERPASSES, FLOOD_PHOTOS, DETOUR_ROUTES } from "@/infrastructure/mock/fixtures/weather-fixtures";

describe("weather fixtures", () => {
  it("ramps rainfall deterministically across the schedule", () => {
    expect(rainfallAt(0)).toBe(12);
    expect(rainfallAt(120)).toBe(21);
    expect(rainfallAt(240)).toBe(41);
    expect(rainfallAt(600)).toBe(14);
    expect(rainfallAt(10_000)).toBe(14); // clamps to last waypoint
  });

  it("crosses the 20 mm/hr threshold between 60s and 120s", () => {
    expect(rainfallAt(60)).toBeLessThan(20);
    expect(rainfallAt(120)).toBeGreaterThanOrEqual(20);
  });

  it("generates a 20x20 radar grid with intensity bands", () => {
    const grid = radarGrid(41);
    expect(grid).toHaveLength(400);
    expect(grid.every((c) => c.intensity >= 0 && c.intensity <= 5)).toBe(true);
    expect(radarGrid(0).every((c) => c.intensity === 0)).toBe(true);
  });

  it("validates fixtures against zod schemas", () => {
    for (const u of UNDERPASSES) {
      expect(underpassFloodSchema.safeParse(u).success).toBe(true);
    }
    for (const p of FLOOD_PHOTOS) {
      expect(floodPhotoSchema.safeParse(p).success).toBe(true);
    }
    for (const r of DETOUR_ROUTES) {
      const computed = {
        ...r,
        edgeState: Object.fromEntries(r.edgeIds.map((id) => [id, "open" as const])),
      };
      expect(detourRouteSchema.safeParse(computed).success).toBe(true);
    }
    expect(weatherReadingSchema.safeParse({ rainfallMmHr: 25, source: "bmkg", capturedAt: 1 }).success).toBe(true);
    expect(weatherReadingSchema.safeParse({ rainfallMmHr: -1, source: "bmkg", capturedAt: 1 }).success).toBe(false);
    expect(underpassFloodSchema.safeParse({ ...UNDERPASSES[0], depthCm: 41, confidence: 1.5 }).success).toBe(false);
  });
});
