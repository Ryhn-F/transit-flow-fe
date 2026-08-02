import type { GeoJSONFeatureCollection } from "@/entities/geojson";
import type { StationNode } from "@/entities/station";
import { DEMO_STATIONS } from "@/infrastructure/mock/fixtures/stations";

class MockStationRepository {
  async getAll(): Promise<GeoJSONFeatureCollection<StationNode>> {
    return structuredClone(DEMO_STATIONS);
  }

  async search(
    query: string,
  ): Promise<GeoJSONFeatureCollection<StationNode>> {
    const needle = query.trim().toLowerCase();
    const features = DEMO_STATIONS.features.filter((f) =>
      f.properties.station_name.toLowerCase().includes(needle),
    );
    return { type: "FeatureCollection", features };
  }

  async getById(id: string) {
    const feature = DEMO_STATIONS.features.find(
      (f) => f.properties.station_id === id,
    );
    return feature ?? null;
  }
}

export const mockStationRepository = new MockStationRepository();
