import type {
  DetourRoute,
  FloodPhoto,
  UnderpassFlood,
  WalkwayEdge,
} from "@/entities/weather";
import { computeDetourSet } from "@/features/weather/lib/compute-detours";
import {
  DETOUR_ROUTES,
  FLOOD_PHOTOS,
  UNDERPASSES,
  WALKWAY_GRAPH,
} from "@/infrastructure/mock/fixtures/weather-fixtures";
import { underpassFloodSchema } from "@/features/weather/lib/weather-schemas";

export interface RerouteRepository {
  getWalkwayGraph(): Promise<WalkwayEdge[]>;
  getUnderpassFloods(): Promise<UnderpassFlood[]>;
  getFloodPhotos(): Promise<FloodPhoto[]>;
  getDetours(floods: UnderpassFlood[]): Promise<DetourRoute[]>;
}

class MockRerouteRepository implements RerouteRepository {
  private floods: UnderpassFlood[] = [];
  private startedAt = Date.now();
  private current = Date.now();

  startSession(now: number): void {
    this.startedAt = now;
    this.current = now;
    this.floods = UNDERPASSES.map((u) => underpassFloodSchema.parse({ ...u }));
  }

  stopSession(): void {
    // no-op
  }

  tick(now: number): void {
    this.current = now;
    const elapsed = (now - this.startedAt) / 1_000;
    // deterministic seeded floods: #3 at t>=300s (UP-3, 30cm), #4 at t>=390s (UP-4, 41cm)
    this.applySeededFlood("UP-3", 30, 0.94, 300);
    this.applySeededFlood("UP-4", 41, 0.96, 390);
  }

  private applySeededFlood(
    id: string,
    depthCm: number,
    confidence: number,
    atSec: number,
  ): void {
    const elapsed = (this.current - this.startedAt) / 1_000;
    if (elapsed < atSec) return;
    const flood = this.floods.find((f) => f.id === id);
    if (flood && flood.depthCm == null) {
      flood.depthCm = depthCm;
      flood.confidence = confidence;
      flood.verified = true;
    }
  }

  async getWalkwayGraph(): Promise<WalkwayEdge[]> {
    return WALKWAY_GRAPH.map((e) => ({ ...e }));
  }

  async getUnderpassFloods(): Promise<UnderpassFlood[]> {
    return this.floods.map((f) => ({ ...f }));
  }

  async getFloodPhotos(): Promise<FloodPhoto[]> {
    return FLOOD_PHOTOS.map((p) => ({ ...p }));
  }

  async getDetours(floods: UnderpassFlood[]): Promise<DetourRoute[]> {
    return computeDetourSet(floods, WALKWAY_GRAPH, DETOUR_ROUTES);
  }
}

export const mockRerouteRepository = new MockRerouteRepository();
