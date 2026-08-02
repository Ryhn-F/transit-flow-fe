"use client";

import { BarChart2, DoorOpen, Shield, Bot, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";

const LAYERS = [
  { key: "crowdDensity" as const, label: "Crowd Density", icon: BarChart2 },
  { key: "exitGates" as const, label: "Exit Gates", icon: DoorOpen },
  { key: "temporaryBufferZone" as const, label: "Temporary Buffer Zone", icon: Shield },
  { key: "aiRecommendations" as const, label: "AI Recommendations", icon: Bot },
  { key: "vciHeatmap" as const, label: "Live VCI Heatmap", icon: Activity },
];

export function ActiveLayersPanel() {
  const { layers, toggleLayer } = useStationUIStore();

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4.5 w-76 transition-all duration-200">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
        <span>Active Spatial Layers</span>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
      </h3>
      <div className="space-y-2">
        {LAYERS.map(({ key, label, icon: Icon }) => {
          const isActive = layers[key];
          return (
            <div
              key={key}
              onClick={() => toggleLayer(key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer select-none",
                isActive
                  ? "bg-blue-500/10 border-blue-500/30 text-slate-900 dark:text-white shadow-sm"
                  : "bg-transparent border-transparent hover:bg-slate-100/70 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                  isActive
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "border-slate-300 dark:border-white/20 bg-transparent",
                )}
              >
                {isActive && (
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                  >
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs font-semibold flex-1 tracking-tight">
                {label}
              </span>
              <Icon
                size={14}
                className={cn(
                  "transition-colors",
                  isActive ? "text-blue-500" : "text-slate-400 dark:text-slate-500",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
