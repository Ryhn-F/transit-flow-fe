import type { CameraFeed, IotCounter } from "@/features/cctv/types";
import { stationName } from "@/infrastructure/mock/fixtures/stations";

export function seedCameras(): CameraFeed[] {
  const mk = (id: string, stationId: string, name: string, laneCount: number): CameraFeed => ({
    id,
    stationId,
    name,
    status: "STREAMING",
    laneCount,
    anonymized: true,
  });
  return [
    mk("CAM-01", "ST-DUK", "Dukuh Atas — Gate A", 2),
    mk("CAM-02", "ST-DUK", "Dukuh Atas — Gate B", 3),
    mk("CAM-03", "ST-DUK", "Dukuh Atas — Plaza", 2),
    mk("CAM-04", "ST-MGR", "Manggarai — Gate 1", 2),
    mk("CAM-05", "ST-MGR", "Manggarai — Gate 2", 3),
    mk("CAM-06", "ST-MGR", "Manggarai — Concourse", 4),
    mk("CAM-07", "ST-MGR", "Manggarai — East Wing", 2),
    mk("CAM-08", "ST-SUD", "Sudirman — Gate E", 2),
    mk("CAM-09", "ST-SUD", "Sudirman — Gate W", 2),
    mk("CAM-10", "ST-SUD", "Sudirman — B1 Tunnel", 1),
  ];
}

export function seedIotCounters(now: number): IotCounter[] {
  const mk = (id: string, stationId: string, delta: number): IotCounter => ({
    id,
    stationId,
    deltaPerTick: delta,
    lastHeartbeat: now,
    messageCount: 0,
    online: true,
  });
  return [
    mk("CTR-01", "ST-DUK", 12),
    mk("CTR-02", "ST-DUK", 9),
    mk("CTR-03", "ST-MGR", 15),
    mk("CTR-04", "ST-MGR", 11),
    mk("CTR-05", "ST-SUD", 7),
    mk("CTR-06", "ST-SUD", 13),
  ];
}

export function cameraStationLabel(camera: CameraFeed): string {
  return stationName(camera.stationId);
}

export function cameraStatusColor(status: CameraFeed["status"]): string {
  if (status === "STREAMING") return "text-emerald-400";
  if (status === "RECONNECTING") return "text-amber-400";
  return "text-rose-400";
}
