import { NextRequest, NextResponse } from "next/server";
import { getAirPollutionData } from "@/lib/openweather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json({ available: false, error: "Missing lat/lon" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const { data, error } = await getAirPollutionData(lat, lon);

  if (error || !data) {
    return NextResponse.json({ available: false, error: error ?? "Pollution data unavailable" });
  }

  return NextResponse.json({ available: true, pollution: data });
}
