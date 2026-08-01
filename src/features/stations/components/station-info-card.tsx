"use client";

import { MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StationNode } from "@/entities/station";

interface StationInfoCardProps {
  station: StationNode;
}

const MOCK_VCI = { score: 72, pedestrians: "1.2k", riskLevel: "HIGH RISK" };

export function StationInfoCard({ station }: StationInfoCardProps) {
  const isHighRisk = station.status === "CONGESTED" || MOCK_VCI.riskLevel === "HIGH RISK";

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4.5 w-76 transition-all duration-200 relative overflow-hidden group">
      {/* Subtle top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          isHighRisk ? "bg-rose-500 glow-crimson" : "bg-emerald-500 glow-emerald"
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
            {station.station_name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={11} className="text-blue-500 shrink-0" />
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-400 tracking-wider">
              LAT: -6.2088 | LNG: 106.8272
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider shrink-0 border border-transparent shadow-sm",
            isHighRisk
              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              isHighRisk ? "bg-rose-500" : "bg-emerald-500",
            )}
          />
          {MOCK_VCI.riskLevel}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-3">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-[0.15em] mb-1">
            VCI Score
          </div>
          <div className="text-2xl font-mono font-black text-rose-500 tracking-tight">
            {MOCK_VCI.score}
            <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-3">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-[0.15em] mb-1">
            Pedestrians
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
              {MOCK_VCI.pedestrians}
            </span>
            <TrendingUp size={15} className="text-amber-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-400 tracking-wide">
          {station.active_exit_count} Active Exits · {station.operator}
        </span>
      </div>
    </div>
  );
}
