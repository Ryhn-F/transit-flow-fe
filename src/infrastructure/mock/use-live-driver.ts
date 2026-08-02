"use client";

import { useEffect } from "react";
import { liveDriver } from "@/infrastructure/mock/live-driver";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useLiveDriver(): boolean {
  const demoOn = useDemoMode();

  useEffect(() => {
    if (!demoOn) return;
    if (!liveDriver.isRunning()) liveDriver.start();
    return () => liveDriver.stop();
  }, [demoOn]);

  return demoOn;
}
