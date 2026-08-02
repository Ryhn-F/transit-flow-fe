import type { ApiEndpoint, HealthCheck, SignalState, AdapterLogEntry } from "../types";
import { VCI_CHANNEL_SEEDS } from "@/infrastructure/mock/fixtures/vci-fixtures";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";
import { stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "hubs",
    method: "GET",
    path: "/api/v1/hubs",
    description: "List all transit hubs with current VCI status",
    exampleParams: [{ key: "format", value: "geojson" }],
  },
  {
    id: "exit-status",
    method: "GET",
    path: "/api/v1/hubs/{id}/exit-status",
    description: "Live exit-choke status for a hub (Grab/Gojek/Moovit integration)",
    exampleParams: [
      { key: "id", value: "dukuh-atas" },
      { key: "exit", value: "B" },
    ],
  },
  {
    id: "buffer-zones",
    method: "GET",
    path: "/api/v1/buffer-zones/active",
    description: "Active ojek buffer zones (15-min slots)",
    exampleParams: [{ key: "city", value: "jakarta" }],
  },
  {
    id: "forecasts",
    method: "GET",
    path: "/api/v1/forecasts",
    description: "48h VCI forecast series per exit",
    exampleParams: [
      { key: "exitId", value: "SUD-E" },
      { key: "horizon", value: "48" },
    ],
  },
];

export function exitStatusGeoJson(exitId: string) {
  const seed = VCI_CHANNEL_SEEDS.find((s) => s.channel_id === exitId);
  const coords = hubExitCoords(exitId);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: coords },
        properties: {
          channel_id: exitId,
          station: stationName(stationOfChannel(exitId)),
          channel: channelName(exitId),
          vci: seed?.base ?? 50,
          status: (seed?.base ?? 50) >= 80 ? "CHOKE_RISK" : (seed?.base ?? 50) >= 50 ? "WARNING" : "NOMINAL",
        },
      },
    ],
  };
}

export function hubExitCoords(exitId: string): [number, number] {
  const coords: Record<string, [number, number]> = {
    "DUK-GA": [106.827, -6.209],
    "DUK-GB": [106.8276, -6.2086],
    "DUK-GC": [106.8268, -6.2084],
    "MGR-01": [106.8498, -6.2095],
    "MGR-02": [106.8494, -6.21],
    "SUD-E": [106.823, -6.2025],
    "SUD-W": [106.8225, -6.202],
  };
  return coords[exitId] ?? [106.8272, -6.2088];
}

export const SIGNALS: SignalState[] = [
  { id: "SIG-01", intersection: "Dukuh Atas — Sudirman Rd", greenExtended: false, vciScore: 62, lastTriggerAt: null },
  { id: "SIG-02", intersection: "Dukuh Atas — Satrio", greenExtended: false, vciScore: 87, lastTriggerAt: null },
  { id: "SIG-03", intersection: "Manggarai — Jakarta Timur", greenExtended: false, vciScore: 55, lastTriggerAt: null },
  { id: "SIG-04", intersection: "Manggarai — Matraman", greenExtended: false, vciScore: 71, lastTriggerAt: null },
  { id: "SIG-05", intersection: "Sudirman — Bendungan", greenExtended: false, vciScore: 83, lastTriggerAt: null },
  { id: "SIG-06", intersection: "Sudirman — Senayan", greenExtended: false, vciScore: 48, lastTriggerAt: null },
];

export const SIGNAL_TRIGGER_THRESHOLD = 85;
export const SIGNAL_EXTENSION_SEC = 8;

export function seedAdapterLog(now: number): AdapterLogEntry[] {
  return [
    { id: "LOG-1", text: "SIG-05: VCI 83 < 85 — no extension", ts: now - 240_000 },
    { id: "LOG-2", text: "SIG-02: VCI 84 < 85 — no extension", ts: now - 120_000 },
    { id: "LOG-3", text: "NTCIP 1202 adapter online · 6 intersections", ts: now - 60_000 },
  ];
}

export const HEALTH_CHECKS: HealthCheck[] = [
  { id: "redis", label: "Upstash Redis", status: "OK" },
  { id: "ai", label: "Sini AI pipeline", status: "OK" },
  { id: "cctv", label: "CCTV ingest", status: "DEGRADED" },
  { id: "mqtt", label: "MQTT broker", status: "OK" },
  { id: "webhook", label: "MAPID webhook", status: "OK" },
];

export function latencySeries(points: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    let seed = 0;
    for (const ch of String(i * 7 + 2)) seed = (seed * 13 + ch.charCodeAt(0)) % 97;
    out.push(28 + (seed % 24)); // 28..51 ms
  }
  return out;
}

export function uptimeSeries(points: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    let seed = 0;
    for (const ch of String(i * 3 + 1)) seed = (seed * 11 + ch.charCodeAt(0)) % 89;
    out.push(seed % 17 === 0 ? 99.9 : 99.99 + (seed % 5) * 0.002);
  }
  return out;
}
