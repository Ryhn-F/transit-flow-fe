import type {
  DetourRoute,
  FloodPhoto,
  RadarCell,
  UnderpassFlood,
  WalkwayEdge,
} from "@/entities/weather";

export const WEATHER_SCHEDULE: Array<[number, number]> = [
  // [elapsedSeconds, rainfallMmHr] — deterministic monsoon ramp
  [0, 12],
  [60, 14],
  [120, 21],
  [180, 27],
  [240, 41],
  [300, 38],
  [390, 41],
  [540, 17],
  [600, 14],
];

export function rainfallAt(elapsedSec: number): number {
  const last = WEATHER_SCHEDULE[WEATHER_SCHEDULE.length - 1];
  if (elapsedSec >= last[0]) return last[1];
  if (elapsedSec <= WEATHER_SCHEDULE[0][0]) return WEATHER_SCHEDULE[0][1];
  for (let i = 0; i < WEATHER_SCHEDULE.length - 1; i++) {
    const [t1, r1] = WEATHER_SCHEDULE[i];
    const [t2, r2] = WEATHER_SCHEDULE[i + 1];
    if (elapsedSec >= t1 && elapsedSec <= t2) {
      const span = t2 - t1;
      const t = span === 0 ? 1 : (elapsedSec - t1) / span;
      return Math.round(r1 + (r2 - r1) * t);
    }
  }
  return last[1];
}

export function radarGrid(rainfallMmHr: number): RadarCell[] {
  const cells: RadarCell[] = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const dist = Math.hypot(x - 9.5, y - 9.5);
      const core = Math.max(0, 1 - dist / 12);
      const band = rainfallMmHr <= 0 ? 0 : Math.min(5, Math.floor(core * 5 * (rainfallMmHr / 41)) + (rainfallMmHr > 20 ? 1 : 0));
      cells.push({ x, y, intensity: band });
    }
  }
  return cells;
}

export const UNDERPASSES: UnderpassFlood[] = [
  { id: "UP-1", name: "Tanah Abang Underpass Gate A", lat: -6.1852, lng: 106.8106, depthCm: 25, confidence: 0.92, verified: true },
  { id: "UP-2", name: "Tanah Abang Underpass Gate B", lat: -6.1857, lng: 106.8113, depthCm: 12, confidence: 0.87, verified: true },
  { id: "UP-3", name: "Tanah Abang Underpass Gate C", lat: -6.1848, lng: 106.8119, depthCm: null, confidence: 0, verified: false },
  { id: "UP-4", name: "Tanah Abang Underpass Gate D", lat: -6.1861, lng: 106.8101, depthCm: null, confidence: 0, verified: false },
  { id: "UP-5", name: "Dukuh Atas Underpass", lat: -6.2086, lng: 106.8269, depthCm: null, confidence: 0, verified: false },
  { id: "UP-6", name: "Sudirman Underpass", lat: -6.2025, lng: 106.8232, depthCm: null, confidence: 0, verified: false },
];

export const WALKWAY_GRAPH: WalkwayEdge[] = [
  { id: "E-01", fromId: "NODE-TA", toId: "NODE-TAB", covered: false, underpassId: "UP-1" },
  { id: "E-02", fromId: "NODE-TA", toId: "NODE-TAC", covered: true, underpassId: null },
  { id: "E-03", fromId: "NODE-TAB", toId: "NODE-MID", covered: false, underpassId: "UP-2" },
  { id: "E-04", fromId: "NODE-TAC", toId: "NODE-MID", covered: true, underpassId: null },
  { id: "E-05", fromId: "NODE-MID", toId: "NODE-DUK", covered: false, underpassId: "UP-5" },
  { id: "E-06", fromId: "NODE-MID", toId: "NODE-DUKC", covered: true, underpassId: null },
  { id: "E-07", fromId: "NODE-DUK", toId: "NODE-SUD", covered: false, underpassId: "UP-6" },
  { id: "E-08", fromId: "NODE-DUKC", toId: "NODE-SUD", covered: true, underpassId: null },
  { id: "E-09", fromId: "NODE-TAB", toId: "NODE-TAD", covered: false, underpassId: "UP-4" },
  { id: "E-10", fromId: "NODE-TAD", toId: "NODE-MID", covered: false, underpassId: "UP-3" },
  { id: "E-11", fromId: "NODE-TA", toId: "NODE-TAE", covered: true, underpassId: null },
  { id: "E-12", fromId: "NODE-TAE", toId: "NODE-DUKC", covered: true, underpassId: null },
  { id: "E-13", fromId: "NODE-DUKC", toId: "NODE-DUK", covered: true, underpassId: null },
  { id: "E-14", fromId: "NODE-MID", toId: "NODE-SUDC", covered: true, underpassId: null },
  { id: "E-15", fromId: "NODE-TAD", toId: "NODE-MID", covered: false, underpassId: "UP-4" },
  { id: "E-16", fromId: "NODE-DUKC", toId: "NODE-SUD", covered: false, underpassId: "UP-6" },
];

export const DETOUR_ROUTES: Array<{
  id: string;
  originId: string;
  destId: string;
  edgeIds: string[];
  timeDeltaMin: number;
  coveredPct: number;
}> = [
  // Route A: fastest, exposed — vulnerable to flood #4 (UP-4 via E-15)
  { id: "ROUTE-A", originId: "NODE-TA", destId: "NODE-SUD", edgeIds: ["E-01", "E-09", "E-15", "E-05", "E-07"], timeDeltaMin: 1, coveredPct: 12 },
  // Route B: medium — vulnerable to flood #3 (UP-3 via E-10)
  { id: "ROUTE-B", originId: "NODE-TA", destId: "NODE-SUD", edgeIds: ["E-02", "E-10", "E-06", "E-08"], timeDeltaMin: 3, coveredPct: 78 },
  // Route C: mostly covered — survives floods #3/#4, vulnerable only to UP-6 (worst case)
  { id: "ROUTE-C", originId: "NODE-TA", destId: "NODE-SUD", edgeIds: ["E-11", "E-12", "E-13", "E-16"], timeDeltaMin: 5, coveredPct: 91 },
];

export const FLOOD_PHOTOS: FloodPhoto[] = [
  { id: "FP-1", underpassId: "UP-1", estDepthCm: 25, confidence: 0.92, source: "Field photo · Gem 3.6 Flash", capturedAt: 0 },
  { id: "FP-2", underpassId: "UP-2", estDepthCm: 12, confidence: 0.87, source: "Field photo · Gem 3.6 Flash", capturedAt: 0 },
  { id: "FP-3", underpassId: "UP-3", estDepthCm: 30, confidence: 0.94, source: "Field photo · Gem 3.6 Flash", capturedAt: 0 },
  { id: "FP-4", underpassId: "UP-4", estDepthCm: 41, confidence: 0.96, source: "Field photo · Gem 3.6 Flash", capturedAt: 0 },
];

export const COMMUTERS_REROUTED = 1240;

export const NODE_COORDS: Record<string, [number, number]> = {
  "NODE-TA": [106.8106, -6.1852],
  "NODE-TAB": [106.8113, -6.1857],
  "NODE-TAC": [106.8119, -6.1848],
  "NODE-TAD": [106.8101, -6.1861],
  "NODE-TAE": [106.8124, -6.1859],
  "NODE-MID": [106.8185, -6.1952],
  "NODE-DUK": [106.8272, -6.2088],
  "NODE-DUKC": [106.8262, -6.2072],
  "NODE-SUD": [106.8228, -6.2023],
  "NODE-SUDC": [106.8238, -6.2031],
};

export function edgeCoordinates(edgeIds: string[]): [number, number][] {
  const coords: [number, number][] = [];
  for (const edgeId of edgeIds) {
    const edge = WALKWAY_GRAPH.find((e) => e.id === edgeId);
    if (!edge) continue;
    const from = NODE_COORDS[edge.fromId];
    if (from && coords.length === 0) coords.push(from);
    const to = NODE_COORDS[edge.toId];
    if (to) coords.push(to);
  }
  return coords;
}
