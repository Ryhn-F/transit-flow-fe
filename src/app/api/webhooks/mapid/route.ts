import { NextResponse } from "next/server";
import { serverSurveyRepository } from "@/infrastructure/repositories/server-survey-repository";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Transform MAPID Form payload structure to survey_submissions schema
    const surveyData = {
      station_id: payload.station_id || payload.stationId || "ST-UNKNOWN",
      surveyor_name: payload.surveyor_name || payload.surveyor || "MAPID Webhook Surveyor",
      exit_door_width_m: Number(payload.exit_door_width_m || payload.doorWidth || 2.0),
      stair_width_m: Number(payload.stair_width_m || payload.stairWidth || 0),
      sidewalk_width_m: Number(payload.sidewalk_width_m || payload.sidewalkWidth || 2.0),
      obstacle_type: (payload.obstacle_type || payload.obstacleType || "none") as "vendor" | "construction" | "angkot_queue" | "parking" | "other" | "none",
      notes: payload.notes || payload.remarks || null,
      geometry: payload.geometry || (payload.latitude && payload.longitude ? {
        type: "Point",
        coordinates: [Number(payload.longitude), Number(payload.latitude)],
      } : null),
    };

    const result = await serverSurveyRepository.create(surveyData);
    return NextResponse.json(
      { status: "success", message: "MAPID webhook survey ingested successfully", data: result },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process MAPID webhook";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
