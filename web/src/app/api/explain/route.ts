import { NextRequest, NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";
import { getArea } from "@/lib/locations";
import { buildDemoInput } from "@/lib/demo-inputs";

export async function POST(req: NextRequest) {
  try {
    const { citySlug, areaSlug } = await req.json() as {
      citySlug: string;
      areaSlug: string;
    };

    const area = getArea(citySlug, areaSlug);
    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const input = buildDemoInput(area);
    const result = await aeropureClient.explain(input);
    return NextResponse.json({ ...result, demoMode: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
