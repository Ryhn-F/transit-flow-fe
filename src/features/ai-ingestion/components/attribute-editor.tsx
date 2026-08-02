"use client";

import { useEffect, useState } from "react";
import { useUpdateAttribute } from "../hooks/use-update-attribute";
import { validateAttributeValue } from "../schemas/attribute-schema";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";
import { cn } from "@/lib/utils";
import type { AiAttributeKey, AiExtraction, BoundingBoxClass } from "@/entities/ai-extraction";

const ROWS: {
  key: AiAttributeKey;
  label: string;
  suffix: string;
}[] = [
  { key: "pedestrian_count", label: "PEDESTRIANS", suffix: "ppl" },
  { key: "angkot_queue_length", label: "ANGKOT QUEUE", suffix: "veh" },
  { key: "vendor_blockage_pct", label: "VENDOR BLOCKAGE", suffix: "%" },
];

const ATTRIBUTE_TO_BBOX_CLASS: Record<AiAttributeKey, BoundingBoxClass> = {
  pedestrian_count: "pedestrian",
  angkot_queue_length: "angkot",
  vendor_blockage_pct: "vendor",
};

function AttributeRow({
  extraction,
  attrKey,
  label,
  suffix,
}: {
  extraction: AiExtraction;
  attrKey: AiAttributeKey;
  label: string;
  suffix: string;
}) {
  const value = extraction.attributes[attrKey];
  const confidence = extraction.confidence[attrKey];
  const { mutate } = useUpdateAttribute();
  const { setHoverAttribute } = useAiIngestionUIStore();
  const hoverBboxIndex = useAiIngestionUIStore((s) => s.hoverBboxIndex);

  const [local, setLocal] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (local === value) return;
    if (Number.isNaN(local)) return;
    const parsed = validateAttributeValue(attrKey, local);
    if (!parsed.success) return;
    const id = setTimeout(() => {
      setSaving(true);
      mutate(
        { id: extraction.id, key: attrKey, value: local },
        { onSettled: () => setSaving(false) },
      );
    }, 500);
    return () => clearTimeout(id);
  }, [local, value, attrKey, extraction.id, mutate]);

  const handleChange = (next: number) => {
    setLocal(next);
    const parsed = validateAttributeValue(attrKey, next);
    setError(parsed.success ? null : parsed.error.issues[0]?.message ?? null);
  };

  const linkedBbox =
    hoverBboxIndex != null
      ? extraction.bboxes[hoverBboxIndex]?.class === ATTRIBUTE_TO_BBOX_CLASS[attrKey]
      : false;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141b2b]/90 border transition-colors duration-120",
        linkedBbox
          ? "bg-blue-500/10 border-blue-500/20"
          : "border-slate-100 dark:border-white/[0.06]",
      )}
      onMouseEnter={() => setHoverAttribute(attrKey)}
      onMouseLeave={() => setHoverAttribute(null)}
      onFocus={() => setHoverAttribute(attrKey)}
      onBlur={() => setHoverAttribute(null)}
    >
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
          {label}
          {saving && (
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!saving && !error && local === value && (
            <span className="text-emerald-500">✓</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            aria-label={label}
            aria-invalid={!!error}
            value={Number.isNaN(local) ? "" : local}
            onChange={(e) => handleChange(e.target.valueAsNumber)}
            className={cn(
              "w-24 bg-slate-100 dark:bg-[#0c1019] font-mono text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-1 transition-colors",
              error
                ? "border-rose-500 focus:ring-rose-500/30"
                : "border-slate-200/80 dark:border-white/10 focus:border-blue-500/60 focus:ring-blue-500/30",
            )}
          />
          <span className="font-mono text-[9px] text-slate-500 uppercase">{suffix}</span>
        </div>
        {error && (
          <p className="text-[11px] text-rose-500 mt-1">{error}</p>
        )}
      </div>

      {/* Confidence bar */}
      <div className="w-24 shrink-0">
        <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
          CONF {confidence}%
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AttributeEditor({ extraction }: { extraction: AiExtraction }) {
  return (
    <section aria-label="AI extracted attributes" className="space-y-2">
      {ROWS.map((row) => (
        <AttributeRow
          key={`${extraction.id}:${row.key}`}
          extraction={extraction}
          attrKey={row.key}
          label={row.label}
          suffix={row.suffix}
        />
      ))}
    </section>
  );
}
