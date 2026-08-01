import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/infrastructure/repositories/server-station-repository", () => ({
  serverStationRepository: {
    search: vi.fn().mockImplementation(async (query: string) => ({
      type: "FeatureCollection",
      features: query.toLowerCase().includes("dukuh")
        ? [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [106.8228, -6.2018] },
              properties: {
                station_id: "STN-DKH-01",
                station_name: "Dukuh Atas",
              },
            },
          ]
        : [],
    })),
  },
}));

describe("GET /api/stations/search", () => {
  it("returns 400 if search query parameter q is missing", async () => {
    const req = new NextRequest("http://localhost/api/stations/search");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Search query must not be empty");
  });

  it("returns matching station results when query is provided", async () => {
    const req = new NextRequest(
      "http://localhost/api/stations/search?q=Dukuh",
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("FeatureCollection");
    expect(data.features).toHaveLength(1);
    expect(data.features[0].properties.station_name).toBe("Dukuh Atas");
  });
});
