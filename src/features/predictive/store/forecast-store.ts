import { create } from "zustand";
import type { ForecastEvent, ForecastSeries, ScenarioInput } from "../lib/fixture-model";

interface ForecastState {
  elapsedHours: number;
  forecastOn: boolean;
  activeEventId: string | null;
  runningScenarioId: string | null;
  scenarioResult: { series: ForecastSeries[]; deltas: Record<string, number> } | null;
  warning: { exitId: string; hour: number; vci: number } | null;
  warningDispatched: boolean;
  selectedExitId: string | null;

  setElapsedHours: (hours: number) => void;
  setForecastOn: (on: boolean) => void;
  setActiveEvent: (id: string | null) => void;
  setRunningScenario: (id: string | null) => void;
  setScenarioResult: (r: ForecastState["scenarioResult"]) => void;
  setWarning: (w: ForecastState["warning"]) => void;
  setWarningDispatched: (d: boolean) => void;
  setSelectedExit: (id: string | null) => void;
}

export const useForecastStore = create<ForecastState>((set) => ({
  elapsedHours: 0,
  forecastOn: false,
  activeEventId: null,
  runningScenarioId: null,
  scenarioResult: null,
  warning: null,
  warningDispatched: false,
  selectedExitId: null,

  setElapsedHours: (elapsedHours) => set({ elapsedHours }),
  setForecastOn: (forecastOn) => set({ forecastOn }),
  setActiveEvent: (activeEventId) => set({ activeEventId }),
  setRunningScenario: (runningScenarioId) => set({ runningScenarioId }),
  setScenarioResult: (scenarioResult) => set({ scenarioResult }),
  setWarning: (warning) => set({ warning }),
  setWarningDispatched: (warningDispatched) => set({ warningDispatched }),
  setSelectedExit: (selectedExitId) => set({ selectedExitId }),
}));
