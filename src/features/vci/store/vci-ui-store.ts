import { create } from "zustand";
import type { DeliveryChannel } from "@/entities/vci-metric";

export interface VciSelectedZone {
  channelId: string;
  lng: number;
  lat: number;
}

interface VCIUIState {
  selectedZone: VciSelectedZone | null;
  channelTab: DeliveryChannel;
  ackIds: string[];
  selectZone: (zone: VciSelectedZone | null) => void;
  setChannelTab: (tab: DeliveryChannel) => void;
  markAcked: (alertId: string) => void;
}

export const useVCIUIStore = create<VCIUIState>((set) => ({
  selectedZone: null,
  channelTab: "TELEGRAM",
  ackIds: [],
  selectZone: (zone) => set({ selectedZone: zone }),
  setChannelTab: (tab) => set({ channelTab: tab }),
  markAcked: (alertId) =>
    set((state) => ({
      ackIds: state.ackIds.includes(alertId) ? state.ackIds : [...state.ackIds, alertId],
    })),
}));
