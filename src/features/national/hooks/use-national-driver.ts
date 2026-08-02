"use client";

import { useEffect, useState } from "react";
import { useNationalStore } from "../store/national-store";
import { toast } from "sonner";

const TICK_MS = 10_000;
const MEDAN_SPIKE_AT_MS = 90_000;

export function useNationalDriver(): void {
  const [startedAt] = useState(() => Date.now());
  const tick = useNationalStore((s) => s.tick);
  const driftCity = useNationalStore((s) => s.driftCity);
  const spikeHub = useNationalStore((s) => s.spikeHub);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      const elapsed = Date.now() - startedAt;
      tick();
      driftCity("medan");

      if (elapsed >= MEDAN_SPIKE_AT_MS && elapsed < MEDAN_SPIKE_AT_MS + 1_000) {
        spikeHub("MD-PUS", 84);
        toast.warning("Medan Pusat crossed VCI 80 — national alert", { duration: 6000 });
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [startedAt, tick, driftCity, spikeHub]);
}
