import { mockVCIRepository } from "@/infrastructure/repositories/mock-vci-repository";
import { useVCILiveStore } from "@/features/vci/store/vci-live-store";

const TICK_MS = 1_000;
const RECALC_SECONDS = 60;

type Listener = () => void;

class VCILiveDriver {
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private version = 0;
  private listeners = new Set<Listener>();

  start(): void {
    if (this.intervalId != null) return;
    const now = Date.now();
    mockVCIRepository.startSession(now);
    this.startedAt = now;
    this.sync(now);
    this.intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const tickNow = Date.now();
      mockVCIRepository.tick(tickNow);
      this.sync(tickNow);
      this.version += 1;
      this.listeners.forEach((l) => l());
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    mockVCIRepository.stopSession();
    this.startedAt = null;
  }

  private sync(now: number): void {
    void mockVCIRepository.getLiveSnapshot().then((snapshot) => {
      useVCILiveStore.getState().setSnapshot(snapshot);
    });
    void mockVCIRepository.getAlerts().then((alerts) => {
      useVCILiveStore.getState().setAlerts(alerts);
    });
    void mockVCIRepository.getDeliveries().then((deliveries) => {
      useVCILiveStore.getState().setDeliveries(deliveries);
    });

    if (this.startedAt != null) {
      const elapsed = Math.floor((now - this.startedAt) / 1_000);
      const elapsedInCycle = elapsed % RECALC_SECONDS;
      const countdown = RECALC_SECONDS - elapsedInCycle;
      const recalculating = countdown >= RECALC_SECONDS || countdown < 1;
      useVCILiveStore.getState().setCountdown(countdown, recalculating);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isRunning(): boolean {
    return this.intervalId != null;
  }
}

export const vciLiveDriver = new VCILiveDriver();
