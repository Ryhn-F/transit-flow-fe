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
        <label className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          Obstruction Impact (%)
        </label>
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{value}%</span>
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
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
}
