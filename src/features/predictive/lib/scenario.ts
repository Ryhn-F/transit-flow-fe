import type { ForecastEvent, ForecastSeries, ScenarioInput } from "./fixture-model";
import { generateSeries } from "./fixture-model";

export function applyTrainDelay(series: ForecastSeries, delayMin: number): ForecastSeries {
  if (delayMin <= 0) return series;
  const delayHours = delayMin / 60;
  const points = series.points.map((p) => {
    const shifted = p.hour - delayHours;
    const src = series.points.find((q) => Math.abs(q.hour - shifted) < 0.6);
    return src ? { ...p, vci: Math.min(120, src.vci + 4) } : p;
  });
  return { ...series, points };
}

export function applyEventShift(
  series: ForecastSeries,
  events: ForecastEvent[],
  newEndHour: number,
): ForecastSeries {
  const points = series.points.map((p) => {
    let shift = 0;
    for (const e of events) {
      if (p.hour >= e.startsHour && p.hour <= e.endsHour) {
        const t = (p.hour - e.startsHour) / Math.max(1, e.endsHour - e.startsHour);
        shift += (newEndHour - e.endsHour) * t;
      }
    }
    if (shift === 0) return p;
    const src = series.points.find((q) => Math.abs(q.hour - (p.hour - shift)) < 0.6);
    return src ? { ...p, vci: src.vci } : p;
  });
  return { ...series, points };
}

export function composeScenario(
  base: ForecastSeries,
  input: ScenarioInput,
  events: ForecastEvent[],
): ForecastSeries {
  let series = applyTrainDelay(base, input.trainDelayMin);
  if (input.eventShiftEndHour != null) {
    series = applyEventShift(series, events, input.eventShiftEndHour);
  }
  const hourOffset = base.points.length > 0 ? base.points[0].hour : 0;
  void hourOffset;
  return series;
}

export const SCENARIO_PRESETS: Array<{ id: string; name: string; input: ScenarioInput }> = [
  {
    id: "preset-concert-rain",
    name: "Concert ends 21:00 + heavy rain",
    input: { trainDelayMin: 20, eventShiftEndHour: 21, rainLevel: "heavy", holidayFactor: 1 },
  },
  {
    id: "preset-eid-eve",
    name: "Eid eve + holiday surge",
    input: { trainDelayMin: 0, eventShiftEndHour: null, rainLevel: "none", holidayFactor: 1.35 },
  },
  {
    id: "preset-normal",
    name: "Normal Tuesday",
    input: { trainDelayMin: 0, eventShiftEndHour: null, rainLevel: "none", holidayFactor: 1 },
  },
];
