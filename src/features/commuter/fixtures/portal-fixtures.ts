export interface CommuterDoor {
  id: string;
  label: string;
  vci: number;
  flowPerMin: number;
  isCovered: boolean;
  escalatorOk: boolean;
}

export interface CommuterHub {
  id: string;
  nameId: string;
  nameEn: string;
  position: { lat: number; lng: number };
  doors: CommuterDoor[];
  walkwayMinutes: Record<string, number>;
}

export const COMMUTER_HUBS: CommuterHub[] = [
  {
    id: "manggarai",
    nameId: "Manggarai",
    nameEn: "Manggarai",
    position: { lat: -6.2097, lng: 106.8501 },
    walkwayMinutes: { A: 2, B: 3, C: 5, D: 4 },
    doors: [
      { id: "mgr-a", label: "A", vci: 62, flowPerMin: 41, isCovered: false, escalatorOk: true },
      { id: "mgr-b", label: "B", vci: 78, flowPerMin: 58, isCovered: false, escalatorOk: true },
      { id: "mgr-c", label: "C", vci: 47, flowPerMin: 30, isCovered: true, escalatorOk: true },
      { id: "mgr-d", label: "D", vci: 56, flowPerMin: 36, isCovered: false, escalatorOk: true },
    ],
  },
  {
    id: "dukuh-atas",
    nameId: "Dukuh Atas",
    nameEn: "Dukuh Atas",
    position: { lat: -6.2088, lng: 106.8272 },
    walkwayMinutes: { A: 2, B: 3, C: 4, D: 5 },
    doors: [
      { id: "duk-a", label: "A", vci: 44, flowPerMin: 28, isCovered: false, escalatorOk: true },
      { id: "duk-b", label: "B", vci: 91, flowPerMin: 64, isCovered: false, escalatorOk: true },
      { id: "duk-c", label: "C", vci: 36, flowPerMin: 22, isCovered: true, escalatorOk: true },
      { id: "duk-d", label: "D", vci: 51, flowPerMin: 32, isCovered: false, escalatorOk: false },
    ],
  },
  {
    id: "sudirman",
    nameId: "Sudirman",
    nameEn: "Sudirman",
    position: { lat: -6.2023, lng: 106.8228 },
    walkwayMinutes: { A: 2, B: 3, C: 4, D: 3 },
    doors: [
      { id: "sud-a", label: "A", vci: 38, flowPerMin: 24, isCovered: false, escalatorOk: true },
      { id: "sud-b", label: "B", vci: 55, flowPerMin: 34, isCovered: false, escalatorOk: true },
      { id: "sud-c", label: "C", vci: 24, flowPerMin: 15, isCovered: true, escalatorOk: true },
      { id: "sud-d", label: "D", vci: 66, flowPerMin: 42, isCovered: false, escalatorOk: true },
    ],
  },
];

export const GPS_FIXTURE = { lat: -6.2066, lng: 106.8506 }; // ~350m from Manggarai

export interface SeededCrowdReport {
  id: string;
  hubId: string;
  type: "blockage" | "escalator" | "flood";
  ts: number;
}

export const SEEDED_CROWD_REPORTS: SeededCrowdReport[] = [
  { id: "CR-0418", hubId: "manggarai", type: "blockage", ts: 0 },
  { id: "CR-0419", hubId: "manggarai", type: "escalator", ts: 0 },
  { id: "CR-0420", hubId: "dukuh-atas", type: "blockage", ts: 0 },
];
