"use client";

import { AlertTriangle, ParkingSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  icon: "danger" | "parking";
  title: string;
  description: string;
  relativeTime: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    type: "CRITICAL",
    icon: "danger",
    title: "Critical Congestion",
    description:
      "Extreme density near Exit B. Deploying additional staff recommended.",
    relativeTime: "2 mins ago",
  },
  {
    id: "2",
    type: "WARNING",
    icon: "parking",
    title: "Illegal Parking Detected",
    description: "3 vehicles obstructing pedestrian path on East Wing.",
    relativeTime: "12 mins ago",
  },
];

export function LiveAlertsPanel() {
  const newCount = MOCK_ALERTS.length;

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4.5 w-76 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
          Live Risk Stream
        </h3>
        {newCount > 0 && (
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono text-[9px] font-bold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {newCount} LIVE
          </span>
        )}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {MOCK_ALERTS.map((alert) => (
          <div key={alert.id} className="flex gap-3 group">
            {/* Left status vertical indicator */}
            <div
              className={cn(
                "w-1 rounded-full shrink-0 transition-all",
                alert.type === "CRITICAL" ? "bg-rose-500 glow-crimson" : "bg-amber-400 glow-amber",
              )}
            />
            <div className="flex gap-2.5 flex-1 min-w-0">
              {/* Icon */}
              <div
                className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-transparent shadow-sm",
                  alert.type === "CRITICAL"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500",
                )}
              >
                {alert.icon === "danger" ? (
                  <AlertTriangle size={13} />
                ) : (
                  <ParkingSquare size={13} />
                )}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {alert.title}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  {alert.description}
                </div>
                <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                  {alert.relativeTime}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
