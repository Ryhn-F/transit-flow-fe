"use client";

import { useState } from "react";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useDemoModeGate(): boolean {
  const [demo] = useState(isDemoMode);
  return demo;
}
