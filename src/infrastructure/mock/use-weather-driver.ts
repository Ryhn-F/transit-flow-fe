"use client";

import { useEffect, useState } from "react";
import { weatherLiveDriver } from "@/infrastructure/mock/weather-live-driver";
import { isDemoMode } from "@/infrastructure/mock/demo-mode";

export function useWeatherDriver(): boolean {
  const [active] = useState(isDemoMode);

  useEffect(() => {
    if (!active) return;
    if (!weatherLiveDriver.isRunning()) weatherLiveDriver.start();
    return () => weatherLiveDriver.stop();
  }, [active]);

  return active;
}
