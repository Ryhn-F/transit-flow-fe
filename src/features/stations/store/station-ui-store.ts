import { create } from "zustand";

interface LayerToggles {
  crowdDensity: boolean;
  exitGates: boolean;
  temporaryBufferZone: boolean;
  aiRecommendations: boolean;
}

interface FlyToTarget {
  lng: number;
  lat: number;
  stationId: string;
}

interface StationUIState {
  searchQuery: string;
  selectedStationId: string | null;
  flyToTarget: FlyToTarget | null;
  layers: LayerToggles;
  setSearchQuery: (q: string) => void;
  selectStation: (id: string | null) => void;
  flyToStation: (target: FlyToTarget) => void;
  clearFlyTo: () => void;
  toggleLayer: (layer: keyof LayerToggles) => void;
}

export const useStationUIStore = create<StationUIState>((set) => ({
  searchQuery: "",
  selectedStationId: null,
  flyToTarget: null,
  layers: {
    crowdDensity: true,
    exitGates: true,
    temporaryBufferZone: false,
    aiRecommendations: false,
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectStation: (id) => set({ selectedStationId: id }),
  flyToStation: (target) =>
    set({ flyToTarget: target, selectedStationId: target.stationId }),
  clearFlyTo: () => set({ flyToTarget: null }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
}));
