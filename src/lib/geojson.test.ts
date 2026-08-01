import { describe, it, expect } from "vitest";
import { toFeature, toFeatureCollection } from "./geojson";

describe("GeoJSON Utilities", () => {
  it("converts a single DB row to a GeoJSON Feature", () => {
    const row = {
      station_id: "stn_001",
      station_name: "Dukuh Atas",
      geometry: { type: "Point" as const, coordinates: [106.8228, -6.2018] },
    };

    const feature = toFeature(row);
    expect(feature.type).toBe("Feature");
    expect(feature.geometry).toEqual(row.geometry);
    expect(feature.properties).toEqual({
      station_id: "stn_001",
      station_name: "Dukuh Atas",
    });
  });

  it("converts multiple DB rows to a GeoJSON FeatureCollection", () => {
    const rows = [
      {
        station_id: "stn_001",
        geometry: { type: "Point" as const, coordinates: [106.8228, -6.2018] },
      },
      {
        station_id: "stn_002",
        geometry: { type: "Point" as const, coordinates: [106.8272, -6.2088] },
      },
    ];

    const fc = toFeatureCollection(rows);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0].properties.station_id).toBe("stn_001");
    expect(fc.features[1].properties.station_id).toBe("stn_002");
  });
});
