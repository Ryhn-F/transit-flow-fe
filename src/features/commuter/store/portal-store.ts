import { create } from "zustand";
import type { CommuterHub } from "../fixtures/portal-fixtures";
import type { CrowdReportInput } from "../lib/schemas";

export type PortalTab = "home" | "safe-path" | "report" | "notifications";

export interface CrowdReport {
  id: string;
  type: "blockage" | "escalator" | "flood";
  hubId: string;
  photoUrl?: string;
  ts: number;
  status: "queued" | "sent";
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  ts: number;
  read: boolean;
}

export interface PortalState {
  tab: PortalTab;
  lang: "id" | "en";
  offline: boolean;
  locationState: "idle" | "locating" | "resolved" | "denied";
  resolvedHubId: string | null;
  distanceKm: number | null;
  hub: CommuterHub | null;
  reports: CrowdReport[];
  notifications: PortalNotification[];
  subscribed: boolean;
  installDismissed: boolean;
  reportCounter: number;
  reportSubmitted: CrowdReport | null;

  setTab: (tab: PortalTab) => void;
  toggleLang: () => void;
  setOffline: (offline: boolean) => void;
  setLocationState: (s: PortalState["locationState"]) => void;
  resolveHub: (hubId: string, distanceKm: number) => void;
  setHub: (hub: CommuterHub) => void;
  submitReport: (input: CrowdReportInput) => CrowdReport;
  flushQueuedReports: () => void;
  addNotification: (title: string, body: string) => void;
  markAllRead: () => void;
  setSubscribed: (subscribed: boolean) => void;
  dismissInstall: () => void;
}

const nextReportId = (n: number) => `CR-${String(421 + n).padStart(4, "0")}`;

export const usePortalStore = create<PortalState>((set, get) => ({
  tab: "home",
  lang: "id",
  offline: false,
  locationState: "idle",
  resolvedHubId: null,
  distanceKm: null,
  hub: null,
  reports: [],
  notifications: [],
  subscribed: false,
  installDismissed: false,
  reportCounter: 0,
  reportSubmitted: null,

  setTab: (tab) => set({ tab }),
  toggleLang: () => set((s) => ({ lang: s.lang === "id" ? "en" : "id" })),
  setOffline: (offline) => set({ offline }),
  setLocationState: (locationState) => set({ locationState }),
  resolveHub: (resolvedHubId, distanceKm) =>
    set({ resolvedHubId, distanceKm, locationState: "resolved" }),
  setHub: (hub) => set({ hub }),
  submitReport: (input) => {
    const state = get();
    const report: CrowdReport = {
      id: nextReportId(state.reportCounter),
      type: input.type,
      hubId: input.hubId,
      photoUrl: input.photoUrl,
      ts: Date.now(),
      status: state.offline ? "queued" : "sent",
    };
    set((s) => ({
      reports: [...s.reports, report],
      reportCounter: s.reportCounter + 1,
      reportSubmitted: report,
    }));
    return report;
  },
  flushQueuedReports: () =>
    set((s) => ({
      reports: s.reports.map((r) => ({ ...r, status: "sent" as const })),
    })),
  addNotification: (title, body) =>
    set((s) => ({
      notifications: [
        { id: `NT-${Date.now()}`, title, body, ts: Date.now(), read: false },
        ...s.notifications,
      ],
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  setSubscribed: (subscribed) => set({ subscribed }),
  dismissInstall: () => set({ installDismissed: true }),
}));
