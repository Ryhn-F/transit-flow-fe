import { mockBufferZoneRepository } from "@/infrastructure/repositories/mock-buffer-zone-repository";
import { useEditorStore } from "@/features/buffer-allocator/store/editor-store";
import { toast } from "sonner";

const TICK_MS = 1_000;
const FIELD_EVENT_AT_MS = 90_000;
const ROTATE_104_AT_MS = 120_000;
const ROTATE_106_AT_MS = 300_000;
const ACK_AFTER_MS = 2_000;

type Listener = () => void;

class BufferLiveDriver {
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private version = 0;
  private listeners = new Set<Listener>();
  private fieldEventFired = false;
  private rotated: Set<string> = new Set();
  private rotatedAt = new Map<string, number>();

  start(): void {
    if (this.intervalId != null) return;
    const now = Date.now();
    mockBufferZoneRepository.startSession(now);
    this.startedAt = now;
    this.fieldEventFired = false;
    this.rotated = new Set();
    this.rotatedAt = new Map();
    this.sync();
    this.intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const tickNow = Date.now();
      mockBufferZoneRepository.tick(tickNow);
      this.applyTimeline(tickNow);
      this.sync();
      this.version += 1;
      this.listeners.forEach((l) => l());
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    mockBufferZoneRepository.stopSession();
    this.startedAt = null;
  }

  private applyTimeline(now: number): void {
    if (this.startedAt == null) return;
    const elapsed = now - this.startedAt;

    if (!this.fieldEventFired && elapsed >= FIELD_EVENT_AT_MS) {
      this.fieldEventFired = true;
      toast.info("Field ops: vendor cart blocking Gate B — recommend barrier relocation.", {
        duration: 6000,
      });
    }

    for (const [slotId, expireAtMs] of [
      ["OJ-104", ROTATE_104_AT_MS],
      ["OJ-106", ROTATE_106_AT_MS],
    ] as const) {
      if (elapsed >= expireAtMs && !this.rotated.has(slotId)) {
        this.rotated.add(slotId);
        this.rotatedAt.set(slotId, now);
        void mockBufferZoneRepository.rotateSlot(slotId, now);
        toast.info(`Slot ${slotId} expired — new slot dispatched at East Wing.`);
      }
      const rotatedAt = this.rotatedAt.get(slotId);
      if (rotatedAt != null && now >= rotatedAt + ACK_AFTER_MS && !this.rotated.has(`${slotId}:ack`)) {
        this.rotated.add(`${slotId}:ack`);
      }
    }
  }

  private sync(): void {
    void mockBufferZoneRepository.listActiveSlots().then((slots) => {
      const withRotation = slots.map((s) => {
        if (this.rotated.has(s.id) && !this.rotated.has(`${s.id}:ack`)) {
          return { ...s, status: "SENT" as const };
        }
        if (this.rotated.has(`${s.id}:ack`)) {
          return { ...s, status: "ACK" as const };
        }
        return s;
      });
      useEditorStore.getState().setSlots(withRotation);
    });
    void mockBufferZoneRepository.listBarriers().then((barriers) => {
      useEditorStore.getState().setBarriers(barriers);
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isRunning(): boolean {
    return this.intervalId != null;
  }
}

export const bufferLiveDriver = new BufferLiveDriver();
