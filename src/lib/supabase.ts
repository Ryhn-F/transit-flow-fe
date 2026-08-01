import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseKey);
