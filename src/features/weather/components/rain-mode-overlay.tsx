"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useWeatherUIStore } from "../store/weather-ui-store";
import { NODE_COORDS, edgeCoordinates } from "@/infrastructure/mock/fixtures/weather-fixtures";

const CELL_SOURCE = "weather-radar-cells";
const CELL_LAYER = "weather-radar-cell-fill";
const FLOOD_SOURCE = "weather-floods";
const FLOOD_LAYER = "weather-flood-dot";
const ROUTE_SOURCE = "weather-detour-routes";
const ROUTE_COVERED = "weather-detour-covered";
const ROUTE_FLOODED = "weather-detour-flooded";
const ROUTE_SELECTED = "weather-detour-selected";

const GRID = { x0: 106.806, y0: -6.191, sizeM: 400 };
const M_PER_DEG_LAT = 111_320;
const CELL_DEG = GRID.sizeM / M_PER_DEG_LAT;
const CELL_DEG_LNG = GRID.sizeM / (M_PER_DEG_LAT * Math.cos((GRID.y0 * Math.PI) / 180));

function cellColor(intensity: number): string {
  if (intensity <= 0) return "rgba(0,0,0,0)";
  const colors = ["#22d3ee", "#38bdf8", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];
  return colors[Math.min(5, intensity)];
}

export function RainModeOverlay({ map, enabled }: { map: MapLibreMap | null; enabled: boolean }) {
  const snapshot = useWeatherUIStore((s) => s.snapshot);
  const detours = useWeatherUIStore((s) => s.detours);
  const selectedRouteId = useWeatherUIStore((s) => s.selectedRouteId);
  const applied = useRef(false);

  useEffect(() => {
    if (!map || !applied.current) return;
    if (enabled) {
      if (!map.getSource(CELL_SOURCE)) {
        map.addSource(CELL_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: CELL_LAYER,
          type: "fill",
          source: CELL_SOURCE,
          paint: { "fill-color": ["get", "color"], "fill-opacity": ["get", "opacity"] },
        });
        map.addSource(FLOOD_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: FLOOD_LAYER,
          type: "circle",
          source: FLOOD_SOURCE,
          paint: {
            "circle-radius": 7,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#bae6fd",
          },
        });
        map.addSource(ROUTE_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        const lineLayers: Array<{
          id: string;
          color: string;
          width: number;
          opacity: number;
          dash?: number[];
        }> = [
          { id: ROUTE_COVERED, color: "#10b981", width: 3, opacity: 0.9 },
          { id: ROUTE_FLOODED, color: "#ef4444", width: 4, opacity: 0.35, dash: [2, 2] },
          { id: ROUTE_SELECTED, color: "#f59e0b", width: 5, opacity: 1 },
        ];
        for (const layer of lineLayers) {
          map.addLayer({
            id: layer.id,
            type: "line",
            source: ROUTE_SOURCE,
            paint: {
              "line-color": layer.color,
              "line-width": layer.width,
              "line-opacity": layer.opacity,
              ...(layer.dash ? { "line-dasharray": layer.dash } : {}),
            },
          });
        }
        map.on("click", FLOOD_LAYER, (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined;
          if (id) useWeatherUIStore.getState().setSelectedFlood(id);
        });
      }
    } else {
      for (const id of [CELL_LAYER, FLOOD_LAYER, ROUTE_COVERED, ROUTE_FLOODED, ROUTE_SELECTED]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      for (const id of [CELL_SOURCE, FLOOD_SOURCE, ROUTE_SOURCE]) {
        if (map.getSource(id)) map.removeSource(id);
      }
    }
  }, [map, enabled]);

  useEffect(() => {
    if (!map || !applied.current) return;
    if (!enabled) return;

    const set = (source: string, features: GeoJSON.Feature[]) => {
      const src = map.getSource(source);
      if (!src || !("setData" in src)) return;
      (src as { setData: (d: unknown) => void }).setData({ type: "FeatureCollection", features });
    };

    const cellFeatures: GeoJSON.Feature[] = (snapshot?.cells ?? []).map((cell) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [GRID.x0 + cell.x * CELL_DEG_LNG, GRID.y0 + cell.y * CELL_DEG],
            [GRID.x0 + (cell.x + 1) * CELL_DEG_LNG, GRID.y0 + cell.y * CELL_DEG],
            [GRID.x0 + (cell.x + 1) * CELL_DEG_LNG, GRID.y0 + (cell.y + 1) * CELL_DEG],
            [GRID.x0 + cell.x * CELL_DEG_LNG, GRID.y0 + (cell.y + 1) * CELL_DEG],
            [GRID.x0 + cell.x * CELL_DEG_LNG, GRID.y0 + cell.y * CELL_DEG],
          ],
        ],
      } as GeoJSON.Polygon,
      properties: { color: cellColor(cell.intensity), opacity: Math.max(0.18, cell.intensity * 0.09) },
    }));

    const floodFeatures: GeoJSON.Feature[] = (snapshot?.floods ?? [])
      .filter((f) => f.depthCm != null)
      .map((f) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [f.lng, f.lat] },
        properties: { id: f.id, depthCm: f.depthCm },
      }));

    const routeFeatures: GeoJSON.Feature[] = [];
    for (const route of detours) {
      const coords = edgeCoordinates(route.edgeIds);
      if (coords.length < 2) continue;
      routeFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {
          id: route.id,
          state: route.id === selectedRouteId ? "selected" : "open",
        },
      });
    }

    set(CELL_SOURCE, cellFeatures);
    set(FLOOD_SOURCE, floodFeatures);
    set(ROUTE_SOURCE, routeFeatures);
  }, [map, enabled, snapshot, detours, selectedRouteId]);

  useEffect(() => {
    if (map && !applied.current) applied.current = true;
  }, [map]);

  return null;
}
