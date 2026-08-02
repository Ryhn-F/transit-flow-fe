import type { HubStat } from "../fixtures/city-fixtures";

export interface LeaderboardRow {
  hub: HubStat;
  rank: number;
  trend: "up" | "down" | "flat";
}

export function aggregateLeaderboard(hubs: HubStat[]): LeaderboardRow[] {
  return [...hubs]
    .sort((a, b) => b.meanVci7d - a.meanVci7d)
    .map((hub, i) => ({
      hub,
      rank: i + 1,
      trend:
        hub.currentVci - hub.meanVci7d > 5 ? "up" : hub.currentVci - hub.meanVci7d < -5 ? "down" : "flat",
    }));
}

export function citySummary(hubs: HubStat[], cityId: string): { mean: number; hubs: number } {
  const filtered = hubs.filter((h) => h.cityId === cityId);
  if (filtered.length === 0) return { mean: 0, hubs: 0 };
  return {
    mean: Math.round(filtered.reduce((s, h) => s + h.meanVci7d, 0) / filtered.length),
    hubs: filtered.length,
  };
}

export function toCsv(rows: LeaderboardRow[]): string {
  const header = "rank,hub,city,mean_vci_7d,current_vci,surges,trend\n";
  const body = rows
    .map(
      (r) =>
        `${r.rank},${r.hub.nameEn},${r.hub.cityId},${r.hub.meanVci7d},${r.hub.currentVci},${r.hub.surgeCount},${r.trend}`,
    )
    .join("\n");
  return header + body;
}

export function driftVci(hub: HubStat, tick: number): HubStat {
  let seed = 0;
  for (const ch of hub.id + String(tick)) seed = (seed * 31 + ch.charCodeAt(0)) % 89;
  const drift = (seed % 5) - 2;
  return {
    ...hub,
    currentVci: Math.max(10, Math.min(100, hub.currentVci + drift)),
  };
}
