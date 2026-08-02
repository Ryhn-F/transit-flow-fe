import { create } from "zustand";
import type { ChannelDelivery, VCIAlert, VCISnapshot } from "@/entities/vci-metric";

interface VCILiveState {
  snapshot: VCISnapshot | null;
  alerts: VCIAlert[];
  deliveries: ChannelDelivery[];
  countdownSec: number;
  recalculating: boolean;
  setSnapshot: (snapshot: VCISnapshot) => void;
  setAlerts: (alerts: VCIAlert[]) => void;
  setDeliveries: (deliveries: ChannelDelivery[]) => void;
  setCountdown: (countdownSec: number, recalculating: boolean) => void;
  applyAck: (alert: VCIAlert) => void;
}

export const useVCILiveStore = create<VCILiveState>((set) => ({
  snapshot: null,
  alerts: [],
  deliveries: [],
  countdownSec: 60,
  recalculating: false,
  setSnapshot: (snapshot) => set({ snapshot }),
  setAlerts: (alerts) => set({ alerts }),
  setDeliveries: (deliveries) => set({ deliveries }),
  setCountdown: (countdownSec, recalculating) => set({ countdownSec, recalculating }),
  applyAck: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.alert_id === alert.alert_id ? alert : a)),
    })),
}));
