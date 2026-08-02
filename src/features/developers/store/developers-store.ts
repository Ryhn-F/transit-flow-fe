import { create } from "zustand";
import type { AdapterLogEntry, ApiKeyInfo, SdkCall, SignalState } from "../types";
import { SIGNALS, seedAdapterLog } from "../fixtures/dev-fixtures";

interface DevelopersState {
  key: ApiKeyInfo;
  calls: SdkCall[];
  signals: SignalState[];
  adapterLog: AdapterLogEntry[];
  selectedEndpointId: string;
  startedAt: number;

  consumeQuota: () => void;
  addCall: (code: string, result: string) => void;
  setSelectedEndpoint: (id: string) => void;
  triggerSignal: (id: string) => void;
  addLog: (text: string) => void;
  refreshVciScores: () => void;
}

const STARTED_AT = Date.now();

export const useDevelopersStore = create<DevelopersState>((set, get) => ({
  key: { key: "tf_live_xxxxxxxxxxxx", requestsUsed: 0, quotaPerMinute: 60 },
  calls: [],
  signals: SIGNALS.map((s) => ({ ...s })),
  adapterLog: seedAdapterLog(STARTED_AT),
  selectedEndpointId: "exit-status",
  startedAt: STARTED_AT,

  consumeQuota: () =>
    set((s) => ({ key: { ...s.key, requestsUsed: s.key.requestsUsed + 1 } })),
  addCall: (code, result) =>
    set((s) => ({
      calls: [{ id: `CALL-${Date.now()}`, code, result, ts: Date.now() }, ...s.calls].slice(0, 20),
    })),
  setSelectedEndpoint: (selectedEndpointId) => set({ selectedEndpointId }),
  triggerSignal: (id) =>
    set((s) => ({
      signals: s.signals.map((sig) =>
        sig.id === id
          ? { ...sig, greenExtended: true, lastTriggerAt: Date.now() }
          : sig,
      ),
    })),
  addLog: (text) =>
    set((s) => ({
      adapterLog: [{ id: `LOG-${Date.now()}`, text, ts: Date.now() }, ...s.adapterLog].slice(0, 30),
    })),
  refreshVciScores: () =>
    set((s) => ({
      signals: s.signals.map((sig, i) => ({
        ...sig,
        vciScore: Math.max(40, Math.min(95, sig.vciScore + ((i * 7 + Date.now()) % 5) - 2)),
      })),
    })),
}));
