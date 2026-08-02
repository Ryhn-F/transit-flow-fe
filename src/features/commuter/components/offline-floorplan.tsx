"use client";

import { MapPin, TrainFront } from "lucide-react";
import { usePortalStore } from "../store/portal-store";

export function OfflineFloorplan() {
  const { lang, hub } = usePortalStore();
  const t = (id: string, en: string) => (lang === "id" ? id : en);

  const doorCount = hub?.doors.length ?? 4;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-amber-500">
        <MapPin size={15} />
        <p className="text-[13px] font-semibold">
          {t("Peta offline dari cache", "Offline map from cache")}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrainFront size={18} className="text-blue-500" />
          <p className="text-[15px] font-bold text-slate-900 dark:text-white">
            {hub ? (lang === "id" ? hub.nameId : hub.nameEn) : t("Stasiun", "Station")}
          </p>
        </div>
        <div className="relative h-40 rounded-2xl bg-slate-50 dark:bg-[#0c1019] border border-slate-100 dark:border-white/[0.06] overflow-hidden">
          <div className="absolute inset-x-6 top-8 h-1.5 rounded-full bg-blue-500/60" />
          <div className="absolute left-8 top-6 bottom-8 w-1.5 rounded-full bg-blue-500/60" />
          {Array.from({ length: doorCount }).map((_, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold"
              style={{ left: `${16 + i * 22}%`, top: "42%" }}
            >
              {hub?.doors[i]?.label ?? String.fromCharCode(65 + i)}
            </div>
          ))}
          <div className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            {t("Denah lantai · cache", "Floorplan · cached")}
          </div>
        </div>
        <p className="text-[12px] text-slate-400 mt-3">
          {t(
            "Laporan tetap tersimpan dan terkirim saat online kembali.",
            "Reports stay saved and send once you're back online.",
          )}
        </p>
      </div>
    </div>
  );
}
