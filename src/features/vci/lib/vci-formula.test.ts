import { describe, it, expect } from "vitest";
import {
  bandOf,
  computeVciScore,
  alertLevelOf,
} from "./vci-formula";

describe("vci-formula", () => {
  it("computes the VCI formula and clamps to 100", () => {
    expect(computeVciScore(50, 20, 4, 0.5)).toBe(35);
    expect(computeVciScore(157, 67, 4.08, 1)).toBe(55);
    expect(computeVciScore(300, 300, 1, 1)).toBe(100);
    expect(computeVciScore(500, 500, 0.5, 0.5)).toBe(100);
  });

  it("returns 0 when width or compliance is zero (exit closed)", () => {
    expect(computeVciScore(100, 50, 0, 0.7)).toBe(0);
    expect(computeVciScore(100, 50, 3, 0)).toBe(0);
  });

  it("maps band boundaries 49/50/79/80", () => {
    expect(bandOf(0)).toBe("GREEN");
    expect(bandOf(49)).toBe("GREEN");
    expect(bandOf(50)).toBe("YELLOW");
    expect(bandOf(79)).toBe("YELLOW");
    expect(bandOf(80)).toBe("RED");
    expect(bandOf(100)).toBe("RED");
  });

  it("maps alert levels", () => {
    expect(alertLevelOf(49)).toBe("NORMAL");
    expect(alertLevelOf(55)).toBe("WARNING");
    expect(alertLevelOf(92)).toBe("CRITICAL");
  });
});
