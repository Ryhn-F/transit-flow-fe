export interface KioskSite {
  id: string;
  stationId: string;
  name: string;
  coordinates: [number, number];
  sizeM: number; // 3 = 3x3m
  visibility: number; // 0-100
  monthlyRevenueIdr: number;
  paybackMonths: number;
}

export interface VendorPermit {
  id: string;
  vendorName: string;
  stationId: string;
  polygon: GeoJSON.Polygon;
  status: "ISSUED" | "COMPLIANT" | "VIOLATION";
  expiresAt: number;
}

export interface SesBand {
  id: string;
  stationId: string;
  label: string;
  hex: string;
}

export interface KioskPoi {
  id: string;
  stationId: string;
  name: string;
  coordinates: [number, number];
  type: "warung" | "minimarket" | "atm";
}

export interface ZeroChokeZone {
  id: string;
  stationId: string;
  polygon: GeoJSON.Polygon;
}

export interface WalkwayCorridor {
  id: string;
  stationId: string;
  segment: [[number, number], [number, number]];
}
