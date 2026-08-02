import type { Dispatch, Incident, Warden, WardenStatus } from "../types";

export const SLA_TARGET_SEC = 15 * 60;

export type DispatchAction =
  | { type: "DISPATCH"; dispatch: Dispatch }
  | { type: "ADVANCE"; dispatchId: string; to: WardenStatus }
  | { type: "RESOLVE"; incidentId: string }
  | { type: "ACK"; dispatchId: string; slaNote: string };

export function dispatchReducer(
  dispatches: Dispatch[],
  action: DispatchAction,
): Dispatch[] {
  switch (action.type) {
    case "DISPATCH":
      return [action.dispatch, ...dispatches];
    case "ADVANCE":
      return dispatches.map((d) =>
        d.id === action.dispatchId ? { ...d, status: action.to } : d,
      );
    case "ACK":
      return dispatches.map((d) =>
        d.id === action.dispatchId ? { ...d, slaNote: action.slaNote } : d,
      );
    case "RESOLVE":
      return dispatches; // incidents resolved separately
    default:
      return dispatches;
  }
}

export function nearestWardens(
  incident: Incident,
  wardens: Warden[],
  count = 3,
): Warden[] {
  const M_PER_DEG_LAT = 111_320;
  return [...wardens]
    .filter((w) => w.status === "IDLE")
    .sort((a, b) => {
      const da = Math.hypot(
        (a.position[0] - incident.position[0]) * M_PER_DEG_LAT,
        (a.position[1] - incident.position[1]) * M_PER_DEG_LAT,
      );
      const db = Math.hypot(
        (b.position[0] - incident.position[0]) * M_PER_DEG_LAT,
        (b.position[1] - incident.position[1]) * M_PER_DEG_LAT,
      );
      return da - db;
    })
    .slice(0, count);
}

export function etaFor(warden: Warden, incident: Incident): number {
  const M_PER_DEG_LAT = 111_320;
  const d = Math.hypot(
    (warden.position[0] - incident.position[0]) * M_PER_DEG_LAT,
    (warden.position[1] - incident.position[1]) * M_PER_DEG_LAT,
  );
  return Math.max(60, Math.round((d / 40) * 60)); // 40 km/h travel speed
}

export function slaRemainingSec(dispatch: Dispatch, now: number): number {
  return Math.max(0, Math.round((dispatch.slaDeadline - now) / 1_000));
}
