"use client";

import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useDemoModeGate(): boolean {
  return useDemoMode();
}
