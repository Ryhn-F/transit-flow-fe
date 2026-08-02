"use client";

import { useEffect, useRef, useState } from "react";
import { useVCILiveStore } from "../store/vci-live-store";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const FLASH_MS = 600;

export function RecalcCountdown() {
  const countdownSec = useVCILiveStore((s) => s.countdownSec);
  const recalculating = useVCILiveStore((s) => s.recalculating);
  const reduced = usePrefersReducedMotion();
  const [flash, setFlash] = useState(false);
  const prevRecalculating = useRef(recalculating);

  useEffect(() => {
    if (recalculating && !prevRecalculating.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), FLASH_MS);
      return () => clearTimeout(t);
    }
  }, [recalculating]);

  useEffect(() => {
    prevRecalculating.current = recalculating;
  });

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-1.5 shadow-xl inline-flex items-center gap-2">
      {flash ? (
        <span className={cn("font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400", !reduced && "animate-pulse")}>
          RECALCULATING
        </span>
      ) : (
        <>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            RECALC IN
          </span>
          <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white tabular-nums">
            {countdownSec}s
          </span>
        </>
      )}
    </div>
  );
}
