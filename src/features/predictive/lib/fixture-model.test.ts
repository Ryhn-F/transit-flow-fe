import { describe, it, expect } from "vitest";
import { generateSeries, exitBaseVci, maxForecastVci, forecastDeltaVci, eventMultiplier } from "./fixture-model";
import { FORECAST_EVENTS } from "@/infrastructure/mock/fixtures/forecast-fixtures";
import { applyTrainDelay, composeScenario } from "./scenario";
import { forecastSeriesSchema, scenarioInputSchema } from "./schemas";

const EVENTS_GBK = FORECAST_EVENTS.filter((e) => e.id === "EV-01");
const EVENTS_NONE = [];

describe("fixture-model", () => {
  it("generates 48 deterministic points within 0-120", () => {
    const a = generateSeries("SUD-E", 86, EVENTS_GBK, "none", 1, 0);
    const b = generateSeries("SUD-E", 86, EVENTS_GBK, "none", 1, 0);
    expect(a.points).toHaveLength(48);
    expect(a).toEqual(b);
    expect(a.points.every((p) => p.vci >= 0 && p.vci <= 120)).toBe(true);
    expect(forecastSeriesSchema.safeParse(a).success).toBe(true);
  });

  it("event multiplier peaks near the GBK concert window", () => {
    expect(eventMultiplier(20, EVENTS_GBK)).toBeGreaterThan(1);
    expect(eventMultiplier(4, EVENTS_GBK)).toBeCloseTo(1, 2);
  });

  it("GBK pushes SUD-E forecast over the 80 threshold", () => {
    const series = generateSeries("SUD-E", 86, EVENTS_GBK, "none", 1, 0);
    expect(maxForecastVci(series)).toBeGreaterThanOrEqual(80);
  });

  it("without events SUD-E stays under threshold", () => {
    const series = generateSeries("SUD-E", 86, EVENTS_NONE, "none", 1, 0);
    expect(maxForecastVci(series)).toBeLessThan(80);
  });

  it("heavy rain boosts evening hours", () => {
    const dry = generateSeries("DUK-GB", 68, [], "none", 1, 0);
    const wet = generateSeries("DUK-GB", 68, [], "heavy", 1, 0);
    const dry19 = dry.points[19].vci;
    const wet19 = wet.points[19].vci;
    expect(wet19).toBeGreaterThanOrEqual(dry19);
  });

  it("exitBaseVci maps shared fixtures", () => {
    expect(exitBaseVci("DUK-GB")).toBe(68);
    expect(exitBaseVci("SUD-E")).toBe(86);
  });
});

describe("scenario mutations", () => {
  it("train delay shifts the evening peak later", () => {
    const base = generateSeries("DUK-GB", 68, [], "none", 1, 0);
    const shifted = applyTrainDelay(base, 60);
    const peakBase = base.points.reduce((a, b) => (b.vci > a.vci ? b : a));
    const peakShift = shifted.points.reduce((a, b) => (b.vci > a.vci ? b : a));
    expect(peakShift.hour).toBeGreaterThanOrEqual(peakBase.hour);
  });

  it("composeScenario produces a valid series", () => {
    const base = generateSeries("SUD-E", 86, EVENTS_GBK, "none", 1, 0);
    const out = composeScenario(base, { trainDelayMin: 20, eventShiftEndHour: 21, rainLevel: "heavy", holidayFactor: 1 }, EVENTS_GBK);
    expect(out.points).toHaveLength(48);
    expect(out.points.every((p) => p.vci <= 120)).toBe(true);
  });

  it("forecastDeltaVci is positive when scenario amplifies", () => {
    const base = generateSeries("SUD-E", 86, [], "none", 1, 0);
    const boosted = generateSeries("SUD-E", 86, [], "heavy", 1.3, 0);
    expect(forecastDeltaVci(boosted, base)).toBeGreaterThan(0);
  });

  it("scenario input schema validates and rejects", () => {
    expect(scenarioInputSchema.safeParse({ trainDelayMin: 20, eventShiftEndHour: null, rainLevel: "heavy", holidayFactor: 1 }).success).toBe(true);
    expect(scenarioInputSchema.safeParse({ trainDelayMin: 300, eventShiftEndHour: null, rainLevel: "heavy", holidayFactor: 1 }).success).toBe(false);
    expect(scenarioInputSchema.safeParse({ trainDelayMin: 20, eventShiftEndHour: null, rainLevel: "storm", holidayFactor: 1 }).success).toBe(false);
  });
});
