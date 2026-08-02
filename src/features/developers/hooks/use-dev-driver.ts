"use client";

import { useEffect, useState } from "react";
import { useDevelopersStore } from "../store/developers-store";
import { SIGNAL_TRIGGER_THRESHOLD, SIGNAL_EXTENSION_SEC } from "../fixtures/dev-fixtures";
import { toast } from "sonner";

const QUOTA_TICK_MS = 5_000;
const SIGNAL_EVAL_MS = 10_000;
const SIGNAL_TRIGGER_AT_MS = 90_000;

export function useDevDriver(): void {
  const [startedAt] = useState(() => Date.now());
  const consumeQuota = useDevelopersStore((s) => s.consumeQuota);
  const refreshVciScores = useDevelopersStore((s) => s.refreshVciScores);
  const triggerSignal = useDevelopersStore((s) => s.triggerSignal);
  const addLog = useDevelopersStore((s) => s.addLog);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      const elapsed = Date.now() - startedAt;
      consumeQuota();
      refreshVciScores();

      const signals = useDevelopersStore.getState().signals;
      if (elapsed >= SIGNAL_TRIGGER_AT_MS && elapsed < SIGNAL_TRIGGER_AT_MS + 1_000) {
        const sig = signals.find((s) => s.id === "SIG-02");
        if (sig) {
          triggerSignal("SIG-02");
          addLog(`SIG-02: VCI ${sig.vciScore} ≥ ${SIGNAL_TRIGGER_THRESHOLD} → NTCIP 1202 green extension +${SIGNAL_EXTENSION_SEC}s`);
          toast.info("SIG-02 green-light extension triggered (VCI ≥ 85)", { duration: 6000 });
        }
      }

      for (const sig of signals) {
        if (sig.vciScore >= SIGNAL_TRIGGER_THRESHOLD && !sig.greenExtended) {
          triggerSignal(sig.id);
          addLog(`SIG-${sig.id.slice(-2)}: VCI ${sig.vciScore} ≥ ${SIGNAL_TRIGGER_THRESHOLD} → NTCIP 1202 extension`);
        }
      }
    }, SIGNAL_EVAL_MS);
    return () => clearInterval(interval);
  }, [startedAt, consumeQuota, refreshVciScores, triggerSignal, addLog]);

  void QUOTA_TICK_MS;
}
