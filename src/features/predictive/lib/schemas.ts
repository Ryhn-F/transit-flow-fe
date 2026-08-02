import { z } from "zod";

export const forecastPointSchema = z.object({
  hour: z.number().int().min(0),
  vci: z.number().min(0).max(120),
  bandLow: z.number().min(0),
  bandHigh: z.number().min(0),
});

export const forecastSeriesSchema = z.object({
  exitId: z.string(),
  horizonHours: z.number().int().min(1),
  points: z.array(forecastPointSchema),
});

export const forecastEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["concert", "holiday", "schedule-change"]),
  startsHour: z.number(),
  endsHour: z.number(),
  venue: z.string(),
  affectedExitIds: z.array(z.string()),
  amplitude: z.number().min(0),
  sigmaHours: z.number().min(0.5),
  source: z.enum(["GTFS", "event-feed"]),
  confidence: z.number().min(0).max(1),
});

export const scenarioInputSchema = z.object({
  trainDelayMin: z.number().int().min(0).max(120),
  eventShiftEndHour: z.number().int().min(0).max(23).nullable(),
  rainLevel: z.enum(["none", "light", "heavy"]),
  holidayFactor: z.number().min(1).max(2),
});

export const FORECAST_WARNING_THRESHOLD = 80;
export const FORECAST_WINDOW_HOURS = 24;
