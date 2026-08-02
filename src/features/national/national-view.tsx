"use client";

import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { useNationalStore } from "./store/national-store";
import { useNationalDriver } from "./hooks/use-national-driver";
import { CITY_PROFILES, CITY_COORDS } from "./fixtures/city-fixtures";
import { aggregateLeaderboard, citySummary, toCsv } from "./lib/aggregate";
import { translate } from "./lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function CitySwitcher() {
  const { cityId, setCity, locale, setLocale } = useNationalStore();

  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c1019]/90 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-1.5 flex-1">
        {CITY_PROFILES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCity(c.id)}
            aria-pressed={cityId === c.id}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150",
              cityId === c.id
                ? "text-white border-transparent"
                : "text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
            )}
            style={cityId === c.id ? { backgroundColor: c.accentHex } : undefined}
          >
            {locale === "id" ? c.nameId : c.nameEn}
          </button>
        ))}
      </div>

      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
        {translate("city.paratransit", locale)}: {CITY_PROFILES.find((c) => c.id === cityId)?.paratransit}
      </span>

      <button
        type="button"
        onClick={() => setLocale(locale === "id" ? "en" : "id")}
        aria-pressed={locale === "en"}
        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-[#141b2b] text-slate-700 dark:text-slate-300"
      >
        {locale === "id" ? "EN" : "ID"}
      </button>
    </div>
  );
}

function Leaderboard() {
  const { hubs, locale, selectedHubId, selectHub, setCity, role, setRole, cityId } = useNationalStore();
  const rows = aggregateLeaderboard(hubs);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kemenhub-national-choke.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kemenhub CSV exported");
  };

  return (
    <div className="bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl p-4 w-[520px] transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {translate("leaderboard.title", locale)}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {(["jabodetabek", "sumut"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors",
                  role === r
                    ? "bg-blue-600 text-white border-blue-400/30"
                    : "text-slate-500 border-transparent hover:border-white/10",
                )}
              >
                {r === "jabodetabek" ? "DISHUB JABODETABEK" : "DISHUB SUMUT"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            {translate("leaderboard.export", locale)}
          </button>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
            <th className="py-1 pr-2">{translate("leaderboard.rank", locale)}</th>
            <th className="py-1 pr-2">{translate("leaderboard.hub", locale)}</th>
            <th className="py-1 pr-2 text-right">{translate("leaderboard.mean", locale)}</th>
            <th className="py-1 pr-2 text-right">{translate("leaderboard.trend", locale)}</th>
            <th className="py-1 text-right">{translate("leaderboard.surge", locale)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ hub, rank, trend }) => (
            <tr
              key={hub.id}
              onClick={() => {
                selectHub(selectedHubId === hub.id ? null : hub.id);
                if (hub.cityId === cityId) setCity(hub.cityId);
              }}
              className={cn(
                "border-t border-slate-100 dark:border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors",
                selectedHubId === hub.id && "bg-blue-500/10",
              )}
            >
              <td className="py-2 pr-2 font-mono text-[10px] text-slate-500">{rank}</td>
              <td className="py-2 pr-2">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                  {locale === "id" ? hub.nameId : hub.nameEn}
                </p>
                <p className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">
                  {hub.cityId} · {CITY_PROFILES.find((c) => c.id === hub.cityId)?.paratransit}
                </p>
              </td>
              <td className="py-2 pr-2 text-right">
                <span
                  className={cn(
                    "font-mono text-[12px] font-bold",
                    hub.meanVci7d >= 80 ? "text-rose-400" : hub.meanVci7d >= 50 ? "text-amber-400" : "text-emerald-400",
                  )}
                >
                  {hub.meanVci7d}
                </span>
              </td>
              <td className="py-2 pr-2 text-right font-mono text-[10px]">
                <span className={trend === "up" ? "text-rose-400" : trend === "down" ? "text-emerald-400" : "text-slate-500"}>
                  {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
                </span>
              </td>
              <td className="py-2 text-right font-mono text-[10px] text-slate-500">{hub.surgeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BubbleMap() {
  const { hubs, locale, setCity, cityId, setLocale } = useNationalStore();

  const bubbles = CITY_PROFILES.map((c) => {
    const summary = citySummary(hubs, c.id);
    const cities: Record<string, [number, number]> = CITY_COORDS;
    const [lng, lat] = cities[c.id];
    const w = 760;
    const h = 420;
    const x = ((lng + 108) / 30) * w;
    const y = h - ((lat + 11) / 24) * h;
    return { city: c, summary, x, y, r: 10 + summary.mean * 0.22 };
  });

  return (
    <svg
      viewBox="0 0 760 420"
      className="w-full h-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0c1019]"
      role="img"
      aria-label="National bubble map"
    >
      <rect x="0" y="0" width="760" height="420" fill="transparent" />
      {bubbles.map(({ city, summary, x, y, r }) => (
        <g key={city.id} onClick={() => setCity(city.id)} className="cursor-pointer">
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={city.accentHex}
            opacity="0.28"
            stroke={city.accentHex}
            strokeWidth="1.5"
          />
          <circle cx={x} cy={y} r={3} fill={city.accentHex} />
          <text x={x} y={y - r - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
            {locale === "id" ? city.nameId : city.nameEn}
          </text>
          <text x={x} y={y + r + 12} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
            VCI {summary.mean} · {summary.hubs} hubs
          </text>
          {city.id === cityId && (
            <circle cx={x} cy={y} r={r + 5} fill="none" stroke={city.accentHex} strokeWidth="1" strokeDasharray="3 3" />
          )}
        </g>
      ))}
      <text x="12" y="20" fontSize="9" fill="#64748b" fontFamily="monospace">
        {translate("leaderboard.title", locale)} · {locale === "id" ? "peta nasional" : "national view"}
      </text>
      <text x="12" y="404" fontSize="8" fill="#94a3b8" fontFamily="monospace">
        BPS admin boundaries · regional partition (PostGIS)
      </text>
      <text x="748" y="404" textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace" onClick={() => setLocale(locale === "id" ? "en" : "id")} className="cursor-pointer">
        {locale === "id" ? "EN" : "ID"}
      </text>
    </svg>
  );
}

export function NationalView() {
  useNationalDriver();
  const { cityId, locale } = useNationalStore();
  const city = CITY_PROFILES.find((c) => c.id === cityId)!;

  return (
    <AppShell showSearch={false}>
      <div className="absolute inset-0 flex flex-col">
        <CitySwitcher />

        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: city.accentHex }}
            />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {locale === "id" ? city.nameId : city.nameEn}
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
              {city.paratransit}
            </span>
          </div>

          <Leaderboard />

          <div className="text-slate-300 dark:text-slate-400">
            <BubbleMap />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
