import type { GeoJSONFeature } from "@/entities/geojson";
import type { LaneEdge, OjekZone, ExitBufferContext, StanchionLine } from "../types";

export const MIN_CLEAR_LANE_M = 2.0;

export interface LaneViolation {
  laneId: string;
  distanceM: number;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function distToSegmentM(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const M_PER_DEG_LAT = 111_320;
  const x = (p[0] - a[0]) * (M_PER_DEG_LAT * Math.cos((a[1] * Math.PI) / 180));
  const y = (p[1] - a[1]) * M_PER_DEG_LAT;
  const ax = (b[0] - a[0]) * (M_PER_DEG_LAT * Math.cos((a[1] * Math.PI) / 180));
  const ay = (b[1] - a[1]) * M_PER_DEG_LAT;
  const lenSq = ax * ax + ay * ay;
  if (lenSq === 0) return Math.hypot(x, y);
  const t = clamp(((x - 0) * ax + (y - 0) * ay) / lenSq, 0, 1);
  return Math.hypot(x - t * ax, y - t * ay);
}

function cross(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function segmentsIntersect(
  a1: [number, number],
  a2: [number, number],
  b1: [number, number],
  b2: [number, number],
): boolean {
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

export function lineToLineDistanceM(
  a1: [number, number],
  a2: [number, number],
  b1: [number, number],
  b2: [number, number],
): number {
  if (segmentsIntersect(a1, a2, b1, b2)) return 0;
  return Math.min(
    distToSegmentM(a1, b1, b2),
    distToSegmentM(a2, b1, b2),
    distToSegmentM(b1, a1, a2),
    distToSegmentM(b2, a1, a2),
  );
}

export function stanchionToLaneDistanceM(
  stanchion: { vertices: [number, number][] },
  lane: LaneEdge,
): number {
  let min = Infinity;
  for (let i = 0; i < stanchion.vertices.length - 1; i++) {
    const d = lineToLineDistanceM(
      stanchion.vertices[i],
      stanchion.vertices[i + 1],
      lane.segment[0],
      lane.segment[1],
    );
    min = Math.min(min, d);
  }
  return min;
}

export function validateClearLane(
  stanchion: { vertices: [number, number][] },
  laneEdges: LaneEdge[],
  minClearanceM = MIN_CLEAR_LANE_M,
): LaneViolation | null {
  for (const lane of laneEdges) {
    const d = stanchionToLaneDistanceM(stanchion, lane);
    if (d < minClearanceM) return { laneId: lane.id, distanceM: d };
  }
  return null;
}

export function nearestPointOnLine(
  p: [number, number],
  line: [number, number][],
): [number, number] {
  let best: [number, number] = p;
  let bestD = Infinity;
  const M_PER_DEG_LAT = 111_320;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const ax = (b[0] - a[0]) * (M_PER_DEG_LAT * Math.cos((a[1] * Math.PI) / 180));
    const ay = (b[1] - a[1]) * M_PER_DEG_LAT;
    const lenSq = ax * ax + ay * ay;
    if (lenSq === 0) continue;
    const dx = (p[0] - a[0]) * (M_PER_DEG_LAT * Math.cos((a[1] * Math.PI) / 180));
    const dy = (p[1] - a[1]) * M_PER_DEG_LAT;
    const t = clamp((dx * ax + dy * ay) / lenSq, 0, 1);
    const proj: [number, number] = [
      a[0] + (t * ax) / (M_PER_DEG_LAT * Math.cos((a[1] * Math.PI) / 180)),
      a[1] + (t * ay) / M_PER_DEG_LAT,
    ];
    const d = Math.hypot(dx - t * ax, dy - t * ay);
    if (d < bestD) {
      bestD = d;
      best = proj;
    }
  }
  return best;
}

export function snapZoneToCurb(
  coords: [number, number],
  curb: GeoJSON.LineString,
): [number, number] {
  const ring = curb.coordinates as [number, number][];
  if (ring.length < 2) return coords;
  const snapped = nearestPointOnLine(coords, ring);
  const M_PER_DEG_LAT = 111_320;
  const offsetM = 2.0;
  const latPerM = 1 / M_PER_DEG_LAT;
  const lngPerM = 1 / (M_PER_DEG_LAT * Math.cos((snapped[1] * Math.PI) / 180));
  return [snapped[0] + offsetM * lngPerM, snapped[1] + offsetM * latPerM];
}

export function isInsideStationBounds(
  coords: [number, number],
  stationCenter: [number, number],
  radiusM: number,
): boolean {
  return distToSegmentM(coords, stationCenter, stationCenter) <= radiusM;
}

export function computeVciDelta(
  barrier: { id: string; active: boolean },
  _exitContext: ExitBufferContext,
): number {
  if (!barrier.active) return 0;
  let seed = 0;
  for (const ch of barrier.id) seed = (seed * 31 + ch.charCodeAt(0)) % 1_000_000;
  return -(14 + (seed % 7)); // -14..-20, deterministic per barrier id
}

export function zoneFeature(
  zone: OjekZone,
): GeoJSONFeature<{ id: string; type: "ojek" }> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: zone.coordinates },
    properties: { id: zone.id, type: "ojek" },
  };
}

export function stanchionFeature(
  stanchion: StanchionLine,
): GeoJSONFeature<{ id: string; type: "stanchion" }> {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: stanchion.vertices },
    properties: { id: stanchion.id, type: "stanchion" },
  };
}

export function laneFeature(
  lane: LaneEdge,
): GeoJSONFeature<{ id: string; type: "lane" }> {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: lane.segment },
    properties: { id: lane.id, type: "lane" },
  };
}
