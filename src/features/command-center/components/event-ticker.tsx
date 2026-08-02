"use client";

import { useCCStore } from "../store/cc-store";
import { cn } from "@/lib/utils";

export function EventTicker() {
  const ticker = useCCStore((s) => s.ticker);
  const screenLabel = useCCStore((s) => s.screenLabel);

  return (
    <div className="border-t border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md px-4 py-2 shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
          Event Stream · Screen {screenLabel}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {ticker.slice(0, 4).map((t) => (
          <span
            key={t.id}
            className={cn(
              "px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10px] text-slate-600 dark:text-slate-300 whitespace-nowrap",
              t.text.startsWith("Dispatch") && "text-blue-500 dark:text-blue-400",
            )}
          >
            {t.text}
          </span>
        ))}
        {ticker.length === 0 && (
          <span className="text-[10px] text-slate-400">No events yet — waiting for incidents…</span>
        )}
      </div>
    </div>
  );
}
