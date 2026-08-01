"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

interface CoordinatesInputProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

export function CoordinatesInput({ value, onChange }: CoordinatesInputProps) {
  const [loading, setLoading] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => setLoading(false),
    );
  };

  return (
    <div>
      <label className="block font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">
        Survey Spatial Coordinates
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={`${value.lat.toFixed(4)},  ${value.lng.toFixed(4)}`}
          className="w-full bg-slate-100 dark:bg-[#141b2b] text-slate-900 dark:text-slate-100 font-mono text-xs rounded-xl px-3.5 py-2.5 pr-10 border border-slate-200/80 dark:border-white/10 focus:outline-none cursor-default shadow-inner"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={loading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-blue-500/10"
          title="Acquire current GPS location"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin size={15} />
          )}
        </button>
      </div>
    </div>
  );
}
