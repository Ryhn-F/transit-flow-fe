"use client";

import { CloudRain } from "lucide-react";
import { useWeatherUIStore } from "../store/weather-ui-store";
import { cn } from "@/lib/utils";

export function FloodDepthFeed() {
  const photos = useWeatherUIStore((s) => s.snapshot?.photos ?? []);
  const feedOpen = useWeatherUIStore((s) => s.feedOpen);
  const setFeedOpen = useWeatherUIStore((s) => s.setFeedOpen);
  const setSelectedFlood = useWeatherUIStore((s) => s.setSelectedFlood);
  const floods = useWeatherUIStore((s) => s.snapshot?.floods ?? []);

  const sorted = [...photos].sort((a, b) => b.capturedAt - a.capturedAt);

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76 transition-all duration-200">
      <button
        type="button"
        onClick={() => setFeedOpen(!feedOpen)}
        className="w-full flex items-center justify-between"
        aria-expanded={feedOpen}
      >
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          Flood Depth Detection
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </h3>
        <span className="text-slate-400 text-[10px] font-mono">{feedOpen ? "▾" : "▸"}</span>
      </button>

      {feedOpen && (
        <div className="mt-3">
          {sorted.length === 0 ? (
            <div className="py-4 text-center space-y-1.5">
              <CloudRain size={16} className="mx-auto text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No flood detections in the last 30 minutes.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {sorted.map((p) => {
                const flood = floods.find((f) => f.id === p.underpassId);
                const lowConfidence = p.confidence < 0.7;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFlood(p.underpassId)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-150 hover:bg-white/[0.05]",
                        lowConfidence
                          ? "bg-amber-500/10 border-amber-500/25"
                          : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <CloudRain size={13} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {flood?.name ?? p.underpassId}
                        </p>
                        <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                          est. depth: <span className="font-bold text-blue-500">{p.estDepthCm} cm</span> · conf {p.confidence.toFixed(2)}
                        </p>
                        <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {p.source}
                        </p>
                        {lowConfidence && (
                          <p className="text-[10px] text-amber-500 mt-0.5">
                            Unverified — verify depth on site
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
