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
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
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
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all",
                isActive
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-[#2d3748] border-[#3d4d61] text-gray-300 hover:border-blue-500/50",
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
