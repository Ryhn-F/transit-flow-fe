"use client";

import { useEffect } from "react";
import { bufferLiveDriver } from "@/infrastructure/mock/buffer-live-driver";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useBufferDriver(): boolean {
  const demoOn = useDemoMode();

  useEffect(() => {
    if (!demoOn) return;
    if (!bufferLiveDriver.isRunning()) bufferLiveDriver.start();
    return () => bufferLiveDriver.stop();
  }, [demoOn]);

  return demoOn;
}
