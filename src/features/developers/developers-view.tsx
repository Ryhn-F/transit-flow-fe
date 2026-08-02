"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useDevelopersStore } from "./store/developers-store";
import { useDevDriver } from "./hooks/use-dev-driver";
import { API_ENDPOINTS, HEALTH_CHECKS, latencySeries, uptimeSeries } from "./fixtures/dev-fixtures";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ApiExplorer() {
  const { selectedEndpointId, setSelectedEndpoint, consumeQuota, key } = useDevelopersStore();
  const [response, setResponse] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const endpoint = API_ENDPOINTS.find((e) => e.id === selectedEndpointId)!;

  const execute = async () => {
    setRunning(true);
    const started = performance.now();
    try {
      const res = await fetch(endpoint.path.replace("{id}", "dukuh-atas"));
      const body = await res.text();
      setLatencyMs(Math.round(performance.now() - started));
      setResponse(body);
      consumeQuota();
    } catch {
      setResponse(JSON.stringify({ error: "gateway unreachable" }, null, 2));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
          Endpoint Catalog
        </h3>
        <ul className="space-y-1.5">
          {API_ENDPOINTS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelectedEndpoint(e.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl border transition-colors",
                  selectedEndpointId === e.id
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
                )}
              >
                <p className="font-mono text-[10px] font-bold text-blue-400">{e.method} {e.path}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{e.description}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2b]/70 border border-slate-100 dark:border-white/[0.06]">
          <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">API Key</p>
          <p className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 break-all">{key.key}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono text-[9px] text-slate-500">
              {key.requestsUsed}/{key.quotaPerMinute} req/min
            </span>
            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (key.requestsUsed / key.quotaPerMinute) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Live Explorer
          </h3>
          <button
            type="button"
            onClick={() => void execute()}
            disabled={running}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {running ? "Executing…" : "Execute"}
          </button>
        </div>

        <p className="font-mono text-[10px] text-slate-500 mb-2">
          GET {endpoint.path.replace("{id}", "dukuh-atas")}?api_key=tf_live_…
        </p>

        <div className="rounded-xl bg-[#0c1019] border border-white/[0.06] p-3 min-h-40 max-h-64 overflow-y-auto scrollbar-thin">
          {response ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">200 OK</span>
                {latencyMs != null && (
                  <span className={cn("font-mono text-[9px] font-bold", latencyMs <= 50 ? "text-emerald-400" : "text-amber-400")}>
                    {latencyMs} ms{latencyMs <= 50 ? " · within SLA" : ""}
                  </span>
                )}
              </div>
              <pre className="font-mono text-[9px] leading-relaxed text-emerald-300/90 whitespace-pre-wrap break-words">
                {response.length > 1200 ? response.slice(0, 1200) + "\n… [truncated]" : response}
              </pre>
            </>
          ) : (
            <p className="text-[11px] text-slate-500">Run a request to see the GeoJSON response.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SdkConsole() {
  const { addCall } = useDevelopersStore();
  const [code, setCode] = useState("getExitStatus('dukuh-atas', 'B')");

  const run = (src: string) => {
    let result: string;
    if (src.includes("getExitStatus")) {
      result = JSON.stringify(
        { channel: "B", vci: 68, status: "WARNING", recommendation: "use covered walkway C" },
        null,
        2,
      );
    } else if (src.includes("listHubs")) {
      result = JSON.stringify({ hubs: ["dukuh-atas", "manggarai", "sudirman"], count: 3 }, null, 2);
    } else {
      result = "TypeError: unknown SDK function — try getExitStatus('dukuh-atas', 'B')";
    }
    addCall(src, result);
    return result;
  };

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
        SDK Playground · @transitflow/sdk
      </h3>
      <div className="flex gap-1.5 mb-3">
        {["getExitStatus('dukuh-atas', 'B')", "listHubs()", "getForecast('SUD-E', 24)"].map((fn) => (
          <button
            key={fn}
            type="button"
            onClick={() => setCode(fn)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#141b2b] border border-slate-200/60 dark:border-white/10 font-mono text-[9px] text-slate-600 dark:text-slate-300"
          >
            {fn}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-[#0c1019] border border-white/10 rounded-xl px-3 py-2 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-blue-500/60"
          aria-label="SDK expression"
        />
        <button
          type="button"
          onClick={() => run(code)}
          className="px-3 py-2 rounded-xl text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Run
        </button>
      </div>
      <div className="rounded-xl bg-[#0c1019] border border-white/[0.06] p-3 max-h-48 overflow-y-auto scrollbar-thin font-mono text-[9px] text-emerald-300/90">
        <p className="text-slate-500 mb-1">{"// @transitflow/sdk v0.1.0 — demo build"}</p>
        <p className="text-slate-600">$ {code}</p>
        <pre className="whitespace-pre-wrap break-words mt-1">{run(code)}</pre>
      </div>
    </div>
  );
}

function SignalBoard() {
  const { signals, adapterLog } = useDevelopersStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
          NTCIP 1202 Signal Board
        </h3>
        <ul className="space-y-1.5">
          {signals.map((s) => (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl border",
                s.greenExtended
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : "bg-slate-50 dark:bg-[#141b2b]/70 border-slate-100 dark:border-white/[0.06]",
              )}
            >
              <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 w-12">{s.id}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 truncate">{s.intersection}</span>
              <span className={cn("font-mono text-[10px] font-bold", s.vciScore >= 85 ? "text-rose-400" : "text-slate-500")}>
                {s.vciScore}
              </span>
              <span className={cn("font-mono text-[8px] font-bold uppercase", s.greenExtended ? "text-emerald-400" : "text-slate-400")}>
                {s.greenExtended ? `GREEN EXT +8s` : "normal"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
          Adapter Protocol Log
        </h3>
        <ul className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
          {adapterLog.map((log) => (
            <li key={log.id} className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-[#0c1019] border border-white/[0.06]">
              <span className="font-mono text-[8px] text-slate-500 mt-0.5">
                {new Date(log.ts).toLocaleTimeString("en-GB")}
              </span>
              <span className="font-mono text-[9px] text-emerald-300/90 break-words">{log.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusPage() {
  const latencies = latencySeries(60);
  const uptimes = uptimeSeries(60);
  const W = 280;
  const H = 60;

  const latencyPath = latencies
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / 59) * W},${H - 4 - (v / 60) * (H - 8)}`)
    .join(" ");
  const uptimePath = uptimes
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / 59) * W},${H - 4 - ((100 - v) / 0.2) * (H - 8)}`)
    .join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
          Platform Status
        </h3>
        <p className="font-mono text-2xl font-black text-emerald-400 mb-4">99.98%</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">Latency p50</p>
            <svg width={W} height={H} className="w-full h-auto">
              <path d={latencyPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            </svg>
            <p className="font-mono text-[9px] text-slate-500 mt-1">&lt; 50 ms SLA · p95 41 ms</p>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">Uptime 60d</p>
            <svg width={W} height={H} className="w-full h-auto">
              <path d={uptimePath} fill="none" stroke="#10b981" strokeWidth="1.5" />
            </svg>
            <p className="font-mono text-[9px] text-slate-500 mt-1">SLA 99.9% · 0 incidents</p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">
          Health Checks
        </h3>
        <ul className="space-y-1.5">
          {HEALTH_CHECKS.map((h) => (
            <li key={h.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141b2b]/70 border border-slate-100 dark:border-white/[0.06]">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  h.status === "OK" ? "bg-emerald-500" : h.status === "DEGRADED" ? "bg-amber-400" : "bg-rose-500",
                )}
              />
              <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 flex-1">{h.label}</span>
              <span className={cn("font-mono text-[9px] font-bold uppercase", h.status === "OK" ? "text-emerald-400" : h.status === "DEGRADED" ? "text-amber-400" : "text-rose-400")}>
                {h.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DevelopersView() {
  useDevDriver();
  const [tab, setTab] = useState<"explorer" | "playground" | "signals" | "status">("explorer");

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
          <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Developer Portal</h1>
          <div className="flex-1" />
          <div className="flex gap-1">
            {(
              [
                ["explorer", "Explorer"],
                ["playground", "SDK Playground"],
                ["signals", "Signals"],
                ["status", "Status"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors",
                  tab === id
                    ? "bg-blue-600 text-white border-blue-400/30"
                    : "bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {tab === "explorer" && <ApiExplorer />}
          {tab === "playground" && (
            <div className="max-w-3xl">
              <SdkConsole />
            </div>
          )}
          {tab === "signals" && <SignalBoard />}
          {tab === "status" && <StatusPage />}
        </div>
      </div>
    </AppShell>
  );
}
