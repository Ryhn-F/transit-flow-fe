import type { ForecastEvent, ScenarioInput } from "@/features/predictive/lib/fixture-model";
import { SCENARIO_PRESETS } from "@/features/predictive/lib/scenario";

export const FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: "EV-01",
    name: "GBK Concert — Friday 21:00",
    kind: "concert",
    startsHour: 20,
    endsHour: 23,
    venue: "GBK Senayan",
    affectedExitIds: ["SUD-E", "SUD-W", "MGR-01"],
    amplitude: 0.55,
    sigmaHours: 2.2,
    source: "event-feed",
    confidence: 0.92,
  },
  {
    id: "EV-02",
    name: "MRT Timetable Change",
    kind: "schedule-change",
    startsHour: 7,
    endsHour: 9,
    venue: "System-wide",
    affectedExitIds: ["MGR-01", "MGR-02", "DUK-GA"],
    amplitude: 0.12,
    sigmaHours: 1.4,
    source: "GTFS",
    confidence: 0.94,
  },
  {
    id: "EV-03",
    name: "KAI Evening Rush Add-on",
    kind: "schedule-change",
    startsHour: 17,
    endsHour: 20,
    venue: "Dukuh Atas",
    affectedExitIds: ["DUK-GB", "DUK-GC"],
    amplitude: 0.18,
    sigmaHours: 1.6,
    source: "GTFS",
    confidence: 0.88,
  },
  {
    id: "EV-04",
    name: "Stadium Match — Sunday 16:00",
    kind: "concert",
    startsHour: 15,
    endsHour: 18,
    venue: "Stadium Utama",
    affectedExitIds: ["SUD-E"],
    amplitude: 0.45,
    sigmaHours: 2.0,
    source: "event-feed",
    confidence: 0.81,
  },
  {
    id: "EV-05",
    name: "Holiday Exodus — Eid",
    kind: "holiday",
    startsHour: 10,
    endsHour: 22,
    venue: "National",
    affectedExitIds: ["DUK-GA", "DUK-GB", "DUK-GC", "MGR-01", "MGR-02", "SUD-E", "SUD-W"],
    amplitude: 0.35,
    sigmaHours: 4,
    source: "event-feed",
    confidence: 0.71,
  },
  {
    id: "EV-06",
    name: "Corporate Event — Thu 19:00",
    kind: "concert",
    startsHour: 18,
    endsHour: 21,
    venue: "Sudirman Tower",
    affectedExitIds: ["SUD-W", "SUD-E"],
    amplitude: 0.22,
    sigmaHours: 1.6,
    source: "event-feed",
    confidence: 0.77,
  },
];

export { SCENARIO_PRESETS };

export function exportScenarioInput(input: ScenarioInput): ScenarioInput {
  return { ...input };
}
