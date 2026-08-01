"use client";

import { useEffect, useState } from "react";
import type { AiExtraction } from "@/entities/ai-extraction";
import { attachmentSlaMs } from "@/entities/ai-extraction";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

function useElapsed(submittedAt: string, active: boolean): number {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Date.now() - Date.parse(submittedAt)),
  );
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || reduced) return;
    const id = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - Date.parse(submittedAt)));
    }, 1_000);
    return () => clearInterval(id);
  }, [active, reduced, submittedAt]);

  return elapsed;
}

function format(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function ProcessingTimer({ extraction }: { extraction: AiExtraction }) {
  const active =
    extraction.status === "QUEUED" || extraction.status === "EXTRACTING";
  const elapsed = useElapsed(extraction.submitted_at, active);
  const sla = attachmentSlaMs(extraction);
  const exceeded = sla != null && sla > 30_000;

  if (!active && sla == null) return null;

  return (
    <span
      data-sla-ms={sla ?? undefined}
      className={cn(
        "font-mono text-[10px] tabular-nums",
        exceeded ? "text-rose-400" : "text-slate-500 dark:text-slate-400",
      )}
    >
      {active ? format(elapsed) : format(sla ?? 0)}
      {exceeded && <span className="text-rose-400 font-bold"> SLA EXCEEDED</span>}
    </span>
  );
}
