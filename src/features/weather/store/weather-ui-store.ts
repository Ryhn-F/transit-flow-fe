import { create } from "zustand";
import type {
  DetourRoute,
  FloodPhoto,
  RadarCell,
  UnderpassFlood,
  WeatherReading,
} from "@/entities/weather";

export type WeatherMode = "idle" | "auto" | "override";

interface WeatherSnapshot {
  reading: WeatherReading;
  cells: RadarCell[];
  floods: UnderpassFlood[];
  photos: FloodPhoto[];
}

interface WeatherUIState {
  rainOn: boolean;
  mode: WeatherMode;
  autoEnabled: boolean;
  bannerAcked: boolean;
  selectedFloodId: string | null;
  selectedRouteId: string | null;
  feedOpen: boolean;
  modalOpen: boolean;
  recoveryMessage: string | null;
  snapshot: WeatherSnapshot | null;
  detours: DetourRoute[];

  setRainOn: (on: boolean) => void;
  setMode: (mode: WeatherMode) => void;
  setAutoEnabled: (enabled: boolean) => void;
  setBannerAcked: (acked: boolean) => void;
  setSelectedFlood: (id: string | null) => void;
  setSelectedRoute: (id: string | null) => void;
  setFeedOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setRecoveryMessage: (msg: string | null) => void;
  setSnapshot: (snapshot: WeatherSnapshot) => void;
  setDetours: (detours: DetourRoute[]) => void;
  clearOverride: () => void;
}

export const useWeatherUIStore = create<WeatherUIState>((set) => ({
  rainOn: false,
  mode: "idle",
  autoEnabled: false,
  bannerAcked: false,
  selectedFloodId: null,
  selectedRouteId: null,
  feedOpen: false,
  modalOpen: false,
  recoveryMessage: null,
  snapshot: null,
  detours: [],

  setRainOn: (on) => set({ rainOn: on }),
  setMode: (mode) => set({ mode }),
  setAutoEnabled: (enabled) => set({ autoEnabled: enabled }),
  setBannerAcked: (acked) => set({ bannerAcked: acked }),
  setSelectedFlood: (id) => set({ selectedFloodId: id }),
  setSelectedRoute: (id) => set({ selectedRouteId: id }),
  setFeedOpen: (open) => set({ feedOpen: open }),
  setModalOpen: (open) => set({ modalOpen: open }),
  setRecoveryMessage: (msg) => set({ recoveryMessage: msg }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setDetours: (detours) => set({ detours }),
  clearOverride: () =>
    set({ mode: "idle", rainOn: false, recoveryMessage: null }),
}));
