"use client";

import { useMemo } from "react";
import type { BoundingBox } from "@/entities/ai-extraction";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";
import { PhotoPlaceholder } from "./photo-placeholder";
import { cn } from "@/lib/utils";

const BOX_CLASS: Record<BoundingBox["class"], { border: string; text: string }> = {
  pedestrian: { border: "border-emerald-400", text: "text-emerald-400" },
  vendor: { border: "border-amber-400", text: "text-amber-400" },
  angkot: { border: "border-blue-400", text: "text-blue-400" },
};

const ATTRIBUTE_TO_CLASS: Record<string, BoundingBox["class"]> = {
  pedestrian_count: "pedestrian",
  angkot_queue_length: "angkot",
  vendor_blockage_pct: "vendor",
};

export function PhotoViewer({
  extractionId,
  bboxes,
}: {
  extractionId: string;
  bboxes: BoundingBox[];
}) {
  const { hoverBboxIndex, hoverAttributeKey, setHoverBbox } = useAiIngestionUIStore();

  const linkedClass = hoverAttributeKey
    ? ATTRIBUTE_TO_CLASS[hoverAttributeKey]
    : null;

  const boxes = useMemo(() => {
    if (bboxes.length === 0) return null;
    return bboxes.map((b, i) => {
      const isHovered = hoverBboxIndex === i;
      const isLinked = linkedClass != null && b.class === linkedClass;
      return (
        <div
          key={i}
          onMouseEnter={() => setHoverBbox(i)}
          onMouseLeave={() => setHoverBbox(null)}
          className={cn(
            "absolute border transition-transform duration-120 rounded-sm pointer-events-auto",
            BOX_CLASS[b.class].border,
            isHovered || isLinked ? "ring-2 ring-white/40 scale-[1.05]" : "opacity-80",
          )}
          style={{
            left: `${b.x * 100}%`,
            top: `${b.y * 100}%`,
            width: `${b.w * 100}%`,
            height: `${b.h * 100}%`,
            backgroundColor: isHovered ? "rgba(59,130,246,0.12)" : "transparent",
          }}
        >
          <span
            className={cn(
              "absolute -top-4 left-0 font-mono text-[8px] uppercase tracking-wider",
              BOX_CLASS[b.class].text,
            )}
          >
            {b.class} {Math.round(b.confidence * 100)}%
          </span>
        </div>
      );
    });
  }, [bboxes, hoverBboxIndex, linkedClass, setHoverBbox]);

  if (bboxes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 h-40 flex items-center justify-center">
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          No field photo captured
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <PhotoPlaceholder label={extractionId} className="w-full aspect-[4/3]" />
      <div className="absolute inset-0">{boxes}</div>
    </div>
  );
}
