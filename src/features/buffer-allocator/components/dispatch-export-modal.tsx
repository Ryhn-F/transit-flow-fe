"use client";

import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, FileDown } from "lucide-react";
import { useEditorStore } from "../store/editor-store";
import { useExportPlan } from "../hooks/use-buffer-mutations";
import { cn } from "@/lib/utils";

export function DispatchExportModal() {
  const { exportOpen, setExportOpen, barriers } = useEditorStore();
  const { mutate, data } = useExportPlan();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [exportOpen, setExportOpen]);

  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    },
    [],
  );

  const openExport = () => {
    setGenerating(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      mutate(undefined, {
        onSettled: () => setGenerating(false),
      });
    }, 600);
  };

  if (!exportOpen) return null;

  const copyPayload = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data.webhook_payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <button
        type="button"
        aria-label="Close dispatch plan"
        onClick={() => setExportOpen(false)}
        className="absolute inset-0 bg-black/50 pointer-events-auto"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dispatch plan export"
        className="pointer-events-auto w-[560px] max-w-[92vw] bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              Dispatch Plan
            </h2>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Barrier Layout Export
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setExportOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {barriers.length === 0 && !data ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add a stanchion to export a plan.
            </p>
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Plan preview */}
            <div className="relative rounded-xl bg-slate-50 dark:bg-[#141b2b]/90 border border-slate-100 dark:border-white/[0.06] p-4 min-h-44">
              {generating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Generating dispatch map…
                    </p>
                  </div>
                </div>
              ) : data ? (
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    <span>PLAN {data.plan_id}</span>
                    <span>{new Date(data.issued_at).toLocaleTimeString("en-GB")}</span>
                  </div>
                  <div className="flex items-center gap-4 h-20">
                    <div className="relative flex-1 h-full">
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-300 dark:bg-white/20" />
                      {data.barriers.map((b) => (
                        <div
                          key={b.id}
                          className={cn(
                            "absolute bottom-0 w-0.5 rounded-full",
                            b.active ? "bg-emerald-500" : "bg-slate-400",
                          )}
                          style={{
                            left: `${(b.vertices.length * 7) % 80}%`,
                            height: `${35 + (b.vertices.length % 3) * 15}%`,
                          }}
                        />
                      ))}
                      {data.slots.map((s, i) => (
                        <div
                          key={s.id}
                          className="absolute bottom-0 w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20"
                          style={{ left: `${12 + i * 16}%`, top: `${20 + (i % 2) * 30}%` }}
                        />
                      ))}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="w-10 h-px bg-slate-400" />
                        <span className="font-mono text-[8px] text-slate-500">50 m</span>
                      </div>
                    </div>
                    <div className="space-y-1 shrink-0">
                      <span className="block w-3 h-1 rounded bg-emerald-500" />
                      <span className="font-mono text-[8px] text-slate-500 uppercase">Barrier</span>
                      <span className="block w-3 h-3 rounded-full border-2 border-amber-400 mt-1" />
                      <span className="font-mono text-[8px] text-slate-500 uppercase">Ojek slot</span>
                    </div>
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    {data.barriers.length} stanchions · {data.slots.length} active slots · operator: {data.operator}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={copyPayload}
                disabled={!data}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-md shadow-blue-600/25 transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Payload copied — matches /api/v1/buffer-zones/active" : "Copy webhook payload"}
              </button>
              {data && (
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                  {data.payload_bytes.toLocaleString()} B
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={openExport}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <FileDown size={13} />
              Regenerate plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
