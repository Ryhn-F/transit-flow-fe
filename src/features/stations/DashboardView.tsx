"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Map as MapLibreMap, Marker } from "maplibre-gl";
import { AppShell } from "@/components/shared/app-shell";
import { MapCanvas } from "@/components/shared/map-canvas";
import { StationInfoCard } from "./components/station-info-card";
import { ActiveLayersPanel } from "./components/active-layers-panel";
import { LiveAlertsPanel } from "./components/live-alerts-panel";
import { StatsFooter } from "./components/stats-footer";
import { useStationsQuery } from "./hooks/use-stations-query";
import { useSelectedStation } from "./hooks/use-selected-station";
import { useStationUIStore } from "./store/station-ui-store";

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: "#22c55e",
  CONGESTED: "#ef4444",
  MAINTENANCE: "#f59e0b",
};

export function DashboardView() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  // mapReady is a state flag so effects re-run when the map becomes available
  const [mapReady, setMapReady] = useState(false);
  const { data: stationsData } = useStationsQuery();
  const selectedStation = useSelectedStation();
  const { selectStation, flyToTarget, clearFlyTo } = useStationUIStore();

  // Fly to station when selected from search bar
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: 14,
      duration: 800,
    });
    clearFlyTo();
  }, [flyToTarget, clearFlyTo]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  const renderMarkers = useCallback(
    (map: MapLibreMap) => {
      if (!stationsData) return;
      clearMarkers();

      stationsData.features.forEach((feature) => {
        if (feature.geometry.type !== "Point") return;
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const station = feature.properties;
        const color = STATUS_COLORS[station.status] ?? "#6366f1";

        const el = document.createElement("div");
        el.style.cssText = `
          width: 20px; height: 20px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        `;

        const dot = document.createElement("div");
        dot.style.cssText = `
          width: 14px; height: 14px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.15s ease;
          transform-origin: center;
        `;
        el.appendChild(dot);

        el.onmouseover = () => (dot.style.transform = "scale(1.4)");
        el.onmouseout = () => (dot.style.transform = "scale(1)");

        const marker = new Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        el.addEventListener("click", () => {
          selectStation(station.station_id);
          map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
        });

        markersRef.current.push(marker);
      });
    },
    [stationsData, selectStation],
  );

  // Render markers whenever EITHER the map becomes ready OR data arrives.
  // Using mapReady state (not just mapRef) ensures this effect re-fires when
  // the map finishes loading — avoiding the stale-closure race where the
  // map.on('load') callback captured a renderMarkers with no data yet.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !stationsData) return;
    renderMarkers(mapRef.current);
  }, [mapReady, stationsData, renderMarkers]);

  // Stable callback — no dependency on renderMarkers so MapCanvas's frozen
  // closure always calls the correct function regardless of load order.
  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  return (
    <AppShell>
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <MapCanvas onMapReady={handleMapReady} />
      </div>

      {/* Overlay column — top-left floating panels */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 z-10 pointer-events-none">
        {selectedStation && (
          <div className="pointer-events-auto">
            <StationInfoCard station={selectedStation} />
          </div>
        )}
        <div className="pointer-events-auto">
          <ActiveLayersPanel />
        </div>
        <div className="pointer-events-auto overflow-y-auto max-h-64">
          <LiveAlertsPanel />
        </div>
      </div>

      {/* Stats footer */}
      <StatsFooter />
    </AppShell>
  );
}
