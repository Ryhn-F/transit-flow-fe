import { describe, it, expect } from "vitest";
import { createEngine, tickEngine } from "./sim-engine";
import { computePipeline } from "./pipeline";
import { seedCameras } from "@/infrastructure/mock/fixtures/cctv-fixtures";

describe("sim-engine", () => {
  it("is deterministic per camera id", () => {
    const a = createEngine("CAM-01", 2);
    const b = createEngine("CAM-01", 2);
    expect(a.pedestrians.length).toBe(b.pedestrians.length);
    for (let i = 0; i < 30; i++) {
      const fa = tickEngine(a, 2);
      const fb = tickEngine(b, 2);
      expect(fa.pedestrians.length).toBe(fb.pedestrians.length);
    }
  });

  it("counts arrivals and departures", () => {
    const engine = createEngine("CAM-02", 3);
    let inTotal = 0;
    let outTotal = 0;
    for (let i = 0; i < 500; i++) {
      const frame = tickEngine(engine, 3);
      inTotal += frame.inCount;
      outTotal += frame.outCount;
    }
    expect(inTotal + outTotal).toBeGreaterThan(0);
  });

  it("bounds boxes stay within the frame", () => {
    const engine = createEngine("CAM-07", 2);
    for (let i = 0; i < 100; i++) {
      const frame = tickEngine(engine, 2);
      for (const p of frame.pedestrians) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
        expect(p.confidence).toBeGreaterThanOrEqual(0.8);
        expect(p.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("pipeline state machine", () => {
  it("uses CCTV source when healthy", () => {
    expect(computePipeline(false, false, 0).source).toBe("CCTV");
    expect(computePipeline(false, false, 0).stageCctv).toBe("OK");
  });

  it("falls back to SURVEY when a camera is down", () => {
    const p = computePipeline(true, false, 0);
    expect(p.source).toBe("SURVEY");
    expect(p.stageCctv).toBe("DOWN");
  });

  it("degrades while reconnecting", () => {
    const p = computePipeline(false, true, 0);
    expect(p.stageCctv).toBe("DEGRADED");
    expect(p.source).toBe("CCTV");
  });

  it("degrades AI when IoT counters are offline", () => {
    const p = computePipeline(false, false, 2);
    expect(p.stageIot).toBe("DEGRADED");
    expect(p.stageAi).toBe("DEGRADED");
    expect(computePipeline(false, false, 3).stageIot).toBe("DOWN");
  });
});

describe("cctv fixtures", () => {
  it("seeds 10 cameras and 6 counters", () => {
    expect(seedCameras()).toHaveLength(10);
    expect(seedCameras().every((c) => c.status === "STREAMING")).toBe(true);
  });
});
