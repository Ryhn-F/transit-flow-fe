export interface HubStat {
  id: string;
  cityId: string;
  nameId: string;
  nameEn: string;
  meanVci7d: number;
  currentVci: number;
  surgeCount: number;
}

export interface CityProfile {
  id: string;
  nameId: string;
  nameEn: string;
  paratransit: string;
  accentHex: string;
  viewport: { lat: number; lng: number; zoom: number };
}

export const CITY_PROFILES: CityProfile[] = [
  { id: "jakarta", nameId: "Jakarta", nameEn: "Jakarta", paratransit: "Angkot", accentHex: "#3b82f6", viewport: { lat: -6.2088, lng: 106.8272, zoom: 11 } },
  { id: "surabaya", nameId: "Surabaya", nameEn: "Surabaya", paratransit: "Bemo", accentHex: "#f59e0b", viewport: { lat: -7.2575, lng: 112.7521, zoom: 11 } },
  { id: "bandung", nameId: "Bandung", nameEn: "Bandung", paratransit: "Angkot", accentHex: "#10b981", viewport: { lat: -6.9175, lng: 107.6191, zoom: 11 } },
  { id: "medan", nameId: "Medan", nameEn: "Medan", paratransit: "Becak", accentHex: "#f43f5e", viewport: { lat: 3.5952, lng: 98.6722, zoom: 11 } },
  { id: "makassar", nameId: "Makassar", nameEn: "Makassar", paratransit: "Pete-pete", accentHex: "#8b5cf6", viewport: { lat: -5.1477, lng: 119.4327, zoom: 11 } },
];

const hubs: Array<Omit<HubStat, "currentVci"> & { currentVci: number }> = [
  { id: "JB-DUK", cityId: "jakarta", nameId: "Dukuh Atas", nameEn: "Dukuh Atas", meanVci7d: 64, currentVci: 68, surgeCount: 12 },
  { id: "JB-MGR", cityId: "jakarta", nameId: "Manggarai", nameEn: "Manggarai", meanVci7d: 58, currentVci: 61, surgeCount: 9 },
  { id: "JB-SUD", cityId: "jakarta", nameId: "Sudirman", nameEn: "Sudirman", meanVci7d: 71, currentVci: 86, surgeCount: 15 },
  { id: "SB-GUB", cityId: "surabaya", nameId: "Gubeng", nameEn: "Gubeng", meanVci7d: 49, currentVci: 52, surgeCount: 4 },
  { id: "SB-PAS", cityId: "surabaya", nameId: "Pasar Turi", nameEn: "Pasar Turi", meanVci7d: 44, currentVci: 41, surgeCount: 2 },
  { id: "BD-HAL", cityId: "bandung", nameId: "Stasiun Hall", nameEn: "Stasiun Hall", meanVci7d: 55, currentVci: 58, surgeCount: 6 },
  { id: "BD-KAC", cityId: "bandung", nameId: "Kiaracondong", nameEn: "Kiaracondong", meanVci7d: 47, currentVci: 45, surgeCount: 3 },
  { id: "MD-PUS", cityId: "medan", nameId: "Medan Pusat", nameEn: "Medan Pusat", meanVci7d: 61, currentVci: 79, surgeCount: 8 },
  { id: "MD-PIN", cityId: "medan", nameId: "P. Brayan", nameEn: "P. Brayan", meanVci7d: 42, currentVci: 39, surgeCount: 1 },
  { id: "MK-TAL", cityId: "makassar", nameId: "Tanjung Bunga", nameEn: "Tanjung Bunga", meanVci7d: 52, currentVci: 50, surgeCount: 5 },
  { id: "MK-MAR", cityId: "makassar", nameId: "Mallengkeri", nameEn: "Mallengkeri", meanVci7d: 46, currentVci: 48, surgeCount: 2 },
  { id: "MK-TAM", cityId: "makassar", nameId: "Tamalate", nameEn: "Tamalate", meanVci7d: 39, currentVci: 37, surgeCount: 0 },
];

export const HUB_STATS: HubStat[] = hubs;

export const CITY_COORDS: Record<string, [number, number]> = {
  jakarta: [106.8272, -6.2088],
  surabaya: [112.7521, -7.2575],
  bandung: [107.6191, -6.9175],
  medan: [98.6722, 3.5952],
  makassar: [119.4327, -5.1477],
};
