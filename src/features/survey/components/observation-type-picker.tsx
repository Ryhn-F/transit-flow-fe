"use client";

import { Users, Construction, ParkingSquare, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObservationType } from "@/entities/survey";

const OPTIONS: {
  value: ObservationType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "PEDESTRIAN_FLOW", label: "Pedestrian Flow", icon: Users },
  { value: "OBSTRUCTION", label: "Obstruction", icon: Construction },
  { value: "ILLEGAL_PARKING", label: "Illegal Parking", icon: ParkingSquare },
  { value: "STREET_VENDOR", label: "Street Vendor", icon: ShoppingBag },
];

interface ObservationTypePickerProps {
  value?: ObservationType;
  onChange: (value: ObservationType) => void;
}

export function ObservationTypePicker({
  value,
  onChange,
}: ObservationTypePickerProps) {
  return (
    <div>
      <label className="block font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
        Observation Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value: optVal, label, icon: Icon }) => {
          const isActive = value === optVal;
          return (
            <button
              key={optVal}
              type="button"
              onClick={() => onChange(optVal)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-[0.98]",
                isActive
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                  : "bg-slate-100 dark:bg-[#141b2b] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20",
              )}
            >
              <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
