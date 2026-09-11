import { NextRequest, NextResponse } from "next/server";
import { getWeatherData } from "@/lib/openweather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { available: false, error: "Missing lat/lon parameters" },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { available: false, error: "Invalid numeric lat/lon parameters" },
      { status: 400 }
    );
  }

  const { data, error } = await getWeatherData(lat, lon);

  if (error || !data) {
    return NextResponse.json({ available: false, error: error ?? "Weather data unavailable" });
  }

  return NextResponse.json({ available: true, weather: data });
}
