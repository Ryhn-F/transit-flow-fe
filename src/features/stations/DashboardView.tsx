"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Map as MapLibreMap, Marker } from "maplibre-gl";
import { AppShell } from "@/components/shared/app-shell";
import { MapCanvas } from "@/components/shared/map-canvas";
import { MapDrawControl } from "@/components/shared/MapDrawControl";
import { StationInfoCard } from "./components/station-info-card";
import { ActiveLayersPanel } from "./components/active-layers-panel";
import { LiveAlertsPanel } from "./components/live-alerts-panel";
import { StatsFooter } from "./components/stats-footer";
import { useStationsQuery } from "./hooks/use-stations-query";
import { useSelectedStation } from "./hooks/use-selected-station";
import { useStationUIStore } from "./store/station-ui-store";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: "#22c55e",
  CONGESTED: "#ef4444",
  MAINTENANCE: "#f59e0b",
};

export function DashboardView() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { data: stationsData } = useStationsQuery();
  const selectedStation = useSelectedStation();
  const { selectStation, flyToTarget, clearFlyTo } = useStationUIStore();

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

  useEffect(() => {
    if (!mapReady || !mapRef.current || !stationsData) return;
    renderMarkers(mapRef.current);
  }, [mapReady, stationsData, renderMarkers]);

  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const handleExportGeoJSON = () => {
    if (!stationsData) {
      toast.error("No spatial data available to export");
      return;
    }
    const blob = new Blob([JSON.stringify(stationsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "station-spatial-nodes.geojson";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported spatial GeoJSON file!");
  };

  const handleToggleEdit = () => {
    setIsEditing((prev) => {
      const next = !prev;
      if (next) {
        toast.info("Spatial Editor Active: Map feature drawing enabled");
      } else {
        toast.info("Spatial Editor Inactive: Returned to View Mode");
      }
      return next;
    });
  };

  return (
    <AppShell>
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <MapCanvas onMapReady={handleMapReady} />
      </div>

      {/* Spatial Draw & Layer Controls */}
      <MapDrawControl
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onExportGeoJSON={handleExportGeoJSON}
        featuresCount={stationsData?.features?.length || 0}
      />

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
