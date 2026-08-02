import type { DetourRoute, UnderpassFlood } from "@/entities/weather";
import { RAIN_THRESHOLD_MMHR } from "@/entities/weather";
import { mockWeatherRepository } from "@/infrastructure/repositories/mock-weather-repository";
import { mockRerouteRepository } from "@/infrastructure/repositories/mock-reroute-repository";
import { useWeatherUIStore } from "@/features/weather/store/weather-ui-store";

const TICK_MS = 10_000;

type Listener = () => void;

class WeatherLiveDriver {
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private lastRainfall = 0;
  private belowThresholdTicks = 0;
  private recoveryFired = false;

  start(): void {
    if (this.intervalId != null) return;
    const now = Date.now();
    this.startedAt = now;
    mockWeatherRepository.startSession(now);
    mockRerouteRepository.startSession(now);
    this.lastRainfall = 0;
    this.belowThresholdTicks = 0;
    this.recoveryFired = false;
    this.sync();
    this.intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const tickNow = Date.now();
      mockWeatherRepository.tick(tickNow);
      mockRerouteRepository.tick(tickNow);
      this.applyRules();
      this.sync();
      this.listeners.forEach((l) => l());
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    mockWeatherRepository.stopSession();
    mockRerouteRepository.stopSession();
    this.startedAt = null;
  }

  private applyRules(): void {
    void mockWeatherRepository.getCurrent().then((reading) => {
      const store = useWeatherUIStore.getState();
      const crossed =
        this.lastRainfall < RAIN_THRESHOLD_MMHR &&
        reading.rainfallMmHr >= RAIN_THRESHOLD_MMHR;
      this.lastRainfall = reading.rainfallMmHr;

      if (crossed && store.mode !== "override") {
        store.setMode("auto");
        store.setAutoEnabled(true);
        store.setRainOn(true);
      }

      if (reading.rainfallMmHr < RAIN_THRESHOLD_MMHR && store.mode !== "override") {
        this.belowThresholdTicks += 1;
        if (this.belowThresholdTicks >= 3 && store.autoEnabled && !this.recoveryFired) {
          this.recoveryFired = true;
          store.setAutoEnabled(false);
          store.setRainOn(false);
          store.setRecoveryMessage("Rain Detour deactivated — rainfall below threshold");
        }
      } else {
        this.belowThresholdTicks = 0;
      }
    });
  }

  private sync(): void {
    void Promise.all([
      mockWeatherRepository.getCurrent(),
      mockWeatherRepository.getRadarGrid(),
      mockRerouteRepository.getUnderpassFloods(),
      mockRerouteRepository.getFloodPhotos(),
    ]).then(([reading, cells, floods, photos]) => {
      const store = useWeatherUIStore.getState();
      store.setSnapshot({ reading, cells, floods, photos });
      void mockRerouteRepository.getDetours(floods).then((routes: DetourRoute[]) => {
        useWeatherUIStore.getState().setDetours(routes);
      });
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

export const weatherLiveDriver = new WeatherLiveDriver();
