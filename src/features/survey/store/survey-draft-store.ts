import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ObservationType, CongestionLevel } from "@/entities/survey";

interface SurveyDraftState {
  stationId: string | null;
  channelId: string | null;
  coordinates: { lat: number; lng: number } | null;
  observationType: ObservationType;
  congestionLevel: CongestionLevel;
  obstructionImpactPercent: number;
  obstructionPolygon: GeoJSON.Polygon | null;
  photoUrls: string[];
  audioNoteUrl: string | null;
  manualNotes: string;
  setField: <K extends keyof SurveyDraftState>(
    key: K,
    value: SurveyDraftState[K],
  ) => void;
  reset: () => void;
}

const initialState = {
  stationId: null,
  channelId: null,
  coordinates: null,
  observationType: "PEDESTRIAN_FLOW" as ObservationType,
  congestionLevel: "MEDIUM" as CongestionLevel,
  obstructionImpactPercent: 65,
  obstructionPolygon: null,
  photoUrls: [],
  audioNoteUrl: null,
  manualNotes: "",
};

export const useSurveyDraftStore = create<SurveyDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      setField: (key, value) =>
        set({ [key]: value } as Pick<SurveyDraftState, typeof key>),
      reset: () => set(initialState),
    }),
    { name: "transitflow-survey-draft" },
  ),
);
