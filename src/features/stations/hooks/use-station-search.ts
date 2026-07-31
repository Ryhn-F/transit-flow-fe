import { useQuery } from "@tanstack/react-query";
import { stationRepository } from "@/infrastructure/repositories/station-repository";

export function useStationSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["stations", "search", trimmed],
    queryFn: () => stationRepository.search(trimmed),
    enabled: trimmed.length > 0,
    placeholderData: (prev) => prev,
  });
}
