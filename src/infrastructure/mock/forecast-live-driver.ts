import { mockForecastRepository } from "@/infrastructure/repositories/mock-forecast-repository";
import { useForecastStore } from "@/features/predictive/store/forecast-store";
import { VCI_CHANNEL_SEEDS } from "@/infrastructure/mock/fixtures/vci-fixtures";
import { FORECAST_WARNING_THRESHOLD, FORECAST_WINDOW_HOURS } from "@/features/predictive/lib/schemas";

const TICK_MS = 15_000;
const HOUR_MS = 3_600_000;

type Listener = () => void;

class ForecastLiveDriver {
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();

  start(): void {
    if (this.intervalId != null) return;
    const now = Date.now();
    this.startedAt = now;
    mockForecastRepository.startSession(now);
    this.sync();
    this.intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      this.sync();
      this.listeners.forEach((l) => l());
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    mockForecastRepository.stopSession();
    this.startedAt = null;
  }

  private sync(): void {
    const now = Date.now();
    const elapsedHours = Math.floor((now - (this.startedAt ?? now)) / HOUR_MS);
    useForecastStore.getState().setElapsedHours(elapsedHours);

    // threshold watcher: any exit ≥80 within the rolling 24h window
    const exitIds = VCI_CHANNEL_SEEDS.map((s) => s.channel_id);
    void mockForecastRepository.getSeriesForExitIds(exitIds, elapsedHours).then((series) => {
      const store = useForecastStore.getState();
      for (const s of series) {
        for (let h = 0; h < FORECAST_WINDOW_HOURS; h++) {
          const p = s.points[h];
          if (p && p.vci >= FORECAST_WARNING_THRESHOLD) {
            if (!store.warning || store.warning.exitId !== s.exitId) {
              store.setWarning({ exitId: s.exitId, hour: p.hour, vci: p.vci });
            }
            return;
          }
        }
      }
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isRunning(): boolean {
    return this.intervalId != null;
  }
}

export const forecastLiveDriver = new ForecastLiveDriver();
