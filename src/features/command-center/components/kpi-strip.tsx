"use client";

import { useCCStore } from "../store/cc-store";
import { AGENCIES } from "../types";
import { cn } from "@/lib/utils";

export function KpiStrip() {
  const incidents = useCCStore((s) => s.incidents);
  const wardens = useCCStore((s) => s.wardens);
  const dispatches = useCCStore((s) => s.dispatches);
  const agency = useCCStore((s) => s.agency);
  const setAgency = useCCStore((s) => s.setAgency);

  const openIncidents = incidents.filter((i) => !i.resolved).length;
  const onSite = wardens.filter((w) => w.status === "ON-SITE").length;
  const inTransit = wardens.filter((w) => w.status === "EN-ROUTE").length;
  const avgLead = dispatches.length ? 12 + Math.min(4, dispatches.length) : 0;

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-1.5 flex-1">
        {AGENCIES.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={agency === a.id}
            onClick={() => setAgency(a.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-150",
              agency === a.id
                ? `${a.accent} bg-white/[0.06] border-white/20`
                : "text-slate-500 dark:text-slate-400 border-transparent hover:border-white/10",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">Open</div>
          <div className="font-mono text-sm font-bold text-rose-400">{openIncidents}</div>
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">En-route</div>
          <div className="font-mono text-sm font-bold text-amber-400">{inTransit}</div>
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">On-site</div>
          <div className="font-mono text-sm font-bold text-emerald-400">{onSite}</div>
        </div>
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">Avg lead</div>
          <div className="font-mono text-sm font-bold text-blue-400">{avgLead}m</div>
        </div>
      </div>
    </div>
  );
}
