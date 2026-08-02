"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useForecastStore } from "../store/forecast-store";
import { mockForecastRepository } from "@/infrastructure/repositories/mock-forecast-repository";
import { buildZonePolygon } from "@/features/vci/lib/build-zone-polygon";
import { VCI_CHANNEL_COORDS } from "@/infrastructure/mock/fixtures/vci-fixtures";
import type { ForecastSeries } from "../lib/fixture-model";

export function useForecastSeries(exitId: string | null) {
  const elapsedHours = useForecastStore((s) => s.elapsedHours);
  const [series, setSeries] = useState<ForecastSeries | null>(null);

  useEffect(() => {
    if (!exitId) return;
    let cancelled = false;
    void mockForecastRepository.getSeries(exitId, elapsedHours).then((s) => {
      if (!cancelled) setSeries(s);
    });
    return () => {
      cancelled = true;
    };
  }, [exitId, elapsedHours]);

  return series;
}

export function ForecastLayerController({
  map,
  enabled,
}: {
  map: MapLibreMap | null;
  enabled: boolean;
}) {
  const elapsedHours = useForecastStore((s) => s.elapsedHours);
  const applied = useRef(false);

  useEffect(() => {
    if (!map || !applied.current) return;
    if (enabled) {
      if (!map.getSource("forecast-zones")) {
        map.addSource("forecast-zones", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "forecast-fill",
          type: "fill",
          source: "forecast-zones",
          paint: {
            "fill-color": ["match", ["get", "band"], "RED", "#f43f5e", "YELLOW", "#f59e0b", "#10b981"],
            "fill-opacity": 0.35,
          },
        });
        map.addLayer({
          id: "forecast-outline",
          type: "line",
          source: "forecast-zones",
          paint: {
            "line-color": "#f59e0b",
            "line-width": 1.5,
            "line-dasharray": [2, 2],
          },
        });
      }
    } else {
      for (const id of ["forecast-fill", "forecast-outline"]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource("forecast-zones")) map.removeSource("forecast-zones");
    }
  }, [map, enabled]);

  useEffect(() => {
    if (!map || !applied.current || !enabled) return;
    const src = map.getSource("forecast-zones");
    if (!src || !("setData" in src)) return;

    const exitIds = Object.keys(VCI_CHANNEL_COORDS);
    void mockForecastRepository.getSeriesForExitIds(exitIds, elapsedHours).then((seriesList) => {
      const features = seriesList.map((s) => {
        const maxH = s.points.reduce((a, b) => (b.vci > a.vci ? b : a));
        const band = maxH.vci >= 80 ? "RED" : maxH.vci >= 50 ? "YELLOW" : "GREEN";
        const [lng, lat] = VCI_CHANNEL_COORDS[s.exitId];
        return {
          type: "Feature",
          geometry: buildZonePolygon(s.exitId, lng, lat, 150),
          properties: { id: s.exitId, band, max: maxH.vci },
        };
      });
      (src as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection",
        features,
      });
    });
  }, [map, enabled, elapsedHours]);

  useEffect(() => {
    if (map && !applied.current) applied.current = true;
  }, [map]);

  return null;
}
