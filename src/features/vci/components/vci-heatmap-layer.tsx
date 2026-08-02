"use client";

import { useCallback, useEffect } from "react";
import type { Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { useVCILiveStore } from "../store/vci-live-store";
import { useVCIUIStore } from "../store/vci-ui-store";
import { zoneFeature } from "../lib/build-zone-polygon";
import { getVciRepository } from "@/infrastructure/mock/provider-registry";
import { bandOf } from "../lib/vci-formula";
import type { VCISnapshot } from "@/entities/vci-metric";

const SOURCE_ID = "vci-zones";
const FILL_ID = "vci-zone-fill";
const OUTLINE_ID = "vci-zone-outline";

type GeoJSONSourceLike = { setData: (data: unknown) => void };

function geojsonSource(target: MapLibreMap): GeoJSONSourceLike | null {
  const source = target.getSource(SOURCE_ID);
  if (!source || !("setData" in source)) return null;
  return source as unknown as GeoJSONSourceLike;
}

function featuresFor(snapshot: VCISnapshot | null) {
  if (!snapshot) return null;
  return {
    type: "FeatureCollection" as const,
    features: snapshot.metrics
      .map((m) => {
        const coords = getVciRepository().getChannelCoords()[m.channel_id];
        if (!coords) return null;
        return zoneFeature(m.channel_id, bandOf(m.vci_score), m.vci_score, coords[0], coords[1]);
      })
      .filter((f): f is NonNullable<typeof f> => f != null),
  };
}

export function VciHeatmapLayer({
  map,
  enabled,
}: {
  map: MapLibreMap | null;
  enabled: boolean;
}) {
  const snapshot = useVCILiveStore((s) => s.snapshot);
  const selectZone = useVCIUIStore((s) => s.selectZone);

  const ensureLayers = useCallback(
    (target: MapLibreMap, dataSnapshot: VCISnapshot | null) => {
      if (target.getSource(SOURCE_ID)) return;

      const onClick = (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const { channel_id } = feature.properties ?? {};
        const coords = getVciRepository().getChannelCoords()[channel_id];
        if (channel_id && coords) {
          selectZone({ channelId: channel_id, lng: coords[0], lat: coords[1] });
        }
      };
      const onEnter = () => {
        target.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        target.getCanvas().style.cursor = "";
      };

      target.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      target.addLayer({
        id: FILL_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": ["match", ["get", "vci_band"], "GREEN", "#10b981", "YELLOW", "#f59e0b", "RED", "#f43f5e", "#10b981"],
          "fill-opacity": ["match", ["get", "vci_band"], "GREEN", 0.28, "YELLOW", 0.45, "RED", 0.62, 0.28],
        },
      });
      target.addLayer({
        id: OUTLINE_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": ["match", ["get", "vci_band"], "GREEN", "#10b981", "YELLOW", "#f59e0b", "RED", "#f43f5e", "#10b981"],
          "line-width": 1.5,
        },
      });
      target.on("click", FILL_ID, onClick);
      target.on("mouseenter", FILL_ID, onEnter);
      target.on("mouseleave", FILL_ID, onLeave);

      const data = featuresFor(dataSnapshot);
      if (data) geojsonSource(target)?.setData(data);
    },
    [selectZone],
  );

  const removeLayers = useCallback((target: MapLibreMap) => {
    if (target.getLayer(OUTLINE_ID)) target.removeLayer(OUTLINE_ID);
    if (target.getLayer(FILL_ID)) target.removeLayer(FILL_ID);
    if (target.getSource(SOURCE_ID)) target.removeSource(SOURCE_ID);
  }, []);

  // Layer lifecycle: add when enabled (after the style is ready), remove when off.
  useEffect(() => {
    if (!map) return;
    if (!enabled) {
      removeLayers(map);
      return;
    }
    if (map.isStyleLoaded()) {
      ensureLayers(map, snapshot);
      return;
    }
    const onLoad = () => ensureLayers(map, snapshot);
    map.once("load", onLoad);
    return () => {
      map.off("load", onLoad);
    };
  }, [map, enabled, snapshot, ensureLayers, removeLayers]);

  // Re-apply after a style swap (e.g. theme change) — setStyle drops custom layers.
  useEffect(() => {
    if (!map) return;
    const onStyleData = () => {
      if (enabled && map.isStyleLoaded() && !map.getSource(SOURCE_ID)) {
        ensureLayers(map, snapshot);
      }
    };
    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  }, [map, enabled, snapshot, ensureLayers]);

  // Push the latest snapshot into the existing source — never rebuilds it.
  useEffect(() => {
    if (!map || !enabled) return;
    if (!map.getSource(SOURCE_ID)) return;
    const data = featuresFor(snapshot);
    if (data) geojsonSource(map)?.setData(data);
  }, [map, enabled, snapshot]);

  return null;
}
