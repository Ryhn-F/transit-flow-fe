import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/infrastructure/repositories/server-station-repository", () => ({
  serverStationRepository: {
    findAll: vi.fn().mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [106.8228, -6.2018] },
          properties: {
            station_id: "STN-DKH-01",
            station_name: "Dukuh Atas Interchange",
            operator: "MRT Jakarta",
            status: "OPERATIONAL",
          },
        },
      ],
    }),
  },
}));

describe("GET /api/stations", () => {
  it("returns 200 with GeoJSON FeatureCollection", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("FeatureCollection");
    expect(data.features).toHaveLength(1);
    expect(data.features[0].properties.station_name).toBe(
      "Dukuh Atas Interchange",
    );
  });
});
