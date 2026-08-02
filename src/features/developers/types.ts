export interface ApiEndpoint {
  id: string;
  method: "GET";
  path: string;
  description: string;
  exampleParams: Array<{ key: string; value: string }>;
}

export interface ApiKeyInfo {
  key: string;
  requestsUsed: number;
  quotaPerMinute: number;
}

export interface SignalState {
  id: string;
  intersection: string;
  greenExtended: boolean;
  vciScore: number;
  lastTriggerAt: number | null;
}

export interface AdapterLogEntry {
  id: string;
  text: string;
  ts: number;
}

export interface HealthCheck {
  id: string;
  label: string;
  status: "OK" | "DEGRADED" | "DOWN";
}

export interface SdkCall {
  id: string;
  code: string;
  result: string;
  ts: number;
}
