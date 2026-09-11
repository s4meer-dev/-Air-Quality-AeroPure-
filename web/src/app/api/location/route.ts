import { NextRequest, NextResponse } from "next/server";
import { searchLocation } from "@/lib/openweather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ locations: [] });
  }

  const { data, error } = await searchLocation(query.trim());

  if (error) {
    return NextResponse.json({ locations: [], error });
  }

  return NextResponse.json({ locations: data });
}
