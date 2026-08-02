import type {
  ExitBufferContext,
  LaneEdge,
  OjekSlot,
  StanchionLine,
} from "@/features/buffer-allocator/types";
import { stationOfChannel } from "./vci-fixtures";
import { stationName, channelName } from "./stations";
import { VCI_CHANNEL_COORDS } from "./vci-fixtures";

const DUK = [-6.2088, 106.8272] as const;
const MGR = [-6.2097, 106.8496] as const;

function curbLine(
  channelId: string,
  dir: number,
): GeoJSON.LineString {
  const [lng, lat] = VCI_CHANNEL_COORDS[channelId];
  const dLng = 0.0006 * dir;
  const dLat = 0.00035;
  return {
    type: "LineString",
    coordinates: [
      [lng - dLng, lat + dLat],
      [lng, lat + dLat * 0.4],
      [lng + dLng, lat + dLat],
    ],
  };
}

export const BUFFER_EXIT_CONTEXTS: ExitBufferContext[] = [
  { id: "exit-dukuhatas-gate-a", stationId: "ST-DUK", channelId: "DUK-GA", name: "Dukuh Atas Gate A", baselineVci: 44, curbGeometry: curbLine("DUK-GA", -1), exitPosition: VCI_CHANNEL_COORDS["DUK-GA"] },
  { id: "exit-dukuhatas-gate-b", stationId: "ST-DUK", channelId: "DUK-GB", name: "Dukuh Atas Gate B", baselineVci: 88, curbGeometry: curbLine("DUK-GB", 1), exitPosition: VCI_CHANNEL_COORDS["DUK-GB"] },
  { id: "exit-dukuhatas-gate-c", stationId: "ST-DUK", channelId: "DUK-GC", name: "Dukuh Atas Gate C", baselineVci: 36, curbGeometry: curbLine("DUK-GC", -1), exitPosition: VCI_CHANNEL_COORDS["DUK-GC"] },
  { id: "exit-manggarai-gate-1", stationId: "ST-MGR", channelId: "MGR-01", name: "Manggarai Gate 1", baselineVci: 55, curbGeometry: curbLine("MGR-01", 1), exitPosition: VCI_CHANNEL_COORDS["MGR-01"] },
  { id: "exit-manggarai-gate-2", stationId: "ST-MGR", channelId: "MGR-02", name: "Manggarai Gate 2", baselineVci: 74, curbGeometry: curbLine("MGR-02", -1), exitPosition: VCI_CHANNEL_COORDS["MGR-02"] },
  { id: "exit-sudirman-gate-e", stationId: "ST-SUD", channelId: "SUD-E", name: "Sudirman Gate E", baselineVci: 86, curbGeometry: curbLine("SUD-E", 1), exitPosition: VCI_CHANNEL_COORDS["SUD-E"] },
];

const LANE_OFFSETS: Array<[number, number]> = [
  [0.0003, 0.00012],
  [-0.0003, 0.0001],
  [0.00015, 0.00028],
  [-0.00015, 0.00026],
];

export const BUFFER_LANE_EDGES: LaneEdge[] = BUFFER_EXIT_CONTEXTS.flatMap((ctx) => {
  const [lng, lat] = ctx.exitPosition;
  return LANE_OFFSETS.map(([dlng, dlat], j) => ({
    id: `lane-${ctx.channelId.toLowerCase()}-${j + 1}`,
    stationId: ctx.stationId,
    exitChannelId: ctx.channelId,
    segment: [
      [lng + dlng * 0.5, lat + dlat * 0.5],
      [lng - dlng * 0.5, lat - dlat * 0.5],
    ] as [[number, number], [number, number]],
  }));
});

function offsetSlot(
  channelId: string,
  dir: number,
): [number, number] {
  const [lng, lat] = VCI_CHANNEL_COORDS[channelId];
  return [lng + dir * 0.0012, lat + dir * 0.0008];
}

export function seededOjekSlots(now: number): OjekSlot[] {
  const mk = (
    id: string,
    channelId: string,
    dir: number,
    expiresInSec: number,
    status: "SENT" | "ACK",
  ): OjekSlot => ({
    id,
    stationId: stationOfChannel(channelId),
    coordinates: offsetSlot(channelId, dir),
    expiresAt: now + expiresInSec * 1_000,
    status,
  });

  return [
    mk("OJ-101", "DUK-GB", 1, 720, "ACK"),
    mk("OJ-102", "DUK-GA", -1, 540, "ACK"),
    mk("OJ-103", "MGR-01", 1, 390, "SENT"),
    mk("OJ-104", "DUK-GC", -1, 120, "ACK"),
    mk("OJ-105", "MGR-02", -1, 660, "SENT"),
    mk("OJ-106", "SUD-E", 1, 300, "ACK"),
  ];
}

export const BUFFER_STANCHION_PRESETS: Array<Omit<StanchionLine, "active">> = [
  {
    id: "gate-a-queue-line",
    stationId: "ST-DUK",
    name: "Gate A Queue Line",
    expectedVciDelta: -17,
    vertices: [
      [106.8267, -6.20895],
      [106.82695, -6.20878],
    ],
  },
  {
    id: "east-wing-channel",
    stationId: "ST-DUK",
    name: "East Wing Channel",
    expectedVciDelta: -14,
    vertices: [
      [106.8274, -6.20862],
      [106.82765, -6.20842],
    ],
  },
];

export const SLOT_DURATION_SEC = 15 * 60;

export const EAST_WING_SLOT_OFFSET: [number, number] = [0.0006, -0.0004];

export function stationCenter(stationId: string): [number, number] {
  if (stationId === "ST-DUK") return [DUK[1], DUK[0]];
  if (stationId === "ST-MGR") return [MGR[1], MGR[0]];
  return [106.823, -6.2023];
}

export function contextLabel(ctx: ExitBufferContext): string {
  return `${stationName(ctx.stationId)} ${channelName(ctx.channelId)}`;
}
