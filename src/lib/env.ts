import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().default("/api"),
  NEXT_PUBLIC_MAPLIBRE_STYLE_URL: z.string().url(),
  NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL: z.string().url().default("https://tiles.openfreemap.org/styles/dark"),
  NEXT_PUBLIC_MAPLIBRE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT: z.coerce.number(),
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG: z.coerce.number(),
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: z.coerce.number().default(11),
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("false"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_MAPLIBRE_STYLE_URL: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL,
  NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL:
    process.env.NEXT_PUBLIC_MAPLIBRE_DARK_STYLE_URL || "https://tiles.openfreemap.org/styles/dark",
  NEXT_PUBLIC_MAPLIBRE_API_KEY: process.env.NEXT_PUBLIC_MAPLIBRE_API_KEY,
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT:
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT,
  NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG:
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG,
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
