import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

let client: SupabaseClient | null = null;

/**
 * Lazy server-only Supabase client. Throws a clear error when the secrets
 * are missing — SUPABASE_SERVICE_ROLE_KEY is an admin key and must never be
 * defaulted in code or exposed to the client bundle.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the server environment.",
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}
