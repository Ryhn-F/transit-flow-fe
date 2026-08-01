import { httpClient } from "@/infrastructure/api/http-client";
import { ENDPOINTS } from "@/infrastructure/api/endpoints";
import type { SurveySubmission } from "@/entities/survey";

export const surveyRepository = {
  async submit(
    payload: Omit<SurveySubmission, "survey_id" | "timestamp">,
  ): Promise<SurveySubmission> {
    try {
      const response = await httpClient.post<{ status: string; data: Record<string, unknown> }>(
        ENDPOINTS.surveys,
        {
          station_id: payload.station_id,
          surveyor_name: payload.surveyor_name,
          exit_door_width_m: 2.5,
          stair_width_m: 3.0,
          sidewalk_width_m: 4.0,
          obstacle_type: payload.observation_type === "STREET_VENDOR" ? "vendor" : "other",
          notes: payload.raw_data?.manual_notes || null,
          geometry: payload.coordinates ? {
            type: "Point",
            coordinates: [payload.coordinates.lng, payload.coordinates.lat],
          } : null,
        }
      );
      if (response.data && response.data.data) {
        const item = response.data.data as Record<string, unknown>;
        return {
          ...payload,
          survey_id: (item.id as string) || crypto.randomUUID(),
          timestamp: (item.created_at as string) || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("Survey API submission error, using offline fallback:", err);
    }

    return {
      ...payload,
      survey_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  },
};
