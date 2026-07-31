"use client";

import { MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StationNode } from "@/entities/station";

interface StationInfoCardProps {
  station: StationNode;
}

// Mock VCI data for the selected station (will be real data once endpoint exists)
const MOCK_VCI = { score: 72, pedestrians: "1.2k", riskLevel: "HIGH RISK" };

export function StationInfoCard({ station }: StationInfoCardProps) {
  const isHighRisk = station.status === "CONGESTED" || MOCK_VCI.riskLevel === "HIGH RISK";

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-72">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">
            {station.station_name}
          </h2>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">South Jakarta, ID</span>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
            isHighRisk
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600",
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
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">VCI Score</div>
          <div className="text-2xl font-black text-red-500">
            {MOCK_VCI.score}
            <span className="text-sm font-medium text-gray-400 ml-1">/100</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Pedestrians</div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-gray-900">
              {MOCK_VCI.pedestrians}
            </span>
            <TrendingUp size={14} className="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <AlertTriangle size={12} className="text-orange-400 shrink-0" />
        <span className="text-xs text-gray-500">
          {station.active_exit_count} active exits · {station.operator}
        </span>
      </div>
    </div>
  );
}
