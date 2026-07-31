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
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        Survey Coordinates
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={`${value.lat.toFixed(4)},  ${value.lng.toFixed(4)}`}
          className="w-full bg-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-default"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={loading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          title="Use my location"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
