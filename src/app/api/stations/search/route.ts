import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serverStationRepository } from "@/infrastructure/repositories/server-station-repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { status: "error", message: "Search query must not be empty" },
        { status: 400 },
      );
    }

    const featureCollection = await serverStationRepository.search(
      query.trim(),
    );
    return NextResponse.json(featureCollection);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search query failed";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
