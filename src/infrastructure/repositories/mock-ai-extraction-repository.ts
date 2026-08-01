import type {
  AiAttributeKey,
  AiExtraction,
  AiExtractionFilters,
} from "@/entities/ai-extraction";
import {
  AI_ARRIVAL_POOL,
  AI_EXTRACTION_LIVE_SEEDS,
  AI_EXTRACTION_SEEDS,
  buildArrivalExtraction,
} from "@/infrastructure/mock/fixtures/ai-extractions";
import { validateAttributeValue } from "@/features/ai-ingestion/schemas/attribute-schema";

const QUEUED_TO_EXTRACTING_MS = 3_000;
const EXTRACTING_TO_REVIEW_MS = 6_000;
const ARRIVAL_INTERVAL_MS = 45_000;
const JITTER_INTERVAL_MS = 5_000;
const EDGE_OVERRUN_AT_MS = 90_000;
const EDGE_OVERRUN_SLA_MS = 34_000;
const EDGE_FLIP_REVIEW_AT_MS = 97_000;

class MockAiExtractionRepository {
  private records = new Map<string, AiExtraction>();
  private startedAt: number | null = null;
  private lastJitterAt = 0;
  private arrivalCount = 0;
  private overrunApplied = false;

  private ensureSeeded(): void {
    if (this.startedAt != null || this.records.size > 0) return;
    this.startSession(Date.now());
  }

  list(filters: AiExtractionFilters = {}): Promise<AiExtraction[]> {
    this.ensureSeeded();
    const { status, stationId, q } = filters;
    const all = Array.from(this.records.values());
    const filtered = all.filter((e) => {
      if (status && status.length > 0 && !status.includes(e.status)) return false;
      if (stationId && e.station_id !== stationId) return false;
      if (q) {
        const needle = q.trim().toLowerCase();
        const hay = `${e.id} ${e.survey_id} ${e.exit_channel_id}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return Promise.resolve(
      filtered.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)),
    );
  }

  getById(id: string): Promise<AiExtraction | null> {
    this.ensureSeeded();
    return Promise.resolve(this.records.get(id) ?? null);
  }

  async review(
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewer_notes?: string,
  ): Promise<AiExtraction> {
    const record = this.records.get(id);
    if (!record) throw new Error("Extraction not found");
    const updated: AiExtraction = {
      ...record,
      status: decision,
      reviewer_notes: reviewer_notes ?? record.reviewer_notes,
    };
    this.records.set(id, updated);
    return updated;
  }

  async updateAttribute(
    id: string,
    key: AiAttributeKey,
    value: number,
  ): Promise<AiExtraction> {
    const record = this.records.get(id);
    if (!record) throw new Error("Extraction not found");
    const parsed = validateAttributeValue(key, value);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid attribute value");
    }
    const updated: AiExtraction = {
      ...record,
      attributes: { ...record.attributes, [key]: value },
    };
    this.records.set(id, updated);
    return updated;
  }

  async attach(id: string, channelId: string): Promise<AiExtraction> {
    const record = this.records.get(id);
    if (!record) throw new Error("Extraction not found");
    const updated: AiExtraction = {
      ...record,
      attached_channel_id: channelId,
      status: "APPROVED",
    };
    this.records.set(id, updated);
    return updated;
  }

  startSession(now: number): void {
    this.records.clear();
    AI_EXTRACTION_SEEDS.forEach((e) => this.records.set(e.id, { ...e }));
    AI_EXTRACTION_LIVE_SEEDS.forEach((e) => {
      const offset = e.id === "AI-2026-0147" ? 500 : 0;
      this.records.set(e.id, {
        ...e,
        submitted_at: new Date(now - offset).toISOString(),
      });
    });
    this.startedAt = now;
    this.lastJitterAt = now;
    this.arrivalCount = 0;
    this.overrunApplied = false;
  }

  stopSession(): void {
    this.startedAt = null;
  }

  tick(now: number): void {
    if (this.startedAt == null) return;
    const elapsed = now - this.startedAt;

    if (elapsed >= ARRIVAL_INTERVAL_MS * (this.arrivalCount + 1)) {
      const index = this.arrivalCount;
      const pool = AI_ARRIVAL_POOL[index % AI_ARRIVAL_POOL.length];
      if (pool && !this.records.has(pool.id)) {
        const record = buildArrivalExtraction(pool, index, now);
        this.records.set(record.id, record);
      }
      this.arrivalCount += 1;
    }

    for (const record of this.records.values()) {
      if (record.status === "QUEUED" || record.status === "EXTRACTING") {
        const submitted = Date.parse(record.submitted_at);
        const since = now - submitted;
        if (record.status === "QUEUED" && since >= QUEUED_TO_EXTRACTING_MS) {
          this.records.set(record.id, { ...record, status: "EXTRACTING" });
        } else if (
          record.status === "EXTRACTING" &&
          since >= EXTRACTING_TO_REVIEW_MS
        ) {
          this.records.set(record.id, {
            ...record,
            status: "REVIEW",
            review_ready_at: new Date(submitted + EXTRACTING_TO_REVIEW_MS).toISOString(),
          });
        }
      }
    }

    if (elapsed >= EDGE_OVERRUN_AT_MS && !this.overrunApplied) {
      this.overrunApplied = true;
      const record = this.records.get("AI-2026-0148");
      if (record) {
        const submitted = Date.parse(record.submitted_at);
        this.records.set(record.id, {
          ...record,
          status: "EXTRACTING",
          review_ready_at: new Date(submitted + EDGE_OVERRUN_SLA_MS).toISOString(),
        });
      }
    }
    if (elapsed >= EDGE_FLIP_REVIEW_AT_MS && this.overrunApplied) {
      const record = this.records.get("AI-2026-0148");
      if (record && record.status === "EXTRACTING") {
        this.records.set(record.id, { ...record, status: "REVIEW" });
      }
    }

    if (now - this.lastJitterAt >= JITTER_INTERVAL_MS) {
      this.lastJitterAt = now;
      for (const record of this.records.values()) {
        if (record.status !== "REVIEW" && record.status !== "EXTRACTING") continue;
        const jitter = (key: AiAttributeKey) =>
          Math.min(
            99,
            Math.max(40, record.confidence[key] + (Math.random() > 0.5 ? 2 : -2)),
          );
        this.records.set(record.id, {
          ...record,
          confidence: {
            pedestrian_count: jitter("pedestrian_count"),
            angkot_queue_length: jitter("angkot_queue_length"),
            vendor_blockage_pct: jitter("vendor_blockage_pct"),
          },
        });
      }
    }
  }

  getStartedAt(): number | null {
    return this.startedAt;
  }
}

export const mockAiExtractionRepository = new MockAiExtractionRepository();
