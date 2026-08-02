import type {
  ForecastEvent,
  ForecastSeries,
  ScenarioInput,
} from "@/features/predictive/lib/fixture-model";
import { exitBaseVci, generateSeries } from "@/features/predictive/lib/fixture-model";
import { FORECAST_EVENTS } from "@/infrastructure/mock/fixtures/forecast-fixtures";
import { VCI_CHANNEL_SEEDS } from "@/infrastructure/mock/fixtures/vci-fixtures";

export interface ForecastRepository {
  getSeries(exitId: string, elapsedHours?: number): Promise<ForecastSeries>;
  getSeriesForExitIds(ids: string[], elapsedHours?: number): Promise<ForecastSeries[]>;
  getEvents(): Promise<ForecastEvent[]>;
  runScenario(
    input: ScenarioInput,
    elapsedHours?: number,
  ): Promise<{ series: ForecastSeries[]; deltas: Record<string, number> }>;
}

const EXIT_IDS = VCI_CHANNEL_SEEDS.map((s) => s.channel_id);

class MockForecastRepository implements ForecastRepository {
  private startedAt = Date.now();

  startSession(now: number): void {
    this.startedAt = now;
  }

  stopSession(): void {
    // no-op
  }

  elapsedHours(now: number): number {
    return Math.floor((now - this.startedAt) / 3_600_000);
  }

  async getSeries(exitId: string, elapsedHours?: number): Promise<ForecastSeries> {
    return generateSeries(
      exitId,
      exitBaseVci(exitId),
      FORECAST_EVENTS.filter((e) => e.affectedExitIds.includes(exitId)),
      "none",
      1,
      elapsedHours ?? 0,
    );
  }

  async getSeriesForExitIds(ids: string[], elapsedHours?: number): Promise<ForecastSeries[]> {
    return Promise.all(ids.map((id) => this.getSeries(id, elapsedHours)));
  }

  async getEvents(): Promise<ForecastEvent[]> {
    return FORECAST_EVENTS.map((e) => ({ ...e }));
  }

  async runScenario(
    input: ScenarioInput,
    elapsedHours?: number,
  ): Promise<{ series: ForecastSeries[]; deltas: Record<string, number> }> {
    const el = elapsedHours ?? 0;
    const series: ForecastSeries[] = [];
    const deltas: Record<string, number> = {};
    for (const exitId of EXIT_IDS) {
      const base = await this.getSeries(exitId, el);
      const affected = FORECAST_EVENTS.filter((e) => e.affectedExitIds.includes(exitId));
      const scenario = generateSeries(exitId, exitBaseVci(exitId), affected, input.rainLevel, input.holidayFactor, el);
      const shifted = applyScenarioTiming(scenario, input);
      series.push(shifted);
      deltas[exitId] = Math.max(
        0,
        ...shifted.points.map((p, i) => p.vci - (base.points[i]?.vci ?? 0)),
      );
    }
    return { series, deltas };
  }
}

function applyScenarioTiming(
  series: ForecastSeries,
  input: ScenarioInput,
): ForecastSeries {
  const delayHours = input.trainDelayMin / 60;
  if (delayHours <= 0) return series;
  const points = series.points.map((p) => {
    const shifted = p.hour - delayHours;
    const src = series.points.find((q) => Math.abs(q.hour - shifted) < 0.6);
    return src ? { ...p, vci: Math.min(120, src.vci + 3) } : p;
  });
  return { ...series, points };
}

export const mockForecastRepository = new MockForecastRepository();
