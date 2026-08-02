"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, MapPin, Loader2, Sun, Moon, ChevronDown } from "lucide-react";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";
import { getStationRepository } from "@/infrastructure/mock/provider-registry";
import { useThemeStore } from "@/lib/theme-store";
import { DemoBadge } from "./demo-badge";
import type { StationNode } from "@/entities/station";
import type { GeoJSONFeature } from "@/entities/geojson";

interface TopBarProps {
  showSearch?: boolean;
}

export function TopBar({ showSearch = true }: TopBarProps) {
  const { flyToStation } = useStationUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoJSONFeature<StationNode>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced search — fires 350 ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setIsOpen(false);
      }, 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getStationRepository().search(trimmed);
        setResults(data.features);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(feature: GeoJSONFeature<StationNode>) {
    if (feature.geometry.type !== "Point") return;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    flyToStation({ lng, lat, stationId: feature.properties.station_id });
    setQuery(feature.properties.station_name);
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] shrink-0 transition-colors duration-200 z-20">
      {/* Station scope dropdown */}
      <button className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-[#141b2b] border border-slate-200/60 dark:border-white/10 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-all duration-150 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Dukuh Atas Hub</span>
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {/* Search */}
      {showSearch && (
        <div ref={containerRef} className="flex-1 max-w-sm relative">
          {/* Icon — spinner when loading, magnifier otherwise */}
          {isLoading ? (
            <Loader2
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
            />
          ) : (
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          )}

          <input
            type="text"
            placeholder="Search spatial nodes (e.g. Dukuh Atas)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/90 dark:bg-[#141b2b]/90 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all duration-150 shadow-inner"
          />

          {/* Search results dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                  No matching spatial nodes found
                </div>
              ) : (
                <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {results.map((feature) => {
                    const s = feature.properties;
                    return (
                      <li key={s.station_id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(feature)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50/80 dark:hover:bg-white/[0.06] text-left transition-colors group"
                        >
                          <MapPin
                            size={14}
                            className="text-blue-500 shrink-0 group-hover:scale-110 transition-transform"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {s.station_name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400 truncate mt-0.5">
                              {s.operator} ·{" "}
                              <span
                                className={
                                  s.status === "OPERATIONAL"
                                    ? "text-emerald-500 font-semibold"
                                    : s.status === "CONGESTED"
                                      ? "text-rose-500 font-semibold"
                                      : "text-amber-500 font-semibold"
                                }
                              >
                                {s.status}
                              </span>
                            </p>
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
      )}

      <div className="flex-1" />

      {/* Demo mode indicator */}
      <DemoBadge />

      {/* Theme Toggle Button (mounted check prevents React SSR Hydration Mismatch) */}
      {mounted ? (
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-150 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-[#141b2b] hover:border-slate-300 dark:hover:border-white/20 active:scale-95 shadow-sm"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-indigo-400" />
          )}
        </button>
      ) : (
        <div className="w-8 h-8 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-[#141b2b]" />
      )}

      {/* Notification bell */}
      <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-150 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-[#141b2b] active:scale-95 shadow-sm">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
      </button>

      {/* Avatar */}
      <button className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-mono font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-150">
        OA
      </button>
    </div>
  );
}
