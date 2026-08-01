import type GeoJSON from "geojson";
import { supabase } from "@/lib/supabase";
import { toFeature, toFeatureCollection } from "@/lib/geojson";

export interface SurveySubmissionInsert {
  station_id: string;
  surveyor_name: string;
  exit_door_width_m: number;
  stair_width_m: number;
  sidewalk_width_m: number;
  obstacle_type: "vendor" | "construction" | "angkot_queue" | "parking" | "other" | "none";
  notes?: string | null;
  geometry?: GeoJSON.Geometry | null;
}

export class ServerSurveyRepository {
  async findAll() {
    const { data, error } = await supabase
      .from("survey_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    const rows = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      geometry: row.geometry as unknown as GeoJSON.Geometry,
    }));
    return toFeatureCollection(rows);
  }

  async create(payload: SurveySubmissionInsert) {
    const { data, error } = await supabase
      .from("survey_submissions")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    const row = {
      ...data,
      geometry: data.geometry as unknown as GeoJSON.Geometry,
    };
    return toFeature(row);
  }
}

export const serverSurveyRepository = new ServerSurveyRepository();
