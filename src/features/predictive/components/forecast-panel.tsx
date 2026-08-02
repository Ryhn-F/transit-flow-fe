"use client";

import { useState } from "react";
import { BellRing, CalendarDays, FlaskConical, LineChart } from "lucide-react";
import { useForecastStore } from "../store/forecast-store";
import { useForecastSeries } from "../components/forecast-layer-controller";
import { mockForecastRepository } from "@/infrastructure/repositories/mock-forecast-repository";
import { FORECAST_EVENTS } from "@/infrastructure/mock/fixtures/forecast-fixtures";
import { SCENARIO_PRESETS } from "../lib/scenario";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const W = 280;
const H = 90;

export function ForecastCurveChart({ exitId }: { exitId: string }) {
  const series = useForecastSeries(exitId);
  const elapsedHours = useForecastStore((s) => s.elapsedHours);
  const scenarioResult = useForecastStore((s) => s.scenarioResult);
  const scenarioSeries = scenarioResult?.series.find((s) => s.exitId === exitId);

  if (!series) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading forecast">
        <div className="h-20 rounded-lg bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  const scenario = scenarioSeries ?? series;
  const max = 120;
  const stepX = W / (scenario.points.length - 1);

  const meanPath = scenario.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(H - 6 - (p.vci / max) * (H - 12)).toFixed(1)}`)
    .join(" ");
  const bandTop = scenario.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(H - 6 - (p.bandHigh / max) * (H - 12)).toFixed(1)}`)
    .join(" ");
  const bandBottom = [...scenario.points]
    .reverse()
    .map((p, i) => `L${((scenario.points.length - 1 - i) * stepX).toFixed(1)},${(H - 6 - (p.bandLow / max) * (H - 12)).toFixed(1)}`)
    .join(" ");

  const nowX = (elapsedHours / 48) * W;

  return (
    <div className="relative">
      <svg width={W} height={H} className="w-full h-auto" role="img" aria-label="48 hour VCI forecast">
        <path d={`${bandTop} ${bandBottom} Z`} fill="#3b82f6" opacity="0.12" />
        <path d={meanPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        {nowX >= 0 && nowX <= W && (
          <line x1={nowX} y1={0} x2={nowX} y2={H} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <text x={nowX + 3} y={10} fontSize="7" fill="#f59e0b" fontFamily="monospace">
          NOW
        </text>
      </svg>
      <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase tracking-wider mt-1">
        <span>-48h</span>
        <span>now</span>
        <span>+48h</span>
      </div>
    </div>
  );
}

export function ForecastPanel() {
  const [tab, setTab] = useState<"forecast" | "events" | "scenario">("forecast");
  const {
    forecastOn,
    setForecastOn,
    activeEventId,
    setActiveEvent,
    warning,
    warningDispatched,
    setWarningDispatched,
    setRunningScenario,
    setScenarioResult,
    runningScenarioId,
    elapsedHours,
  } = useForecastStore();
  const [scenarioInput, setScenarioInput] = useState({ trainDelayMin: 20, eventShiftEndHour: null as number | null, rainLevel: "heavy" as "none" | "light" | "heavy", holidayFactor: 1 });

  const runScenario = async (input = scenarioInput) => {
    setRunningScenario("custom");
    const result = await mockForecastRepository.runScenario(
      { trainDelayMin: input.trainDelayMin, eventShiftEndHour: input.eventShiftEndHour, rainLevel: input.rainLevel, holidayFactor: input.holidayFactor },
      elapsedHours,
    );
    setScenarioResult(result);
    setRunningScenario(null);
    toast.success("Scenario computed — curves updated");
  };

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-80 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          48h Forecast
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={forecastOn}
          onClick={() => setForecastOn(!forecastOn)}
          className={cn(
            "w-10 h-5.5 rounded-full border transition-all duration-150 relative h-6",
            forecastOn ? "bg-blue-600 border-blue-400/30" : "bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/15",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-150",
              forecastOn ? "left-[18px]" : "left-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex gap-1 mb-3" role="tablist" aria-label="Forecast tabs">
        {(
          [
            ["forecast", "Curves", LineChart],
            ["events", "Events", CalendarDays],
            ["scenario", "What-If", FlaskConical],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-150",
              tab === id
                ? "bg-blue-600 text-white border-blue-400/30"
                : "bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
            )}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {tab === "forecast" && (
        <div>
          <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
            SUD-E · GBK concert Fri 21:00
          </p>
          <ForecastCurveChart exitId="SUD-E" />
          <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mt-3 mb-1">
            DUK-GB
          </p>
          <ForecastCurveChart exitId="DUK-GB" />
        </div>
      )}

      {tab === "events" && (
        <ul className="space-y-1.5">
          {FORECAST_EVENTS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setActiveEvent(activeEventId === e.id ? null : e.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl border transition-all duration-150",
                  activeEventId === e.id
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
                )}
              >
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{e.name}</p>
                <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                  {e.startsHour}:00–{e.endsHour}:00 · conf {Math.round(e.confidence * 100)}% · {e.source}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "scenario" && (
        <div className="space-y-2.5">
          {SCENARIO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setScenarioInput(p.input);
                void runScenario(p.input);
              }}
              disabled={runningScenarioId != null}
              className="w-full text-left px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141b2b]/70 hover:border-blue-500/40 transition-colors disabled:opacity-50"
            >
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                {p.name}
              </p>
              <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                delay {p.input.trainDelayMin}m · rain {p.input.rainLevel} · holiday ×{p.input.holidayFactor}
              </p>
            </button>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1 block">
                Train delay (min)
              </span>
              <input
                type="number"
                min={0}
                max={120}
                value={scenarioInput.trainDelayMin}
                onChange={(e) => setScenarioInput({ ...scenarioInput, trainDelayMin: Number(e.target.value) })}
                className="w-full bg-slate-100 dark:bg-[#141b2b] text-xs rounded-xl px-3 py-2 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:border-blue-500/60"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1 block">
                Rain
              </span>
              <select
                value={scenarioInput.rainLevel}
                onChange={(e) => setScenarioInput({ ...scenarioInput, rainLevel: e.target.value as "none" | "light" | "heavy" })}
                className="w-full bg-slate-100 dark:bg-[#141b2b] text-xs rounded-xl px-3 py-2 border border-slate-200/80 dark:border-white/10"
              >
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="heavy">Heavy</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void runScenario()}
            disabled={runningScenarioId != null}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 transition-colors disabled:opacity-50"
          >
            <FlaskConical size={12} />
            {runningScenarioId ? "Computing…" : "Run Simulation"}
          </button>
        </div>
      )}

      {warning && !warningDispatched && (
        <div className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3">
          <div className="flex items-center gap-2 mb-1">
            <BellRing size={13} className="text-rose-400" />
            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Predicted surge
            </p>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            {warning.exitId} forecast VCI {warning.vci} at +{warning.hour}h — within 24h window
          </p>
          <button
            type="button"
            onClick={() => {
              setWarningDispatched(true);
              toast.success("Advance notification sent to station masters");
            }}
            className="mt-2 w-full px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
          >
            Send advance notification
          </button>
        </div>
      )}
    </div>
  );
}
