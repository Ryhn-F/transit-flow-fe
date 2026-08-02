"use client";

import { useEffect, useState } from "react";
import { useKioskStore } from "../store/kiosk-store";
import { toast } from "sonner";

const METRICS_TICK_MS = 10_000;
const VENDOR_DRIFT_AT_MS = 240_000;

export function useKioskDriver(): void {
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (document.hidden) return;
      useKioskStore.getState().refreshAllMetrics();

      if (elapsed >= VENDOR_DRIFT_AT_MS && elapsed < VENDOR_DRIFT_AT_MS + 1_000) {
        useKioskStore.getState().markVendorViolation("VND-1");
        toast.warning("Vendor footprint drifted into a choke corridor — VIOLATION", {
          duration: 6000,
        });
      }
    }, METRICS_TICK_MS);
    return () => clearInterval(interval);
  }, [startedAt]);
}
