import type { KioskSite, WalkwayCorridor } from "../types";
import { distToSegmentM } from "@/features/buffer-allocator/lib/geometry-validation";

export const MIN_CLEAR_WALKWAY_M = 2.5;
export const KIOSK_SIZE_M = 3;

export interface WalkwayViolation {
  corridorId: string;
  distanceM: number;
}

export function kioskToCorridorDistanceM(
  kiosk: { coordinates: [number, number]; sizeM: number },
  corridor: WalkwayCorridor,
): number {
  return distToSegmentM(kiosk.coordinates, corridor.segment[0], corridor.segment[1]);
}

export function validateKioskPlacement(
  kiosk: { coordinates: [number, number]; sizeM: number },
  corridors: WalkwayCorridor[],
  minClearanceM = MIN_CLEAR_WALKWAY_M,
): WalkwayViolation | null {
  for (const corridor of corridors) {
    const d = kioskToCorridorDistanceM(kiosk, corridor);
    if (d < minClearanceM) return { corridorId: corridor.id, distanceM: d };
  }
  return null;
}

export function visibilityScore(
  baseTraffic: number,
  vciInverse: number,
  sesFactor: number,
  poiDensity: number,
): number {
  return Math.round(
    Math.min(100, Math.max(0, baseTraffic * 0.5 + vciInverse * 0.25 + sesFactor * 15 + poiDensity * 4)),
  );
}

export function revenueEstimateIdr(visibility: number, sesIndex: number): number {
  const base = 30_000_000 + visibility * 420_000;
  return Math.round(base * (0.8 + sesIndex * 0.2));
}

export function paybackMonths(monthlyRevenueIdr: number): number {
  const buildCost = 180_000_000;
  return Math.max(3, Math.round(buildCost / Math.max(1, monthlyRevenueIdr)));
}

export function kioskSquareFeature(
  kiosk: { id: string; coordinates: [number, number]; sizeM: number },
): GeoJSON.Feature {
  const M_PER_DEG_LAT = 111_320;
  const half = kiosk.sizeM / 2;
  const latPerM = 1 / M_PER_DEG_LAT;
  const lngPerM = 1 / (M_PER_DEG_LAT * Math.cos((kiosk.coordinates[1] * Math.PI) / 180));
  const [lng, lat] = kiosk.coordinates;
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng - half * lngPerM, lat - half * latPerM],
          [lng + half * lngPerM, lat - half * latPerM],
          [lng + half * lngPerM, lat + half * latPerM],
          [lng - half * lngPerM, lat + half * latPerM],
          [lng - half * lngPerM, lat - half * latPerM],
        ],
      ],
    },
    properties: { id: kiosk.id, type: "kiosk" },
  };
}
