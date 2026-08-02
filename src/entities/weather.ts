export interface WeatherReading {
  rainfallMmHr: number;
  source: "bmkg" | "owm";
  capturedAt: number;
}

export interface RadarCell {
  x: number;
  y: number;
  intensity: number; // 0-5
}

export interface UnderpassFlood {
  id: string;
  name: string;
  lat: number;
  lng: number;
  depthCm: number | null;
  confidence: number;
  verified: boolean;
}

export interface FloodPhoto {
  id: string;
  underpassId: string;
  estDepthCm: number;
  confidence: number;
  source: string;
  capturedAt: number;
}

export interface WalkwayEdge {
  id: string;
  fromId: string;
  toId: string;
  covered: boolean;
  underpassId: string | null;
}

export type EdgeState = "open" | "covered" | "flooded";

export interface DetourRoute {
  id: string;
  originId: string;
  destId: string;
  edgeIds: string[];
  timeDeltaMin: number;
  coveredPct: number;
  edgeState: Record<string, EdgeState>;
}

export const RAIN_THRESHOLD_MMHR = 20;
export const FLOOD_DEPTH_THRESHOLD_CM = 30;
