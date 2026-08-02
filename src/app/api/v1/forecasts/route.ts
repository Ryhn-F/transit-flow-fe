import { NextResponse } from "next/server";
import { mockForecastRepository } from "@/infrastructure/repositories/mock-forecast-repository";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const exitId = url.searchParams.get("exitId") ?? "SUD-E";
  const series = await mockForecastRepository.getSeries(exitId, 0);
  return NextResponse.json(series);
}

export const dynamic = "force-dynamic";
