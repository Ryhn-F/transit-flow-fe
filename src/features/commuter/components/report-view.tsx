"use client";

import { useState } from "react";
import { TrafficCone, MoveVertical, Droplets, ImagePlus, CheckCircle2, Send } from "lucide-react";
import { usePortalStore } from "../store/portal-store";
import { crowdReportSchema, type CrowdReportInput } from "../lib/schemas";
import { cn } from "@/lib/utils";

const TYPES: Array<{ type: CrowdReportInput["type"]; labelId: string; labelEn: string; icon: typeof TrafficCone }> = [
  { type: "blockage", labelId: "Penghalang", labelEn: "Blockage", icon: TrafficCone },
  { type: "escalator", labelId: "Eskalator Rusak", labelEn: "Broken Escalator", icon: MoveVertical },
  { type: "flood", labelId: "Genangan", labelEn: "Flood", icon: Droplets },
];

export function ReportView() {
  const { lang, hub, offline, submitReport, reportSubmitted } = usePortalStore();
  const [type, setType] = useState<CrowdReportInput["type"] | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const t = (id: string, en: string) => (lang === "id" ? id : en);

  const submit = () => {
    if (!type) {
      setError(t("Pilih jenis laporan", "Choose a report type"));
      return;
    }
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const report = submitReport({
        type,
        hubId: hub?.id ?? "manggarai",
        photoUrl: photo ?? undefined,
      });
      setSubmitting(false);
      setType(null);
      setPhoto(null);
      void report;
    }, 450);
  };

  if (reportSubmitted) {
    return (
      <div className="p-5">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} className="text-emerald-500" />
          </div>
          <p className="text-[17px] font-bold text-slate-900 dark:text-white">
            {t("Laporan terkirim!", "Report sent!")}
          </p>
          <p className="font-mono text-[13px] font-bold text-emerald-500">{reportSubmitted.id}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            {t("Lihat di dasbor operator", "View in operator dashboard")} →
          </p>
          <button
            type="button"
            onClick={() => usePortalStore.getState().setTab("home")}
            className="w-full min-h-11 mt-2 px-4 py-3 rounded-2xl text-[14px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0c1019] border border-slate-200/80 dark:border-white/10"
          >
            {t("Kembali", "Back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300">
        {t("Apa yang terjadi di stasiun Anda?", "What happened at your station?")}
      </p>

      <div className="grid grid-cols-1 gap-2">
        {TYPES.map(({ type: t2, labelId, labelEn, icon: Icon }) => (
          <button
            key={t2}
            type="button"
            aria-pressed={type === t2}
            onClick={() => {
              setType(t2);
              setError(null);
            }}
            className={cn(
              "flex items-center gap-3 min-h-11 px-4 py-3 rounded-2xl border transition-all duration-150",
              type === t2
                ? "border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                : "border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70",
            )}
          >
            <Icon size={18} className={type === t2 ? "text-emerald-500" : "text-slate-400"} />
            <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
              {lang === "id" ? labelId : labelEn}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-[13px] text-rose-500 font-medium">{error}</p>}

      <label className="flex items-center justify-center gap-2 min-h-11 px-4 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-slate-400 cursor-pointer">
        <ImagePlus size={17} />
        <span className="text-[13px] font-medium">
          {photo ? t("Foto terlampir", "Photo attached") : t("Tambahkan foto (opsional)", "Add a photo (optional)")}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = () => setPhoto(String(reader.result));
              reader.readAsDataURL(f);
            }
          }}
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !type}
        className={cn(
          "w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[15px] font-bold text-white transition-all duration-150",
          submitting || !type ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400",
        )}
      >
        {submitting ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send size={16} />
            {t("Kirim Laporan", "Send Report")}
          </>
        )}
      </button>

      {offline && (
        <p className="text-[12px] text-amber-500 font-medium text-center">
          {t("Tersimpan offline — terkirim saat online", "Saved offline — will send when online")}
        </p>
      )}

      {hub && (
        <p className="text-[12px] text-slate-400 text-center">
          {t("Melapor untuk", "Reporting for")} {lang === "id" ? hub.nameId : hub.nameEn}
        </p>
      )}
    </div>
  );
}
