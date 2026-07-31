"use client";

import { cn } from "@/lib/utils";
import type { CongestionLevel } from "@/entities/survey";

const LEVELS: { value: CongestionLevel; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "#22c55e" },
  { value: "MEDIUM", label: "Med", color: "#f59e0b" },
  { value: "HIGH", label: "High", color: "#f97316" },
  { value: "CRITICAL", label: "Crit", color: "#ef4444" },
];

const LEVEL_INDEX: Record<CongestionLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

interface CongestionLevelSliderProps {
  value?: CongestionLevel;
  onChange: (value: CongestionLevel) => void;
}

export function CongestionLevelSlider({
  value,
  onChange,
}: CongestionLevelSliderProps) {
  const currentIdx = value != null ? LEVEL_INDEX[value] : -1;
  const currentLevel = currentIdx >= 0 ? LEVELS[currentIdx] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Congestion Level
        </label>
        {currentLevel && (
          <span
            className="text-sm font-bold"
            style={{ color: currentLevel.color }}
          >
            {currentLevel.label}
          </span>
        )}
      </div>

      {/* Slider bar */}
      <div className="relative mb-2">
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={currentIdx >= 0 ? currentIdx : 0}
          onChange={(e) => onChange(LEVELS[Number(e.target.value)].value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: currentLevel
              ? `linear-gradient(to right, ${currentLevel.color} 0%, ${currentLevel.color} ${(currentIdx / 3) * 100}%, #3d4d61 ${(currentIdx / 3) * 100}%, #3d4d61 100%)`
              : "#3d4d61",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {LEVELS.map(({ label }) => (
          <span key={label} className="text-[10px] text-gray-500">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
