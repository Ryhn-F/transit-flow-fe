import { useStationUIStore } from "@/features/stations/store/station-ui-store";
import { useStationsQuery } from "./use-stations-query";
import type { StationNode } from "@/entities/station";

export function useSelectedStation(): StationNode | null {
  const selectedStationId = useStationUIStore((s) => s.selectedStationId);
  const { data } = useStationsQuery();

  if (!selectedStationId || !data) return null;

  const feature = data.features.find(
    (f) => f.properties.station_id === selectedStationId,
  );
  return feature?.properties ?? null;
}
