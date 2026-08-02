export type CameraStatus = "STREAMING" | "RECONNECTING" | "OFFLINE";

export interface CameraFeed {
  id: string;
  stationId: string;
  name: string;
  status: CameraStatus;
  laneCount: number;
  anonymized: boolean;
}

export interface IotCounter {
  id: string;
  stationId: string;
  deltaPerTick: number;
  lastHeartbeat: number;
  messageCount: number;
  online: boolean;
}

export type PipelineSource = "CCTV" | "SURVEY";

export interface PipelineState {
  source: PipelineSource;
  stageCctv: "OK" | "DEGRADED" | "DOWN";
  stageIot: "OK" | "DEGRADED" | "DOWN";
  stageAi: "OK" | "DEGRADED";
}

export interface DetectedObject {
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

export interface SimFrame {
  pedestrians: DetectedObject[];
  inCount: number;
  outCount: number;
}
