"use client";

import { useStationsQuery } from "@/features/stations/hooks/use-stations-query";
import { cn } from "@/lib/utils";

interface TargetStationSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TargetStationSelect({
  value,
  onChange,
  error,
}: TargetStationSelectProps) {
  const { data, isLoading } = useStationsQuery();
  const stations = data?.features ?? [];

  return (
    <div>
      <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5">
        Target Station Node
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none bg-slate-100 dark:bg-[#141b2b] text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 border border-slate-200/80 dark:border-white/10 transition-all duration-150 shadow-inner",
            error && "border-rose-500",
            isLoading && "opacity-60 cursor-wait",
          )}
          disabled={isLoading}
        >
          <option value="" className="bg-white dark:bg-[#0c1019] text-slate-900 dark:text-slate-100">
            {isLoading ? "Loading station registry..." : "Select target station node..."}
          </option>
          {stations.map((f) => (
            <option key={f.properties.station_id} value={f.properties.station_id} className="bg-white dark:bg-[#0c1019] text-slate-900 dark:text-slate-100">
              {f.properties.station_name} ({f.properties.operator})
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
