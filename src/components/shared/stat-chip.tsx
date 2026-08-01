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
        "flex items-center gap-3 bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl px-4 py-2.5 shadow-xl transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20",
        className,
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-blue-500" />
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-400 font-semibold">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          {subLabel && (
            <span className="font-mono text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
