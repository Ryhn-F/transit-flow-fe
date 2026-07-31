export const ENDPOINTS = {
  stations: "/stations",
  stationSearch: "/stations/search",
  stationById: (id: string) => `/stations/${id}`,
} as const;
