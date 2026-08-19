import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { mobile } = await req.json();
  if (!mobile || String(mobile).length < 10) {
    return NextResponse.json({ error: "Valid 10-digit mobile number required." }, { status: 400 });
  }
  const code = sendOtp(mobile);
  // In production this is where an SMS provider (e.g. an SMS gateway) would be called.
  return NextResponse.json({ sent: true, demoCode: code });
}
