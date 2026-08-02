import { create } from "zustand";
import type {
  BarrierToggleResult,
  BufferGeometryDraft,
  EditorMode,
  OjekSlot,
  OjekZone,
  StanchionLine,
} from "../types";

interface VciAnimationState {
  barrierId: string | null;
  vciFrom: number;
  vciTo: number;
  throughputFrom: number;
  throughputTo: number;
  step: number;
  steps: number;
  done: boolean;
}

interface EditorState {
  mode: EditorMode;
  selectedId: string | null;
  draft: BufferGeometryDraft | null;
  invalidIds: string[];
  isSaving: boolean;
  slots: OjekSlot[];
  barriers: StanchionLine[];
  zones: OjekZone[];
  validationMessage: string | null;
  animation: VciAnimationState | null;
  exportOpen: boolean;

  setMode: (mode: EditorMode) => void;
  select: (id: string | null) => void;
  startOjekDraft: (coords: [number, number], radiusM: number) => void;
  placeOjek: (zone: OjekZone) => void;
  addStanchionVertex: (coords: [number, number]) => void;
  completeStanchion: (stanchion: StanchionLine) => void;
  cancelDraft: () => void;
  markInvalid: (ids: string[], message: string) => void;
  clearInvalid: () => void;
  setValidationMessage: (msg: string | null) => void;
  moveSelection: (dLng: number, dLat: number) => void;
  removeSelection: () => void;
  removeZone: (id: string) => void;
  setSaving: (saving: boolean) => void;
  setSlots: (slots: OjekSlot[]) => void;
  setBarriers: (barriers: StanchionLine[]) => void;
  replaceBarrier: (barrier: StanchionLine) => void;
  toggleBarrierLocal: (result: BarrierToggleResult) => void;
  startAnimation: (result: BarrierToggleResult) => void;
  setAnimationStep: (step: number) => void;
  endAnimation: () => void;
  setExportOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: "view",
  selectedId: null,
  draft: null,
  invalidIds: [],
  isSaving: false,
  slots: [],
  barriers: [],
  zones: [],
  validationMessage: null,
  animation: null,
  exportOpen: false,

  setMode: (mode) => set({ mode, selectedId: null, draft: null, invalidIds: [], validationMessage: null }),
  select: (id) => set({ selectedId: id }),
  startOjekDraft: (coords, radiusM) => set({ draft: { type: "ojek", coords, radiusM } }),
  placeOjek: (zone) =>
    set((state) => ({ zones: [...state.zones, zone], draft: null, validationMessage: "Ojek zone placed — snapped to curb geometry" })),
  addStanchionVertex: (coords) => {
    const draft = get().draft;
    if (draft?.type === "stanchion") {
      set({ draft: { type: "stanchion", vertices: [...draft.vertices, coords] } });
    } else {
      set({ draft: { type: "stanchion", vertices: [coords] } });
    }
  },
  completeStanchion: (stanchion) =>
    set((state) => ({ barriers: [...state.barriers, stanchion], draft: null, validationMessage: "2.0 m lane clearance — OK" })),
  cancelDraft: () => set({ draft: null, validationMessage: null }),
  markInvalid: (ids, message) => set({ invalidIds: ids, validationMessage: message }),
  clearInvalid: () => set({ invalidIds: [] }),
  setValidationMessage: (msg) => set({ validationMessage: msg }),
  moveSelection: (dLng, dLat) => {
    const { selectedId, zones, barriers } = get();
    if (!selectedId) return;
    set({
      zones: zones.map((z) => (z.id === selectedId ? { ...z, coordinates: [z.coordinates[0] + dLng, z.coordinates[1] + dLat] as [number, number] } : z)),
      barriers: barriers.map((b) =>
        b.id === selectedId
          ? { ...b, vertices: b.vertices.map((v) => [v[0] + dLng, v[1] + dLat] as [number, number]) }
          : b,
      ),
    });
  },
  removeSelection: () => {
    const { selectedId, zones, barriers } = get();
    if (!selectedId) return;
    set({
      zones: zones.filter((z) => z.id !== selectedId),
      barriers: barriers.filter((b) => b.id !== selectedId),
      selectedId: null,
    });
  },
  removeZone: (id) => set((state) => ({ zones: state.zones.filter((z) => z.id !== id) })),
  setSaving: (saving) => set({ isSaving: saving }),
  setSlots: (slots) => set({ slots }),
  setBarriers: (barriers) => set({ barriers }),
  replaceBarrier: (barrier) =>
    set((state) => ({
      barriers: state.barriers.map((b) => (b.id === barrier.id ? barrier : b)),
    })),
  toggleBarrierLocal: (result) =>
    set((state) => ({
      barriers: state.barriers.map((b) =>
        b.id === result.barrierId ? { ...b, active: result.state === "ACTIVE" } : b,
      ),
    })),
  startAnimation: (result) =>
    set({
      animation: {
        barrierId: result.barrierId,
        vciFrom: result.vciFrom,
        vciTo: result.vciTo,
        throughputFrom: result.throughputFrom,
        throughputTo: result.throughputTo,
        step: 0,
        steps: 50,
        done: false,
      },
    }),
  setAnimationStep: (step) =>
    set((state) => ({
      animation: state.animation ? { ...state.animation, step, done: step >= state.animation.steps } : null,
    })),
  endAnimation: () => set({ animation: null }),
  setExportOpen: (open) => set({ exportOpen: open }),
}));
