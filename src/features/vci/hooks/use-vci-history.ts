import { useQuery } from "@tanstack/react-query";
import { getVciRepository } from "@/infrastructure/mock/provider-registry";

export function useVciHistory(channelId: string | null, windowHours = 24) {
  return useQuery({
    queryKey: ["vci", "history", channelId, windowHours],
    queryFn: () =>
      getVciRepository().getHistory(channelId!, windowHours),
    enabled: channelId != null,
    staleTime: 60_000,
  });
}
