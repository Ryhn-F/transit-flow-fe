"use client";

import { useEffect, useRef, useState } from "react";
import { useVCILiveStore } from "../store/vci-live-store";
import { useVCIUIStore } from "../store/vci-ui-store";
import { useAcknowledgeAlert } from "../hooks/use-acknowledge-alert";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { formatSlaClock } from "../lib/sla-clock";

function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio unavailable — ignore
  }
}

export function ChokeAlertBanner() {
  const alerts = useVCILiveStore((s) => s.alerts);
  const ackIds = useVCIUIStore((s) => s.ackIds);
  const { mutate: acknowledge } = useAcknowledgeAlert();
  const reduced = usePrefersReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const playedRef = useRef<Set<string>>(new Set());

  const open = alerts.find(
    (a) => a.status === "OPEN" && !ackIds.includes(a.alert_id),
  );

  // Acknowledged alerts still tracking their SLA render as a slim chip.
  const tracking = alerts
    .filter((a) => a.status === "ACKNOWLEDGED" && !ackIds.includes(a.alert_id))
    .filter((a) => a.sla_deadline != null && Date.parse(a.sla_deadline) > now)
    .sort((a, b) => Date.parse(a.sla_deadline ?? "") - Date.parse(b.sla_deadline ?? ""));
  const deadline = tracking[0]?.sla_deadline ?? null;
  const remaining = deadline != null ? Date.parse(deadline) - now : null;
  const slaLow = remaining != null && remaining > 0 && remaining < 5 * 60_000;
  const timer = remaining != null && remaining > 0 ? formatSlaClock(remaining) : null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open && !playedRef.current.has(open.alert_id)) {
      playedRef.current.add(open.alert_id);
      if (!reduced) playChime();
    }
  }, [open, reduced]);

  if (!open) {
    if (tracking.length === 0) return null;
    return (
      <div
        role="status"
        aria-label={`${tracking.length} open choke alert${tracking.length === 1 ? "" : "s"} tracking SLA`}
        className={cn(
          "absolute top-0 left-0 right-0 z-30 flex items-center gap-2.5 px-5 py-1.5 border-b bg-rose-500/10 border-rose-500/30 backdrop-blur-xl",
          slaLow && "bg-rose-600/20",
          !reduced && "glow-crimson",
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
          {tracking.length} OPEN
        </p>
        {timer && (
          <span className={cn("font-mono text-[10px] font-bold tracking-wider", slaLow ? "text-rose-300" : "text-rose-400")}>
            SLA {timer}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-5 py-3 border-b bg-rose-500/10 border-rose-500/30 backdrop-blur-xl",
        slaLow && "bg-rose-600/20",
        !reduced && "glow-crimson",
      )}
    >
      <span className={cn("w-2 h-2 rounded-full bg-rose-500 shrink-0", !reduced && "animate-pulse")} />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">
          CHOKE RISK — {open.station_name} {open.channel_name} (VCI {open.vci_score})
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Raised {new Date(open.raised_at).toLocaleTimeString("en-GB")}
          {timer && <span className="ml-2 font-mono text-rose-400">SLA {timer}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => acknowledge({ alertId: open.alert_id, note: "Operator acknowledged" })}
        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/25 border border-rose-400/30 transition-all duration-150 active:scale-95 shrink-0"
      >
        Acknowledge & Dispatch
      </button>
    </div>
  );
}
