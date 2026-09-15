import { NextRequest, NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";
import { getArea } from "@/lib/locations";
import { buildForecastInput, FORECAST_OFFSETS } from "@/lib/demo-inputs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { citySlug, areaSlug, offsetHours } = body as {
      citySlug: string;
      areaSlug: string;
      offsetHours?: number;
    };

    const area = getArea(citySlug, areaSlug);
    if (!area) {
      return NextResponse.json(
        { error: `Area "${areaSlug}" not found in "${citySlug}"` },
        { status: 404 }
      );
    }

    const now = new Date();

    if (typeof offsetHours === "number") {
      // Single point forecast for a specific hour offset
      const input = buildForecastInput(area, offsetHours, now);
      const result = await aeropureClient.predict(input);
      return NextResponse.json({ ...result, hourOffset: offsetHours });
    }

    // Full 6-point 24h forecast timeline
    const timeline = await Promise.all(
      FORECAST_OFFSETS.map(async (offset) => {
        const input = buildForecastInput(area, offset, now);
        const result = await aeropureClient.predict(input);
        return {
          hourOffset: offset,
          label: offset === 0 ? "Now" : `+${offset}h`,
          time: new Date(now.getTime() + offset * 3600 * 1000).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          predicted_aqi_proxy: result.predicted_aqi_proxy,
          hazard_probability: result.hazard_probability,
          hazardous: result.hazardous,
          risk_category: result.risk_category,
          pollution_regime: result.pollution_regime,
        };
      })
    );

    return NextResponse.json({ timeline, area, demoMode: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      return NextResponse.json(
        { error: "ML inference engine temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
