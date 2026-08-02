"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { MapCanvas } from "@/components/shared/map-canvas";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { useKioskStore } from "./store/kiosk-store";
import { useKioskDriver } from "./hooks/use-kiosk-driver";
import { kioskSquareFeature, validateKioskPlacement } from "./lib/constraints";
import { KIOSK_CORRIDORS, KIOSK_POIS, SES_BANDS, ZERO_CHOKE_ZONES } from "./fixtures/kiosk-fixtures";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function KioskMap({ onMapReady }: { onMapReady: (map: MapLibreMap) => void }) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const { kiosks, selectedKioskId, setSelected, placeKiosk, moveKiosk, sesOn, poisOn, violation, setViolation } = useKioskStore();
  const dragRef = useRef<{ id: string } | null>(null);

  useEffect(() => {
    if (!map) return;

    for (const id of ["kiosk-feet", "kiosk-selected", "kiosk-zones", "kiosk-ses", "kiosk-pois", "kiosk-corridors"]) {
      if (map.getSource(id)) {
        const src = map.getSource(id);
        if (src && "setData" in src) {
          const features: GeoJSON.Feature[] = [];
          if (id === "kiosk-feet") features.push(...kiosks.filter((k) => k.id !== selectedKioskId).map(kioskSquareFeature));
          if (id === "kiosk-selected") features.push(...kiosks.filter((k) => k.id === selectedKioskId).map(kioskSquareFeature));
          if (id === "kiosk-zones") features.push(...ZERO_CHOKE_ZONES.map((z) => ({ type: "Feature", geometry: z.polygon, properties: { id: z.id } } as GeoJSON.Feature)));
          if (id === "kiosk-ses" && sesOn) features.push(...SES_BANDS.slice(0, 2).map((b, i) => ({ type: "Feature", geometry: ZERO_CHOKE_ZONES[i % 2].polygon, properties: { id: b.id } } as GeoJSON.Feature)));
          if (id === "kiosk-pois" && poisOn) features.push(...KIOSK_POIS.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: p.coordinates } as GeoJSON.Point, properties: { id: p.id } } as GeoJSON.Feature)));
          if (id === "kiosk-corridors") features.push(...KIOSK_CORRIDORS.map((c) => ({ type: "Feature", geometry: { type: "LineString", coordinates: c.segment } as GeoJSON.LineString, properties: { id: c.id } } as GeoJSON.Feature)));
          (src as { setData: (d: unknown) => void }).setData({ type: "FeatureCollection", features });
        }
      }
    }
  }, [map, kiosks, selectedKioskId, sesOn, poisOn]);

  useEffect(() => {
    if (!map) return;
    const onDown = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ["kiosk-feet", "kiosk-selected"] });
      const id = hit[0]?.properties?.id as string | undefined;
      if (id) {
        dragRef.current = { id };
        setSelected(id);
        map.getCanvas().style.cursor = "move";
        e.originalEvent.preventDefault();
      }
    };
    const onMove = (e: MapMouseEvent) => {
      if (dragRef.current) {
        moveKiosk(dragRef.current.id, [e.lngLat.lng, e.lngLat.lat]);
      }
    };
    const onUp = () => {
      if (!dragRef.current) return;
      const kiosk = useKioskStore.getState().kiosks.find((k) => k.id === dragRef.current!.id);
      dragRef.current = null;
      if (kiosk) {
        const violation = validateKioskPlacement(kiosk, KIOSK_CORRIDORS);
        if (violation) {
          setViolation("2.5 m walkway violated — kiosk snapped back");
          toast.error("Kiosk blocks the 2.5 m clear walkway — move it");
        } else {
          setViolation(null);
        }
      }
      map.getCanvas().style.cursor = "grab";
    };
    const onClick = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ["kiosk-feet", "kiosk-selected"] });
      const id = hit[0]?.properties?.id as string | undefined;
      if (id) setSelected(id);
    };
    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    map.on("click", onClick);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.off("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReady = (map: MapLibreMap) => {
    setMap(map);
    for (const id of ["kiosk-feet", "kiosk-selected", "kiosk-zones", "kiosk-ses", "kiosk-pois", "kiosk-corridors"]) {
      map.addSource(id, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    }
    map.addLayer({ id: "kiosk-zones-fill", type: "fill", source: "kiosk-zones", paint: { "fill-color": "#10b981", "fill-opacity": 0.12 } });
    map.addLayer({ id: "kiosk-ses-fill", type: "fill", source: "kiosk-ses", paint: { "fill-color": "#f59e0b", "fill-opacity": 0.18 } });
    map.addLayer({ id: "kiosk-pois-dot", type: "circle", source: "kiosk-pois", paint: { "circle-radius": 4, "circle-color": "#94a3b8" } });
    map.addLayer({ id: "kiosk-corridors-line", type: "line", source: "kiosk-corridors", paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [4, 2], "line-opacity": 0.7 } });
    map.addLayer({ id: "kiosk-feet-fill", type: "fill", source: "kiosk-feet", paint: { "fill-color": "#f59e0b", "fill-opacity": 0.5, "fill-outline-color": "#d97706" } });
    map.addLayer({ id: "kiosk-selected-fill", type: "fill", source: "kiosk-selected", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.6, "fill-outline-color": "#2563eb" } });
    map.on("click", (e) => {
      if (e.originalEvent.shiftKey) {
        placeKiosk([e.lngLat.lng, e.lngLat.lat]);
        toast.success("Kiosk placed — 3×3 m footprint");
      }
    });
    onMapReady(map);
  };

  return <MapCanvas onMapReady={handleReady} />;
}

export function KioskView() {
  useKioskDriver();
  const {
    kiosks,
    selectedKioskId,
    sesOn,
    setSesOn,
    poisOn,
    setPoisOn,
    violation,
    permits,
    issuePermit,
    setProposalOpen,
  } = useKioskStore();
  const [mapReady, setMapReady] = useState(false);

  const selected = kiosks.find((k) => k.id === selectedKioskId) ?? null;

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
          <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Kiosk Studio</h1>
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
            Shift+Click places a kiosk
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSesOn(!sesOn)}
            aria-pressed={sesOn}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 transition-colors"
          >
            SES Overlay
          </button>
          <button
            type="button"
            onClick={() => setPoisOn(!poisOn)}
            aria-pressed={poisOn}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 transition-colors"
          >
            POIs
          </button>
          <button
            type="button"
            onClick={() => setProposalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 transition-colors"
          >
            Generate Proposal
          </button>
        </div>

        <div className="flex-1 relative min-h-0">
          <KioskMap onMapReady={() => setMapReady(true)} />

          {violation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold glow-crimson">
              {violation}
            </div>
          )}

          {/* Revenue panel */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-64">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
                Revenue Estimator
              </h3>
              {!selected ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  Select a kiosk footprint to estimate revenue.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Visibility</span>
                    <span className="font-mono text-sm font-bold text-blue-500">{selected.visibility}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selected.visibility}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Projected /mo</span>
                    <span className="font-mono text-sm font-bold text-emerald-500">
                      Rp {selected.monthlyRevenueIdr.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Payback</span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {selected.paybackMonths} months
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permit desk */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none max-h-[70%] overflow-y-auto scrollbar-thin">
            <div className="pointer-events-auto bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-72">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
                Vendor Permits
              </h3>
              <ul className="space-y-2">
                {permits.map((p) => (
                  <li
                    key={p.id}
                    className={cn(
                      "px-3 py-2 rounded-xl border",
                      p.status === "VIOLATION"
                        ? "bg-rose-500/10 border-rose-500/25"
                        : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{p.vendorName}</p>
                      <span
                        className={cn(
                          "font-mono text-[8px] font-bold uppercase",
                          p.status === "VIOLATION" ? "text-rose-400" : "text-emerald-500",
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                      {p.id} · expires {new Date(p.expiresAt).toLocaleDateString("en-GB")}
                    </p>
                    {p.status === "VIOLATION" && (
                      <button
                        type="button"
                        onClick={() => issuePermit(p.id)}
                        className="mt-2 w-full px-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
                      >
                        Issue New Permit
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
