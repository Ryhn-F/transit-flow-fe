"use client";

import { Home, Footprints, Send, Bell } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { cn } from "@/lib/utils";
import type { PortalTab } from "../store/portal-store";

const TABS: Array<{ tab: PortalTab; labelId: string; labelEn: string; icon: typeof Home }> = [
  { tab: "home", labelId: "Beranda", labelEn: "Home", icon: Home },
  { tab: "safe-path", labelId: "Jalur Aman", labelEn: "Safe-Path", icon: Footprints },
  { tab: "report", labelId: "Lapor", labelEn: "Report", icon: Send },
  { tab: "notifications", labelId: "Notifikasi", labelEn: "Alerts", icon: Bell },
];

export function BottomNav() {
  const { tab, setTab, lang } = usePortalStore();

  return (
    <nav
      aria-label="Portal navigation"
      className="shrink-0 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ tab: t, labelId, labelEn, icon: Icon }) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-h-11 py-2 transition-all duration-150",
                active
                  ? "text-emerald-500"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              )}
            >
              <Icon size={19} className={cn(active && "scale-110 transition-transform duration-150")} />
              <span className="text-[10px] font-semibold">{lang === "id" ? labelId : labelEn}</span>
              {active && <span className="w-4 h-0.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
