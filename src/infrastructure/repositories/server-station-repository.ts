import type GeoJSON from "geojson";
import { supabase } from "@/lib/supabase";
import { toFeature, toFeatureCollection } from "@/lib/geojson";

export class ServerStationRepository {
  async findAll() {
    const { data, error } = await supabase
      .from("station_nodes_geojson")
      .select("*");

    if (error) throw new Error(error.message);
    const rows = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      geometry: row.geometry as unknown as GeoJSON.Geometry,
    }));
    return toFeatureCollection(rows);
  }

  async search(query: string) {
    const { data, error } = await supabase
      .from("station_nodes_geojson")
      .select("*")
      .ilike("station_name", `%${query}%`);

    if (error) throw new Error(error.message);
    const rows = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      geometry: row.geometry as unknown as GeoJSON.Geometry,
    }));
    return toFeatureCollection(rows);
  }

  async findById(stationId: string) {
    const { data, error } = await supabase
      .from("station_nodes_geojson")
      .select("*")
      .eq("station_id", stationId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = {
      ...data,
      geometry: data.geometry as unknown as GeoJSON.Geometry,
    };
    return toFeature(row);
  }
}

export const serverStationRepository = new ServerStationRepository();
