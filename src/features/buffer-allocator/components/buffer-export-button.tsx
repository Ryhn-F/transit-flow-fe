"use client";

import { FileOutput } from "lucide-react";
import { useEditorStore } from "../store/editor-store";
import { cn } from "@/lib/utils";

export function BufferExportButton() {
  const { setExportOpen, barriers } = useEditorStore();

  return (
    <button
      type="button"
      onClick={() => setExportOpen(true)}
      disabled={barriers.length === 0}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 shadow-md shadow-blue-600/25 border border-blue-400/30 active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
      )}
      title={barriers.length === 0 ? "Add a stanchion to export a plan" : "Export dispatch plan"}
    >
      <FileOutput size={12} />
      Export Dispatch Map
    </button>
  );
}
