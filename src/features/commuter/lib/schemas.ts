import { z } from "zod";

export const crowdReportSchema = z.object({
  type: z.enum(["blockage", "escalator", "flood"]),
  hubId: z.string(),
  photoUrl: z.string().optional(),
});

export type CrowdReportInput = z.infer<typeof crowdReportSchema>;

export const commuterDoorSchema = z.object({
  id: z.string(),
  label: z.string(),
  vci: z.number().min(0).max(100),
  flowPerMin: z.number().min(0),
  isCovered: z.boolean(),
  escalatorOk: z.boolean(),
});
