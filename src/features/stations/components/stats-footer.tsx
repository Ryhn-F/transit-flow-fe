import { BarChart2, Clock } from "lucide-react";
import { StatChip } from "@/components/shared/stat-chip";

export function StatsFooter() {
  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        <StatChip
          icon={BarChart2}
          label="Avg VCI (Today)"
          value="48.2"
          subLabel="Moderate"
        />
      </div>
      <div className="pointer-events-auto">
        <StatChip icon={Clock} label="Est. Peak Time" value="17:30 - 19:00" />
      </div>
    </div>
  );
}
