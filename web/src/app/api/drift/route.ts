import { NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";

export async function GET() {
  try {
    const drift = await aeropureClient.drift();
    return NextResponse.json(drift);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
