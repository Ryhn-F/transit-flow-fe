import { mulberry32 } from "@/lib/prng";
import { VCI_CRITICAL_THRESHOLD } from "./vci-formula";

export interface VciExitProfile {
  channel_id: string;
  base: number;
  amplitude: number;
  periodSec: number;
  phaseRad: number;
  profile: "SINE" | "RAMP";
  rampStartSec: number;
  rampPeakSec: number;
  rampHoldSec: number;
  rampDecaySec: number;
}

export const SEED = 42;

export function buildProfiles(
  channels: Array<{
    channel_id: string;
    base: number;
    amplitude?: number;
    periodSec?: number;
    ramp?: { start: number; peak: number; hold: number; decay: number };
  }>,
): VciExitProfile[] {
  return channels.map((c, i) => {
    const rand = mulberry32(SEED + i * 131);
    return {
      channel_id: c.channel_id,
      base: c.base,
      amplitude: c.amplitude ?? 4,
      periodSec: c.periodSec ?? 300,
      phaseRad: rand() * Math.PI * 2,
      profile: c.ramp ? "RAMP" : "SINE",
      rampStartSec: c.ramp?.start ?? 0,
      rampPeakSec: c.ramp?.peak ?? 0,
      rampHoldSec: c.ramp?.hold ?? 0,
      rampDecaySec: c.ramp?.decay ?? 0,
    };
  });
}

export function driftValue(profile: VciExitProfile, elapsedSec: number): number {
  if (profile.profile === "RAMP") {
    const { rampStartSec: start, rampPeakSec: peak, rampHoldSec: hold, rampDecaySec: decay } = profile;
    if (elapsedSec < start) return 0;
    if (elapsedSec < peak) {
      return profile.amplitude * ((elapsedSec - start) / (peak - start));
    }
    if (elapsedSec < peak + hold) return profile.amplitude;
    if (elapsedSec < peak + hold + decay) {
      return profile.amplitude * (1 - (elapsedSec - peak - hold) / decay);
    }
    return 0;
  }
  return profile.amplitude * Math.sin((2 * Math.PI * elapsedSec) / profile.periodSec + profile.phaseRad);
}

export function scoreAt(
  profile: VciExitProfile,
  elapsedSec: number,
  jitter = 0,
): number {
  const raw = profile.base + driftValue(profile, elapsedSec) + jitter;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Deterministic golden sequence from seed 42: the same sequence of (elapsedSec,
 * score) pairs must reproduce in tests. Jitter comes from a per-profile PRNG.
 */
export function jitterAt(profile: VciExitProfile, recalcIndex: number): number {
  const rand = mulberry32(SEED + profile.channel_id.length * 97 + recalcIndex * 17);
  return Math.round(rand() * 4 - 2);
}

export function metricFromScore(params: {
  channel_id: string;
  pedestrian_flow_rate_ppm: number;
  vehicular_dropoff_surge_vpm: number;
  effective_width_m: number;
  compliance_factor: number;
  vci_score: number;
  timestamp: string;
}) {
  const { vci_score } = params;
  return {
    ...params,
    alert_level: (vci_score >= VCI_CRITICAL_THRESHOLD ? "CRITICAL" : vci_score >= 50 ? "WARNING" : "NORMAL"),
    recommended_action:
      vci_score >= VCI_CRITICAL_THRESHOLD
        ? "Deploy staff to exit channel immediately"
        : vci_score >= 50
          ? "Monitor and prepare buffer allocation"
          : "Nominal — continue routine patrol",
  };
}
