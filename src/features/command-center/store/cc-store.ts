import { create } from "zustand";
import type {
  Agency,
  Dispatch,
  Incident,
  IncidentTickerItem,
  Warden,
} from "../types";
import { CC_WARDENS, seedDispatches, seedIncidents } from "../fixtures/cc-fixtures";
import { dispatchReducer } from "../lib/dispatch-machine";
import { toast } from "sonner";

const SYNC_CHANNEL = "transitflow.cc.sync.v1";
const CC_STARTED_AT = Date.now();

interface CCState {
  agency: Agency;
  wardens: Warden[];
  incidents: Incident[];
  dispatches: Dispatch[];
  ticker: IncidentTickerItem[];
  selectedIncidentId: string | null;
  startedAt: number;
  incidentCounter: number;
  screenLabel: string;

  setAgency: (agency: Agency) => void;
  selectIncident: (id: string | null) => void;
  dispatch: (incidentId: string, wardenId: string) => void;
  advanceWarden: (wardenId: string, to: Warden["status"]) => void;
  addIncident: (incident: Incident) => void;
  resolveIncident: (id: string) => void;
  pushTicker: (text: string) => void;
  setScreenLabel: (label: string) => void;
  syncNow: () => void;
  emitSync: (msg: object) => void;
}

let broadcast: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcast = new BroadcastChannel(SYNC_CHANNEL);
}

export const useCCStore = create<CCState>((set, get) => ({
  agency: "DISHUB",
  wardens: CC_WARDENS.map((w) => ({ ...w })),
  incidents: seedIncidents(Date.now()),
  dispatches: seedDispatches(Date.now()),
  ticker: [],
  selectedIncidentId: null,
  startedAt: CC_STARTED_AT,
  incidentCounter: 900,
  screenLabel: "A",

  setAgency: (agency) => set({ agency }),
  selectIncident: (selectedIncidentId) => set({ selectedIncidentId }),
  dispatch: (incidentId, wardenId) => {
    const state = get();
    const incident = state.incidents.find((i) => i.id === incidentId);
    const warden = state.wardens.find((w) => w.id === wardenId);
    if (!incident || !warden) return;

    const dispatch: Dispatch = {
      id: `DS-${state.incidentCounter + 10}`,
      incidentId,
      wardenId,
      status: "EN-ROUTE",
      dispatchedAt: Date.now(),
      slaDeadline: Date.now() + 15 * 60_000,
      slaNote: null,
    };
    set((s) => ({
      dispatches: dispatchReducer(s.dispatches, { type: "DISPATCH", dispatch }),
      wardens: s.wardens.map((w) => (w.id === wardenId ? { ...w, status: "EN-ROUTE" } : w)),
      ticker: [
        { id: `TK-${Date.now()}`, text: `Dispatch ${dispatch.id} → ${warden.name} (${incident.stationName})`, ts: Date.now() },
        ...s.ticker,
      ],
    }));
    toast.success(`Warden ${warden.name} dispatched to ${incident.stationName}`);
    get().emitSync({ type: "DISPATCH", dispatchId: dispatch.id });
  },
  advanceWarden: (wardenId, to) => {
    set((s) => ({
      wardens: s.wardens.map((w) => (w.id === wardenId ? { ...w, status: to } : w)),
      dispatches: s.dispatches.map((d) =>
        d.wardenId === wardenId ? { ...d, status: to } : d,
      ),
    }));
  },
  addIncident: (incident) =>
    set((s) => ({ incidents: [incident, ...s.incidents] })),
  resolveIncident: (id) =>
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === id ? { ...i, resolved: true } : i)),
    })),
  pushTicker: (text) =>
    set((s) => ({
      ticker: [{ id: `TK-${Date.now()}`, text, ts: Date.now() }, ...s.ticker].slice(0, 12),
    })),
  setScreenLabel: (screenLabel) => set({ screenLabel }),
  syncNow: () => {
    // broadcast current state to the paired screen
    if (broadcast) {
      broadcast.postMessage({ type: "PING", from: get().screenLabel });
    }
  },
  emitSync: (msg: unknown) => {
    if (broadcast) broadcast.postMessage({ ...(msg as object), from: get().screenLabel });
  },
}));

export function subscribeToCCSync(onRemote: (msg: { type: string; from: string }) => void): () => void {
  if (!broadcast) return () => {};
  const handler = (e: MessageEvent) => onRemote(e.data as { type: string; from: string });
  broadcast.addEventListener("message", handler);
  return () => broadcast.removeEventListener("message", handler);
}

export { SYNC_CHANNEL };
