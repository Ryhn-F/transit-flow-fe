"use client";

import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function DemoBadge() {
  if (!isDemoMode()) return null;

  return (
    <span
      role="status"
      className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono text-[9px] font-bold uppercase tracking-[0.15em] glow-amber shrink-0"
    >
      DEMO MODE · Fixture Data
    </span>
  );
}
