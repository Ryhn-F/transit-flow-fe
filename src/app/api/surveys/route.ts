import { NextResponse } from "next/server";
import { z } from "zod";
import { serverSurveyRepository } from "@/infrastructure/repositories/server-survey-repository";

export const surveySubmissionSchema = z.object({
  station_id: z.string().min(1, "Station ID is required"),
  surveyor_name: z.string().min(1, "Surveyor name is required"),
  exit_door_width_m: z.number().positive("Exit door width must be greater than 0"),
  stair_width_m: z.number().min(0, "Stair width must be 0 or greater"),
  sidewalk_width_m: z.number().positive("Sidewalk width must be greater than 0"),
  obstacle_type: z.enum(["vendor", "construction", "angkot_queue", "parking", "other", "none"]),
  notes: z.string().optional().nullable(),
  geometry: z.record(z.unknown()).optional().nullable(),
});

export async function GET() {
  try {
    const featureCollection = await serverSurveyRepository.findAll();
    return NextResponse.json(featureCollection);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch survey submissions";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = surveySubmissionSchema.parse(body);
    const feature = await serverSurveyRepository.create({
      ...validatedData,
      geometry: (validatedData.geometry as unknown as import("geojson").Geometry) ?? undefined,
    });
    return NextResponse.json({ status: "success", data: feature }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: "error", message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to submit survey";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
