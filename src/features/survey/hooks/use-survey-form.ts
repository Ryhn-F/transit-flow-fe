import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSurveyDraftStore } from "@/features/survey/store/survey-draft-store";

export const surveyFormSchema = z.object({
  stationId: z.string().min(1, "Select a target station"),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  observationType: z.enum([
    "PEDESTRIAN_FLOW",
    "OBSTRUCTION",
    "ILLEGAL_PARKING",
    "STREET_VENDOR",
  ]),
  congestionLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  obstructionImpactPercent: z.number().min(0).max(100),
  photoUrls: z.array(z.string()),
  manualNotes: z.string().optional(),
});

export type SurveyFormValues = z.infer<typeof surveyFormSchema>;

export function useSurveyForm() {
  const draft = useSurveyDraftStore();

  return useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      stationId: draft.stationId ?? "",
      coordinates: draft.coordinates ?? { lat: -6.2023, lng: 106.8228 },
      observationType: draft.observationType,
      congestionLevel: draft.congestionLevel,
      obstructionImpactPercent: draft.obstructionImpactPercent,
      photoUrls: draft.photoUrls,
      manualNotes: draft.manualNotes,
    },
  });
}
