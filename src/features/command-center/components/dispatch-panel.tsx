"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { useCCStore } from "../store/cc-store";
import { AGENCIES } from "../types";
import { slaRemainingSec } from "../lib/dispatch-machine";
import { cn } from "@/lib/utils";
import type { Incident } from "../types";

export function DispatchPanel({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const wardens = useCCStore((s) => s.wardens);
  const dispatches = useCCStore((s) => s.dispatches);
  const dispatch = useCCStore((s) => s.dispatch);
  const agency = useCCStore((s) => s.agency);
  const resolveIncident = useCCStore((s) => s.resolveIncident);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const idleWardens = wardens
    .filter((w) => w.status === "IDLE" && (agency === "DISHUB" || w.agency === agency))
    .slice(0, 3);

  const activeDispatch = dispatches.find((d) => d.incidentId === incident.id);

  const sla = activeDispatch ? slaRemainingSec(activeDispatch, now) : null;

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <AlertTriangle size={12} className={incident.severity === "CRITICAL" ? "text-rose-400" : "text-amber-400"} />
          {incident.id}
        </h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">
          ✕
        </button>
      </div>
      <p className="text-[13px] font-bold text-slate-900 dark:text-white">
        {incident.stationName} — {incident.type}
      </p>
      <p className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
        {incident.severity} · raised {new Date(incident.raisedAt).toLocaleTimeString("en-GB")}
      </p>

      {activeDispatch ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <Timer size={13} className="text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex-1">
              {wardens.find((w) => w.id === activeDispatch.wardenId)?.name}
            </span>
            <span className={cn("font-mono text-[10px] font-bold", sla != null && sla < 300 ? "text-rose-400" : "text-emerald-400")}>
              SLA {sla != null ? `${Math.floor(sla / 60)}:${String(sla % 60).padStart(2, "0")}` : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              resolveIncident(incident.id);
              useCCStore.getState().pushTicker(`${incident.id} resolved by warden`);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <CheckCircle2 size={13} />
            Resolve Incident
          </button>
        </div>
      ) : idleWardens.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">
            Nearest wardens
          </p>
          {idleWardens.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => dispatch(incident.id, w.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141b2b]/70 hover:border-blue-500/40 transition-colors text-left"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  AGENCIES.find((a) => a.id === w.agency)?.accent,
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{w.name}</p>
                <p className="font-mono text-[9px] text-slate-500">{w.agency} · ETA ~{Math.floor(w.etaSec / 60)}m</p>
              </div>
              <span className="text-[10px] font-bold text-blue-500">DISPATCH →</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          No idle wardens for {agency} — switch agency to see others.
        </p>
      )}
    </div>
  );
}
