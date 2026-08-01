import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serverStationRepository } from "@/infrastructure/repositories/server-station-repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const feature = await serverStationRepository.findById(id);

    if (!feature) {
      return NextResponse.json(
        { status: "error", message: "Station not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(feature);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch station";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
