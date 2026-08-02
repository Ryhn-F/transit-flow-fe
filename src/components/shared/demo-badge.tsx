"use client";

import { Sparkles } from "lucide-react";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function DemoBadge() {
  if (!isDemoMode()) return null;

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-[11px] font-medium shrink-0"
    >
      <Sparkles size={11} />
      Demo Mode
    </span>
  );
}
