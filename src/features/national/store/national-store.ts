import { create } from "zustand";
import type { HubStat } from "../fixtures/city-fixtures";
import { HUB_STATS } from "../fixtures/city-fixtures";
import type { Locale } from "../lib/i18n";
import { aggregateLeaderboard, driftVci } from "../lib/aggregate";

interface NationalState {
  cityId: string;
  locale: Locale;
  hubs: HubStat[];
  selectedHubId: string | null;
  role: "jabodetabek" | "sumut";
  startedAt: number;

  setCity: (cityId: string) => void;
  setLocale: (locale: Locale) => void;
  selectHub: (id: string | null) => void;
  setRole: (role: NationalState["role"]) => void;
  tick: () => void;
  driftCity: (cityId: string) => void;
  spikeHub: (hubId: string, vci: number) => void;
}

const STARTED_AT = Date.now();

export const useNationalStore = create<NationalState>((set, get) => ({
  cityId: "jakarta",
  locale: "id",
  hubs: HUB_STATS.map((h) => ({ ...h })),
  selectedHubId: null,
  role: "jabodetabek",
  startedAt: STARTED_AT,

  setCity: (cityId) => set({ cityId, selectedHubId: null }),
  setLocale: (locale) => set({ locale }),
  selectHub: (selectedHubId) => set({ selectedHubId }),
  setRole: (role) => set({ role }),
  tick: () =>
    set((s) => ({
      hubs: s.hubs.map((h) => driftVci(h, Math.floor((Date.now() - s.startedAt) / 10_000))),
    })),
  driftCity: (cityId) =>
    set((s) => ({
      hubs: s.hubs.map((h) =>
        h.cityId === cityId ? driftVci(h, Math.floor((Date.now() - s.startedAt) / 10_000)) : h,
      ),
    })),
  spikeHub: (hubId, vci) =>
    set((s) => ({
      hubs: s.hubs.map((h) => (h.id === hubId ? { ...h, currentVci: vci } : h)),
    })),
}));

export function useLeaderboard() {
  return aggregateLeaderboard(useNationalStore.getState().hubs);
}
