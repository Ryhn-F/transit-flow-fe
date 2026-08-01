"use client";

import { useEffect, useState } from "react";
import { liveDriver } from "@/infrastructure/mock/live-driver";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useDemoDriver(): boolean {
  const [active] = useState(isDemoMode);

  useEffect(() => {
    if (!active) return;
    liveDriver.start();
    return () => liveDriver.stop();
  }, [active]);

  return active;
}
