"use client";

import { CloudRain, Droplets } from "lucide-react";
import { useWeatherUIStore } from "../store/weather-ui-store";
import { RAIN_THRESHOLD_MMHR } from "@/entities/weather";
import { cn } from "@/lib/utils";

export function RainfallChip() {
  const snapshot = useWeatherUIStore((s) => s.snapshot);
  const mode = useWeatherUIStore((s) => s.mode);
  const autoEnabled = useWeatherUIStore((s) => s.autoEnabled);

  if (!snapshot) return null;
  const { rainfallMmHr } = snapshot.reading;
  const heavy = rainfallMmHr >= RAIN_THRESHOLD_MMHR;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-xl shadow-lg transition-all duration-300",
          heavy
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
            : rainfallMmHr > 12
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-white/95 dark:bg-[#0c1019]/95 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400",
        )}
      >
        <Droplets size={13} className="shrink-0" />
        <span className="font-mono text-xs font-bold tabular-nums">
          {rainfallMmHr} mm/hr
        </span>
        <span className="text-[10px] font-medium">
          {rainfallMmHr >= 41 ? "monsoon" : heavy ? "heavy rain" : rainfallMmHr > 12 ? "moderate" : "light rain"}
        </span>
      </div>

      {autoEnabled && (
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-semibold">
          Rain Detour Active
        </span>
      )}

      {mode === "override" && (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold shadow-amber-500/40 glow-amber">
          MANUAL OVERRIDE
        </span>
      )}

      {snapshot.floods.length === 0 && (
        <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#0c1019]/95 border border-slate-200/80 dark:border-white/[0.08] text-slate-400 text-[10px] font-semibold">
          <CloudRain size={11} className="inline mr-1" />
          No flood detections
        </span>
      )}
    </div>
  );
}
