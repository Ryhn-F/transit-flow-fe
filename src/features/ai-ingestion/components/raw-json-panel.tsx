"use client";

import { useState } from "react";

export function RawJsonPanel({ json }: { json: string }) {
  const lines = json.split("\n").length;
  const [open, setOpen] = useState(lines <= 200);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141b2b]/80 overflow-hidden"
    >
      <summary className="px-4 py-2.5 cursor-pointer flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
        <span className="font-mono uppercase tracking-[0.15em] text-[9px]">
          Raw Gemini JSON
        </span>
        <span className="font-mono text-[9px] text-slate-500">
          {lines} lines {lines > 200 ? `· collapsed [+${lines - 200} more]` : ""}
        </span>
      </summary>
      <pre className="p-4 font-mono text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words max-h-64 overflow-y-auto scrollbar-thin">
        {json}
      </pre>
    </details>
  );
}
