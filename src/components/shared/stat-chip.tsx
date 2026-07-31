import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatChipProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subLabel?: string;
  className?: string;
}

export function StatChip({
  icon: Icon,
  label,
  value,
  subLabel,
  className,
}: StatChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md",
        className,
      )}
    >
      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-blue-600" />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900">{value}</span>
          {subLabel && (
            <span className="text-xs text-orange-500 font-medium">
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
