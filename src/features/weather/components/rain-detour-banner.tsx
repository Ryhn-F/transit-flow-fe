"use client";

import { CloudRainWind } from "lucide-react";
import { useWeatherUIStore } from "../store/weather-ui-store";

export function RainDetourBanner() {
  const autoEnabled = useWeatherUIStore((s) => s.autoEnabled);
  const bannerAcked = useWeatherUIStore((s) => s.bannerAcked);
  const setBannerAcked = useWeatherUIStore((s) => s.setBannerAcked);
  const snapshot = useWeatherUIStore((s) => s.snapshot);

  if (!autoEnabled || bannerAcked) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-30 flex items-center gap-3 px-5 py-2.5 border-b bg-amber-500/10 border-amber-500/30 backdrop-blur-xl glow-amber shrink-0"
    >
      <CloudRainWind size={15} className="text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">
          HEAVY RAIN — {snapshot?.reading.rainfallMmHr ?? "—"} mm/hr — Rain Detour auto-enabled
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          Covered routes are now preferred for commuter trips.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setBannerAcked(true)}
        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/25 border border-amber-400/30 transition-all duration-150 active:scale-95 shrink-0"
      >
        Acknowledge
      </button>
    </div>
  );
}
