import { describe, it, expect } from "vitest";
import {
  validateKioskPlacement,
  visibilityScore,
  revenueEstimateIdr,
  paybackMonths,
  kioskSquareFeature,
  MIN_CLEAR_WALKWAY_M,
} from "./constraints";
import { KIOSK_CORRIDORS } from "../fixtures/kiosk-fixtures";
import type { WalkwayCorridor } from "../types";

const corridor: WalkwayCorridor = {
  id: "KW-X",
  stationId: "ST-DUK",
  segment: [
    [106.827, -6.2086],
    [106.828, -6.2086],
  ],
};

describe("kiosk constraints", () => {
  it("passes a kiosk at exactly 2.5 m clearance", () => {
    const ok = validateKioskPlacement(
      { coordinates: [106.8275, -6.2086 + MIN_CLEAR_WALKWAY_M / 111_320], sizeM: 3 },
      [corridor],
    );
    expect(ok).toBeNull();
  });

  it("fails a kiosk inside the walkway corridor", () => {
    const bad = validateKioskPlacement(
      { coordinates: [106.8275, -6.2086], sizeM: 3 },
      [corridor],
    );
    expect(bad).not.toBeNull();
    expect(bad!.corridorId).toBe("KW-X");
  });

  it("checks all corridors and reports the first violation", () => {
    const v = validateKioskPlacement(
      { coordinates: [106.8272, -6.2084], sizeM: 3 },
      KIOSK_CORRIDORS,
    );
    expect(v).not.toBeNull();
  });

  it("computes visibility within 0-100", () => {
    expect(visibilityScore(60, 40, 1, 3)).toBeGreaterThanOrEqual(0);
    expect(visibilityScore(60, 40, 1, 3)).toBeLessThanOrEqual(100);
    expect(visibilityScore(100, 100, 2, 10)).toBe(100);
  });

  it("revenue scales with visibility and SES", () => {
    const low = revenueEstimateIdr(30, 0);
    const high = revenueEstimateIdr(90, 2);
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThan(30_000_000);
  });

  it("payback is bounded and sane", () => {
    expect(paybackMonths(45_000_000)).toBe(4);
    expect(paybackMonths(90_000_000)).toBe(3); // clamped to min 3
    expect(paybackMonths(90_000_000)).toBeGreaterThanOrEqual(3);
  });

  it("builds a 3x3m square feature", () => {
    const f = kioskSquareFeature({ id: "K1", coordinates: [106.8272, -6.2085], sizeM: 3 });
    expect(f.geometry.type).toBe("Polygon");
    const ring = (f.geometry as GeoJSON.Polygon).coordinates[0];
    expect(ring.length).toBe(5);
  });
});
