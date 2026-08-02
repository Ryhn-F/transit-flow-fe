"use client";

import { Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { DemoBadge } from "@/components/shared/demo-badge";
import { useLiveDriver } from "@/infrastructure/mock/use-live-driver";
import { useDemoModeGate } from "./hooks/use-demo-mode-gate";
import { ExtractionQueueList } from "./components/extraction-queue-list";
import { ExtractionDetailDrawer } from "./components/extraction-detail-drawer";
import { SlaTicker } from "./components/sla-ticker";
import { useAiIngestionUIStore } from "./store/ai-ingestion-ui-store";
import { useStationsQuery } from "@/features/stations/hooks/use-stations-query";
import { cn } from "@/lib/utils";
import type { AiExtractionStatus } from "@/entities/ai-extraction";

const STATUS_FILTERS: Array<AiExtractionStatus | "ALL"> = [
  "ALL",
  "REVIEW",
  "EXTRACTING",
  "QUEUED",
  "APPROVED",
  "REJECTED",
];

export function IngestionQueueView() {
  useLiveDriver();
  const demoMode = useDemoModeGate();

  const { filters, setFilter } = useAiIngestionUIStore();
  const { data: stationsData } = useStationsQuery();

  if (!demoMode) {
    return (
      <AppShell showSearch={false}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Sparkles size={20} className="mx-auto text-blue-500" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              AI Ingestion is a demo-mode surface
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Set NEXT_PUBLIC_DEMO_MODE=true to explore the mock pipeline
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
              INGESTION QA QUEUE
            </h1>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Sini AI Parsing Engine · Review Pipeline
            </p>
          </div>
          <SlaTicker />
          <DemoBadge />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search queue (id / survey / gate)…"
              value={filters.q}
              onChange={(e) => setFilter({ q: e.target.value })}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/90 dark:bg-[#141b2b]/90 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter({ status: s })}
                aria-pressed={filters.status === s}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider border transition-all duration-150",
                  filters.status === s
                    ? "bg-blue-600 text-white border-blue-400/30 shadow-md shadow-blue-600/25"
                    : "bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <select
            aria-label="Filter by station"
            value={filters.stationId}
            onChange={(e) => setFilter({ stationId: e.target.value })}
            className="bg-slate-100 dark:bg-[#141b2b] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-white/10 focus:outline-none focus:border-blue-500/60"
          >
            <option value="">ALL STATIONS</option>
            {(stationsData?.features ?? []).map((f) => (
              <option key={f.properties.station_id} value={f.properties.station_id}>
                {f.properties.station_name}
              </option>
            ))}
          </select>
        </div>

        {/* Queue */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ExtractionQueueList />
        </div>
      </div>

      {/* Detail drawer */}
      <ExtractionDetailDrawer />
    </AppShell>
  );
}
