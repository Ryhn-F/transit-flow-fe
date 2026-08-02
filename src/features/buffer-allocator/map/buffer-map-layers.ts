import type { Map as MapLibreMap } from "maplibre-gl";
import type { GeoJSONFeature } from "@/entities/geojson";

export const SOURCE = {
  ojek: "buffer-ojek-zones",
  stanchion: "buffer-stanchions",
  lane: "buffer-lane-edges",
  draft: "buffer-draft",
  invalid: "buffer-invalid-drafts",
} as const;

export const LAYER = {
  ojekFill: "buffer-ojek-fill",
  stanchionLine: "buffer-stanchion-line",
  stanchionVertex: "buffer-stanchion-vertex",
  laneClearance: "buffer-lane-clearance",
  draft: "buffer-draft-layer",
  invalidGlow: "buffer-invalid-glow",
} as const;

export function addBufferLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE.ojek)) return;
  map.addSource(SOURCE.ojek, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addSource(SOURCE.stanchion, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addSource(SOURCE.lane, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addSource(SOURCE.draft, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addSource(SOURCE.invalid, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

  map.addLayer({
    id: LAYER.ojekFill,
    type: "fill",
    source: SOURCE.ojek,
    paint: {
      "fill-color": "#f59e0b",
      "fill-opacity": 0.12,
      "fill-outline-color": "#f59e0b",
    },
  });
  map.addLayer({
    id: LAYER.stanchionLine,
    type: "line",
    source: SOURCE.stanchion,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": ["case", ["get", "active"], "#10b981", "#94a3b8"],
      "line-width": 2,
    },
  });
  map.addLayer({
    id: LAYER.stanchionVertex,
    type: "circle",
    source: SOURCE.stanchion,
    paint: {
      "circle-radius": 4,
      "circle-color": "#f1f5f9",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#64748b",
    },
  });
  map.addLayer({
    id: LAYER.laneClearance,
    type: "line",
    source: SOURCE.lane,
    paint: {
      "line-color": "#10b981",
      "line-width": 3,
      "line-opacity": 0.7,
      "line-dasharray": [2, 2],
    },
  });
  map.addLayer({
    id: LAYER.draft,
    type: "line",
    source: SOURCE.draft,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#f59e0b",
      "line-width": 3,
      "line-dasharray": [4, 3],
      "line-opacity": 0.9,
    },
  });
  map.addLayer({
    id: LAYER.invalidGlow,
    type: "line",
    source: SOURCE.invalid,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#f43f5e",
      "line-width": 5,
      "line-opacity": 0.8,
    },
  });
}

export function removeBufferLayers(map: MapLibreMap): void {
  Object.values(LAYER).forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  Object.values(SOURCE).forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
}

export function setData(
  map: MapLibreMap,
  source: string,
  features: GeoJSONFeature[],
): void {
  const src = map.getSource(source);
  if (!src || !("setData" in src)) return;
  (src as { setData: (d: unknown) => void }).setData({
    type: "FeatureCollection",
    features,
  });
}

export function ojekZoneCircleFeature(zone: {
  id: string;
  coordinates: [number, number];
  radiusM: number;
}): GeoJSONFeature<{ id: string; type: "ojek" }> {
  const M_PER_DEG_LAT = 111_320;
  const latPerM = 1 / M_PER_DEG_LAT;
  const lngPerM =
    1 / (M_PER_DEG_LAT * Math.cos((zone.coordinates[1] * Math.PI) / 180));
  const r = zone.radiusM;
  const ring: [number, number][] = [];
  for (let i = 0; i < 32; i++) {
    const a = (2 * Math.PI * i) / 32;
    ring.push([
      zone.coordinates[0] + Math.cos(a) * r * lngPerM,
      zone.coordinates[1] + Math.sin(a) * r * latPerM,
    ]);
  }
  ring.push(ring[0]);
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: { id: zone.id, type: "ojek" },
  };
}

export function stanchionFeature(stanchion: {
  id: string;
  vertices: [number, number][];
  active: boolean;
}): GeoJSONFeature<{ id: string; type: "stanchion"; active: boolean }> {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: stanchion.vertices },
    properties: { id: stanchion.id, type: "stanchion", active: stanchion.active },
  };
}

export function laneFeature(lane: {
  id: string;
  segment: [[number, number], [number, number]];
}): GeoJSONFeature<{ id: string; type: "lane" }> {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: lane.segment },
    properties: { id: lane.id, type: "lane" },
  };
}
