"use client";

import { BarChart2, DoorOpen, Shield, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";

const LAYERS = [
  { key: "crowdDensity" as const, label: "Crowd Density", icon: BarChart2 },
  { key: "exitGates" as const, label: "Exit Gates", icon: DoorOpen },
  { key: "temporaryBufferZone" as const, label: "Temporary Buffer Zone", icon: Shield },
  { key: "aiRecommendations" as const, label: "AI Recommendations", icon: Bot },
];

export function ActiveLayersPanel() {
  const { layers, toggleLayer } = useStationUIStore();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-72">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Active Layers
      </h3>
      <div className="space-y-2.5">
        {LAYERS.map(({ key, label, icon: Icon }) => {
          const isActive = layers[key];
          return (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                onClick={() => toggleLayer(key)}
                className={cn(
                  "w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                  isActive
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 hover:border-blue-400",
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
              <span
                className={cn(
                  "text-sm flex-1 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-400",
                )}
              >
                {label}
              </span>
              <Icon
                size={15}
                className={cn(
                  "transition-colors",
                  isActive ? "text-blue-600" : "text-gray-300",
                )}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
