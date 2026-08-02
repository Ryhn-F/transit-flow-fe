import type { AlertLevel, VCIBand } from "@/entities/vci-metric";

export const VCI_RECALC_SECONDS = 60;
export const VCI_CRITICAL_THRESHOLD = 80;
export const VCI_HYSTERESIS_REARM = 70;

export function computeVciScore(
  pedestrianFlowRatePpm: number,
  dropoffSurgeVpm: number,
  effectiveWidthM: number,
  complianceFactor: number,
): number {
  const denominator = effectiveWidthM * complianceFactor;
  if (denominator <= 0) return 0;
  return Math.min(
    100,
    Math.round((pedestrianFlowRatePpm + dropoffSurgeVpm) / denominator),
  );
}

export function bandOf(score: number): VCIBand {
  if (score >= VCI_CRITICAL_THRESHOLD) return "RED";
  if (score >= 50) return "YELLOW";
  return "GREEN";
}

export function alertLevelOf(score: number): AlertLevel {
  if (score >= VCI_CRITICAL_THRESHOLD) return "CRITICAL";
  if (score >= 50) return "WARNING";
  return "NORMAL";
}

export function recommendedActionOf(score: number): string {
  if (score >= VCI_CRITICAL_THRESHOLD) return "Deploy staff to exit channel immediately";
  if (score >= 50) return "Monitor and prepare buffer allocation";
  return "Nominal — continue routine patrol";
}
