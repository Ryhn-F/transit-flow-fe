"use client";

import { useDemoModeStore } from "./demo-mode-store";

/** Runtime demo-mode flag — seeded from NEXT_PUBLIC_DEMO_MODE, switchable in the UI. */
export function isDemoMode(): boolean {
  return useDemoModeStore.getState().enabled;
}

export function useDemoMode(): boolean {
  return useDemoModeStore((s) => s.enabled);
}
