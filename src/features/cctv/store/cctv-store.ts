import { create } from "zustand";
import type { CameraFeed, IotCounter, PipelineState } from "../types";
import { seedCameras, seedIotCounters } from "@/infrastructure/mock/fixtures/cctv-fixtures";
import { computePipeline } from "../lib/pipeline";

interface CCTVState {
  cameras: CameraFeed[];
  counters: IotCounter[];
  pipeline: PipelineState;
  focusCameraId: string | null;
  anonymize: boolean;
  startedAt: number;

  setCameras: (cameras: CameraFeed[]) => void;
  setCameraStatus: (id: string, status: CameraFeed["status"]) => void;
  toggleAnonymize: () => void;
  setFocus: (id: string | null) => void;
  tickCounter: (id: string, now: number) => void;
  recomputePipeline: () => void;
  killCamera: (id: string) => void;
  reviveCamera: (id: string) => void;
}

const STARTED_AT = Date.now();

export const useCCTVStore = create<CCTVState>((set, get) => ({
  cameras: seedCameras(),
  counters: seedIotCounters(STARTED_AT),
  pipeline: computePipeline(false, false, 0),
  focusCameraId: null,
  anonymize: true,
  startedAt: STARTED_AT,

  setCameras: (cameras) => set({ cameras }),
  setCameraStatus: (id, status) =>
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? { ...c, status } : c)),
    })),
  toggleAnonymize: () => set((s) => ({ anonymize: !s.anonymize })),
  setFocus: (focusCameraId) => set({ focusCameraId }),
  tickCounter: (id, now) =>
    set((s) => ({
      counters: s.counters.map((c) =>
        c.id === id
          ? { ...c, lastHeartbeat: now, messageCount: c.messageCount + 1 }
          : c,
      ),
    })),
  recomputePipeline: () => {
    const s = get();
    const cctvDown = s.cameras.some((c) => c.status === "OFFLINE");
    const cctvReconnecting = s.cameras.some((c) => c.status === "RECONNECTING");
    const iotOffline = s.counters.filter((c) => !c.online).length;
    set({ pipeline: computePipeline(cctvDown, cctvReconnecting, iotOffline) });
  },
  killCamera: (id) => {
    get().setCameraStatus(id, "RECONNECTING");
    get().recomputePipeline();
  },
  reviveCamera: (id) => {
    get().setCameraStatus(id, "STREAMING");
    get().recomputePipeline();
  },
}));
