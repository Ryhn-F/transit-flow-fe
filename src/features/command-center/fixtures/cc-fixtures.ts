import type { Dispatch, Incident, Warden } from "../types";
import { VCI_CHANNEL_COORDS, stationOfChannel } from "@/infrastructure/mock/fixtures/vci-fixtures";
import { stationName, channelName } from "@/infrastructure/mock/fixtures/stations";

export const CC_WARDENS: Warden[] = [
  { id: "WD-01", name: "Sutrisno", agency: "DISHUB", position: [106.8268, -6.2076], status: "IDLE", etaSec: 240 },
  { id: "WD-02", name: "Rahmat", agency: "DISHUB", position: [106.8281, -6.2098], status: "IDLE", etaSec: 300 },
  { id: "WD-03", name: "Dedi", agency: "POLRI", position: [106.8242, -6.2031], status: "IDLE", etaSec: 420 },
  { id: "WD-04", name: "Yanto", agency: "POLRI", position: [106.8502, -6.2091], status: "IDLE", etaSec: 360 },
  { id: "WD-05", name: "Hendra", agency: "KAI", position: [106.8488, -6.2105], status: "IDLE", etaSec: 480 },
  { id: "WD-06", name: "Bayu", agency: "MRT", position: [106.8234, -6.2016], status: "IDLE", etaSec: 330 },
];

export function seedIncidents(now: number): Incident[] {
  const mk = (
    id: string,
    type: Incident["type"],
    channelId: string,
    severity: Incident["severity"],
    minAgo: number,
  ): Incident => {
    const [lng, lat] = VCI_CHANNEL_COORDS[channelId];
    return {
      id,
      type,
      stationId: stationOfChannel(channelId),
      stationName: stationName(stationOfChannel(channelId)),
      position: [lng, lat],
      severity,
      raisedAt: now - minAgo * 60_000,
      resolved: false,
    };
  };

  return [
    mk("INC-901", "CHOKE", "SUD-E", "CRITICAL", 42),
    mk("INC-902", "PARKING", "DUK-GB", "WARNING", 28),
    mk("INC-903", "BLOCKAGE", "MGR-02", "WARNING", 15),
    mk("INC-904", "FLOOD", "MGR-01", "CRITICAL", 6),
    mk("INC-905", "CHOKE", "DUK-GC", "WARNING", 3),
  ];
}

export function incidentLabel(i: Incident): string {
  const typeLabel: Record<Incident["type"], string> = {
    CHOKE: "Choke",
    FLOOD: "Flood",
    PARKING: "Parking",
    BLOCKAGE: "Blockage",
  };
  return `${typeLabel[i.type]} · ${i.stationName} ${channelName("")}`;
}

export function incidentChannelName(i: Incident): string {
  return channelName(""); // incidents carry station-level info
}

export function seedDispatches(now: number): Dispatch[] {
  return [
    {
      id: "DS-901",
      incidentId: "INC-901",
      wardenId: "WD-03",
      status: "ON-SITE",
      dispatchedAt: now - 40 * 60_000,
      slaDeadline: now - 20 * 60_000,
      slaNote: "Responded in 12 min — within target",
    },
    {
      id: "DS-902",
      incidentId: "INC-903",
      wardenId: "WD-04",
      status: "EN-ROUTE",
      dispatchedAt: now - 12 * 60_000,
      slaDeadline: now + 3 * 60_000,
      slaNote: null,
    },
  ];
}

export function historySeries(days: number): number[] {
  // deterministic 60-day VCI bottleneck history for trend charts
  const series: number[] = [];
  for (let i = 0; i < days; i++) {
    let seed = 0;
    const s = String(i * 7 + 3);
    for (const ch of s) seed = (seed * 31 + ch.charCodeAt(0)) % 97;
    const weekly = 52 + Math.sin(i / 7) * 12;
    const spike = seed % 5 === 0 ? 18 : 0;
    series.push(Math.round(weekly + spike));
  }
  return series;
}

export function leadTimes(days: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    let seed = 0;
    for (const ch of String(i * 13 + 5)) seed = (seed * 17 + ch.charCodeAt(0)) % 89;
    out.push(8 + (seed % 9)); // minutes 8..16
  }
  return out;
}
