"use client";

import { useEffect, useState } from "react";
import { vciLiveDriver } from "@/infrastructure/mock/vci-live-driver";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useVCIDriver(): boolean {
  const [active] = useState(isDemoMode);

  useEffect(() => {
    if (!active) return;
    if (!vciLiveDriver.isRunning()) vciLiveDriver.start();
    return () => vciLiveDriver.stop();
  }, [active]);

  return active;
}
