"use client";

import { Footprints, Umbrella } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { useSafePath } from "../hooks/use-portal-driver";
import { cn } from "@/lib/utils";

export function SafePathView() {
  const { lang, hub } = usePortalStore();
  const safePath = useSafePath();
  const t = (id: string, en: string) => (lang === "id" ? id : en);

  if (!hub) {
    return (
      <div className="p-5">
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-3">
          <div className="h-5 rounded-full bg-slate-100 dark:bg-white/10 animate-pulse" />
          <div className="h-5 rounded-full bg-slate-100 dark:bg-white/10 animate-pulse w-3/4" />
          <div className="h-12 rounded-2xl bg-slate-100 dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!safePath) return null;

  const steps = [
    { n: 1, label: t("Keluar di pintu", "Exit at door") + ` ${safePath.recommended.label}` },
    {
      n: 2,
      label: t("Ikuti walkway terlindung", "Follow covered walkway") + ` (${hub.walkwayMinutes[safePath.recommended.label]} min)`,
    },
    { n: 3, label: t("Tiba di halte", "Arrive at stop") },
  ];

  return (
    <div className="p-5 space-y-5">
      <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
          {t("Pintu Teraman", "Safest Door")}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t("Pintu", "Door")} {safePath.recommended.label}
          <span className="ml-2 font-mono text-sm font-bold text-emerald-500">{safePath.recommended.vci}</span>
        </p>
        {safePath.recommended.isCovered && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[12px] font-semibold">
            <Umbrella size={12} /> {t("Walkway terlindung", "Covered walkway")}
          </span>
        )}
      </section>

      {/* Steps */}
      <ol className="space-y-2" aria-label="Navigate steps">
        {steps.map((s, i) => (
          <li key={s.n} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70 px-4 py-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 flex items-center justify-center text-[13px] font-bold shrink-0">
              {s.n}
            </span>
            <span className="text-[14px] font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
            {i === steps.length - 1 && <Footprints size={16} className="ml-auto text-slate-400" />}
          </li>
        ))}
      </ol>

      {/* Comparison */}
      <section aria-label={t("Perbandingan pintu", "Door comparison")}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t("Perbandingan pintu", "Door comparison")}
        </p>
        <div className="space-y-2" role="list">
          {safePath.deltas.map(({ door }) => (
            <div
              key={door.id}
              role="listitem"
              aria-current={door.id === safePath.recommended.id ? "true" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 min-h-11",
                door.id === safePath.recommended.id
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70",
              )}
            >
              <span className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#0c1019] border border-slate-200 dark:border-white/15 flex items-center justify-center text-[13px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                {door.label}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">
                    {door.vci >= 80
                      ? t("Padat", "Crowded")
                      : door.vci >= 50
                        ? t("Sedang", "Busy")
                        : t("Lengang", "Clear")}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {door.vci}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      door.vci >= 80 ? "bg-rose-500" : door.vci >= 50 ? "bg-amber-400" : "bg-emerald-500",
                    )}
                    style={{ width: `${door.vci}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
