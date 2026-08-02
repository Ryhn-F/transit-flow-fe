import { describe, it, expect } from "vitest";
import { buildZonePolygon, polygonCentroid, zoneFeature } from "./build-zone-polygon";

describe("build-zone-polygon", () => {
  it("builds a closed 24-vertex polygon", () => {
    const poly = buildZonePolygon("DUK-GB", 106.8276, -6.2086);
    const ring = poly.coordinates[0];
    expect(ring.length).toBe(25);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("polygon centroid matches the requested center", () => {
    const poly = buildZonePolygon("DUK-GB", 106.8276, -6.2086);
    const [lng, lat] = polygonCentroid(poly);
    expect(Math.abs(lng - 106.8276)).toBeLessThan(0.001);
    expect(Math.abs(lat - -6.2086)).toBeLessThan(0.001);
  });

  it("zoneFeature carries band + score properties", () => {
    const f = zoneFeature("SUD-E", "RED", 86, 106.823, -6.2025);
    expect(f.type).toBe("Feature");
    expect(f.properties).toEqual({ channel_id: "SUD-E", vci_band: "RED", vci_score: 86 });
  });
});
