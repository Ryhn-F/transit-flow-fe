import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { surveyRepository } from "@/infrastructure/repositories/survey-repository";
import { useSurveyDraftStore } from "@/features/survey/store/survey-draft-store";
import type { SurveySubmission } from "@/entities/survey";

export function useSubmitSurvey(onSuccess?: () => void) {
  const reset = useSurveyDraftStore((s) => s.reset);

  return useMutation({
    mutationFn: (
      payload: Omit<SurveySubmission, "survey_id" | "timestamp">,
    ) => surveyRepository.submit(payload),
    onSuccess: () => {
      toast.success("Survey submitted successfully!");
      reset();
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to submit survey");
    },
  });
}
