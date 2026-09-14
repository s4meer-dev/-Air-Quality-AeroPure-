import { NextRequest, NextResponse } from "next/server";
import { searchCities, searchAreas, getCity } from "@/lib/locations";
import { searchGlobalLocation } from "@/lib/openweather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityQ  = searchParams.get("city")  ?? "";
  const areaQ  = searchParams.get("area")  ?? "";
  const citySlug = searchParams.get("citySlug") ?? "";
  const liveQ = searchParams.get("live") ?? "";

  if (liveQ) {
    const { data, error } = await searchGlobalLocation(liveQ);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ liveLocations: data });
  }

  if (citySlug && areaQ) {
    const areas = searchAreas(citySlug, areaQ);
    return NextResponse.json({ areas });
  }
  if (citySlug && !areaQ) {
    const city = getCity(citySlug);
    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });
    return NextResponse.json({ areas: city.areas });
  }

  const cities = searchCities(cityQ);
  return NextResponse.json({ cities });
}
