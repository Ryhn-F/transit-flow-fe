"use client";

import { useState } from "react";
import { Eye, EyeOff, Wifi, Activity, Server, Brain } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { useCCTVStore } from "./store/cctv-store";
import { useCCTVDriver, CameraCanvas } from "./hooks/use-cctv-driver";
import { cameraStationLabel, cameraStatusColor } from "@/infrastructure/mock/fixtures/cctv-fixtures";
import { cn } from "@/lib/utils";

function PipelineDiagram() {
  const pipeline = useCCTVStore((s) => s.pipeline);

  const stages = [
    { id: "cctv", label: "CCTV", icon: Wifi, state: pipeline.stageCctv },
    { id: "iot", label: "IoT Counters", icon: Activity, state: pipeline.stageIot },
    { id: "ai", label: "AI Validation", icon: Brain, state: pipeline.stageAi },
    { id: "vci", label: "VCI", icon: Server, state: pipeline.source === "SURVEY" ? "DEGRADED" : "OK" },
  ] as const;

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-80">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
        Data Pipeline
      </h3>
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-xl border text-center",
                s.state === "OK"
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : s.state === "DEGRADED"
                    ? "bg-amber-500/10 border-amber-500/25"
                    : "bg-rose-500/10 border-rose-500/25",
              )}
            >
              <s.icon size={13} className={s.state === "OK" ? "text-emerald-400" : s.state === "DEGRADED" ? "text-amber-400" : "text-rose-400"} />
              <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{s.label}</span>
              <span
                className={cn(
                  "font-mono text-[8px] font-bold uppercase",
                  s.state === "OK" ? "text-emerald-400" : s.state === "DEGRADED" ? "text-amber-400" : "text-rose-400",
                )}
              >
                {s.state}
              </span>
            </div>
            {i < stages.length - 1 && <span className="text-slate-500 text-[10px] shrink-0">→</span>}
          </div>
        ))}
      </div>
      <p className="font-mono text-[9px] text-slate-500 mt-2 uppercase tracking-wider">
        {pipeline.source === "SURVEY" ? "fallback: field survey data" : "source: CCTV + IoT"}
      </p>
    </div>
  );
}

function IotPanel() {
  const counters = useCCTVStore((s) => s.counters);

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-80">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
        IoT Foot-Traffic Counters
      </h3>
      <ul className="space-y-1.5">
        {counters.map((c) => (
          <li key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2b]/70 border border-slate-100 dark:border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">{c.id}</span>
            <span className="font-mono text-[9px] text-slate-500 flex-1">
              +{c.deltaPerTick} / 5s · {c.messageCount} msgs
            </span>
            <span className="font-mono text-[8px] text-emerald-500 uppercase">Live</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CCTVView() {
  useCCTVDriver();
  const { cameras, anonymize, toggleAnonymize, setFocus, focusCameraId, killCamera, reviveCamera } = useCCTVStore();
  const [filter, setFilter] = useState("ALL");

  const visible = cameras.filter((c) => filter === "ALL" || c.stationId === filter);
  const focus = cameras.find((c) => c.id === focusCameraId) ?? null;

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
          <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">CCTV & IoT</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter by station"
            className="ml-auto bg-slate-100 dark:bg-[#141b2b] text-xs rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-white/10"
          >
            <option value="ALL">ALL STATIONS</option>
            <option value="ST-DUK">Dukuh Atas</option>
            <option value="ST-MGR">Manggarai</option>
            <option value="ST-SUD">Sudirman</option>
          </select>
          <button
            type="button"
            onClick={toggleAnonymize}
            aria-pressed={anonymize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300 transition-colors"
          >
            {anonymize ? <EyeOff size={13} /> : <Eye size={13} />}
            {anonymize ? "Anonymized" : "Raw feed"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {/* Focus view */}
          {focus && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {focus.name}
                </h2>
                <button type="button" onClick={() => setFocus(null)} className="text-xs text-slate-400 hover:text-slate-600">
                  Close focus
                </button>
              </div>
              <div className="max-w-3xl">
                <CameraCanvas camera={focus} width={640} height={360} />
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((camera) => (
              <div
                key={camera.id}
                className="group relative rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141b2b]/70 p-2 transition-colors hover:border-blue-500/40"
              >
                <button type="button" onClick={() => setFocus(camera.id)} className="w-full text-left">
                  <CameraCanvas camera={camera} />
                </button>
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {camera.name}
                  </p>
                  <span className={cn("font-mono text-[8px] font-bold uppercase", cameraStatusColor(camera.status))}>
                    {camera.status}
                  </span>
                </div>
                <p className="font-mono text-[8px] text-slate-500 px-1">{cameraStationLabel(camera)}</p>
                <div className="flex gap-1 mt-1.5 px-1">
                  <button
                    type="button"
                    onClick={() => killCamera(camera.id)}
                    disabled={camera.status !== "STREAMING"}
                    className="flex-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-30"
                  >
                    Kill
                  </button>
                  <button
                    type="button"
                    onClick={() => reviveCamera(camera.id)}
                    disabled={camera.status === "STREAMING"}
                    className="flex-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
                  >
                    Revive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 px-5 py-4 border-t border-slate-200/80 dark:border-white/[0.08] shrink-0">
          <PipelineDiagram />
          <IotPanel />
        </div>
      </div>
    </AppShell>
  );
}
