import { describe, it, expect } from "vitest";
import { aggregateLeaderboard, citySummary, toCsv, driftVci } from "./aggregate";
import { HUB_STATS, CITY_PROFILES } from "../fixtures/city-fixtures";
import { TRANSLATIONS, missingKeys, translate } from "./i18n";
import { useNationalStore } from "../store/national-store";

describe("national aggregate", () => {
  it("ranks hubs by 7-day mean VCI descending", () => {
    const rows = aggregateLeaderboard(HUB_STATS);
    expect(rows).toHaveLength(12);
    expect(rows[0].hub.id).toBe("JB-SUD"); // mean 71
    expect(rows[0].rank).toBe(1);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].hub.meanVci7d).toBeGreaterThanOrEqual(rows[i].hub.meanVci7d);
    }
  });

  it("computes trend from current vs mean", () => {
    const rows = aggregateLeaderboard(HUB_STATS);
    const sud = rows.find((r) => r.hub.id === "JB-SUD")!;
    expect(sud.trend).toBe("up"); // current 86 vs mean 71
  });

  it("summarizes a city", () => {
    const summary = citySummary(HUB_STATS, "surabaya");
    expect(summary.hubs).toBe(2);
    expect(summary.mean).toBeGreaterThan(0);
    expect(citySummary(HUB_STATS, "nope").hubs).toBe(0);
  });

  it("exports CSV with header", () => {
    const csv = toCsv(aggregateLeaderboard(HUB_STATS));
    expect(csv.startsWith("rank,hub,city,mean_vci_7d,current_vci,surges,trend")).toBe(true);
    expect(csv.split("\n").length).toBe(13);
  });

  it("drifts deterministically within bounds", () => {
    const a = driftVci(HUB_STATS[0], 5);
    const b = driftVci(HUB_STATS[0], 5);
    expect(a).toEqual(b);
    expect(a.currentVci).toBeGreaterThanOrEqual(10);
    expect(a.currentVci).toBeLessThanOrEqual(100);
  });
});

describe("i18n", () => {
  it("has complete id/en coverage", () => {
    expect(missingKeys("id")).toHaveLength(0);
    expect(missingKeys("en")).toHaveLength(0);
    expect(Object.keys(TRANSLATIONS).length).toBeGreaterThanOrEqual(10);
  });

  it("translates and falls back to id", () => {
    expect(translate("nav.title", "en")).toBe("TransitFlow National");
    expect(translate("nav.title", "id")).toBe("TransitFlow Nasional");
  });
});

describe("national-store", () => {
  it("switches city and locale", () => {
    useNationalStore.getState().setCity("medan");
    useNationalStore.getState().setLocale("en");
    expect(useNationalStore.getState().cityId).toBe("medan");
    expect(useNationalStore.getState().locale).toBe("en");
  });

  it("spikes a hub", () => {
    useNationalStore.getState().spikeHub("MD-PUS", 84);
    expect(useNationalStore.getState().hubs.find((h) => h.id === "MD-PUS")?.currentVci).toBe(84);
  });

  it("city profiles cover 5 cities", () => {
    expect(CITY_PROFILES).toHaveLength(5);
  });
});
