import { useQuery } from "@tanstack/react-query";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";

export function useStationAttachments(stationId: string | null) {
  return useQuery({
    queryKey: ["ai-extractions", "attached", stationId],
    queryFn: async () => {
      const items = await getAiExtractionRepository().list({
        status: ["APPROVED"],
      });
      return items
        .filter((e) => e.attached_channel_id != null)
        .filter((e) => e.station_id === stationId);
    },
    enabled: stationId != null,
    refetchInterval: 2_000,
  });
}
