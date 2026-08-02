"use client";

import { useEffect } from "react";
import { weatherLiveDriver } from "@/infrastructure/mock/weather-live-driver";
import { useDemoMode } from "@/infrastructure/mock/demo-mode";

export function useWeatherDriver(): boolean {
  const demoOn = useDemoMode();

  useEffect(() => {
    if (!demoOn) return;
    if (!weatherLiveDriver.isRunning()) weatherLiveDriver.start();
    return () => weatherLiveDriver.stop();
  }, [demoOn]);

  return demoOn;
}
