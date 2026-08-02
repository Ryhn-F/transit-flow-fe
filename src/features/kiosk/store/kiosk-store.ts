import { create } from "zustand";
import type { KioskSite, VendorPermit } from "../types";
import { refreshKioskMetrics, SEED_KIOSKS, seedPermits } from "../fixtures/kiosk-fixtures";

interface KioskState {
  kiosks: KioskSite[];
  permits: VendorPermit[];
  selectedKioskId: string | null;
  sesOn: boolean;
  poisOn: boolean;
  violation: string | null;
  proposalOpen: boolean;
  startedAt: number;

  setSelected: (id: string | null) => void;
  setSesOn: (on: boolean) => void;
  setPoisOn: (on: boolean) => void;
  placeKiosk: (coordinates: [number, number]) => KioskSite | null;
  moveKiosk: (id: string, coordinates: [number, number]) => void;
  setViolation: (v: string | null) => void;
  refreshAllMetrics: () => void;
  markVendorViolation: (id: string) => void;
  issuePermit: (vendorId: string) => void;
  setProposalOpen: (open: boolean) => void;
}

const STARTED_AT = Date.now();

export const useKioskStore = create<KioskState>((set, get) => ({
  kiosks: SEED_KIOSKS.map((k) => refreshKioskMetrics(k, 60)),
  permits: seedPermits(STARTED_AT),
  selectedKioskId: null,
  sesOn: false,
  poisOn: false,
  violation: null,
  proposalOpen: false,
  startedAt: STARTED_AT,

  setSelected: (selectedKioskId) => set({ selectedKioskId }),
  setSesOn: (sesOn) => set({ sesOn }),
  setPoisOn: (poisOn) => set({ poisOn }),
  placeKiosk: (coordinates) => {
    const id = `KS-${Date.now().toString().slice(-4)}`;
    const kiosk: KioskSite = {
      id,
      stationId: "ST-DUK",
      name: `Kiosk ${id.slice(-2)}`,
      coordinates,
      sizeM: 3,
      visibility: 0,
      monthlyRevenueIdr: 0,
      paybackMonths: 0,
    };
    const placed = refreshKioskMetrics(kiosk, 60);
    set((s) => ({ kiosks: [...s.kiosks, placed], selectedKioskId: id }));
    return placed;
  },
  moveKiosk: (id, coordinates) =>
    set((s) => ({
      kiosks: s.kiosks.map((k) => (k.id === id ? { ...k, coordinates } : k)),
    })),
  setViolation: (violation) => set({ violation }),
  refreshAllMetrics: () =>
    set((s) => ({
      kiosks: s.kiosks.map((k) => refreshKioskMetrics(k, 55 + (s.kiosks.indexOf(k) % 3) * 8)),
    })),
  markVendorViolation: (id) =>
    set((s) => ({
      permits: s.permits.map((p) => (p.id === id ? { ...p, status: "VIOLATION" } : p)),
    })),
  issuePermit: (id) =>
    set((s) => ({
      permits: s.permits.map((p) => (p.id === id ? { ...p, status: "COMPLIANT" } : p)),
    })),
  setProposalOpen: (proposalOpen) => set({ proposalOpen }),
}));
