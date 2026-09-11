import { NextRequest, NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await aeropureClient.predict(input);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
