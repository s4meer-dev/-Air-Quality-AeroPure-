import { NextRequest, NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";
import { getArea } from "@/lib/locations";
import { buildDemoInput } from "@/lib/demo-inputs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let input;
    if (body.citySlug && body.areaSlug) {
      const area = getArea(body.citySlug, body.areaSlug);
      if (!area) {
        return NextResponse.json({ error: "Area not found" }, { status: 404 });
      }
      input = buildDemoInput(area);
    } else {
      input = body;
    }

    const result = await aeropureClient.predict(input);
    return NextResponse.json({ ...result, demoMode: Boolean(body.citySlug) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
