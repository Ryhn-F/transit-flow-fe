import type { PipelineState } from "../types";

export function computePipeline(
  cctvDown: boolean,
  cctvReconnecting: boolean,
  iotOfflineCount: number,
): PipelineState {
  const stageCctv = cctvDown ? "DOWN" : cctvReconnecting ? "DEGRADED" : "OK";
  const stageIot = iotOfflineCount >= 3 ? "DOWN" : iotOfflineCount > 0 ? "DEGRADED" : "OK";
  return {
    source: cctvDown ? "SURVEY" : "CCTV",
    stageCctv,
    stageIot,
    stageAi: cctvDown || iotOfflineCount > 0 ? "DEGRADED" : "OK",
  };
}

export function pipelineLabel(p: PipelineState): string {
  if (p.source === "SURVEY") return "fallback: field survey data";
  return "source: CCTV + IoT";
}
