import { mulberry32 } from "@/lib/prng";
import { VCI_CHANNEL_SEEDS, stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";

export interface ForecastPoint {
  hour: number;
  vci: number;
  bandLow: number;
  bandHigh: number;
}

export interface ForecastSeries {
  exitId: string;
  horizonHours: number;
  points: ForecastPoint[];
}

export interface ForecastEvent {
  id: string;
  name: string;
  kind: "concert" | "holiday" | "schedule-change";
  startsHour: number;
  endsHour: number;
  venue: string;
  affectedExitIds: string[];
  amplitude: number;
  sigmaHours: number;
  source: "GTFS" | "event-feed";
  confidence: number;
}

export interface ScenarioInput {
  trainDelayMin: number;
  eventShiftEndHour: number | null;
  rainLevel: "none" | "light" | "heavy";
  holidayFactor: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  input: ScenarioInput;
}

const HORIZON = 48;
const BASELINE_PEAKS: Array<[number, number]> = [
  [8, 1],
  [19, 1],
];

function phi(x: number): number {
  return Math.exp(-0.5 * x * x);
}

export function baselineAt(hour: number, base: number, isWeekend: boolean): number {
  const wk = isWeekend ? 0.6 : 1;
  let v = base * 0.35;
  for (const [peakHour, amp] of BASELINE_PEAKS) {
    v += base * 0.4 * amp * wk * phi((hour - peakHour) / 2.2);
  }
  return v;
}

export function eventMultiplier(hour: number, events: ForecastEvent[]): number {
  let mult = 1;
  for (const e of events) {
    if (hour < e.startsHour - 3 || hour > e.endsHour + 3) continue;
    mult += e.amplitude * phi((hour - (e.startsHour + e.endsHour) / 2) / e.sigmaHours);
  }
  return mult;
}

export function weatherMultiplier(hour: number, rainLevel: ScenarioInput["rainLevel"]): number {
  if (rainLevel === "heavy") return hour >= 18 && hour <= 22 ? 1.3 : 1.15;
  if (rainLevel === "light") return hour >= 18 && hour <= 22 ? 1.15 : 1.0;
  return 1.0;
}

export function generateSeries(
  exitId: string,
  base: number,
  events: ForecastEvent[],
  rainLevel: ScenarioInput["rainLevel"],
  holidayFactor: number,
  elapsedHours: number,
): ForecastSeries {
  const rand = mulberry32(
    exitId.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7) + elapsedHours * 131,
  );
  const isWeekend = Math.floor(elapsedHours / 24) % 7 >= 5;
  const points: ForecastPoint[] = [];
  let prevNoise = rand() * 2 - 1;

  for (let h = 0; h < HORIZON; h++) {
    const noise = rand() * 2 - 1;
    const N = 0.5 * (noise + prevNoise) * 3;
    prevNoise = noise;
    const B = baselineAt(h, base, isWeekend) * holidayFactor;
    const E = eventMultiplier(h, events);
    const W = weatherMultiplier(h, rainLevel);
    const vci = Math.max(0, Math.min(120, B * E * W + N));
    const band = 2 + (h / HORIZON) * 10;
    points.push({
      hour: h,
      vci: Math.round(vci),
      bandLow: Math.max(0, Math.round(vci - band)),
      bandHigh: Math.min(120, Math.round(vci + band)),
    });
  }

  return { exitId, horizonHours: HORIZON, points };
}

export function exitBaseVci(exitId: string): number {
  return VCI_CHANNEL_SEEDS.find((s) => s.channel_id === exitId)?.base ?? 55;
}

export function exitStationId(exitId: string): string {
  return stationOfChannel(exitId);
}

export function maxForecastVci(series: ForecastSeries): number {
  return Math.max(...series.points.map((p) => p.vci));
}

export function forecastDeltaVci(
  scenario: ForecastSeries,
  baseline: ForecastSeries,
): number {
  let maxDelta = 0;
  for (let h = 0; h < Math.min(scenario.points.length, baseline.points.length); h++) {
    const d = scenario.points[h].vci - baseline.points[h].vci;
    maxDelta = Math.max(maxDelta, d);
  }
  return maxDelta;
}
