"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker } from "maplibre-gl";
import { MapCanvas } from "@/components/shared/map-canvas";
import { useCCStore } from "../store/cc-store";
import { AGENCIES } from "../types";
import { DEMO_STATIONS } from "@/infrastructure/mock/fixtures/stations";

const AGENCY_COLORS: Record<string, string> = {
  DISHUB: "#60a5fa",
  POLRI: "#fb7185",
  KAI: "#34d399",
  MRT: "#fbbf24",
};

export function CCIncidentMap({
  onMapReady,
  onIncidentClick,
}: {
  onMapReady: (map: MapLibreMap) => void;
  onIncidentClick: (incidentId: string) => void;
}) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const incidents = useCCStore((s) => s.incidents);
  const wardens = useCCStore((s) => s.wardens);
  const selectedIncidentId = useCCStore((s) => s.selectedIncidentId);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // station dots
    for (const f of DEMO_STATIONS.features) {
      if (f.geometry.type !== "Point") continue;
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const el = document.createElement("div");
      el.style.cssText = "width:12px;height:12px;border-radius:50%;background:#64748b;border:2px solid white;opacity:0.8;";
      markersRef.current.push(new Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
    }

    // wardens
    for (const w of wardens) {
      const el = document.createElement("div");
      const color = AGENCY_COLORS[w.agency] ?? "#94a3b8";
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color};display:flex;align-items:center;justify-content:center;`;
      el.title = `${w.name} · ${w.status}`;
      const m = new Marker({ element: el }).setLngLat(w.position).addTo(map);
      markersRef.current.push(m);
    }

    // incidents
    for (const inc of incidents) {
      if (inc.resolved) continue;
      const el = document.createElement("div");
      const color = inc.severity === "CRITICAL" ? "#f43f5e" : "#f59e0b";
      const selected = inc.id === selectedIncidentId;
      el.style.cssText = `width:${selected ? 20 : 14}px;height:${selected ? 20 : 14}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 10px ${color};cursor:pointer;transition:all 150ms;`;
      el.onclick = () => onIncidentClick(inc.id);
      const m = new Marker({ element: el }).setLngLat(inc.position).addTo(map);
      markersRef.current.push(m);
    }
  }, [incidents, wardens, selectedIncidentId, onIncidentClick]);

  const handleReady = (map: MapLibreMap) => {
    mapRef.current = map;
    onMapReady(map);
  };

  return <MapCanvas onMapReady={handleReady} />;
}
