import type {
  KioskPoi,
  KioskSite,
  SesBand,
  VendorPermit,
  WalkwayCorridor,
  ZeroChokeZone,
} from "../types";
import { revenueEstimateIdr, visibilityScore, paybackMonths } from "../lib/constraints";

const DUK = [-6.2088, 106.8272] as const;

function square(
  center: [number, number],
  halfDeg: number,
): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates: [
      [
        [center[0] - halfDeg, center[1] - halfDeg],
        [center[0] + halfDeg, center[1] - halfDeg],
        [center[0] + halfDeg, center[1] + halfDeg],
        [center[0] - halfDeg, center[1] + halfDeg],
        [center[0] - halfDeg, center[1] - halfDeg],
      ],
    ],
  };
}

export const SES_BANDS: SesBand[] = [
  { id: "SES-A", stationId: "ST-DUK", label: "High income", hex: "#10b981" },
  { id: "SES-B", stationId: "ST-DUK", label: "Middle income", hex: "#f59e0b" },
  { id: "SES-C", stationId: "ST-DUK", label: "Lower income", hex: "#94a3b8" },
];

export const KIOSK_POIS: KioskPoi[] = [
  { id: "POI-1", stationId: "ST-DUK", name: "Warung Sari", coordinates: [106.8275, -6.2084], type: "warung" },
  { id: "POI-2", stationId: "ST-DUK", name: "Minimarket 24h", coordinates: [106.8269, -6.2083], type: "minimarket" },
  { id: "POI-3", stationId: "ST-DUK", name: "ATM BNI", coordinates: [106.8274, -6.209], type: "atm" },
  { id: "POI-4", stationId: "ST-DUK", name: "Warung Kopi", coordinates: [106.8267, -6.2087], type: "warung" },
];

export const ZERO_CHOKE_ZONES: ZeroChokeZone[] = [
  { id: "ZC-1", stationId: "ST-DUK", polygon: square([106.8271, -6.2085], 0.0005) },
  { id: "ZC-2", stationId: "ST-DUK", polygon: square([106.8275, -6.2083], 0.0004) },
];

export const KIOSK_CORRIDORS: WalkwayCorridor[] = [
  { id: "KW-1", stationId: "ST-DUK", segment: [[106.8269, -6.2086], [106.8274, -6.2086]] },
  { id: "KW-2", stationId: "ST-DUK", segment: [[106.8272, -6.2089], [106.8272, -6.2082]] },
];

export const SEED_KIOSKS: KioskSite[] = [
  {
    id: "KS-1",
    stationId: "ST-DUK",
    name: "Kiosk A",
    coordinates: [106.8272, -6.20855],
    sizeM: 3,
    visibility: 0,
    monthlyRevenueIdr: 0,
    paybackMonths: 0,
  },
  {
    id: "KS-2",
    stationId: "ST-DUK",
    name: "Kiosk B",
    coordinates: [106.82745, -6.20835],
    sizeM: 3,
    visibility: 0,
    monthlyRevenueIdr: 0,
    paybackMonths: 0,
  },
];

export function seedPermits(now: number): VendorPermit[] {
  return [
    {
      id: "VND-1",
      vendorName: "Pak Amin",
      stationId: "ST-DUK",
      polygon: square([106.82715, -6.2085], 0.0002),
      status: "COMPLIANT",
      expiresAt: now + 30 * 86_400_000,
    },
    {
      id: "VND-2",
      vendorName: "Bu Siti",
      stationId: "ST-DUK",
      polygon: square([106.82735, -6.2086], 0.0002),
      status: "COMPLIANT",
      expiresAt: now + 14 * 86_400_000,
    },
  ];
}

export function refreshKioskMetrics(kiosk: KioskSite, trafficBase: number): KioskSite {
  const sesIndex = 1;
  const vis = visibilityScore(trafficBase, 50, sesIndex, 3);
  const monthly = revenueEstimateIdr(vis, sesIndex);
  return { ...kiosk, visibility: vis, monthlyRevenueIdr: monthly, paybackMonths: paybackMonths(monthly) };
}

export { DUK };
