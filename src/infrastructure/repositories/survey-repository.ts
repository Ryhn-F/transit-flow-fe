import type { SurveySubmission } from "@/entities/survey";

// Phase 1: simulated submission — no real backend endpoint yet.
// Swap the body for a real httpClient.post() call once POST /survey-submissions exists.
export const surveyRepository = {
  async submit(
    payload: Omit<SurveySubmission, "survey_id" | "timestamp">,
  ): Promise<SurveySubmission> {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return {
      ...payload,
      survey_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  },
};
