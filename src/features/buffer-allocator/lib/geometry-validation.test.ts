import { describe, it, expect } from "vitest";
import {
  distToSegmentM,
  lineToLineDistanceM,
  validateClearLane,
  nearestPointOnLine,
  snapZoneToCurb,
  computeVciDelta,
} from "./geometry-validation";
import type { LaneEdge } from "../types";

const LANE_OK: LaneEdge = {
  id: "lane-ok",
  stationId: "ST-DUK",
  exitChannelId: "DUK-GB",
  segment: [
    [106.827, -6.2086],
    [106.828, -6.2086],
  ],
};

function laneAt(offsetM: number, id: string): LaneEdge {
  return {
    ...LANE_OK,
    id,
    segment: [
      [106.827, -6.2086 + offsetM / 111_320],
      [106.828, -6.2086 + offsetM / 111_320],
    ],
  };
}

function stanchionAt(offsetM: number): { vertices: [number, number][] } {
  return {
    vertices: [
      [106.827, -6.2086 + offsetM / 111_320],
      [106.828, -6.2086 + offsetM / 111_320],
    ],
  };
}

describe("geometry-validation", () => {
  it("computes point-to-segment distance in meters", () => {
    const d = distToSegmentM([106.8275, -6.20855], [106.827, -6.2086], [106.828, -6.2086]);
    expect(Math.abs(d - 5.5)).toBeLessThan(0.2);
  });

  it("line-to-line distance is zero on intersection", () => {
    const d = lineToLineDistanceM(
      [106.8275, -6.2086],
      [106.8275, -6.2087],
      [106.827, -6.20865],
      [106.828, -6.20865],
    );
    expect(d).toBe(0);
  });

  it("passes a stanchion at exactly 2.0 m clearance", () => {
    const lane = laneAt(0, "lane-a");
    expect(validateClearLane(stanchionAt(2.0), [lane])).toBeNull();
  });

  it("fails a stanchion at 1.4 m clearance", () => {
    const lane = laneAt(0, "lane-a");
    const violation = validateClearLane(stanchionAt(1.4), [lane]);
    expect(violation).not.toBeNull();
    expect(violation!.distanceM).toBeLessThan(2.0);
  });

  it("reports the violating lane id", () => {
    const violation = validateClearLane(stanchionAt(1.0), [laneAt(3.0, "lane-0"), laneAt(1.0, "lane-1")]);
    expect(violation?.laneId).toBe("lane-1");
  });

  it("nearest point on line projects correctly", () => {
    const p = nearestPointOnLine([106.8275, -6.2085], [[106.827, -6.2086], [106.828, -6.2086]]);
    expect(Math.abs(p[1] - -6.2086)).toBeLessThan(1e-6);
    expect(Math.abs(p[0] - 106.8275)).toBeLessThan(1e-6);
  });

  it("snaps a zone to the curb with a 2 m offset", () => {
    const snapped = snapZoneToCurb([106.8275, -6.2085], {
      type: "LineString",
      coordinates: [[106.827, -6.2086], [106.828, -6.2086]],
    });
    expect(snapped[1]).toBeGreaterThan(-6.2086);
  });

  it("computes a deterministic negative VCI delta for active barriers", () => {
    const ctx = {
      id: "exit-dukuhatas-gate-b",
      stationId: "ST-DUK",
      channelId: "DUK-GB",
      name: "Dukuh Atas Gate B",
      baselineVci: 88,
      curbGeometry: { type: "LineString" as const, coordinates: [] as [number, number][] },
      exitPosition: [106.8276, -6.2086] as [number, number],
    };
    const d1 = computeVciDelta({ id: "gate-a-queue-line", active: true }, ctx);
    const d2 = computeVciDelta({ id: "gate-a-queue-line", active: true }, ctx);
    expect(d1).toBeLessThan(0);
    expect(d1).toBeGreaterThanOrEqual(-20);
    expect(d1).toBe(d2);
    expect(computeVciDelta({ id: "x", active: false }, ctx)).toBe(0);
  });
});
