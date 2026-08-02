import { useQuery } from "@tanstack/react-query";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";
import type { AiExtractionFilters } from "@/entities/ai-extraction";
import { useAiIngestionUIStore } from "../store/ai-ingestion-ui-store";

export function useExtractionQueue() {
  const filters = useAiIngestionUIStore((s) => s.filters);

  const status: AiExtractionFilters["status"] =
    filters.status && filters.status !== "ALL" ? [filters.status] : undefined;

  return useQuery({
    queryKey: ["ai-extractions", { status: filters.status, stationId: filters.stationId, q: filters.q }],
    queryFn: () =>
      getAiExtractionRepository().list({
        status,
        stationId: filters.stationId || undefined,
        q: filters.q || undefined,
      }),
    refetchInterval: (query) => {
      const items = query.state.data;
      const hasActive =
        items?.some((e) => e.status === "QUEUED" || e.status === "EXTRACTING") ??
        false;
      return hasActive ? 1_000 : false;
    },
  });
}
