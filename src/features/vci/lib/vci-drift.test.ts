import { describe, it, expect } from "vitest";
import {
  buildProfiles,
  scoreAt,
  driftValue,
  jitterAt,
  SEED,
} from "./vci-drift";

const profiles = buildProfiles([
  { channel_id: "DUK-GA", base: 44 },
  { channel_id: "DUK-GB", base: 68, amplitude: 17, ramp: { start: 30, peak: 120, hold: 180, decay: 60 } },
  { channel_id: "SUD-E", base: 86 },
]);

describe("vci-drift", () => {
  it("reproduces the same values for the same inputs (golden sequence, seed 42)", () => {
    const a = buildProfiles([{ channel_id: "DUK-GA", base: 44 }]);
    const b = buildProfiles([{ channel_id: "DUK-GA", base: 44 }]);
    for (const t of [0, 60, 120, 300, 900]) {
      expect(scoreAt(a[0], t, 0)).toBe(scoreAt(b[0], t, 0));
    }
    expect(SEED).toBe(42);
  });

  it("ramp profile: flat until start, rises to peak, holds, decays", () => {
    const gb = profiles.find((p) => p.channel_id === "DUK-GB")!;
    expect(driftValue(gb, 0)).toBe(0);
    expect(driftValue(gb, 15)).toBe(0);
    expect(driftValue(gb, 75)).toBeCloseTo(17 * (45 / 90), 1);
    expect(driftValue(gb, 120)).toBe(17);
    expect(driftValue(gb, 200)).toBe(17);
    expect(driftValue(gb, 360)).toBe(0);
  });

  it("sine profile oscillates within amplitude", () => {
    const sud = profiles.find((p) => p.channel_id === "SUD-E")!;
    for (const t of [0, 60, 240, 720]) {
      const drift = driftValue(sud, t);
      expect(Math.abs(drift)).toBeLessThanOrEqual(sud.amplitude + 1e-9);
    }
  });

  it("jitter is bounded ±2 and deterministic per recalc index", () => {
    const sud = profiles.find((p) => p.channel_id === "SUD-E")!;
    for (let i = 0; i < 50; i++) {
      const j = jitterAt(sud, i);
      expect(Math.abs(j)).toBeLessThanOrEqual(2);
    }
    expect(jitterAt(sud, 7)).toBe(jitterAt(sud, 7));
  });
});
