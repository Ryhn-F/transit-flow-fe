"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useExtractionDetail } from "../hooks/use-extraction-detail";
import { useReviewExtraction } from "../hooks/use-review-extraction";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";
import { PhotoViewer } from "./photo-viewer";
import { AttributeEditor } from "./attribute-editor";
import { AudioTranscript } from "./audio-transcript";
import { RawJsonPanel } from "./raw-json-panel";
import { AttachPicker } from "./attach-picker";
import { StatusChip } from "@/components/shared/status-chip";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";
import { cn } from "@/lib/utils";

export function ExtractionDetailDrawer() {
  const { drawerOpen, selectedId, close } = useAiIngestionUIStore();
  const { data: extraction, isLoading } = useExtractionDetail(drawerOpen ? selectedId : null);
  const { mutate: review, isPending: isReviewing } = useReviewExtraction();
  const reduced = usePrefersReducedMotion();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    headerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, close]);

  if (!drawerOpen) return null;

  const isApproved = extraction?.status === "APPROVED";
  const isAttached = extraction?.attached_channel_id != null;

  return (
    <div className="absolute inset-0 z-30 flex justify-end pointer-events-none">
      {/* Dim overlay */}
      <button
        type="button"
        aria-label="Close extraction detail"
        onClick={close}
        className="absolute inset-0 bg-black/50 pointer-events-auto"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Extraction detail"
        className={cn(
          "pointer-events-auto w-[520px] max-w-[92vw] h-full bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col",
          !reduced && "transition-transform duration-300 ease-out translate-x-0",
        )}
      >
        <div
          ref={headerRef}
          tabIndex={-1}
          className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.06] shrink-0"
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                {extraction?.id ?? "Loading…"}
              </h2>
              {extraction && <StatusChip status={extraction.status} />}
            </div>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              Extraction Detail
            </p>
            {extraction && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {stationName(extraction.station_id)} — {channelName(extraction.exit_channel_id)} ·{" "}
                <span className="font-mono">{extraction.survey_id}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
          {isLoading || !extraction ? (
            <div className="space-y-3" role="status" aria-label="Loading extraction">
              <div className="h-40 rounded-xl bg-white/[0.04] animate-pulse" />
              <div className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
              <div className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>
          ) : (
            <>
              <PhotoViewer extractionId={extraction.id} bboxes={extraction.bboxes} />
              <AttributeEditor extraction={extraction} />
              <AudioTranscript audio={extraction.audio} />
              <RawJsonPanel json={extraction.raw_gemini_json} />
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3 shrink-0">
          {!isLoading && extraction && (
            isAttached ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Attached · {channelName(extraction.attached_channel_id ?? "")}
                </span>
              </div>
            ) : isApproved ? (
              <AttachPicker extractionId={extraction.id} />
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    review({ id: extraction.id, decision: "REJECTED" })
                  }
                  disabled={isReviewing}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  REJECT
                </button>
                <button
                  type="button"
                  onClick={() =>
                    review({ id: extraction.id, decision: "APPROVED" })
                  }
                  disabled={isReviewing}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 border border-emerald-400/30 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  {isReviewing ? "SAVING…" : "APPROVE"}
                </button>
              </div>
            )
          )}
        </div>
      </aside>
    </div>
  );
}
