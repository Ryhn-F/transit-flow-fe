import type { GeoJSONFeatureCollection } from "@/entities/geojson";
import type { StationNode, ExitChannel } from "@/entities/station";

export const DEMO_STATIONS: GeoJSONFeatureCollection<StationNode> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [106.8272, -6.2088] },
      properties: {
        station_id: "ST-DUK",
        station_name: "Dukuh Atas",
        operator: "KAI",
        peak_hourly_capacity: 3200,
        active_exit_count: 3,
        status: "OPERATIONAL",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [106.8496, -6.2097] },
      properties: {
        station_id: "ST-MGR",
        station_name: "Manggarai",
        operator: "KAI",
        peak_hourly_capacity: 4100,
        active_exit_count: 2,
        status: "OPERATIONAL",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [106.8228, -6.2023] },
      properties: {
        station_id: "ST-SUD",
        station_name: "Sudirman",
        operator: "MRT",
        peak_hourly_capacity: 2800,
        active_exit_count: 1,
        status: "CONGESTED",
      },
    },
  ],
};

export const DEMO_EXIT_CHANNELS: ExitChannel[] = [
  {
    channel_id: "DUK-GA",
    station_id: "ST-DUK",
    channel_name: "Gate A",
    physical_width_meters: 4.5,
    effective_width_meters: 3.2,
    walkway_compliance_factor: 0.8,
    max_flow_rate_ppm: 42,
  },
  {
    channel_id: "DUK-GB",
    station_id: "ST-DUK",
    channel_name: "Gate B",
    physical_width_meters: 3.5,
    effective_width_meters: 2.1,
    walkway_compliance_factor: 0.65,
    max_flow_rate_ppm: 28,
  },
  {
    channel_id: "DUK-GC",
    station_id: "ST-DUK",
    channel_name: "Gate C",
    physical_width_meters: 5.0,
    effective_width_meters: 4.1,
    walkway_compliance_factor: 0.9,
    max_flow_rate_ppm: 55,
  },
  {
    channel_id: "MGR-01",
    station_id: "ST-MGR",
    channel_name: "Gate 1",
    physical_width_meters: 6.0,
    effective_width_meters: 4.8,
    walkway_compliance_factor: 0.85,
    max_flow_rate_ppm: 60,
  },
  {
    channel_id: "MGR-02",
    station_id: "ST-MGR",
    channel_name: "Gate 2",
    physical_width_meters: 3.2,
    effective_width_meters: 1.8,
    walkway_compliance_factor: 0.6,
    max_flow_rate_ppm: 22,
  },
  {
    channel_id: "SUD-E",
    station_id: "ST-SUD",
    channel_name: "Gate E",
    physical_width_meters: 3.8,
    effective_width_meters: 2.4,
    walkway_compliance_factor: 0.7,
    max_flow_rate_ppm: 30,
  },
];

export function stationName(stationId: string): string {
  const feature = DEMO_STATIONS.features.find(
    (f) => f.properties.station_id === stationId,
  );
  return feature?.properties.station_name ?? stationId;
}

export function stationCoords(
  stationId: string,
): [number, number] | null {
  const feature = DEMO_STATIONS.features.find(
    (f) => f.properties.station_id === stationId,
  );
  if (!feature || feature.geometry.type !== "Point") return null;
  return feature.geometry.coordinates as [number, number];
}

export function channelName(channelId: string): string {
  const channel = DEMO_EXIT_CHANNELS.find(
    (c) => c.channel_id === channelId,
  );
  return channel?.channel_name ?? channelId;
}
