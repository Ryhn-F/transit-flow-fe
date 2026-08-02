import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";
import type { AiAttributeKey } from "@/entities/ai-extraction";

export function useUpdateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      key,
      value,
    }: {
      id: string;
      key: AiAttributeKey;
      value: number;
    }) => getAiExtractionRepository().updateAttribute(id, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-extractions"] });
      toast.success("Changes saved");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save attribute");
    },
  });
}
