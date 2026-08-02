"use client";

import { useEffect, useState } from "react";
import { forecastLiveDriver } from "@/infrastructure/mock/forecast-live-driver";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useForecastDriver(): boolean {
  const [active] = useState(isDemoMode);

  useEffect(() => {
    if (!active) return;
    if (!forecastLiveDriver.isRunning()) forecastLiveDriver.start();
    return () => forecastLiveDriver.stop();
  }, [active]);

  return active;
}
