import { describe, it, expect } from "vitest";
import { computeSafePath, doorDeltas, nearestHub, hubDistanceKm } from "./safe-path";
import { COMMUTER_HUBS, GPS_FIXTURE } from "../fixtures/portal-fixtures";
import type { CommuterDoor } from "../fixtures/portal-fixtures";

function doors(...vcIs: number[]): CommuterDoor[] {
  return vcIs.map((vci, i) => ({
    id: `d${i}`,
    label: String.fromCharCode(65 + i),
    vci,
    flowPerMin: 40 - i * 5,
    isCovered: i === 2,
    escalatorOk: true,
  }));
}

describe("safe-path", () => {
  it("recommends the lowest-VCI door", () => {
    const result = computeSafePath(doors(60, 44, 80, 51));
    expect(result.recommended.label).toBe("B");
  });

  it("computes clearerPct deltas ranked best to worst", () => {
    const result = computeSafePath(doors(50, 80));
    expect(result.deltas).toHaveLength(2);
    expect(result.deltas[0].door.label).toBe("A");
    expect(result.deltas[1].clearerPct).toBeGreaterThan(0);
  });

  it("flags allEqual when doors are within 2 VCI points", () => {
    expect(computeSafePath(doors(51, 52)).allEqual).toBe(true);
    expect(computeSafePath(doors(40, 60)).allEqual).toBe(false);
  });

  it("excludes broken escalators from eligibility", () => {
    const pool = doors(30, 45, 70).map((d, i) => ({
      ...d,
      escalatorOk: i !== 0, // door A broken
    }));
    const result = computeSafePath(pool);
    expect(result.recommended.label).toBe("B");
  });

  it("is deterministic", () => {
    const a = computeSafePath(doors(66, 24, 55));
    const b = computeSafePath(doors(66, 24, 55));
    expect(a.recommended).toEqual(b.recommended);
    expect(doorDeltas(doors(66, 24, 55))[0].door.id).toBe("d1");
  });
});

describe("nearest-hub", () => {
  it("resolves the GPS fixture to Manggarai within 5 km", () => {
    const hit = nearestHub(GPS_FIXTURE, COMMUTER_HUBS);
    expect(hit?.hubId).toBe("manggarai");
    expect(hit!.distanceKm).toBeLessThan(1);
  });

  it("returns null when no hub is within 5 km", () => {
    const hit = nearestHub({ lat: -8.5, lng: 115.2 }, COMMUTER_HUBS);
    expect(hit).toBeNull();
  });

  it("computes a sane distance in km", () => {
    const d = hubDistanceKm(GPS_FIXTURE, COMMUTER_HUBS[0].position);
    expect(d).toBeGreaterThan(0.1);
    expect(d).toBeLessThan(1);
  });
});
