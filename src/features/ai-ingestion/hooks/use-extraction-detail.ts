import { useQuery } from "@tanstack/react-query";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";

export function useExtractionDetail(id: string | null) {
  return useQuery({
    queryKey: ["ai-extractions", id],
    queryFn: () => getAiExtractionRepository().getById(id!),
    enabled: id != null,
    refetchInterval: (query) => {
      const record = query.state.data;
      const hasActive =
        record?.status === "QUEUED" || record?.status === "EXTRACTING";
      return hasActive ? 1_000 : false;
    },
  });
}
