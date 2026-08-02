"use client";

import { AlertTriangle, Route } from "lucide-react";
import { useWeatherUIStore } from "../store/weather-ui-store";
import { COMMUTERS_REROUTED } from "@/infrastructure/mock/fixtures/weather-fixtures";
import { cn } from "@/lib/utils";

export function DetourPanel() {
  const detours = useWeatherUIStore((s) => s.detours);
  const autoEnabled = useWeatherUIStore((s) => s.autoEnabled);
  const mode = useWeatherUIStore((s) => s.mode);
  const selectedRouteId = useWeatherUIStore((s) => s.selectedRouteId);
  const setSelectedRoute = useWeatherUIStore((s) => s.setSelectedRoute);
  const setModalOpen = useWeatherUIStore((s) => s.setModalOpen);

  if (!autoEnabled && mode !== "override") return null;

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
          Rain Detour Routing
        </h3>
        {mode === "override" && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
            MANUAL OVERRIDE
          </span>
        )}
      </div>

      <p className="font-mono text-[10px] text-emerald-500 mb-3">
        {COMMUTERS_REROUTED.toLocaleString()} commuters rerouted to covered route C
      </p>

      {detours.length === 0 ? (
        <div className="py-4 text-center space-y-1.5">
          <AlertTriangle size={15} className="mx-auto text-amber-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No covered alternative available for this trip
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {detours.map((route) => (
            <li key={route.id}>
              <button
                type="button"
                onClick={() =>
                  setSelectedRoute(selectedRouteId === route.id ? null : route.id)
                }
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all duration-150",
                  selectedRouteId === route.id
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/30 glow-emerald"
                    : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06] hover:bg-white/[0.05]",
                )}
              >
                <Route size={13} className="text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {route.id.replace("ROUTE-", "Route ")} · +{route.timeDeltaMin} min
                  </p>
                  <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {route.coveredPct}% covered
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-3 w-full px-3 py-2 rounded-xl text-xs font-semibold border border-blue-500/30 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
      >
        Preview commuter view
      </button>
    </div>
  );
}
