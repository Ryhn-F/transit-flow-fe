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
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl p-4 w-72 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
            {station.station_name}
          </h2>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500">South Jakarta, ID</span>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
            isHighRisk
              ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
              : "bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isHighRisk ? "bg-red-500" : "bg-green-500",
            )}
          />
          {MOCK_VCI.riskLevel}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-gray-50 dark:bg-slate-800/80 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">VCI Score</div>
          <div className="text-2xl font-black text-red-500">
            {MOCK_VCI.score}
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 ml-1">/100</span>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/80 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pedestrians</div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {MOCK_VCI.pedestrians}
            </span>
            <TrendingUp size={14} className="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
        <AlertTriangle size={12} className="text-orange-400 shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {station.active_exit_count} active exits · {station.operator}
        </span>
      </div>
    </div>
  );
}
