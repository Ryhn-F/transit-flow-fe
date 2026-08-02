"use client";

import { useEffect } from "react";
import { vciLiveDriver } from "@/infrastructure/mock/vci-live-driver";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useVCIDriver(): boolean {
  const demoOn = useDemoMode();

  useEffect(() => {
    if (!demoOn) return;
    if (!vciLiveDriver.isRunning()) vciLiveDriver.start();
    return () => vciLiveDriver.stop();
  }, [demoOn]);

  return demoOn;
}
