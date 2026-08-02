"use client";

import { useMemo, useState } from "react";
import { useStationsQuery } from "@/features/stations/hooks/use-stations-query";
import { exitChannelsForStation } from "@/infrastructure/repositories/mock-exit-channel-repository";
import { useAttachExtraction } from "../hooks/use-attach-extraction";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";
import { cn } from "@/lib/utils";

export function AttachPicker({ extractionId }: { extractionId: string }) {
  const { data: stationsData } = useStationsQuery();
  const stations = stationsData?.features ?? [];
  const [stationId, setStationId] = useState("");
  const [channelId, setChannelId] = useState("");
  const { mutate, isPending } = useAttachExtraction();
  const { setPendingAttach } = useAiIngestionUIStore();

  const channels = useMemo(
    () => (stationId ? exitChannelsForStation(stationId) : []),
    [stationId],
  );

  const confirm = () => {
    if (!channelId) return;
    setPendingAttach(extractionId);
    mutate(
      { id: extractionId, channelId },
      { onSettled: () => setPendingAttach(null) },
    );
  };

  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5 block">
          Target Station Node
        </span>
        <select
          value={stationId}
          onChange={(e) => {
            setStationId(e.target.value);
            setChannelId("");
          }}
          className="w-full bg-slate-100 dark:bg-[#141b2b] text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3.5 py-2.5 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
        >
          <option value="">Select station node…</option>
          {stations.map((f) => (
            <option key={f.properties.station_id} value={f.properties.station_id}>
              {f.properties.station_name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5 block">
          Exit Channel
        </span>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={!stationId}
          className={cn(
            "w-full bg-slate-100 dark:bg-[#141b2b] text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3.5 py-2.5 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all",
            !stationId && "opacity-50 cursor-not-allowed",
          )}
        >
          <option value="">
            {stationId ? "Select exit channel…" : "Select station first"}
          </option>
          {channels.map((c) => (
            <option key={c.channel_id} value={c.channel_id}>
              {c.channel_name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={confirm}
        disabled={!channelId || isPending}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-150 shadow-md shadow-blue-600/25 border border-blue-400/30 active:scale-95",
          !channelId || isPending ? "bg-blue-700 opacity-60 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500",
        )}
      >
        {isPending && (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        Confirm Attachment
      </button>
    </div>
  );
}
