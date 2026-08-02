import { z } from "zod";

export const weatherReadingSchema = z.object({
  rainfallMmHr: z.number().min(0).max(100),
  source: z.enum(["bmkg", "owm"]),
  capturedAt: z.number(),
});

export const radarCellSchema = z.object({
  x: z.number().int().min(0).max(19),
  y: z.number().int().min(0).max(19),
  intensity: z.number().int().min(0).max(5),
});

export const underpassFloodSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  depthCm: z.number().min(0).nullable(),
  confidence: z.number().min(0).max(1),
  verified: z.boolean(),
});

export const floodPhotoSchema = z.object({
  id: z.string(),
  underpassId: z.string(),
  estDepthCm: z.number().min(0),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  capturedAt: z.number(),
});

export const walkwayEdgeSchema = z.object({
  id: z.string(),
  fromId: z.string(),
  toId: z.string(),
  covered: z.boolean(),
  underpassId: z.string().nullable(),
});

export const detourRouteSchema = z.object({
  id: z.string(),
  originId: z.string(),
  destId: z.string(),
  edgeIds: z.array(z.string()),
  timeDeltaMin: z.number(),
  coveredPct: z.number().min(0).max(100),
  edgeState: z.record(z.string(), z.enum(["open", "covered", "flooded"])),
});
