"use client";

import { useEffect, useState } from "react";
import { bufferLiveDriver } from "@/infrastructure/mock/buffer-live-driver";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useBufferDriver(): boolean {
  const [active] = useState(isDemoMode);

  useEffect(() => {
    if (!active) return;
    if (!bufferLiveDriver.isRunning()) bufferLiveDriver.start();
    return () => bufferLiveDriver.stop();
  }, [active]);

  return active;
}
