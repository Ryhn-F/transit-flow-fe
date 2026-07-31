import { httpClient } from "@/infrastructure/api/http-client";
import { ENDPOINTS } from "@/infrastructure/api/endpoints";
import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@/entities/geojson";
import type { StationNode } from "@/entities/station";

export const stationRepository = {
  async getAll(): Promise<GeoJSONFeatureCollection<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stations);
    return data;
  },

  async search(query: string): Promise<GeoJSONFeatureCollection<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stationSearch, {
      params: { q: query },
    });
    return data;
  },

  async getById(id: string): Promise<GeoJSONFeature<StationNode>> {
    const { data } = await httpClient.get(ENDPOINTS.stationById(id));
    return data;
  },
};
