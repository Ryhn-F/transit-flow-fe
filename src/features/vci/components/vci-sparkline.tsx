"use client";

import { useMemo, useState } from "react";
import type { VCIMetric } from "@/entities/vci-metric";
import { bandOf } from "@/features/vci/lib/vci-formula";

const W = 160;
const H = 40;

export function VciSparkline({ history }: { history: VCIMetric[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, ticks } = useMemo(() => {
    if (history.length < 2) return { path: "", ticks: [] as { x: number; y: number; i: number }[] };
    const scores = history.map((m) => m.vci_score);
    const max = Math.max(100, ...scores);
    const min = Math.min(0, ...scores);
    const range = Math.max(1, max - min);
    const stepX = W / (history.length - 1);
    const points = history.map((m, i) => {
      const x = i * stepX;
      const y = H - 4 - ((m.vci_score - min) / range) * (H - 8);
      return [x, y] as const;
    });
    const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const ticks = points.map(([x, y], i) => ({ x, y, i }));
    return { path, ticks };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="h-10 rounded-lg bg-white/5 flex items-center justify-center">
        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
          no history
        </span>
      </div>
    );
  }

  const hovered = hoverIndex != null ? history[hoverIndex] : null;

  return (
    <div className="relative" role="img" aria-label="24 hour VCI history">
      <svg width={W} height={H} className="w-full h-auto">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500" />
        {ticks.map(({ x, y, i }) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hoverIndex === i ? 3 : 0}
            className="fill-blue-500 transition-all duration-100"
          />
        ))}
        {hovered && hoverIndex != null && (
          <line
            x1={ticks[hoverIndex].x}
            y1={0}
            x2={ticks[hoverIndex].x}
            y2={H}
            stroke="#3b82f6"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        )}
      </svg>
      <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: hoverIndex != null ? `${(hoverIndex / (history.length - 1)) * 100}%` : undefined }}>
        {hovered && hoverIndex != null && (
          <div className="bg-[#0c1019] border border-white/10 rounded-lg px-2 py-1 -translate-x-1/2 whitespace-nowrap pointer-events-auto">
            <span className="font-mono text-[9px] text-slate-300">
              {new Date(hovered.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · VCI {hovered.vci_score}
              <span className={`ml-1 ${hovered.vci_score >= 80 ? "text-rose-400" : hovered.vci_score >= 50 ? "text-amber-400" : "text-emerald-400"}`}>
                [{bandOf(hovered.vci_score)}]
              </span>
            </span>
          </div>
        )}
      </div>
      <div
        className="absolute inset-0"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          setHoverIndex(Math.round(ratio * (history.length - 1)));
        }}
        onMouseLeave={() => setHoverIndex(null)}
      />
    </div>
  );
}
