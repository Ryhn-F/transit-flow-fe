"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, ChevronDown, MapPin, Loader2 } from "lucide-react";
import { useStationUIStore } from "@/features/stations/store/station-ui-store";
import { stationRepository } from "@/infrastructure/repositories/station-repository";
import type { StationNode } from "@/entities/station";
import type { GeoJSONFeature } from "@/entities/geojson";

interface TopBarProps {
  showSearch?: boolean;
}

export function TopBar({ showSearch = true }: TopBarProps) {
  const { flyToStation } = useStationUIStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoJSONFeature<StationNode>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const data = await stationRepository.search(trimmed);
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
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Station scope dropdown */}
      <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
        <span>Dukuh Atas</span>
        <ChevronDown size={14} />
      </button>

      {/* Search */}
      {showSearch && (
        <div ref={containerRef} className="flex-1 max-w-sm relative">
          {/* Icon — spinner when loading, magnifier otherwise */}
          {isLoading ? (
            <Loader2
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
            />
          ) : (
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          )}

          <input
            type="text"
            placeholder="Search station..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />

          {/* Dropdown results */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">
                  No stations found
                </p>
              ) : (
                <ul>
                  {results.map((feature) => {
                    const s = feature.properties;
                    return (
                      <li key={s.station_id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(feature)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
                        >
                          <MapPin
                            size={14}
                            className="text-blue-500 shrink-0 group-hover:text-blue-600"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {s.station_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {s.operator} ·{" "}
                              <span
                                className={
                                  s.status === "OPERATIONAL"
                                    ? "text-green-500"
                                    : s.status === "CONGESTED"
                                      ? "text-red-500"
                                      : "text-amber-500"
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

      {/* Notification bell */}
      <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* Avatar */}
      <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold hover:bg-blue-700 transition-colors">
        OA
      </button>
    </div>
  );
}
