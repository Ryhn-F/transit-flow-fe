"use client";

import { Send, MessageSquare, Mail } from "lucide-react";
import { useVCILiveStore } from "../store/vci-live-store";
import { useVCIUIStore } from "../store/vci-ui-store";
import { cn } from "@/lib/utils";
import type { DeliveryChannel } from "@/entities/vci-metric";

const CHANNELS: DeliveryChannel[] = ["TELEGRAM", "DISCORD", "EMAIL"];

const CHANNEL_META: Record<DeliveryChannel, { label: string; icon: typeof Send; color: string }> = {
  TELEGRAM: { label: "Telegram", icon: Send, color: "text-blue-400" },
  DISCORD: { label: "Discord", icon: MessageSquare, color: "text-indigo-400" },
  EMAIL: { label: "Email", icon: Mail, color: "text-amber-400" },
};

export function AlertChannelFeed() {
  const deliveries = useVCILiveStore((s) => s.deliveries);
  const alerts = useVCILiveStore((s) => s.alerts);
  const { channelTab, setChannelTab } = useVCIUIStore();

  const tabItems = deliveries.filter((d) => d.channel === channelTab);
  const unread = deliveries.filter((d) => d.status === "QUEUED" || d.status === "RETRYING").length;

  const alertTitle = (alertId: string) => {
    const alert = alerts.find((a) => a.alert_id === alertId);
    return alert ? `${alert.station_name} ${alert.channel_name} · VCI ${alert.vci_score}` : alertId;
  };

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-76 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
          Alert Channel Feed
        </h3>
        {unread > 0 && (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/25 font-mono text-[9px] font-bold rounded-full">
            {unread} PENDING
          </span>
        )}
      </div>

      <div className="flex gap-1 mb-3" role="tablist" aria-label="Alert channels">
        {CHANNELS.map((channel) => {
          const Icon = CHANNEL_META[channel].icon;
          const count = deliveries.filter((d) => d.channel === channel).length;
          return (
            <button
              key={channel}
              role="tab"
              aria-selected={channelTab === channel}
              onClick={() => setChannelTab(channel)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all duration-150",
                channelTab === channel
                  ? "bg-blue-600 text-white border-blue-400/30 shadow-md shadow-blue-600/25"
                  : "bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
              )}
            >
              <Icon size={11} className={channelTab === channel ? "text-white" : CHANNEL_META[channel].color} />
              {CHANNEL_META[channel].label}
              <span className="font-mono text-[8px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {tabItems.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
          No {CHANNEL_META[channelTab].label.toLowerCase()} messages delivered yet
        </p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
          {tabItems.map((d) => {
            const meta = CHANNEL_META[d.channel];
            const Icon = meta.icon;
            const isPending = d.status === "QUEUED" || d.status === "RETRYING";
            return (
              <li
                key={d.delivery_id}
                className={cn(
                  "flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-all duration-150",
                  d.status === "FAILED"
                    ? "bg-rose-500/10 border-rose-500/25"
                    : isPending
                      ? "bg-blue-500/10 border-blue-500/25"
                      : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
                )}
              >
                <Icon size={13} className={cn(meta.color, "mt-0.5 shrink-0")} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {alertTitle(d.alert_id)}
                  </p>
                  <p className="font-mono text-[9px] mt-0.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        d.status === "DELIVERED" && "text-emerald-500",
                        d.status === "FAILED" && "text-rose-400",
                        d.status === "QUEUED" && "text-slate-400",
                        d.status === "RETRYING" && "text-amber-400 animate-pulse",
                      )}
                    >
                      {d.status === "DELIVERED" && d.delivered_at
                        ? `DELIVERED ${new Date(d.delivered_at).toLocaleTimeString("en-GB")}`
                        : d.status === "FAILED"
                          ? `FAILED — retry ${d.attempt}/3`
                          : d.status === "RETRYING"
                            ? "Retrying in 10s…"
                            : "QUEUED"}
                    </span>
                  </p>
                </div>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-current" aria-hidden />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
