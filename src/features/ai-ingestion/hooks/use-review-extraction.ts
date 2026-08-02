import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAiExtractionRepository } from "@/infrastructure/mock/provider-registry";

export function useReviewExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      decision,
      reviewer_notes,
    }: {
      id: string;
      decision: "APPROVED" | "REJECTED";
      reviewer_notes?: string;
    }) => getAiExtractionRepository().review(id, decision, reviewer_notes),
    onSuccess: (_data, { decision }) => {
      queryClient.invalidateQueries({ queryKey: ["ai-extractions"] });
      toast.success(
        decision === "APPROVED" ? "Extraction approved" : "Extraction rejected",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save decision");
    },
  });
}
