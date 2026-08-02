import type { GeoJSONFeature } from "@/entities/geojson";

const ZONE_VERTICES = 24;
const METERS_PER_DEGREE_LAT = 111_320;
const ZONE_RADIUS_M = 150;

export function buildZonePolygon(
  channelId: string,
  lng: number,
  lat: number,
  radiusM = ZONE_RADIUS_M,
  vertices = ZONE_VERTICES,
): GeoJSON.Polygon {
  const latPerM = 1 / METERS_PER_DEGREE_LAT;
  const lngPerM = 1 / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

  const ring: [number, number][] = [];
  for (let i = 0; i < vertices; i++) {
    const angle = (2 * Math.PI * i) / vertices;
    ring.push([
      lng + Math.cos(angle) * radiusM * lngPerM,
      lat + Math.sin(angle) * radiusM * latPerM,
    ]);
  }
  ring.push(ring[0]);

  return {
    type: "Polygon",
    coordinates: [ring],
  };
}

export function polygonCentroid(
  polygon: GeoJSON.Polygon,
): [number, number] {
  const ring = polygon.coordinates[0];
  const lng = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
  const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
  return [lng, lat];
}

export function zoneFeature(
  channelId: string,
  vciBand: string,
  vciScore: number,
  lng: number,
  lat: number,
): GeoJSONFeature<{ channel_id: string; vci_band: string; vci_score: number }> {
  return {
    type: "Feature",
    geometry: buildZonePolygon(channelId, lng, lat),
    properties: { channel_id: channelId, vci_band: vciBand, vci_score: vciScore },
  };
}
