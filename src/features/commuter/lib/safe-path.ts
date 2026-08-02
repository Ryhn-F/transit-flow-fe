import type { CommuterDoor } from "../fixtures/portal-fixtures";

export interface DoorDelta {
  door: CommuterDoor;
  clearerPct: number;
}

export interface SafePathResult {
  recommended: CommuterDoor;
  deltas: DoorDelta[]; // ranked best → worst
  allEqual: boolean;
}

function distanceKm(a: number, b: number): number {
  return Math.abs(a - b);
}

export function computeSafePath(doors: CommuterDoor[]): SafePathResult {
  const eligible = doors.filter((d) => d.escalatorOk);
  const pool = eligible.length > 0 ? eligible : doors;
  const sorted = [...pool].sort(
    (a, b) => a.vci - b.vci || b.flowPerMin - a.flowPerMin,
  );
  const best = sorted[0];

  if (sorted.length <= 1) {
    return { recommended: best, deltas: [], allEqual: true };
  }

  const second = sorted[1];
  const deltas: DoorDelta[] = sorted.map((door, i) => ({
    door,
    clearerPct:
      i === 0
        ? 0
        : Math.max(
            1,
            Math.round(((door.vci - best.vci) / Math.max(1, best.vci)) * 100),
          ),
  }));

  const spread = Math.max(...sorted.map((d) => d.vci)) - Math.min(...sorted.map((d) => d.vci));
  return {
    recommended: best,
    deltas,
    allEqual: spread <= 2,
  };
}

export function doorDeltas(doors: CommuterDoor[]): DoorDelta[] {
  return computeSafePath(doors).deltas;
}

export function hubDistanceKm(fixture: { lat: number; lng: number }, hub: { lat: number; lng: number }): number {
  const dLat = distanceKm(fixture.lat, hub.lat) * 111.32;
  const dLng = distanceKm(fixture.lng, hub.lng) * 111.32 * Math.cos((hub.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function nearestHub(
  position: { lat: number; lng: number },
  hubs: Array<{ id: string; nameId: string; nameEn: string; position: { lat: number; lng: number }; doors: CommuterDoor[]; walkwayMinutes: Record<string, number> }>,
): { hubId: string; distanceKm: number } | null {
  let best: { hubId: string; distanceKm: number } | null = null;
  for (const hub of hubs) {
    const d = hubDistanceKm(position, hub.position);
    if (d <= 5 && (best == null || d < best.distanceKm)) {
      best = { hubId: hub.id, distanceKm: d };
    }
  }
  return best;
}
