"use client";

import { MousePointer, MapPin, Ruler, Save, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "../store/editor-store";
import { cn } from "@/lib/utils";
import type { EditorMode } from "../types";

const TOOLS: Array<{ mode: EditorMode; label: string; icon: typeof MousePointer }> = [
  { mode: "select", label: "Select", icon: MousePointer },
  { mode: "ojek", label: "Ojek Zone", icon: MapPin },
  { mode: "stanchion", label: "Stanchion", icon: Ruler },
];

const TOOL_BUTTON_CLASS =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400";

export function BufferEditorTools() {
  const { mode, setMode, isSaving, validationMessage, invalidIds, setSaving, draft, zones, barriers } =
    useEditorStore();
  const editing = mode !== "view";
  const emptyCanvas = !draft && zones.length === 0 && barriers.length === 0;

  const saveLayout = () => {
    if (isSaving) return;
    toast.info("Saving layout…");
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMode("view");
      toast.success("Layout saved");
    }, 600);
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] p-1.5 rounded-2xl shadow-2xl">
      <button
        type="button"
        onClick={() => setMode(editing ? "view" : "ojek")}
        aria-pressed={editing}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
          editing
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 glow-amber"
            : "bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
        )}
      >
        {editing ? "View Mode" : "Edit Buffer Layout"}
      </button>

      {editing && (
        <>
          <div className="w-px h-6 bg-slate-200/60 dark:bg-white/10" />
          {TOOLS.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={isSaving}
              aria-pressed={mode === m}
              className={cn(
                TOOL_BUTTON_CLASS,
                mode === m
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                isSaving && "opacity-50 pointer-events-none",
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={saveLayout}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            <Save size={12} />
            {isSaving ? "Saving…" : "Save Layout"}
          </button>
        </>
      )}

      {editing && (
        <div
          className={cn(
            "absolute -bottom-10 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all duration-200",
            emptyCanvas
              ? "bg-slate-100 dark:bg-[#141b2b] text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/10"
              : invalidIds.length > 0
                ? "bg-rose-500/10 text-rose-400 border-rose-500/25 glow-crimson"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
          )}
          role="status"
        >
          {emptyCanvas ? (
            <span className="animate-pulse">
              Click the map to place an ojek zone, or click to start a stanchion line.
            </span>
          ) : invalidIds.length > 0 ? (
            <>
              <XCircle size={12} />
              {validationMessage ?? "2.0 m lane clearance — violated"}
            </>
          ) : (
            <>
              <CheckCircle2 size={12} />
              {validationMessage ?? "2.0 m lane clearance — OK"}
            </>
          )}
        </div>
      )}
    </div>
  );
}
