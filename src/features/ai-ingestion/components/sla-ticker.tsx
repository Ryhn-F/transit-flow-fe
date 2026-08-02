"use client";

import { useExtractionQueue } from "../hooks/use-extraction-queue";
import { attachmentSlaMs } from "@/entities/ai-extraction";
import { cn } from "@/lib/utils";

export function SlaTicker() {
  const { data, isLoading } = useExtractionQueue();
  const items = data ?? [];

  const slas = items
    .map((e) => attachmentSlaMs(e))
    .filter((ms): ms is number => ms != null);
  const fastest = slas.length > 0 ? Math.min(...slas) : null;
  const worst = slas.length > 0 ? Math.max(...slas) : null;
  const exceeded = worst != null && worst > 30_000;

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-[#141b2b]/80"
      data-sla-ms={worst ?? undefined}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        SLA 30s
      </span>
      <span
        className={cn(
          "font-mono text-[10px] tabular-nums",
          exceeded ? "text-rose-400 font-bold" : "text-slate-700 dark:text-slate-200",
        )}
      >
        {isLoading ? "…" : fastest != null ? `${(fastest / 1000).toFixed(1)}s` : "—"}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        {slas.length} evaluated
      </span>
      {exceeded && (
        <span className="font-mono text-[9px] font-bold text-rose-400 uppercase tracking-wider glow-crimson rounded-full px-2 py-0.5 bg-rose-500/10 border border-rose-500/25">
          SLA EXCEEDED
        </span>
      )}
    </div>
  );
}
