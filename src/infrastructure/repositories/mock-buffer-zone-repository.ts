import type {
  BarrierToggleResult,
  BufferZoneRepository,
  DispatchPlanExport,
  ExitBufferContext,
  LaneEdge,
  OjekSlot,
  OjekZone,
  StanchionLine,
} from "@/features/buffer-allocator/types";
import {
  BUFFER_EXIT_CONTEXTS,
  BUFFER_LANE_EDGES,
  BUFFER_STANCHION_PRESETS,
  EAST_WING_SLOT_OFFSET,
  SLOT_DURATION_SEC,
  seededOjekSlots,
  stationCenter,
} from "@/infrastructure/mock/fixtures/buffer-fixtures";
import { computeVciDelta, isInsideStationBounds, snapZoneToCurb } from "@/features/buffer-allocator/lib/geometry-validation";
import { mulberry32 } from "@/lib/prng";

const OJEK_RADIUS_M = 35;
const STATION_RADIUS_M = 400;

class MockBufferZoneRepository implements BufferZoneRepository {
  private seeded = false;
  private startedAt = 0;
  private currentNow = Date.now();
  private slots: OjekSlot[] = [];
  private barriers: StanchionLine[] = [];
  private ojekZones: OjekZone[] = [];
  private counter = 200;

  private ensureSeeded(now = Date.now()): void {
    if (this.seeded) return;
    this.seeded = true;
    this.startedAt = now;
    this.currentNow = now;
    this.slots = seededOjekSlots(now);
    this.barriers = BUFFER_STANCHION_PRESETS.map((p) => ({ ...p, active: false }));
  }

  startSession(now: number): void {
    this.seeded = false;
    this.slots = [];
    this.barriers = [];
    this.ojekZones = [];
    this.ensureSeeded(now);
  }

  stopSession(): void {
    this.seeded = false;
  }

  tick(now: number): void {
    this.ensureSeeded(now);
    this.currentNow = now;
  }

  listActiveSlots(): Promise<OjekSlot[]> {
    this.ensureSeeded();
    return Promise.resolve(
      this.slots
        .filter((s) => s.expiresAt > this.currentNow)
        .sort((a, b) => a.expiresAt - b.expiresAt),
    );
  }

  listBarriers(): Promise<StanchionLine[]> {
    this.ensureSeeded();
    return Promise.resolve(this.barriers.map((b) => ({ ...b })));
  }

  listExitContexts(): Promise<ExitBufferContext[]> {
    this.ensureSeeded();
    return Promise.resolve(BUFFER_EXIT_CONTEXTS.map((c) => ({ ...c })));
  }

  listLaneEdges(): Promise<LaneEdge[]> {
    this.ensureSeeded();
    return Promise.resolve(BUFFER_LANE_EDGES.map((l) => ({ ...l })));
  }

  async placeOjekZone(draft: {
    coords: [number, number];
    radiusM: number;
  }): Promise<OjekZone> {
    this.ensureSeeded();
    const context = this.nearestContext(draft.coords);
    if (!context) throw new Error("Placement outside Dukuh Atas station boundary");

    const snapped = snapZoneToCurb(draft.coords, context.curbGeometry);
    this.counter += 1;
    const zone: OjekZone = {
      id: `OJZ-${this.counter}`,
      stationId: context.stationId,
      coordinates: snapped,
      radiusM: draft.radiusM || OJEK_RADIUS_M,
      slotId: null,
    };
    this.ojekZones.push(zone);
    return zone;
  }

  async saveStanchion(stanchion: StanchionLine): Promise<StanchionLine> {
    this.ensureSeeded();
    const idx = this.barriers.findIndex((b) => b.id === stanchion.id);
    if (idx >= 0) {
      this.barriers[idx] = { ...stanchion };
    } else {
      this.counter += 1;
      this.barriers.push({ ...stanchion, id: stanchion.id });
    }
    return this.barriers[idx >= 0 ? idx : this.barriers.length - 1];
  }

  async moveOjekZone(id: string, coords: [number, number]): Promise<OjekZone> {
    this.ensureSeeded();
    const idx = this.ojekZones.findIndex((z) => z.id === id);
    if (idx < 0) throw new Error("Ojek zone not found");
    this.ojekZones[idx] = { ...this.ojekZones[idx], coordinates: coords };
    return this.ojekZones[idx];
  }

  async deleteOjekZone(id: string): Promise<void> {
    this.ensureSeeded();
    this.ojekZones = this.ojekZones.filter((z) => z.id !== id);
  }

  async deleteStanchion(id: string): Promise<void> {
    this.ensureSeeded();
    this.barriers = this.barriers.filter((b) => b.id !== id);
  }

  async rotateSlot(slotId: string, now: number): Promise<OjekSlot | null> {
    this.ensureSeeded(now);
    const idx = this.slots.findIndex((s) => s.id === slotId);
    if (idx < 0) return null;
    const rotated: OjekSlot = {
      ...this.slots[idx],
      coordinates: [
        this.slots[idx].coordinates[0] + EAST_WING_SLOT_OFFSET[0],
        this.slots[idx].coordinates[1] + EAST_WING_SLOT_OFFSET[1],
      ],
      expiresAt: now + SLOT_DURATION_SEC * 1_000,
      status: "SENT",
    };
    this.slots[idx] = rotated;
    return rotated;
  }

  async toggleBarrier(
    id: string,
    state: "ACTIVE" | "STANDBY",
  ): Promise<BarrierToggleResult> {
    this.ensureSeeded();
    const barrier = this.barriers.find((b) => b.id === id);
    if (!barrier) throw new Error("Barrier not found");

    barrier.active = state === "ACTIVE";
    const context = this.nearestContext(barrier.vertices[0]);
    const baseline = Math.max(0, Math.min(100, context?.baselineVci ?? 70));
    const delta = computeVciDelta(barrier, context!);

    const rand = mulberry32(id.length * 53 + 11);
    const throughputFrom = 2340 + Math.floor(rand() * 200);
    const throughputTo =
      state === "ACTIVE"
        ? throughputFrom + Math.round(Math.abs(delta) * 23)
        : throughputFrom;

    return {
      barrierId: id,
      state,
      vciFrom: state === "ACTIVE" ? baseline : baseline + delta,
      vciTo: state === "ACTIVE" ? baseline + delta : baseline,
      throughputFrom,
      throughputTo,
    };
  }

  async exportDispatchPlan(): Promise<DispatchPlanExport> {
    this.ensureSeeded();
    const now = this.currentNow;
    const plan_id = `BP-${now.toString().slice(-6)}`;
    const payload = {
      slots: this.slots.filter((s) => s.expiresAt > now).map((s) => ({
        id: s.id,
        coordinates: s.coordinates,
        expires_at: new Date(s.expiresAt).toISOString(),
      })),
      barriers: this.barriers.map((b) => ({
        id: b.id,
        vertices: b.vertices,
        active: b.active,
      })),
      plan_id,
      issued_at: new Date(now).toISOString(),
    };
    return {
      plan_id,
      issued_at: new Date(now).toISOString(),
      operator: "Operator Admin",
      slots: this.slots.filter((s) => s.expiresAt > now),
      barriers: this.barriers.map((b) => ({ ...b })),
      payload_bytes: JSON.stringify(payload).length,
      webhook_payload: payload,
    };
  }

  private nearestContext(coords: [number, number]): ExitBufferContext | null {
    for (const ctx of BUFFER_EXIT_CONTEXTS) {
      if (isInsideStationBounds(coords, stationCenter(ctx.stationId), STATION_RADIUS_M)) {
        return ctx;
      }
    }
    return null;
  }
}

export const mockBufferZoneRepository = new MockBufferZoneRepository();
