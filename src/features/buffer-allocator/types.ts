export type EditorMode = "view" | "ojek" | "stanchion" | "select";

export interface OjekZone {
  id: string;
  stationId: string;
  coordinates: [number, number];
  radiusM: number;
  slotId: string | null;
}

export interface StanchionLine {
  id: string;
  stationId: string;
  name: string;
  vertices: [number, number][];
  expectedVciDelta: number;
  active: boolean;
}

export interface LaneEdge {
  id: string;
  stationId: string;
  exitChannelId: string;
  segment: [[number, number], [number, number]];
}

export interface ExitBufferContext {
  id: string;
  stationId: string;
  channelId: string;
  name: string;
  baselineVci: number;
  curbGeometry: GeoJSON.LineString;
  exitPosition: [number, number];
}

export interface OjekSlot {
  id: string;
  stationId: string;
  coordinates: [number, number];
  expiresAt: number;
  status: "SENT" | "ACK";
}

export interface BarrierToggleResult {
  barrierId: string;
  state: "ACTIVE" | "STANDBY";
  vciFrom: number;
  vciTo: number;
  throughputFrom: number;
  throughputTo: number;
}

export interface DispatchPlanExport {
  plan_id: string;
  issued_at: string;
  operator: string;
  slots: OjekSlot[];
  barriers: StanchionLine[];
  payload_bytes: number;
  webhook_payload: {
    slots: Array<{ id: string; coordinates: [number, number]; expires_at: string }>;
    barriers: Array<{ id: string; vertices: [number, number][]; active: boolean }>;
    plan_id: string;
    issued_at: string;
  };
}

export type BufferGeometryDraft =
  | { type: "ojek"; coords: [number, number]; radiusM: number }
  | { type: "stanchion"; vertices: [number, number][] };

export interface BufferZoneRepository {
  listActiveSlots(): Promise<OjekSlot[]>;
  listBarriers(): Promise<StanchionLine[]>;
  listExitContexts(): Promise<ExitBufferContext[]>;
  listLaneEdges(): Promise<LaneEdge[]>;
  placeOjekZone(
    draft: { coords: [number, number]; radiusM: number },
  ): Promise<OjekZone>;
  saveStanchion(stanchion: StanchionLine): Promise<StanchionLine>;
  toggleBarrier(id: string, state: "ACTIVE" | "STANDBY"): Promise<BarrierToggleResult>;
  exportDispatchPlan(): Promise<DispatchPlanExport>;
}
