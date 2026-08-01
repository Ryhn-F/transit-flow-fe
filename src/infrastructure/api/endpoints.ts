export const ENDPOINTS = {
  stations: "/stations",
  stationSearch: "/stations/search",
  stationById: (id: string) => `/stations/${id}`,
  surveys: "/surveys",
} as const;

