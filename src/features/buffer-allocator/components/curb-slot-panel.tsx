"use client";

import { useEffect, useState } from "react";
import { Bike } from "lucide-react";
import { useEditorStore } from "../store/editor-store";
import { cn } from "@/lib/utils";
import { formatSlaClock } from "@/features/vci/lib/sla-clock";

function SlotRow({ slotId, now }: { slotId: string; now: number }) {
  const slot = useEditorStore((s) => s.slots.find((x) => x.id === slotId));

  if (!slot) return null;

  const remaining = slot.expiresAt - now;
  if (remaining <= 0) return null;

  const urgent = remaining <= 15_000;
  const expiring = remaining <= 60_000;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200",
        urgent
          ? "bg-rose-500/10 border-rose-500/25"
          : expiring
            ? "bg-amber-500/10 border-amber-500/25"
            : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
      )}
    >
      <Bike size={13} className="text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
          {slot.id}
        </p>
        <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
          {slot.coordinates[0].toFixed(4)}, {slot.coordinates[1].toFixed(4)}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span
          className={cn(
            "font-mono text-[10px] font-bold tabular-nums",
            urgent ? "text-rose-400" : expiring ? "text-amber-400" : "text-slate-600 dark:text-slate-300",
            (urgent || expiring) && "animate-pulse",
          )}
        >
          {formatSlaClock(remaining)}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
          {slot.status === "ACK" ? "ACK" : "SENT →"}
        </span>
      </div>
    </li>
  );
}

export function CurbSlotPanel() {
  const slots = useEditorStore((s) => s.slots);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const active = slots.filter((s) => s.expiresAt > now);

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76 transition-all duration-200">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3">
        Curb Slot Dispatcher
      </h3>

      {active.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
          No active ojek slots — the surge window is closed.
        </p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
          {active.map((s) => (
            <SlotRow key={s.id} slotId={s.id} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
