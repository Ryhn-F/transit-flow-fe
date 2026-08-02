"use client";

import { useEffect, useState } from "react";
import { LocateFixed, Loader2, MapPin, AlertTriangle } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { useSafePath } from "../hooks/use-portal-driver";
import { COMMUTER_HUBS } from "../fixtures/portal-fixtures";
import { cn } from "@/lib/utils";

export function HomeView() {
  const { lang, locationState, resolvedHubId, distanceKm, hub, notifications } = usePortalStore();
  const safePath = useSafePath();
  const [manualOpen, setManualOpen] = useState(false);
  const latestAlert = notifications[0];

  const t = (id: string, en: string) => (lang === "id" ? id : en);

  useEffect(() => {
    if (!hub) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setManualOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hub]);

  return (
    <div className="p-5 space-y-5">
      {/* Location card */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {t("Lokasi Anda", "Your location")}
        </p>

        {locationState === "locating" && (
          <div className="flex items-center gap-3 py-1">
            <Loader2 size={17} className="animate-spin text-emerald-500" />
            <span className="text-[15px] font-medium text-slate-600 dark:text-slate-300">
              {t("Mencari lokasi…", "Finding your location…")}
            </span>
          </div>
        )}

        {locationState === "resolved" && hub && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[17px] font-bold text-slate-900 dark:text-white">
                {lang === "id" ? hub.nameId : hub.nameEn}
              </p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                {distanceKm} km · {t("stasiun terdekat", "nearest station")}
              </p>
            </div>
          </div>
        )}

        {locationState === "denied" && (
          <div className="space-y-3">
            <p className="text-[14px] text-rose-500 font-medium">
              {t(
                "Lokasi tidak diizinkan. Pilih stasiun secara manual.",
                "Location denied. Choose a station manually.",
              )}
            </p>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="w-full min-h-11 px-4 py-3 rounded-2xl text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              {t("Pilih stasiun", "Pick a station")}
            </button>
            {manualOpen && (
              <div className="space-y-2" role="list" aria-label="Stations">
                {COMMUTER_HUBS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    role="listitem"
                    onClick={() => {
                      usePortalStore.getState().resolveHub(h.id, 0);
                      setManualOpen(false);
                    }}
                    className="w-full min-h-11 px-4 py-3 rounded-2xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#0c1019] border border-slate-200/80 dark:border-white/10"
                  >
                    {lang === "id" ? h.nameId : h.nameEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {locationState === "idle" && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("portal:locate"))}
            className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            <LocateFixed size={17} />
            {t("Gunakan Lokasi Saya", "USE MY LOCATION")}
          </button>
        )}
      </section>

      {/* Safe-Path card */}
      {hub && safePath && (
        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            {t("Rekomendasi Pintu Aman", "Safe Exit Recommendation")}
          </p>
          <p className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">
            {safePath.allEqual
              ? t("Semua pintu setara — pilih pintu terdekat", "All doors equal — pick the nearest")
              : safePath.deltas[1]
                ? t(
                    `Pintu ${safePath.recommended.label} ${safePath.deltas[1].clearerPct}% lebih lengang dari Pintu ${safePath.deltas[1].door.label}`,
                    `Exit Door ${safePath.recommended.label} is ${safePath.deltas[1].clearerPct}% clearer than Door ${safePath.deltas[1].door.label}`,
                  )
                : t(`Gunakan Pintu ${safePath.recommended.label}`, `Use Door ${safePath.recommended.label}`)}
          </p>
          <div className="mt-3 space-y-2">
            {safePath.deltas.slice(0, 3).map(({ door, clearerPct }) => (
              <div key={door.id} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white dark:bg-[#0c1019] border border-slate-200 dark:border-white/15 flex items-center justify-center text-[12px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                  {door.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/60 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", door.id === safePath.recommended.id ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}
                    style={{ width: `${Math.max(12, 100 - clearerPct)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                  {door.vci}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-slate-400 mt-3">
            {t("Diperbarui 12 detik lalu", "Updated 12 seconds ago")}
          </p>
        </section>
      )}

      {/* Latest alert strip */}
      {latestAlert && (
        <button
          type="button"
          onClick={() => usePortalStore.getState().setTab("notifications")}
          className="w-full flex items-center gap-3 rounded-3xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 text-left"
        >
          <AlertTriangle size={17} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{latestAlert.title}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{latestAlert.body}</p>
          </div>
        </button>
      )}
    </div>
  );
}
