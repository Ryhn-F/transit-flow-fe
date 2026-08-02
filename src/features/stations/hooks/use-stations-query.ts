import { useQuery } from "@tanstack/react-query";
import { getStationRepository } from "@/infrastructure/mock/provider-registry";

export const STATIONS_QUERY_KEY = ["stations"] as const;

export function useStationsQuery() {
  return useQuery({
    queryKey: STATIONS_QUERY_KEY,
    queryFn: () => getStationRepository().getAll(),
  });
}
