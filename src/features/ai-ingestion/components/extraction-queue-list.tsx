"use client";

import { useState } from "react";
import { useExtractionQueue } from "../hooks/use-extraction-queue";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";
import { StatusChip } from "@/components/shared/status-chip";
import { ProcessingTimer } from "./processing-timer";
import { PhotoPlaceholder } from "./photo-placeholder";
import { cn } from "@/lib/utils";
import type { AiExtraction, AiExtractionStatus } from "@/entities/ai-extraction";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";

const STATUS_ORDER: AiExtractionStatus[] = [
  "REVIEW",
  "EXTRACTING",
  "QUEUED",
  "APPROVED",
  "REJECTED",
];

const SOURCE_LABEL: Record<AiExtraction["source"], string> = {
  PHOTO: "SRC: PHOTO",
  AUDIO: "SRC: AUDIO",
  MULTIMODAL: "SRC: MULTI",
};

function RowItem({ extraction }: { extraction: AiExtraction }) {
  const { open } = useAiIngestionUIStore();

  return (
    <li>
      <button
        type="button"
        onClick={() => open(extraction.id)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 group hover:bg-white/[0.05] border-b border-white/[0.04]"
      >
        <PhotoPlaceholder label={extraction.id} className="w-14 h-10 shrink-0 group-hover:scale-[1.03] transition-transform duration-150" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-slate-200 truncate">
              {extraction.id}
            </span>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider shrink-0">
              {SOURCE_LABEL[extraction.source]}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {stationName(extraction.station_id)} — {channelName(extraction.exit_channel_id)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ProcessingTimer extraction={extraction} />
            {extraction.status === "REVIEW" && (
              <span className="font-mono text-[9px] text-blue-400">
                {extraction.confidence.pedestrian_count}% CONF
              </span>
            )}
          </div>
        </div>

        <StatusChip status={extraction.status} className="shrink-0" />
      </button>
    </li>
  );
}

function Group({
  label,
  items,
  collapsible = false,
}: {
  label: string;
  items: AiExtraction[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (items.length === 0) return null;

  return (
    <section aria-label={label}>
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2 text-left",
          collapsible ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {label} · {items.length}
        </span>
        {collapsible && (
          <span className="text-slate-500 text-[10px] font-mono">
            {open ? "▾" : "▸"}
          </span>
        )}
      </button>
      {open && <ul>{items.map((e) => <RowItem key={e.id} extraction={e} />)}</ul>}
    </section>
  );
}

export function ExtractionQueueList() {
  const { data, isLoading, isError, refetch } = useExtractionQueue();
  const { filters, clearFilters } = useAiIngestionUIStore();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3" role="status" aria-label="Loading extraction queue">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-rose-400">Failed to load extraction queue</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No extractions match the current filter
        </p>
        {(filters.q || filters.stationId || filters.status) && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            CLEAR FILTERS
          </button>
        )}
      </div>
    );
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: items.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {grouped.map((g) => (
        <Group
          key={g.status}
          label={g.status}
          items={g.items}
          collapsible={g.status === "APPROVED" || g.status === "REJECTED"}
        />
      ))}
    </div>
  );
}
