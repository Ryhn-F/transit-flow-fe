"use client";

import React from "react";
import { Download, Pencil, MousePointer } from "lucide-react";

interface MapDrawControlProps {
  isEditing: boolean;
  onToggleEdit: () => void;
  onExportGeoJSON: () => void;
  featuresCount?: number;
}

export const MapDrawControl: React.FC<MapDrawControlProps> = ({
  isEditing,
  onToggleEdit,
  onExportGeoJSON,
  featuresCount = 0,
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-1.5 rounded-2xl shadow-2xl transition-all duration-200">
      <button
        onClick={onToggleEdit}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 border ${
          isEditing
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 glow-amber"
            : "bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
        }`}
      >
        {isEditing ? (
          <Pencil className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        ) : (
          <MousePointer className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span>{isEditing ? "Spatial Editor Active" : "View Mode"}</span>
      </button>

      <button
        onClick={onExportGeoJSON}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 shadow-md shadow-blue-600/25 border border-blue-400/30 active:scale-95"
        title="Export spatial layer as GeoJSON"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export GeoJSON ({featuresCount})</span>
      </button>
    </div>
  );
};
