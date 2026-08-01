import { env } from "@/lib/env";

export function isDemoMode(): boolean {
  return env.NEXT_PUBLIC_DEMO_MODE === "true";
}
