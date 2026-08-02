"use client";

import { useEffect } from "react";
import { X, Umbrella } from "lucide-react";
import { useWeatherUIStore } from "../store/weather-ui-store";

export function RainSafePathModal() {
  const modalOpen = useWeatherUIStore((s) => s.modalOpen);
  const setModalOpen = useWeatherUIStore((s) => s.setModalOpen);
  const autoEnabled = useWeatherUIStore((s) => s.autoEnabled);
  const detours = useWeatherUIStore((s) => s.detours);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, setModalOpen]);

  if (!modalOpen) return null;

  const best = detours[0];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <button
        type="button"
        aria-label="Close preview"
        onClick={() => setModalOpen(false)}
        className="absolute inset-0 bg-black/50 pointer-events-auto"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rain Safe-Path preview"
        className="pointer-events-auto w-[480px] max-w-[92vw] bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
            Jalur Aman Hujan
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Trip</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Tanah Abang → Sudirman
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <Umbrella size={13} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500">
              {autoEnabled ? "Aktif" : "Tidak aktif"}
            </span>
          </div>
        </div>

        {!best ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tidak ada jalur terlindung untuk perjalanan ini
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
            <div className="h-16 relative mb-3">
              <svg viewBox="0 0 200 40" className="w-full h-full">
                <path
                  d="M4 32 L60 18 L120 30 L196 10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="4" cy="32" r="4" fill="#0c1019" stroke="#10b981" />
                <circle cx="196" cy="10" r="4" fill="#0c1019" stroke="#10b981" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Via covered walkway C · +{best.timeDeltaMin} min
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {best.coveredPct}% jalur terlindung — elevated walkway & indoor corridor
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className="mt-5 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
