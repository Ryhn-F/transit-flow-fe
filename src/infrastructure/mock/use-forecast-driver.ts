"use client";

import { useEffect } from "react";
import { forecastLiveDriver } from "@/infrastructure/mock/forecast-live-driver";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useForecastDriver(): boolean {
  const demoOn = useDemoMode();

  useEffect(() => {
    if (!demoOn) return;
    if (!forecastLiveDriver.isRunning()) forecastLiveDriver.start();
    return () => forecastLiveDriver.stop();
  }, [demoOn]);

  return demoOn;
}
