import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from "@/entities/geojson";

export function toFeature<T extends { geometry: GeoJSON.Geometry }>(
  row: T,
): GeoJSONFeature<Omit<T, "geometry">> {
  const { geometry, ...properties } = row;
  return {
    type: "Feature",
    geometry,
    properties: properties as Omit<T, "geometry">,
  };
}

export function toFeatureCollection<T extends { geometry: GeoJSON.Geometry }>(
  rows: T[],
): GeoJSONFeatureCollection<Omit<T, "geometry">> {
  return {
    type: "FeatureCollection",
    features: rows.map(toFeature),
  };
}
