export type Agency = "DISHUB" | "POLRI" | "KAI" | "MRT";

export interface AgencyDef {
  id: Agency;
  label: string;
  accent: string; // tailwind text color
  accentHex: string;
}

export const AGENCIES: AgencyDef[] = [
  { id: "DISHUB", label: "Dishub", accent: "text-blue-400", accentHex: "#60a5fa" },
  { id: "POLRI", label: "Polri", accent: "text-rose-400", accentHex: "#fb7185" },
  { id: "KAI", label: "KAI", accent: "text-emerald-400", accentHex: "#34d399" },
  { id: "MRT", label: "MRT", accent: "text-amber-400", accentHex: "#fbbf24" },
];

export type WardenStatus = "IDLE" | "EN-ROUTE" | "ON-SITE";

export interface Warden {
  id: string;
  name: string;
  agency: Agency;
  position: [number, number];
  status: WardenStatus;
  etaSec: number;
}

export type IncidentType = "CHOKE" | "FLOOD" | "PARKING" | "BLOCKAGE";

export interface Incident {
  id: string;
  type: IncidentType;
  stationId: string;
  stationName: string;
  position: [number, number];
  severity: "CRITICAL" | "WARNING";
  raisedAt: number;
  resolved: boolean;
}

export interface Dispatch {
  id: string;
  incidentId: string;
  wardenId: string;
  status: WardenStatus;
  dispatchedAt: number;
  slaDeadline: number;
  slaNote: string | null;
}

export interface IncidentTickerItem {
  id: string;
  text: string;
  ts: number;
}
