import { mockAiExtractionRepository } from "@/infrastructure/repositories/mock-ai-extraction-repository";

const TICK_MS = 1_000;

type Listener = () => void;

class LiveDriver {
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private refCount = 0;
  private version = 0;
  private listeners = new Set<Listener>();

  start(): void {
    this.refCount += 1;
    if (this.intervalId != null) return;
    const now = Date.now();
    mockAiExtractionRepository.startSession(now);
    this.startedAt = now;
    this.intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      mockAiExtractionRepository.tick(Date.now());
      this.version += 1;
      this.listeners.forEach((l) => l());
    }, TICK_MS);
  }

  stop(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount > 0) return;
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    mockAiExtractionRepository.stopSession();
    this.startedAt = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVersion(): number {
    return this.version;
  }

  isRunning(): boolean {
    return this.intervalId != null;
  }
}

export const liveDriver = new LiveDriver();
