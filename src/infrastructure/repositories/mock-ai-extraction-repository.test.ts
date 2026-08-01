import { describe, it, expect, beforeEach } from "vitest";
import { mockAiExtractionRepository as repo } from "./mock-ai-extraction-repository";
import { AI_EXTRACTION_SEEDS, AI_ARRIVAL_POOL } from "../mock/fixtures/ai-extractions";

const T0 = 1_750_000_000_000;

beforeEach(() => {
  repo.startSession(T0);
});

describe("mock ai-extraction repository state machine", () => {
  it("seeds 8 fixtures (6 resolved + 2 live)", async () => {
    const all = await repo.list();
    expect(all).toHaveLength(6 + 2);
  });

  it("advances EXTRACTING → REVIEW within 6 seconds of session start", async () => {
    repo.tick(T0 + 5_000);
    const mid = await repo.getById("AI-2026-0147");
    expect(mid?.status).toBe("EXTRACTING");

    repo.tick(T0 + 7_000);
    const done = await repo.getById("AI-2026-0147");
    expect(done?.status).toBe("REVIEW");
    expect(done?.review_ready_at).not.toBeNull();
  });

  it("advances QUEUED → EXTRACTING → REVIEW for new arrivals", async () => {
    repo.tick(T0 + 45_000);
    const first = await repo.getById(AI_ARRIVAL_POOL[0].id);
    expect(first?.status).toBe("QUEUED");

    repo.tick(T0 + 48_000);
    const extracting = await repo.getById(AI_ARRIVAL_POOL[0].id);
    expect(extracting?.status).toBe("EXTRACTING");

    repo.tick(T0 + 51_000);
    const review = await repo.getById(AI_ARRIVAL_POOL[0].id);
    expect(review?.status).toBe("REVIEW");
    expect(review?.review_ready_at).not.toBeNull();
  });

  it("arrives every 45s alternating stations", async () => {
    repo.tick(T0 + 45_000);
    const first = await repo.getById(AI_ARRIVAL_POOL[0].id);
    expect(first).not.toBeNull();

    repo.tick(T0 + 90_000);
    const second = await repo.getById(AI_ARRIVAL_POOL[1].id);
    expect(second).not.toBeNull();
    expect(second?.station_id).not.toBe(first?.station_id);
  });

  it("review() transitions to APPROVED and attach() is idempotent", async () => {
    const approved = await repo.review("AI-2026-0144", "APPROVED");
    expect(approved.status).toBe("APPROVED");

    const first = await repo.attach("AI-2026-0144", "DUK-GC");
    expect(first.attached_channel_id).toBe("DUK-GC");

    const second = await repo.attach("AI-2026-0144", "MGR-01");
    expect(second.attached_channel_id).toBe("MGR-01");
  });

  it("rejects out-of-range attribute updates via zod", async () => {
    await expect(
      repo.updateAttribute("AI-2026-0144", "vendor_blockage_pct", 112),
    ).rejects.toThrow("between 0 and 100");

    await expect(
      repo.updateAttribute("AI-2026-0144", "pedestrian_count", -1),
    ).rejects.toThrow("between 0 and 500");

    const ok = await repo.updateAttribute("AI-2026-0144", "vendor_blockage_pct", 78);
    expect(ok.attributes.vendor_blockage_pct).toBe(78);
  });

  it("scripts the SLA overrun edge at t=90s (34s SLA) then flips REVIEW", async () => {
    repo.tick(T0 + 90_000);
    const record = await repo.getById("AI-2026-0148");
    expect(record?.status).toBe("EXTRACTING");
    expect(record?.review_ready_at).not.toBeNull();
    const sla = Date.parse(record!.review_ready_at!) - Date.parse(record!.submitted_at);
    expect(sla).toBe(34_000);

    repo.tick(T0 + 97_000);
    const flipped = await repo.getById("AI-2026-0148");
    expect(flipped?.status).toBe("REVIEW");
  });

  it("filters by status, station and query", async () => {
    const review = await repo.list({ status: ["REVIEW"] });
    expect(review.length).toBeGreaterThan(0);
    expect(review.every((e) => e.status === "REVIEW")).toBe(true);

    const duk = await repo.list({ stationId: "ST-DUK" });
    expect(duk.every((e) => e.station_id === "ST-DUK")).toBe(true);

    const q = await repo.list({ q: "AI-2026-0141" });
    expect(q.length).toBe(1);
  });

  it("clamps confidence jitter within 40-99", async () => {
    repo.tick(T0 + 5_000);
    const record = await repo.getById("AI-2026-0144");
    expect(record!.confidence.pedestrian_count).toBeGreaterThanOrEqual(40);
    expect(record!.confidence.pedestrian_count).toBeLessThanOrEqual(99);
  });

  it("rejects review/update of unknown ids", async () => {
    await expect(repo.review("AI-9999", "APPROVED")).rejects.toThrow("not found");
    await expect(repo.attach("AI-9999", "DUK-GA")).rejects.toThrow("not found");
  });

  it("starts with one fixture already attached (dashboard-visible)", async () => {
    const attached = AI_EXTRACTION_SEEDS.filter((e) => e.attached_channel_id != null);
    expect(attached.length).toBe(1);
    expect(attached[0].id).toBe("AI-2026-0141");
  });
});
