"use client";

interface ObstructionImpactSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ObstructionImpactSlider({
  value,
  onChange,
}: ObstructionImpactSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Obstruction Impact (%)
        </label>
        <span className="text-sm font-bold text-gray-200">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${value}%, #3d4d61 ${value}%, #3d4d61 100%)`,
        }}
      />
    </div>
  );
}
