"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { X } from "lucide-react";
import { useVCILiveStore } from "../store/vci-live-store";
import { useVCIUIStore } from "../store/vci-ui-store";
import { bandOf } from "../lib/vci-formula";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";
import { stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";
import { cn } from "@/lib/utils";

export function VciInspectorPopover({ map }: { map: MapLibreMap | null }) {
  const { selectedZone, selectZone } = useVCIUIStore();
  const snapshot = useVCILiveStore((s) => s.snapshot);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !selectedZone) return;
    const update = () => setPos(map.project([selectedZone.lng, selectedZone.lat]));
    update();
    map.on("move", update);
    map.on("zoom", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [map, selectedZone]);

  useEffect(() => {
    if (!selectedZone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectZone(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedZone, selectZone]);

  useEffect(() => {
    if (!selectedZone) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        selectZone(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedZone, selectZone]);

  if (!selectedZone || !snapshot || !map || !pos) return null;

  const metric = snapshot.metrics.find((m) => m.channel_id === selectedZone.channelId);
  const zone = metric ? bandOf(metric.vci_score) : null;
  const stationId = stationOfChannel(selectedZone.channelId);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="VCI zone inspector"
      className="absolute z-20 w-64 bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, calc(-100% - 14px))" }}
    >
      <button
        type="button"
        aria-label="Close inspector"
        onClick={() => selectZone(null)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
      >
        <X size={12} />
      </button>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
          {stationName(stationId)} · {channelName(selectedZone.channelId)}
        </h3>
        {zone && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full font-mono text-[8px] font-bold uppercase tracking-wider border",
              zone === "RED" ? "bg-rose-500/10 text-rose-400 border-rose-500/25" : zone === "YELLOW" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
            )}
          >
            {zone}
          </span>
        )}
      </div>

      {!metric ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No metric for this zone yet</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-2.5">
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">VCI Score</div>
              <div className={cn("text-xl font-mono font-black tracking-tight", metric.vci_score >= 80 ? "text-rose-500" : metric.vci_score >= 50 ? "text-amber-500" : "text-emerald-500")}>
                {metric.effective_width_m <= 0 ? "—" : metric.vci_score}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-2.5">
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Ped Flow</div>
              <div className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tight">{metric.pedestrian_flow_rate_ppm}</div>
            </div>
            <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-2.5">
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Drop-off Surge</div>
              <div className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tight">{metric.vehicular_dropoff_surge_vpm}</div>
            </div>
            <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-2.5">
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Width × α</div>
              <div className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
                {metric.effective_width_m > 0 ? `${metric.effective_width_m} × ${metric.compliance_factor}` : "EXIT CLOSED"}
              </div>
            </div>
          </div>

          <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">
            Formula: (PED + SURGE) / (WIDTH × α)
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-[#141b2b] rounded-lg px-2.5 py-2">
            ({metric.pedestrian_flow_rate_ppm} + {metric.vehicular_dropoff_surge_vpm}) / ({metric.effective_width_m > 0 ? metric.effective_width_m : 0} × {metric.compliance_factor}) = <span className={metric.vci_score >= 80 ? "text-rose-400 font-bold" : "text-slate-900 dark:text-white font-bold"}>{metric.vci_score}</span>
          </div>
        </>
      )}
    </div>
  );
}
