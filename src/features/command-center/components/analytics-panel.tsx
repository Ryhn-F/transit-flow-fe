"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { historySeries, leadTimes } from "../fixtures/cc-fixtures";
import { toast } from "sonner";

const W = 260;
const H = 80;

function TrendChart({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const stepX = W / (series.length - 1);
  const path = series
    .map((v, i) => {
      const x = i * stepX;
      const y = H - 4 - ((v - min) / range) * (H - 8);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} className="w-full h-auto" role="img" aria-label="Trend chart">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
      <path
        d={`${path} L${W},${H} L0,${H} Z`}
        fill={color}
        opacity="0.08"
      />
    </svg>
  );
}

export function AnalyticsPanel() {
  const [windowDays, setWindowDays] = useState(7);
  const [slider, setSlider] = useState(1); // 0..1 scrub offset

  const series = useMemo(() => historySeries(60), []);
  const leads = useMemo(() => leadTimes(60), []);

  const windowed = series.slice(60 - windowDays, 60 - windowDays + Math.round(slider * (60 - windowDays)) || 60 - windowDays);
  const windowedLeads = leads.slice(60 - windowDays);

  const meanLead = windowedLeads.length
    ? Math.round(windowedLeads.reduce((a, b) => a + b, 0) / windowedLeads.length)
    : 0;

  const exportCsv = () => {
    const header = "day,bottleneck_vci,lead_min\n";
    const rows = series.map((v, i) => `${i + 1},${v},${leads[i]}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kemenhub-bottleneck-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kemenhub CSV exported");
  };

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-80 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Historical Analytics
        </h3>
        <div className="flex items-center gap-1">
          {[7, 30, 60].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setWindowDays(d)}
              className={cnWindow(d, windowDays)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">Bottleneck trend (VCI)</p>
      <div className="text-blue-500">
        <TrendChart series={windowed.length > 1 ? windowed : series.slice(60 - windowDays)} color="#3b82f6" />
      </div>

      <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mt-3 mb-1">Response lead time (min)</p>
      <div className="text-emerald-500">
        <TrendChart series={windowedLeads} color="#10b981" />
      </div>
      <p className="font-mono text-[10px] text-slate-500 mt-1">
        mean {meanLead}m · p95 {Math.max(...windowedLeads)}m
      </p>

      <input
        type="range"
        min={0}
        max={100}
        value={slider * 100}
        onChange={(e) => setSlider(Number(e.target.value) / 100)}
        aria-label="Time slider"
        className="w-full mt-3"
      />
      <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase tracking-wider">
        <span>D-{windowDays}</span>
        <span>Today</span>
      </div>

      <button
        type="button"
        onClick={exportCsv}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
      >
        <Download size={12} />
        Export CSV (Kemenhub)
      </button>
    </div>
  );
}

function cnWindow(d: number, current: number): string {
  return `px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold border transition-colors ${
    d === current
      ? "bg-blue-600 text-white border-blue-400/30"
      : "text-slate-500 border-transparent hover:border-white/10"
  }`;
}
