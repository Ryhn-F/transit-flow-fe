"use client";

import { Download, Wifi, WifiOff, Languages } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function PortalHeader() {
  const { lang, toggleLang, offline, setOffline, installDismissed, dismissInstall } = usePortalStore();

  return (
    <header
      className="shrink-0 sticky top-0 z-20 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight flex-1">
          TransitFlow <span className="text-emerald-500">Portal</span>
        </h1>

        {isDemoMode() && (
          <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
            Demo
          </span>
        )}

        <button
          type="button"
          onClick={toggleLang}
          aria-label="Toggle language"
          className="w-11 h-11 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <Languages size={17} />
          <span className="text-[9px] font-bold ml-0.5">{lang === "id" ? "ID" : "EN"}</span>
        </button>

        <button
          type="button"
          onClick={() => setOffline(!offline)}
          aria-pressed={offline}
          aria-label="Toggle offline mode"
          className={cnButton(offline)}
        >
          {offline ? <WifiOff size={17} /> : <Wifi size={17} />}
        </button>

        {!installDismissed && (
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Install app"
            className="w-11 h-11 flex items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-colors"
          >
            <Download size={17} />
          </button>
        )}
      </div>

      {offline && (
        <div className="px-4 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
          Mode luring aktif — peta dari cache
        </div>
      )}
    </header>
  );
}

function cnButton(active: boolean): string {
  return `w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
    active
      ? "text-amber-500 bg-amber-500/10"
      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
  }`;
}
