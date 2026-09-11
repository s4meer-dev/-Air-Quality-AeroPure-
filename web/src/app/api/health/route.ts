import { NextResponse } from "next/server";
import { aeropureClient } from "@/lib/aeropure-client";

export async function GET() {
  try {
    const health = await aeropureClient.health();
    return NextResponse.json({ ...health, apiOnline: true });
  } catch {
    return NextResponse.json({ apiOnline: false, status: "offline" }, { status: 200 });
  }
}
