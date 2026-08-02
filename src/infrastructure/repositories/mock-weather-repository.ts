import type { RadarCell, WeatherReading } from "@/entities/weather";
import { rainfallAt, radarGrid } from "@/infrastructure/mock/fixtures/weather-fixtures";

export interface WeatherRepository {
  getCurrent(): Promise<WeatherReading>;
  getRadarGrid(): Promise<RadarCell[]>;
}

class MockWeatherRepository implements WeatherRepository {
  private startedAt = Date.now();
  private current = Date.now();

  startSession(now: number): void {
    this.startedAt = now;
    this.current = now;
  }

  stopSession(): void {
    // no-op
  }

  tick(now: number): void {
    this.current = now;
  }

  async getCurrent(): Promise<WeatherReading> {
    const elapsed = Math.max(0, (this.current - this.startedAt) / 1_000);
    return {
      rainfallMmHr: rainfallAt(elapsed),
      source: "bmkg",
      capturedAt: this.current,
    };
  }

  async getRadarGrid(): Promise<RadarCell[]> {
    const reading = await this.getCurrent();
    return radarGrid(reading.rainfallMmHr);
  }
}

export const mockWeatherRepository = new MockWeatherRepository();
