"use client";

import { MapPin, TrendingUp, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StationNode } from "@/entities/station";
import { useStationAttachments } from "@/features/ai-ingestion/hooks/use-station-attachments";
import { attachmentSlaMs } from "@/entities/ai-extraction";
import { useVCILiveStore } from "@/features/vci/store/vci-live-store";
import { useVciHistory } from "@/features/vci/hooks/use-vci-history";
import { VciSparkline } from "@/features/vci/components/vci-sparkline";
import { bandOf } from "@/features/vci/lib/vci-formula";
import { VCI_CHANNEL_SEEDS, stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";

interface StationInfoCardProps {
  station: StationNode;
}

const BAND_TEXT: Record<"GREEN" | "YELLOW" | "RED", string> = {
  GREEN: "SMOOTH",
  YELLOW: "WARNING",
  RED: "HIGH RISK",
};

export function StationInfoCard({ station }: StationInfoCardProps) {
  const snapshot = useVCILiveStore((s) => s.snapshot);
  const { data: attachments } = useStationAttachments(station.station_id);
  const attachment = attachments?.[0];
  const slaMs = attachment ? attachmentSlaMs(attachment) : null;

  const channelIds = VCI_CHANNEL_SEEDS
    .filter((s) => stationOfChannel(s.channel_id) === station.station_id)
    .map((s) => s.channel_id);

  const stationMetrics = channelIds
    .map((id) => snapshot?.metrics.find((m) => m.channel_id === id))
    .filter((m) => m != null);

  const worst = stationMetrics.length > 0
    ? stationMetrics.reduce((a, b) => (b!.vci_score > a!.vci_score ? b : a))
    : null;

  const { data: history } = useVciHistory(worst?.channel_id ?? null);

  const isHighRisk = worst != null && worst.vci_score >= 80;
  const band = worst ? bandOf(worst.vci_score) : "GREEN";

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4.5 w-76 transition-all duration-200 relative overflow-hidden group">
      {/* Subtle top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          isHighRisk ? "bg-rose-500 glow-crimson" : band === "YELLOW" ? "bg-amber-400 glow-amber" : "bg-emerald-500 glow-emerald",
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
            {station.station_name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={11} className="text-blue-500 shrink-0" />
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-wider">
              LAT: -6.2088 | LNG: 106.8272
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider shrink-0 border border-transparent shadow-sm",
            band === "RED"
              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
              : band === "YELLOW"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              band === "RED" ? "bg-rose-500" : band === "YELLOW" ? "bg-amber-400" : "bg-emerald-500",
            )}
          />
          {worst ? BAND_TEXT[band] : "—"}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-3">
          <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">
            VCI Score
          </div>
          <div className={cn("text-2xl font-mono font-black tracking-tight", band === "RED" ? "text-rose-500" : band === "YELLOW" ? "text-amber-500" : "text-emerald-500")}>
            {worst?.vci_score ?? "—"}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-0.5">/100</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] rounded-xl p-3">
          <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">
            Ped Flow
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
              {worst?.pedestrian_flow_rate_ppm ?? "—"}
            </span>
            <TrendingUp size={15} className="text-amber-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* 24h sparkline */}
      <div className="mt-2.5">
        <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1">
          {worst ? `24H VCI — ${worst.channel_id}` : "24H VCI"}
        </div>
        <div className="text-blue-500">
          <VciSparkline history={history ?? []} />
        </div>
      </div>

      {/* AI Attachments */}
      {attachment && (
        <section
          aria-label="AI extracted attachments"
          className="mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 ai-attach-pop"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-blue-500 flex items-center gap-1.5">
              <Sparkles size={11} className="animate-pulse" />
              AI Attachments
            </span>
            <Link
              href="/ai-ingestion"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              view in QA <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                Pedestrians
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {attachment.attributes.pedestrian_count}
              </div>
            </div>
            <div>
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                Angkot Queue
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {attachment.attributes.angkot_queue_length}
              </div>
            </div>
            <div>
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                Vendor Blockage
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {attachment.attributes.vendor_blockage_pct}%
              </div>
            </div>
            <div>
              <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                Confidence
              </div>
              <div className="text-sm font-mono font-bold text-blue-500">
                {attachment.confidence.pedestrian_count}%
              </div>
            </div>
          </div>
          <div className="font-mono text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-2">
            SRC: {attachment.id} · {slaMs != null ? `${(slaMs / 1000).toFixed(0)}s` : "—"} ·{" "}
            {attachment.exit_channel_id}
          </div>
        </section>
      )}

      {/* Status row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <AlertTriangle size={13} className="text-amber-400 shrink-0" />
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-wide">
          {station.active_exit_count} Active Exits · {station.operator}
        </span>
      </div>
    </div>
  );
}
