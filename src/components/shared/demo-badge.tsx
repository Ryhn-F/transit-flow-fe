"use client";

import { Sparkles } from "lucide-react";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";
import { useDemoModeStore } from "@/infrastructure/mock/demo-mode-store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function DemoBadge() {
  const demoOn = useDemoMode();
  const toggle = useDemoModeStore((s) => s.toggle);
  const queryClient = useQueryClient();

  const handleToggle = () => {
    const next = !demoOn;
    useDemoModeStore.getState().setEnabled(next);
    void queryClient.invalidateQueries();
    toast.info(
      next
        ? "Demo mode ON — fixture data sources active"
        : "Demo mode OFF — real data sources",
      { duration: 3000 },
    );
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={demoOn}
      onClick={handleToggle}
      title="Toggle demo mode (fixture data vs real data)"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-150 active:scale-95 ${
        demoOn
          ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-500 dark:text-indigo-400"
          : "bg-slate-500/10 border-slate-500/25 text-slate-500 dark:text-slate-400"
      }`}
    >
      <Sparkles size={11} />
      {demoOn ? "Demo Mode: ON" : "Demo Mode: OFF"}
    </button>
  );
}
