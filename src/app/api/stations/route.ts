import { NextResponse } from "next/server";
import { serverStationRepository } from "@/infrastructure/repositories/server-station-repository";

export async function GET() {
  try {
    const featureCollection = await serverStationRepository.findAll();
    return NextResponse.json(featureCollection);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stations";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
