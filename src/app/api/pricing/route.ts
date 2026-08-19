import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { state, setPricing } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(state.pricing);
}

export async function POST(req: NextRequest) {
  const { hourly } = await req.json();
  if (!hourly || isNaN(hourly)) {
    return NextResponse.json({ error: "A numeric hourly rate is required." }, { status: 400 });
  }
  const pricing = setPricing(Number(hourly));
  return NextResponse.json(pricing);
}
