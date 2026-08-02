import { create } from "zustand";
import type { AiAttributeKey, AiExtractionStatus } from "@/entities/ai-extraction";

export interface AiIngestionFilters {
  status: AiExtractionStatus | "ALL" | null;
  stationId: string;
  q: string;
}

interface AiIngestionUIState {
  selectedId: string | null;
  drawerOpen: boolean;
  filters: AiIngestionFilters;
  hoverBboxIndex: number | null;
  hoverAttributeKey: AiAttributeKey | null;
  pendingAttachId: string | null;
  open: (id: string) => void;
  close: () => void;
  setFilter: (partial: Partial<AiIngestionFilters>) => void;
  clearFilters: () => void;
  setHoverBbox: (index: number | null) => void;
  setHoverAttribute: (key: AiAttributeKey | null) => void;
  setPendingAttach: (id: string | null) => void;
}

export const useAiIngestionUIStore = create<AiIngestionUIState>((set) => ({
  selectedId: null,
  drawerOpen: false,
  filters: { status: null, stationId: "", q: "" },
  hoverBboxIndex: null,
  hoverAttributeKey: null,
  pendingAttachId: null,
  open: (id) => set({ selectedId: id, drawerOpen: true }),
  close: () => set({ drawerOpen: false }),
  setFilter: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  clearFilters: () =>
    set({ filters: { status: null, stationId: "", q: "" } }),
  setHoverBbox: (index) => set({ hoverBboxIndex: index }),
  setHoverAttribute: (key) => set({ hoverAttributeKey: key }),
  setPendingAttach: (id) => set({ pendingAttachId: id }),
}));
