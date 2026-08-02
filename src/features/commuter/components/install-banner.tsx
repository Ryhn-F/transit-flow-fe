"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { usePortalStore } from "../store/portal-store";

export function InstallBanner() {
  const { lang, installDismissed, dismissInstall } = usePortalStore();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!installDismissed) return;
    const t = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(t);
  }, [installDismissed]);

  if (!visible || installDismissed) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-30 mx-auto max-w-sm rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl shadow-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
        <Download size={17} className="text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900 dark:text-white">
          {lang === "id" ? "Instal TransitFlow untuk akses cepat" : "Install TransitFlow for quick access"}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {lang === "id" ? "Tambahkan ke layar utama" : "Add to home screen"}
        </p>
      </div>
      <button
        type="button"
        onClick={dismissInstall}
        className="px-3 py-2 rounded-xl text-[12px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
      >
        {lang === "id" ? "Nanti" : "Later"}
      </button>
    </div>
  );
}
