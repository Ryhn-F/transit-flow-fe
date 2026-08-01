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
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-2 rounded-xl shadow-2xl">
      <button
        onClick={onToggleEdit}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isEditing
            ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        }`}
      >
        {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
        <span>{isEditing ? "Spatial Editor Active" : "View Mode"}</span>
      </button>

      <button
        onClick={onExportGeoJSON}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
        title="Export spatial layer as GeoJSON"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export GeoJSON ({featuresCount})</span>
      </button>
    </div>
  );
};
