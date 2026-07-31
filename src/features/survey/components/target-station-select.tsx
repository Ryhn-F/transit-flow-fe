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
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        Target Station
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none bg-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-transparent transition-colors",
            error && "border-red-500",
            isLoading && "opacity-60 cursor-wait",
          )}
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? "Loading stations..." : "Select a station..."}
          </option>
          {stations.map((f) => (
            <option key={f.properties.station_id} value={f.properties.station_id}>
              {f.properties.station_name} ({f.properties.operator})
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
