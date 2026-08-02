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
import { useVCIDriver } from "@/infrastructure/mock/use-vci-driver";
import { useBufferDriver } from "@/infrastructure/mock/use-buffer-driver";
import { useWeatherDriver } from "@/infrastructure/mock/use-weather-driver";
import { VciHeatmapLayer } from "@/features/vci/components/vci-heatmap-layer";
import { VciInspectorPopover } from "@/features/vci/components/vci-inspector-popover";
import { ChokeAlertBanner } from "@/features/vci/components/choke-alert-banner";
import { AlertChannelFeed } from "@/features/vci/components/alert-channel-feed";
import { RecalcCountdown } from "@/features/vci/components/recalc-countdown";
import { RainModeOverlay } from "@/features/weather/components/rain-mode-overlay";
import { RainfallChip } from "@/features/weather/components/rainfall-chip";
import { FloodDepthFeed } from "@/features/weather/components/flood-depth-feed";
import { DetourPanel } from "@/features/weather/components/detour-panel";
import { RainSafePathModal } from "@/features/weather/components/rain-safe-path-modal";
import { RainDetourBanner } from "@/features/weather/components/rain-detour-banner";
import { useSpatialEditor } from "@/features/buffer-allocator/map/use-spatial-editor";
import { BufferEditorTools } from "@/features/buffer-allocator/components/buffer-editor-tools";
import { BufferExportButton } from "@/features/buffer-allocator/components/buffer-export-button";
import { BarrierToggleCard } from "@/features/buffer-allocator/components/barrier-toggle-card";
import { CurbSlotPanel } from "@/features/buffer-allocator/components/curb-slot-panel";
import { DispatchExportModal } from "@/features/buffer-allocator/components/dispatch-export-modal";
import { useEditorStore } from "@/features/buffer-allocator/store/editor-store";

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: "#22c55e",
  CONGESTED: "#ef4444",
  MAINTENANCE: "#f59e0b",
};

export function DashboardView() {
  useVCIDriver();
  useBufferDriver();
  useWeatherDriver();
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { data: stationsData } = useStationsQuery();
  const selectedStation = useSelectedStation();
  const { selectStation, flyToTarget, clearFlyTo, layers } = useStationUIStore();
  const bufferEnabled = layers.temporaryBufferZone;

  useSpatialEditor(mapInstance, bufferEnabled);

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
    setMapInstance(map);
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

  return (
    <AppShell>
      {/* Map area — banner flows above; all floating controls anchor to the map area below it */}
      <div className="absolute inset-0 flex flex-col">
        <ChokeAlertBanner />
        <RainDetourBanner />
        <div className="relative flex-1 min-h-0">
          <MapCanvas onMapReady={handleMapReady} />
          <VciHeatmapLayer map={mapInstance} enabled={layers.vciHeatmap} />
          <VciInspectorPopover map={mapInstance} />
          <RainModeOverlay map={mapInstance} enabled={layers.rainMode} />
          <RainfallChip />

          {/* Buffer allocator — editor tools & layers */}
          {bufferEnabled && (
            <>
              <BufferEditorTools />
              <BufferExportButton />
            </>
          )}

          {/* Spatial Draw & Layer Controls */}
          <MapDrawControl
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
            <div className="pointer-events-auto">
              <AlertChannelFeed />
            </div>
            {layers.rainMode && (
              <div className="pointer-events-auto">
                <FloodDepthFeed />
              </div>
            )}
            {bufferEnabled && (
              <>
                <div className="pointer-events-auto">
                  <BarrierToggleCards />
                </div>
                <div className="pointer-events-auto">
                  <CurbSlotPanel />
                </div>
              </>
            )}
          </div>

          {/* Rain detour panel — bottom-left above countdown */}
          {layers.rainMode && (
            <div className="absolute bottom-16 left-4 z-10">
              <DetourPanel />
            </div>
          )}

          {/* Recalc countdown chip — bottom-left */}
          <div className="absolute bottom-4 left-4 z-10">
            <RecalcCountdown />
          </div>

          {/* Stats footer */}
          <StatsFooter />
        </div>
      </div>

      {/* Buffer dispatch export modal */}
      <DispatchExportModal />

      {/* Rain Safe-Path commuter preview */}
      <RainSafePathModal />
    </AppShell>
  );
}

function BarrierToggleCards() {
  const barriers = useEditorStore((s) => s.barriers);
  if (barriers.length === 0) return null;
  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76 transition-all duration-200">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">
        Barrier Simulator
      </h3>
      <div className="space-y-2">
        {barriers.map((b) => (
          <BarrierToggleCard key={b.id} barrierId={b.id} />
        ))}
      </div>
    </div>
  );
}
